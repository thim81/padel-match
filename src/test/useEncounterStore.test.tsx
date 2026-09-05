import { renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useEncounterStore } from '@/hooks/useEncounterStore';
import { createEmptyRound, Encounter, StoredEncounter } from '@/types/encounter';

const mocks = vi.hoisted(() => ({
  stored: [] as StoredEncounter[],
  setEncounters: vi.fn(),
  activeTeam: { id: 'team-b' }
}));

vi.mock('@/hooks/useLocalStorage', () => ({
  useLocalStorage: () => [mocks.stored, mocks.setEncounters]
}));

vi.mock('@/hooks/useSyncSettings', () => ({
  useSyncSettings: () => ({ activeTeam: mocks.activeTeam })
}));

function createEncounter(id: string): Encounter {
  return {
    id,
    date: '2026-09-05T10:00:00.000Z',
    opponentName: 'Opponent',
    mode: 'interclub',
    formatFamily: 'two_sets',
    formatType: 'FMT_201',
    rounds: [createEmptyRound(1), createEmptyRound(2), createEmptyRound(3)],
    status: 'in-progress'
  };
}

describe('useEncounterStore migration persistence', () => {
  beforeEach(() => {
    mocks.stored = [createEncounter('stale-team-a')];
    mocks.setEncounters.mockReset();
  });

  it('normalizes the current storage-key value through a functional updater', () => {
    renderHook(() => useEncounterStore());

    expect(mocks.setEncounters).toHaveBeenCalledOnce();
    const updateCurrentValue = mocks.setEncounters.mock.calls[0][0];
    expect(updateCurrentValue).toBeTypeOf('function');

    const currentTeamValue = [createEncounter('current-team-b')];
    const migrated = updateCurrentValue(currentTeamValue);

    expect(migrated[0].id).toBe('current-team-b');
    expect(migrated[0].rounds).toHaveLength(2);
  });
});
