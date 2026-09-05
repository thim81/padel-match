import { FORMAT_RULES } from '@/lib/formatRules';
import { createEmptyRound, Encounter, FormatType, Round } from '@/types/encounter';

export function createInterclubRounds(formatType: FormatType): Round[] {
  const count = FORMAT_RULES[formatType].interclubRoundCount;

  return Array.from({ length: count }, (_, index) =>
    createEmptyRound((index + 1) as Round['number'])
  );
}

export function normalizeInterclubRounds(encounter: Encounter): Encounter {
  if (encounter.mode !== 'interclub' || encounter.status !== 'in-progress') {
    return encounter;
  }

  const roundCount = FORMAT_RULES[encounter.formatType].interclubRoundCount;
  if (encounter.rounds.length <= roundCount) {
    return encounter;
  }

  return {
    ...encounter,
    rounds: encounter.rounds.slice(0, roundCount)
  };
}
