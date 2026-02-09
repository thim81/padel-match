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
}

export interface SyncSettings {
  teams: TeamSpace[];
  activeTeamId: string | null;
  syncEnabled: boolean;
}

const DEFAULT_SYNC_SETTINGS: SyncSettings = {
  teams: [],
  activeTeamId: null,
  syncEnabled: false,
};

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
  };
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
        return Boolean(team && typeof team === 'object' && (team as TeamSpace).syncToken);
      })
      .map((team) => {
        const parsed = parseSyncToken(team.syncToken);
        const normalizedName = parsed?.teamName || team.teamName || 'Team';
        const normalizedSecret = parsed?.teamSecret || team.teamSecret || '';
        return {
          ...team,
          id: team.id || team.syncToken,
          teamName: normalizedName,
          teamSecret: normalizedSecret,
          syncToken: createSyncToken(normalizedName, normalizedSecret || parsed?.teamSecret || ''),
          createdAt: team.createdAt || new Date().toISOString(),
        };
      })
      .filter((team) => Boolean(team.teamSecret));

    const activeTeamId = teams.some((team) => team.id === candidate.activeTeamId)
      ? (candidate.activeTeamId as string)
      : teams[0]?.id ?? null;
    const syncEnabled =
      typeof candidate.syncEnabled === 'boolean'
        ? candidate.syncEnabled
        : teams.length > 0;

    return { teams, activeTeamId, syncEnabled };
  }

  // Legacy format migration: { teamName, teamSecret, syncToken }.
  if (candidate.syncToken) {
    const parsed = parseSyncToken(candidate.syncToken);
    if (parsed) {
      const team = makeTeamSpace(parsed.teamName, parsed.teamSecret);
      return { teams: [team], activeTeamId: team.id, syncEnabled: true };
    }
  }

  if (candidate.teamName && candidate.teamSecret) {
    const team = makeTeamSpace(candidate.teamName, candidate.teamSecret);
    return { teams: [team], activeTeamId: team.id, syncEnabled: true };
  }

  return DEFAULT_SYNC_SETTINGS;
}

export function useSyncSettings() {
  const [storedSettings, setStoredSettings] = useLocalStorage<SyncSettings>(STORAGE_KEY, DEFAULT_SYNC_SETTINGS);
  const syncSettings = useMemo(() => normalizeSyncSettings(storedSettings), [storedSettings]);
  const activeTeam = useMemo(
    () => syncSettings.teams.find((team) => team.id === syncSettings.activeTeamId) ?? null,
    [syncSettings.activeTeamId, syncSettings.teams],
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
          teams: [team, ...prev.teams],
          activeTeamId: team.id,
          syncEnabled: true,
        };
      });
    },
    [setStoredSettings],
  );

  const updateActiveTeamName = useCallback(
    (teamName: string) => {
      const trimmed = teamName.trim();
      if (!trimmed || !activeTeam) return;

      const updated = makeTeamSpace(trimmed, activeTeam.teamSecret);
      setStoredSettings((prevRaw) => {
        const prev = normalizeSyncSettings(prevRaw);
        const teams = prev.teams.map((team) => (team.id === activeTeam.id ? { ...updated, createdAt: team.createdAt } : team));
        return {
          teams,
          activeTeamId: updated.id,
        };
      });
    },
    [activeTeam, setStoredSettings],
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
          teams: [team, ...prev.teams],
          activeTeamId: team.id,
          syncEnabled: true,
        };
      });

      return team;
    },
    [setStoredSettings],
  );

  const setActiveTeam = useCallback(
    (teamId: string) => {
      setStoredSettings((prevRaw) => {
        const prev = normalizeSyncSettings(prevRaw);
        if (!prev.teams.some((team) => team.id === teamId)) return prev;
        return {
          ...prev,
          activeTeamId: teamId,
        };
      });
    },
    [setStoredSettings],
  );

  const removeTeam = useCallback(
    (teamId: string) => {
      setStoredSettings((prevRaw) => {
        const prev = normalizeSyncSettings(prevRaw);
        const remaining = prev.teams.filter((team) => team.id !== teamId);
        const nextActive = prev.activeTeamId === teamId ? (remaining[0]?.id ?? null) : prev.activeTeamId;
        return {
          teams: remaining,
          activeTeamId: nextActive,
          syncEnabled: remaining.length > 0 ? prev.syncEnabled : false,
        };
      });
    },
    [setStoredSettings],
  );

  const setSyncEnabled = useCallback(
    (enabled: boolean) => {
      setStoredSettings((prevRaw) => {
        const prev = normalizeSyncSettings(prevRaw);
        return {
          ...prev,
          syncEnabled: enabled,
        };
      });
    },
    [setStoredSettings],
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
    setSyncEnabled,
  };
}
