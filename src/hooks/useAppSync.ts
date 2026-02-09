import { useEffect, useRef, useCallback } from 'react';
import { toast } from 'sonner';
import { Encounter, Player } from '@/types/encounter';
import { fetchRemoteState, pushLocalState, SyncState } from '@/lib/sync';
import { SyncSettings } from './useSyncSettings';

function normalizeRemoteState(state: SyncState): SyncState {
  return {
    players: Array.isArray(state.players) ? state.players : [],
    encounters: Array.isArray(state.encounters) ? state.encounters : [],
    settings: {
      syncToken: state.settings?.syncToken ?? '',
    },
  };
}

export function useAppSync(
  syncToken: string,
  players: Player[],
  encounters: Encounter[],
  settings: SyncSettings,
  onSyncState: (state: SyncState) => void,
) {
  const lastSyncedState = useRef('');
  const initializedToken = useRef<string | null>(null);

  const getLocalState = useCallback((): SyncState => {
    return {
      players,
      encounters,
      settings,
    };
  }, [players, encounters, settings]);

  const syncNow = useCallback(
    async (showSuccessToast = false) => {
      if (!syncToken) return;

      const remoteState = await fetchRemoteState(syncToken);
      if (remoteState) {
        const normalizedRemote = normalizeRemoteState(remoteState);
        const remoteStateStr = JSON.stringify(normalizedRemote);
        const currentStateStr = JSON.stringify(getLocalState());

        if (remoteStateStr !== currentStateStr) {
          onSyncState(normalizedRemote);
        }
        lastSyncedState.current = remoteStateStr;
        if (showSuccessToast) toast.success('Synced successfully');
        return;
      }

      const currentState = getLocalState();
      const currentStateStr = JSON.stringify(currentState);
      const success = await pushLocalState(syncToken, currentState);
      if (success) {
        lastSyncedState.current = currentStateStr;
        if (showSuccessToast) toast.success('Synced successfully');
      }
    },
    [syncToken, getLocalState, onSyncState],
  );

  useEffect(() => {
    if (!syncToken) {
      initializedToken.current = null;
      lastSyncedState.current = '';
      return;
    }

    if (initializedToken.current === syncToken) return;

    initializedToken.current = syncToken;
    syncNow(true);
  }, [syncToken, syncNow]);

  useEffect(() => {
    if (!syncToken || initializedToken.current !== syncToken) return;

    const currentState = getLocalState();
    const currentStateStr = JSON.stringify(currentState);

    if (currentStateStr === lastSyncedState.current) return;

    const timeoutId = window.setTimeout(async () => {
      const success = await pushLocalState(syncToken, currentState);
      if (success) {
        lastSyncedState.current = currentStateStr;
      }
    }, 2000);

    return () => window.clearTimeout(timeoutId);
  }, [syncToken, players, encounters, settings, getLocalState]);

  useEffect(() => {
    if (!syncToken) return;

    const handleResume = () => {
      if (document.hidden) return;
      syncNow();
    };

    const handlePageShow = () => {
      syncNow();
    };

    document.addEventListener('visibilitychange', handleResume);
    window.addEventListener('focus', handleResume);
    window.addEventListener('pageshow', handlePageShow);

    return () => {
      document.removeEventListener('visibilitychange', handleResume);
      window.removeEventListener('focus', handleResume);
      window.removeEventListener('pageshow', handlePageShow);
    };
  }, [syncToken, syncNow]);
}
