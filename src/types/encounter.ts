export type MatchFormat = '2sets' | '1set9';

export interface Player {
  id: string;
  name: string;
}

export interface TiebreakScore {
  home: number;
  away: number;
}

export interface SetScore {
  home: number;
  away: number;
  tiebreak?: TiebreakScore;
}

export interface Match {
  id: string;
  homePair: [string, string]; // player IDs
  sets: SetScore[];
  winner?: 'home' | 'away';
}

export interface Round {
  number: 1 | 2 | 3;
  matches: [Match, Match];
}

export interface EncounterResult {
  homeMatchesWon: number;
  awayMatchesWon: number;
  homeGamesWon: number;
  awayGamesWon: number;
  homePointsWon: number;
  awayPointsWon: number;
  winner: 'home' | 'away';
}

export interface Encounter {
  id: string;
  date: string;
  opponentName: string;
  format: MatchFormat;
  rounds: Round[];
  status: 'in-progress' | 'completed';
  result?: EncounterResult;
}

export function createEmptyMatch(id: string): Match {
  return {
    id,
    homePair: ['', ''],
    sets: [{ home: 0, away: 0 }]
  };
}

export function createEmptyRound(roundNumber: 1 | 2 | 3): Round {
  return {
    number: roundNumber,
    matches: [createEmptyMatch(`r${roundNumber}m1`), createEmptyMatch(`r${roundNumber}m2`)]
  };
}
