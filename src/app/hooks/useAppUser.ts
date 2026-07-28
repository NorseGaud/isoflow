import { useEffect, useState } from 'react';
import {
  getDefaultUser,
  initializeAppDb,
  UserRecord
} from 'src/api/client';
import { migrateLegacyBrowserDb } from 'src/api/migrateLegacy';

export const useAppUser = () => {
  const [user, setUser] = useState<UserRecord | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        await initializeAppDb();
        await migrateLegacyBrowserDb();
        const defaultUser = await getDefaultUser();

        if (!cancelled) {
          setUser(defaultUser);
          setError(null);
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error
              ? err.message
              : 'Failed to start app. Is the Isoflow server running on :9324?'
          );
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  return { user, error, isLoading };
};
