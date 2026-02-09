import { useCallback, useMemo } from 'react';
import { useLocalStorage } from './useLocalStorage';
import { createSyncToken, generateTeamSecret, parseSyncToken } from '@/lib/syncKey';

const STORAGE_KEY = 'padel-sync-settings';

export interface TeamSpace {
  id: string;
  teamName: string;
  teamSecret: string;
  syncToken: string;
  createdAt: string;
  isDefault?: boolean;
}

export interface SyncSettings {
  teams: TeamSpace[];
  activeTeamId: string | null;
  syncEnabled: boolean;
}

const DEFAULT_SYNC_SETTINGS: SyncSettings = {
  teams: [],
  activeTeamId: null,
  syncEnabled: false
};
const DEFAULT_TEAM_ID = 'local';

function createDefaultTeamSpace(): TeamSpace {
  return {
    id: DEFAULT_TEAM_ID,
    teamName: 'Personal',
    teamSecret: '',
    syncToken: '',
    createdAt: new Date().toISOString(),
    isDefault: true
  };
}

function makeTeamSpace(teamName: string, teamSecret: string): TeamSpace {
  const normalizedName = teamName.trim();
  const normalizedSecret = teamSecret.trim();
  const syncToken = createSyncToken(normalizedName, normalizedSecret);

  return {
    id: syncToken,
    teamName: normalizedName,
    teamSecret: normalizedSecret,
    syncToken,
    createdAt: new Date().toISOString(),
    isDefault: false
  };
}

function ensureDefaultTeam(teams: TeamSpace[]): TeamSpace[] {
  const existingDefault = teams.find((team) => team.id === DEFAULT_TEAM_ID || team.isDefault);
  const nonDefault = teams.filter((team) => team.id !== DEFAULT_TEAM_ID && !team.isDefault);

  const defaultTeam = existingDefault
    ? { ...existingDefault, id: DEFAULT_TEAM_ID, teamName: existingDefault.teamName || 'Personal', teamSecret: '', syncToken: '', isDefault: true }
    : createDefaultTeamSpace();

  return [defaultTeam, ...nonDefault];
}

function normalizeSyncSettings(raw: unknown): SyncSettings {
  if (!raw || typeof raw !== 'object') {
    return DEFAULT_SYNC_SETTINGS;
  }

  const candidate = raw as Partial<SyncSettings> & {
    syncToken?: string;
    teamName?: string;
    teamSecret?: string;
  };

  if (Array.isArray(candidate.teams)) {
    const teams = candidate.teams
      .filter((team): team is TeamSpace => {
        return Boolean(team && typeof team === 'object');
      })
      .map((team) => {
        const parsed = parseSyncToken(team.syncToken);
        const isDefault = team.id === DEFAULT_TEAM_ID || team.isDefault;
        const normalizedName = isDefault ? team.teamName || 'Personal' : parsed?.teamName || team.teamName || 'Team';
        const normalizedSecret = isDefault ? '' : parsed?.teamSecret || team.teamSecret || '';
        return {
          ...team,
          id: isDefault ? DEFAULT_TEAM_ID : team.id || team.syncToken,
          teamName: normalizedName,
          teamSecret: normalizedSecret,
          syncToken: isDefault ? '' : createSyncToken(normalizedName, normalizedSecret || parsed?.teamSecret || ''),
          createdAt: team.createdAt || new Date().toISOString(),
          isDefault
        };
      })
      .filter((team) => team.isDefault || Boolean(team.teamSecret));

    const withDefault = ensureDefaultTeam(teams);

    const activeTeamId = withDefault.some((team) => team.id === candidate.activeTeamId)
      ? (candidate.activeTeamId as string)
      : (withDefault[0]?.id ?? null);
    const syncEnabled =
      typeof candidate.syncEnabled === 'boolean' ? candidate.syncEnabled : false;

    return { teams: withDefault, activeTeamId, syncEnabled };
  }

  // Legacy format migration: { teamName, teamSecret, syncToken }.
  if (candidate.syncToken) {
    const parsed = parseSyncToken(candidate.syncToken);
    if (parsed) {
      const team = makeTeamSpace(parsed.teamName, parsed.teamSecret);
      return { teams: ensureDefaultTeam([team]), activeTeamId: team.id, syncEnabled: false };
    }
  }

  if (candidate.teamName && candidate.teamSecret) {
    const team = makeTeamSpace(candidate.teamName, candidate.teamSecret);
    return { teams: ensureDefaultTeam([team]), activeTeamId: team.id, syncEnabled: false };
  }

  return {
    teams: [createDefaultTeamSpace()],
    activeTeamId: DEFAULT_TEAM_ID,
    syncEnabled: false
  };
}

export function useSyncSettings() {
  const [storedSettings, setStoredSettings] = useLocalStorage<SyncSettings>(
    STORAGE_KEY,
    DEFAULT_SYNC_SETTINGS
  );
  const syncSettings = useMemo(() => normalizeSyncSettings(storedSettings), [storedSettings]);
  const activeTeam = useMemo(
    () => syncSettings.teams.find((team) => team.id === syncSettings.activeTeamId) ?? null,
    [syncSettings.activeTeamId, syncSettings.teams]
  );

  const createTeamSpace = useCallback(
    (teamName: string) => {
      const trimmed = teamName.trim();
      if (!trimmed) return;

      const team = makeTeamSpace(trimmed, generateTeamSecret());
      setStoredSettings((prevRaw) => {
        const prev = normalizeSyncSettings(prevRaw);
        const existing = prev.teams.find((item) => item.syncToken === team.syncToken);
        if (existing) {
          return { ...prev, activeTeamId: existing.id };
        }

        return {
          teams: ensureDefaultTeam([team, ...prev.teams]),
          activeTeamId: team.id,
          syncEnabled: prev.syncEnabled
        };
      });
    },
    [setStoredSettings]
  );

  const updateActiveTeamName = useCallback(
    (teamName: string) => {
      const trimmed = teamName.trim();
      if (!trimmed || !activeTeam) return;

      const updated = makeTeamSpace(trimmed, activeTeam.teamSecret);
      setStoredSettings((prevRaw) => {
        const prev = normalizeSyncSettings(prevRaw);
        const teams = prev.teams.map((team) =>
          team.id === activeTeam.id ? { ...updated, createdAt: team.createdAt } : team
        );
        return {
          teams,
          activeTeamId: updated.id
        };
      });
    },
    [activeTeam, setStoredSettings]
  );

  const importTeamFromToken = useCallback(
    (syncToken: string) => {
      const parsed = parseSyncToken(syncToken.trim());
      if (!parsed) return null;

      const team = makeTeamSpace(parsed.teamName, parsed.teamSecret);
      setStoredSettings((prevRaw) => {
        const prev = normalizeSyncSettings(prevRaw);
        const existing = prev.teams.find((item) => item.syncToken === team.syncToken);
        if (existing) {
          return { ...prev, activeTeamId: existing.id };
        }

        return {
          teams: ensureDefaultTeam([team, ...prev.teams]),
          activeTeamId: team.id,
          syncEnabled: prev.syncEnabled
        };
      });

      return team;
    },
    [setStoredSettings]
  );

  const setActiveTeam = useCallback(
    (teamId: string) => {
      setStoredSettings((prevRaw) => {
        const prev = normalizeSyncSettings(prevRaw);
        if (!prev.teams.some((team) => team.id === teamId)) return prev;
        return {
          ...prev,
          activeTeamId: teamId
        };
      });
    },
    [setStoredSettings]
  );

  const removeTeam = useCallback(
    (teamId: string) => {
      setStoredSettings((prevRaw) => {
        const prev = normalizeSyncSettings(prevRaw);
        if (teamId === DEFAULT_TEAM_ID) return prev;
        const remaining = prev.teams.filter((team) => team.id !== teamId);
        const nextActive =
          prev.activeTeamId === teamId ? (remaining[0]?.id ?? null) : prev.activeTeamId;
        return {
          teams: ensureDefaultTeam(remaining),
          activeTeamId: nextActive,
          syncEnabled: prev.syncEnabled
        };
      });
    },
    [setStoredSettings]
  );

  const setSyncEnabled = useCallback(
    (enabled: boolean) => {
      setStoredSettings((prevRaw) => {
        const prev = normalizeSyncSettings(prevRaw);
        return {
          ...prev,
          syncEnabled: enabled
        };
      });
    },
    [setStoredSettings]
  );

  return {
    syncSettings,
    teams: syncSettings.teams,
    activeTeam,
    syncEnabled: syncSettings.syncEnabled,
    syncToken: activeTeam?.syncToken ?? '',
    createTeamSpace,
    updateActiveTeamName,
    importTeamFromToken,
    setActiveTeam,
    removeTeam,
    setSyncEnabled
  };
}
