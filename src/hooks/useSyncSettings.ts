import { useCallback } from 'react';
import { useLocalStorage } from './useLocalStorage';

const STORAGE_KEY = 'padel-sync-settings';

export interface SyncSettings {
  syncToken: string;
}

const DEFAULT_SYNC_SETTINGS: SyncSettings = {
  syncToken: '',
};

export function useSyncSettings() {
  const [syncSettings, setSyncSettings] = useLocalStorage<SyncSettings>(STORAGE_KEY, DEFAULT_SYNC_SETTINGS);

  const updateSyncToken = useCallback(
    (syncToken: string) => {
      setSyncSettings((prev) => ({ ...prev, syncToken }));
    },
    [setSyncSettings],
  );

  const setSyncSettingsState = useCallback(
    (next: SyncSettings) => {
      setSyncSettings(next);
    },
    [setSyncSettings],
  );

  return { syncSettings, updateSyncToken, setSyncSettingsState };
}
