import { Encounter } from '@/types/encounter';
import { useLocalStorage } from './useLocalStorage';
import { useCallback } from 'react';
import { useSyncSettings } from './useSyncSettings';

const STORAGE_KEY_PREFIX = 'padel-encounters';

export function useEncounterStore() {
  const { activeTeam } = useSyncSettings();
  const storageKey = `${STORAGE_KEY_PREFIX}:${activeTeam?.id ?? 'local'}`;
  const [encounters, setEncounters] = useLocalStorage<Encounter[]>(storageKey, []);

  const addEncounter = useCallback(
    (encounter: Encounter) => {
      setEncounters((prev) => [encounter, ...prev]);
    },
    [setEncounters]
  );

  const updateEncounter = useCallback(
    (id: string, updates: Partial<Encounter>) => {
      setEncounters((prev) => prev.map((e) => (e.id === id ? { ...e, ...updates } : e)));
    },
    [setEncounters]
  );

  const getEncounter = useCallback(
    (id: string) => {
      return encounters.find((e) => e.id === id);
    },
    [encounters]
  );

  const deleteEncounter = useCallback(
    (id: string) => {
      setEncounters((prev) => prev.filter((e) => e.id !== id));
    },
    [setEncounters]
  );

  const setEncountersState = useCallback(
    (nextEncounters: Encounter[]) => {
      setEncounters(nextEncounters);
    },
    [setEncounters],
  );

  return { encounters, addEncounter, updateEncounter, getEncounter, deleteEncounter, setEncountersState };
}
