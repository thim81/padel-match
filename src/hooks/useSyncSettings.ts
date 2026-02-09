import { useCallback } from 'react';
import { useLocalStorage } from './useLocalStorage';
import { createSyncToken, generateTeamSecret, parseSyncToken } from '@/lib/syncKey';

const STORAGE_KEY = 'padel-sync-settings';

export interface SyncSettings {
  teamName: string;
  teamSecret: string;
  syncToken: string;
}

const DEFAULT_SYNC_SETTINGS: SyncSettings = {
  teamName: '',
  teamSecret: '',
  syncToken: '',
};

function buildSettings(teamName: string, teamSecret: string): SyncSettings {
  const trimmedName = teamName.trim();
  const trimmedSecret = teamSecret.trim();

  return {
    teamName: trimmedName,
    teamSecret: trimmedSecret,
    syncToken: trimmedName && trimmedSecret ? createSyncToken(trimmedName, trimmedSecret) : '',
  };
}

export function useSyncSettings() {
  const [syncSettings, setSyncSettings] = useLocalStorage<SyncSettings>(STORAGE_KEY, DEFAULT_SYNC_SETTINGS);

  const initializeTeamSpace = useCallback(
    (teamName: string) => {
      const trimmedName = teamName.trim();
      if (!trimmedName) return;

      const teamSecret = generateTeamSecret();
      setSyncSettings(buildSettings(trimmedName, teamSecret));
    },
    [setSyncSettings],
  );

  const updateTeamName = useCallback(
    (teamName: string) => {
      setSyncSettings((prev) => buildSettings(teamName, prev.teamSecret));
    },
    [setSyncSettings],
  );

  const importSyncToken = useCallback(
    (syncToken: string) => {
      const parsed = parseSyncToken(syncToken.trim());
      if (!parsed) {
        setSyncSettings((prev) => ({ ...prev, syncToken: syncToken.trim() }));
        return;
      }

      setSyncSettings(buildSettings(parsed.teamName, parsed.teamSecret));
    },
    [setSyncSettings],
  );

  const setSyncSettingsState = useCallback(
    (next: SyncSettings) => {
      const parsed = parseSyncToken(next.syncToken);
      if (parsed) {
        setSyncSettings(buildSettings(parsed.teamName, parsed.teamSecret));
        return;
      }

      if (next.teamName && next.teamSecret) {
        setSyncSettings(buildSettings(next.teamName, next.teamSecret));
        return;
      }

      setSyncSettings({ ...DEFAULT_SYNC_SETTINGS, ...next });
    },
    [setSyncSettings],
  );

  return { syncSettings, initializeTeamSpace, updateTeamName, importSyncToken, setSyncSettingsState };
}
