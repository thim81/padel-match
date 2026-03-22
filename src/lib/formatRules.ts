import { Encounter, FormatFamily, FormatType, LegacyMatchFormat, StoredEncounter } from '@/types/encounter';

export interface FormatRule {
  id: FormatType;
  family: FormatFamily;
  label: string;
  description: string;
  goldenPoint: boolean;
}

export const FORMAT_RULES: Record<FormatType, FormatRule> = {
  FMT_101: {
    id: 'FMT_101',
    family: 'single_set',
    label: 'Single set to 9. At 8-8, tie-break to 7.',
    description: 'Single set to 9. At 8-8, tie-break to 7.',
    goldenPoint: false
  },
  FMT_102: {
    id: 'FMT_102',
    family: 'single_set',
    label: 'Single set to 9. At 8-8, super tie-break to 10.',
    description: 'Single set to 9. At 8-8, super tie-break to 10.',
    goldenPoint: true
  },
  FMT_201: {
    id: 'FMT_201',
    family: 'two_sets',
    label: '2 sets to 6 · TB7 · 3rd STB10 · golden point',
    description: 'Sets to 6 with TB at 6-6. Third set super tie-break to 10.',
    goldenPoint: true
  }
};

export const FORMAT_TYPES_BY_FAMILY: Record<FormatFamily, FormatType[]> = {
  single_set: ['FMT_101', 'FMT_102'],
  two_sets: ['FMT_201']
};

export const DEFAULT_FORMAT_TYPE_BY_FAMILY: Record<FormatFamily, FormatType> = {
  single_set: 'FMT_101',
  two_sets: 'FMT_201'
};

export const LEGACY_TO_FORMAT: Record<LegacyMatchFormat, { formatFamily: FormatFamily; formatType: FormatType }> = {
  '1set9': { formatFamily: 'single_set', formatType: 'FMT_101' },
  '2sets': { formatFamily: 'two_sets', formatType: 'FMT_201' }
};

export function normalizeEncounterFormat(encounter: StoredEncounter): Encounter {
  if ('formatFamily' in encounter && encounter.formatFamily && encounter.formatType) {
    return encounter as Encounter;
  }

  const legacy = encounter.format ?? '1set9';
  const mapped = LEGACY_TO_FORMAT[legacy];
  return {
    ...encounter,
    formatFamily: mapped.formatFamily,
    formatType: mapped.formatType
  };
}

export function getFormatRule(formatType: FormatType): FormatRule {
  return FORMAT_RULES[formatType];
}

export function isTwoSetsFormat(formatType: FormatType): boolean {
  return getFormatRule(formatType).family === 'two_sets';
}
