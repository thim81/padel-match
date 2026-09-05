import { Encounter, StoredEncounter } from '@/types/encounter';
import { useLocalStorage } from './useLocalStorage';
import { useCallback, useEffect, useMemo } from 'react';
import { useSyncSettings } from './useSyncSettings';
import { normalizeEncounterFormat } from '@/lib/formatRules';
import { normalizeInterclubRounds } from '@/lib/encounterRounds';

const STORAGE_KEY_PREFIX = 'padel-encounters';

export function useEncounterStore() {
  const { activeTeam } = useSyncSettings();
  const storageKey = `${STORAGE_KEY_PREFIX}:${activeTeam?.id ?? 'local'}`;
  const [storedEncounters, setEncounters] = useLocalStorage<StoredEncounter[]>(storageKey, []);
  const encounters = useMemo(
    () =>
      storedEncounters.map((encounter) =>
        normalizeInterclubRounds(normalizeEncounterFormat(encounter))
      ),
    [storedEncounters]
  );

  useEffect(() => {
    const needsPersistence = encounters.some(
      (encounter, index) => encounter !== storedEncounters[index]
    );
    if (needsPersistence) {
      setEncounters((currentStoredEncounters) =>
        currentStoredEncounters.map((encounter) =>
          normalizeInterclubRounds(normalizeEncounterFormat(encounter))
        )
      );
    }
  }, [encounters, setEncounters, storedEncounters]);

  const addEncounter = useCallback(
    (encounter: Encounter) => {
      setEncounters((prev) => [encounter, ...prev]);
    },
    [setEncounters]
  );

  const updateEncounter = useCallback(
    (id: string, updates: Partial<Encounter>) => {
      setEncounters((prev) =>
        prev.map((e) =>
          e.id === id
            ? {
                ...normalizeEncounterFormat(e),
                ...updates
              }
            : e
        )
      );
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
    [setEncounters]
  );

  return {
    encounters,
    addEncounter,
    updateEncounter,
    getEncounter,
    deleteEncounter,
    setEncountersState
  };
}
