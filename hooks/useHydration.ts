import { useState, useEffect } from 'react';

/**
 * Custom hook to prevent hydration mismatches
 * Returns true only after client-side hydration is complete
 * Use this for any component that uses localStorage or client-only data
 */
export function useHydration(): boolean {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return mounted;
}

