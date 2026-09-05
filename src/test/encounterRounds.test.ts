import { describe, expect, it } from 'vitest';
import { createInterclubRounds, normalizeInterclubRounds } from '@/lib/encounterRounds';
import { createEmptyRound, Encounter, FormatType } from '@/types/encounter';

function createEncounter(
  formatType: FormatType,
  status: Encounter['status'] = 'in-progress'
): Encounter {
  return {
    id: 'encounter-1',
    date: '2026-09-05T10:00:00.000Z',
    opponentName: 'Opponent',
    mode: 'interclub',
    formatFamily: formatType === 'FMT_201' ? 'two_sets' : 'single_set',
    formatType,
    rounds: [createEmptyRound(1), createEmptyRound(2), createEmptyRound(3)],
    status
  };
}

describe('createInterclubRounds', () => {
  it('creates two rounds for the two-set format', () => {
    const rounds = createInterclubRounds('FMT_201');

    expect(rounds.map((round) => round.number)).toEqual([1, 2]);
  });

  it('creates three rounds for a single-set format', () => {
    const rounds = createInterclubRounds('FMT_101');

    expect(rounds.map((round) => round.number)).toEqual([1, 2, 3]);
  });

  it('creates three rounds for the golden-point single-set format', () => {
    const rounds = createInterclubRounds('FMT_102');

    expect(rounds.map((round) => round.number)).toEqual([1, 2, 3]);
  });
});

describe('normalizeInterclubRounds', () => {
  it('trims an in-progress two-set interclub encounter to two rounds', () => {
    const encounter = createEncounter('FMT_201');

    const normalized = normalizeInterclubRounds(encounter);

    expect(normalized.rounds.map((round) => round.number)).toEqual([1, 2]);
  });

  it('preserves all rounds in completed encounter history', () => {
    const encounter = createEncounter('FMT_201', 'completed');

    const normalized = normalizeInterclubRounds(encounter);

    expect(normalized).toBe(encounter);
    expect(normalized.rounds).toHaveLength(3);
  });

  it('preserves three rounds for an in-progress single-set interclub encounter', () => {
    const encounter = createEncounter('FMT_101');

    const normalized = normalizeInterclubRounds(encounter);

    expect(normalized).toBe(encounter);
    expect(normalized.rounds).toHaveLength(3);
  });
});
