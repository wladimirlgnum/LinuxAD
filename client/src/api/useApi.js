import { useCallback, useEffect, useState } from 'react';

/**
 * Hook de chargement de donnees : gere loading / error / refetch.
 * @param {() => Promise<any>} fetcher fonction d'appel API (stable ou memoisee)
 * @param {any[]} deps dependances declenchant un rechargement
 */
export function useApi(fetcher, deps = []) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const load = useCallback(fetcher, deps);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    load()
      .then((res) => !cancelled && setData(res))
      .catch((err) => !cancelled && setError(err))
      .finally(() => !cancelled && setLoading(false));

    // Evite un setState apres demontage si l'utilisateur change de page.
    return () => {
      cancelled = true;
    };
  }, [load]);

  return { data, setData, loading, error };
}
