// Couche d'acces aux donnees, adossee a Supabase.
// L'objet `api` conserve exactement la meme surface qu'avant (memes noms de
// methodes, memes formes d'objets renvoyees) : les composants React restent
// inchanges. Le mapping colonnes Supabase <-> formes attendues par l'UI vit ici.
import { supabase } from '../lib/supabase.js';

// Checklist type appliquee a tout nouveau poste (auparavant cote serveur Express).
const DEFAULT_CHECKLIST = [
  'Sauvegarde des donnees utilisateur',
  'Installation Ubuntu 26.04 LTS',
  'Configuration reseau (IP, DNS -> Samba AD)',
  'Jonction au domaine (realm join)',
  'Installation des logiciels metier',
  'Test de connexion avec compte AD',
  'Montage des partages reseau',
  'Test impression (driver Sharp/CUPS)',
  'Validation utilisateur',
  'Cloture du poste',
];

// Deballe une reponse Supabase : jette sur erreur (memes semantiques que
// l'ancien client HTTP qui levait sur les reponses non-2xx), renvoie sinon data.
function unwrap({ data, error }) {
  if (error) throw new Error(error.message);
  return data;
}

// --- Mappers colonnes Supabase -> formes attendues par les composants ---

// L'app identifie une etape par son numero fonctionnel (1..9) = colonne `number`,
// et non par la cle primaire serial `id`.
const toStep = (r) => ({ id: r.number, title: r.title, status: r.status, summary: r.description ?? '' });

const toSoftware = (r) => ({
  id: r.id,
  windows: r.name,
  vendor: r.editor ?? '',
  category: r.category ?? '',
  // La colonne `users` est un TEXT ; l'UI attend un tableau.
  users: r.users ? r.users.split(',').map((u) => u.trim()).filter(Boolean) : [],
  critical: r.critical,
  linux: r.linux_alternative ?? '',
  status: r.migration_status,
});

const toTask = (r) => ({ id: r.id, label: r.label, done: r.completed });

const toWorkstation = (r) => ({
  id: r.id,
  name: r.employee_name,
  role: r.department ?? '',
  notes: r.notes ?? '',
  checklist: (r.workstation_tasks ?? [])
    .slice()
    .sort((a, b) => a.order_index - b.order_index)
    .map(toTask),
});

export const api = {
  // --- Etapes macro (table steps) ---
  async getProgress() {
    const rows = unwrap(await supabase.from('steps').select('*').order('number'));
    return rows.map(toStep);
  },
  async setStepStatus(stepId, status) {
    const rows = unwrap(
      await supabase
        .from('steps')
        .update({ status, updated_at: new Date().toISOString() })
        .eq('number', stepId)
        .select()
    );
    return rows[0] ? toStep(rows[0]) : null;
  },

  // --- Guides : le contenu pedagogique reste statique (data/guides.js) ;
  //     seul l'avancement (guide_sections.completed) est persiste ici. ---
  async getGuide(stepId) {
    const step = unwrap(await supabase.from('steps').select('id').eq('number', stepId).maybeSingle());
    if (!step) return { checklist: [] };
    const rows = unwrap(
      await supabase.from('guide_sections').select('id, title, completed').eq('step_id', step.id).order('order_index')
    );
    return { checklist: rows.map((r) => ({ id: r.id, label: r.title, done: r.completed })) };
  },
  async setGuideItem(stepId, itemId, done) {
    const rows = unwrap(await supabase.from('guide_sections').update({ completed: done }).eq('id', itemId).select());
    const r = rows[0];
    return r ? { id: r.id, label: r.title, done: r.completed } : null;
  },

  // --- Matrice logiciels (table software) ---
  async getSoftware() {
    const rows = unwrap(await supabase.from('software').select('*').order('id'));
    return rows.map(toSoftware);
  },
  async updateSoftware(id, patch) {
    const dbPatch = {};
    if (patch.status !== undefined) dbPatch.migration_status = patch.status;
    if (typeof patch.linux === 'string') dbPatch.linux_alternative = patch.linux;
    const rows = unwrap(await supabase.from('software').update(dbPatch).eq('id', id).select());
    return rows[0] ? toSoftware(rows[0]) : null;
  },

  // --- Postes de travail (workstations) + checklist normalisee (workstation_tasks) ---
  async getWorkstations() {
    const rows = unwrap(await supabase.from('workstations').select('*, workstation_tasks(*)').order('id'));
    return rows.map(toWorkstation);
  },
  async createWorkstation({ name, role = '' }) {
    const [ws] = unwrap(
      await supabase
        .from('workstations')
        .insert({ employee_name: name.trim(), department: role.trim(), notes: '' })
        .select()
    );
    const tasks = DEFAULT_CHECKLIST.map((label, i) => ({
      workstation_id: ws.id,
      order_index: i,
      label,
      completed: false,
    }));
    const inserted = unwrap(await supabase.from('workstation_tasks').insert(tasks).select());
    return toWorkstation({ ...ws, workstation_tasks: inserted });
  },
  async updateWorkstation(id, ws) {
    // 1) Champs du poste
    unwrap(
      await supabase
        .from('workstations')
        .update({ employee_name: ws.name, department: ws.role ?? '', notes: ws.notes ?? '' })
        .eq('id', id)
    );

    // 2) Reconciliation de la checklist (bascules / ajouts / suppressions).
    //    Les items existants portent un id numerique (serial) ; les items
    //    ajoutes cote client portent un id chaine temporaire.
    const desired = ws.checklist ?? [];
    const keepIds = new Set(desired.filter((i) => typeof i.id === 'number').map((i) => i.id));

    const existing = unwrap(await supabase.from('workstation_tasks').select('id').eq('workstation_id', id));
    const toDelete = existing.map((t) => t.id).filter((tid) => !keepIds.has(tid));
    if (toDelete.length) unwrap(await supabase.from('workstation_tasks').delete().in('id', toDelete));

    // Un seul upsert : les lignes avec id sont mises a jour, celles sans id inserees.
    const rows = desired.map((item, i) => {
      const base = { workstation_id: id, order_index: i, label: item.label, completed: item.done };
      return typeof item.id === 'number' ? { id: item.id, ...base } : base;
    });
    if (rows.length) unwrap(await supabase.from('workstation_tasks').upsert(rows));

    return ws;
  },
  async deleteWorkstation(id) {
    // workstation_tasks est purge en cascade (ON DELETE CASCADE).
    unwrap(await supabase.from('workstations').delete().eq('id', id));
    return null;
  },
};
