import { Player } from '@/types/encounter';
import { useLocalStorage } from './useLocalStorage';
import { useCallback } from 'react';
import { useSyncSettings } from './useSyncSettings';

const STORAGE_KEY_PREFIX = 'padel-team-players';

export function useTeamStore() {
  const { activeTeam } = useSyncSettings();
  const storageKey = `${STORAGE_KEY_PREFIX}:${activeTeam?.id ?? 'local'}`;
  const [players, setPlayers] = useLocalStorage<Player[]>(storageKey, []);

  const addPlayer = useCallback(
    (name: string) => {
      setPlayers((prev) => {
        if (prev.length >= 4) return prev;
        return [...prev, { id: crypto.randomUUID(), name }];
      });
    },
    [setPlayers]
  );

  const updatePlayer = useCallback(
    (id: string, name: string) => {
      setPlayers((prev) => prev.map((p) => (p.id === id ? { ...p, name } : p)));
    },
    [setPlayers]
  );

  const removePlayer = useCallback(
    (id: string) => {
      setPlayers((prev) => prev.filter((p) => p.id !== id));
    },
    [setPlayers]
  );

  const setPlayersState = useCallback(
    (nextPlayers: Player[]) => {
      setPlayers(nextPlayers);
    },
    [setPlayers],
  );

  return { players, addPlayer, updatePlayer, removePlayer, setPlayersState };
}
