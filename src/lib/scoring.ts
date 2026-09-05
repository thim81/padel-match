import { Match, FormatType, Round, SetScore, EncounterResult } from '@/types/encounter';
import { isTwoSetsFormat } from '@/lib/formatRules';

function isSingleStbFormat(formatType: FormatType): boolean {
  return formatType === 'FMT_102';
}

/** Determine the winner of a single set */
export function getSetWinner(
  set: SetScore,
  formatType: FormatType,
  isThirdSet: boolean
): 'home' | 'away' | null {
  if (isTwoSetsFormat(formatType)) {
    if (isThirdSet) {
      if (set.tiebreak) {
        const { home, away } = set.tiebreak;
        if (home >= 10 && home - away >= 2) return 'home';
        if (away >= 10 && away - home >= 2) return 'away';
      }
      return null;
    }

    if (set.home === 7 && set.away === 6) return 'home';
    if (set.away === 7 && set.home === 6) return 'away';
    if (set.home === 7 && set.away === 5) return 'home';
    if (set.away === 7 && set.home === 5) return 'away';
    if (set.home >= 6 && set.home - set.away >= 2) return 'home';
    if (set.away >= 6 && set.away - set.home >= 2) return 'away';

    if (set.home === 6 && set.away === 6 && set.tiebreak) {
      const { home, away } = set.tiebreak;
      if (home >= 7 && home - away >= 2) return 'home';
      if (away >= 7 && away - home >= 2) return 'away';
    }
    return null;
  }

  if (set.home === 8 && set.away === 8 && set.tiebreak) {
    const { home, away } = set.tiebreak;
    const tbTarget = isSingleStbFormat(formatType) ? 10 : 7;
    if (home >= tbTarget && home - away >= 2) return 'home';
    if (away >= tbTarget && away - home >= 2) return 'away';
    return null;
  }

  if (set.home >= 9 && set.home - set.away >= 1) return 'home';
  if (set.away >= 9 && set.away - set.home >= 1) return 'away';
  return null;
}

/** Determine the winner of a match */
export function getMatchWinner(match: Match, formatType: FormatType): 'home' | 'away' | null {
  if (isTwoSetsFormat(formatType)) {
    let homeWins = 0;
    let awayWins = 0;
    match.sets.forEach((set, i) => {
      const winner = getSetWinner(set, formatType, i === 2);
      if (winner === 'home') homeWins++;
      if (winner === 'away') awayWins++;
    });
    if (homeWins >= 2) return 'home';
    if (awayWins >= 2) return 'away';
    return null;
  }

  if (match.sets.length === 0) return null;
  return getSetWinner(match.sets[0], formatType, false);
}

export function isMatchComplete(match: Match, formatType: FormatType): boolean {
  return getMatchWinner(match, formatType) !== null;
}

export function isRoundComplete(round: Round, formatType: FormatType): boolean {
  return round.matches.every((m) => isMatchComplete(m, formatType));
}

function getSetGames(set: SetScore): { home: number; away: number } {
  return { home: set.home, away: set.away };
}

function getSetPoints(set: SetScore): { home: number; away: number } {
  if (set.tiebreak) {
    return { home: set.tiebreak.home, away: set.tiebreak.away };
  }
  return { home: 0, away: 0 };
}

export function calculateEncounterResult(rounds: Round[], formatType: FormatType): EncounterResult {
  let homeMatchesWon = 0;
  let awayMatchesWon = 0;
  let homeGamesWon = 0;
  let awayGamesWon = 0;
  let homePointsWon = 0;
  let awayPointsWon = 0;

  rounds.forEach((round) => {
    round.matches.forEach((match) => {
      const winner = getMatchWinner(match, formatType);
      if (winner === 'home') homeMatchesWon++;
      if (winner === 'away') awayMatchesWon++;

      match.sets.forEach((set) => {
        const games = getSetGames(set);
        homeGamesWon += games.home;
        awayGamesWon += games.away;

        const points = getSetPoints(set);
        homePointsWon += points.home;
        awayPointsWon += points.away;
      });
    });
  });

  let winner: 'home' | 'away';
  if (homeMatchesWon !== awayMatchesWon) {
    winner = homeMatchesWon > awayMatchesWon ? 'home' : 'away';
  } else if (homeGamesWon !== awayGamesWon) {
    winner = homeGamesWon > awayGamesWon ? 'home' : 'away';
  } else {
    winner = homePointsWon >= awayPointsWon ? 'home' : 'away';
  }

  return {
    homeMatchesWon,
    awayMatchesWon,
    homeGamesWon,
    awayGamesWon,
    homePointsWon,
    awayPointsWon,
    winner
  };
}

export function calculateSingleEncounterResult(
  match: Match,
  formatType: FormatType
): EncounterResult {
  let homeMatchesWon = 0;
  let awayMatchesWon = 0;
  let homeGamesWon = 0;
  let awayGamesWon = 0;
  let homePointsWon = 0;
  let awayPointsWon = 0;

  const winner = getMatchWinner(match, formatType);
  if (winner === 'home') homeMatchesWon = 1;
  if (winner === 'away') awayMatchesWon = 1;

  match.sets.forEach((set) => {
    homeGamesWon += set.home;
    awayGamesWon += set.away;
    if (set.tiebreak) {
      homePointsWon += set.tiebreak.home;
      awayPointsWon += set.tiebreak.away;
    }
  });

  const encounterWinner: 'home' | 'away' =
    winner ?? (homeGamesWon >= awayGamesWon ? 'home' : 'away');

  return {
    homeMatchesWon,
    awayMatchesWon,
    homeGamesWon,
    awayGamesWon,
    homePointsWon,
    awayPointsWon,
    winner: encounterWinner
  };
}

export function formatMatchScore(match: Match, formatType: FormatType): string {
  if (match.sets.length === 0) return '—';

  const displaySets = hasStraightSetsWinner(match, formatType)
    ? match.sets.slice(0, 2)
    : match.sets;

  return displaySets
    .map((set, i) => {
      if (isTwoSetsFormat(formatType) && i === 2) {
        if (set.tiebreak) return `[${set.tiebreak.home}-${set.tiebreak.away}]`;
        return '—';
      }
      let score = `${set.home}-${set.away}`;
      if (set.tiebreak) {
        const loserTBScore = Math.min(set.tiebreak.home, set.tiebreak.away);
        score += `(${loserTBScore})`;
      }
      return score;
    })
    .join(' ');
}

export function isValidSetScore(
  home: number,
  away: number,
  formatType: FormatType,
  isThirdSet: boolean
): boolean {
  if (isTwoSetsFormat(formatType) && isThirdSet) {
    return true;
  }

  if (isTwoSetsFormat(formatType)) {
    if (home === 6 && away <= 4) return true;
    if (away === 6 && home <= 4) return true;
    if ((home === 7 && away === 5) || (away === 7 && home === 5)) return true;
    if ((home === 7 && away === 6) || (away === 7 && home === 6)) return true;
    return false;
  }

  if (home === 9 && away <= 7) return true;
  if (away === 9 && home <= 7) return true;
  if ((home === 9 && away === 8) || (away === 9 && home === 8)) return true;
  return false;
}

export function needsTiebreak(home: number, away: number, formatType: FormatType): boolean {
  if (isTwoSetsFormat(formatType)) return home === 6 && away === 6;
  return home === 8 && away === 8;
}

export function needsSuperTiebreak(match: Match, formatType: FormatType): boolean {
  if (!isTwoSetsFormat(formatType)) return false;
  let homeWins = 0;
  let awayWins = 0;
  match.sets.forEach((set, i) => {
    if (i < 2) {
      const winner = getSetWinner(set, formatType, false);
      if (winner === 'home') homeWins++;
      if (winner === 'away') awayWins++;
    }
  });
  return homeWins === 1 && awayWins === 1;
}

export function hasStraightSetsWinner(match: Match, formatType: FormatType): boolean {
  if (!isTwoSetsFormat(formatType) || match.sets.length < 2) return false;

  const firstSetWinner = getSetWinner(match.sets[0], formatType, false);
  const secondSetWinner = getSetWinner(match.sets[1], formatType, false);

  return firstSetWinner !== null && firstSetWinner === secondSetWinner;
}
