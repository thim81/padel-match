import { Match, MatchFormat, Round, SetScore, EncounterResult } from '@/types/encounter';

/** Determine the winner of a single set */
export function getSetWinner(
  set: SetScore,
  format: MatchFormat,
  isThirdSet: boolean
): 'home' | 'away' | null {
  if (format === '2sets') {
    if (isThirdSet) {
      // Super tiebreak — first to 10 with 2 pts difference
      if (set.tiebreak) {
        const { home, away } = set.tiebreak;
        if (home >= 10 && home - away >= 2) return 'home';
        if (away >= 10 && away - home >= 2) return 'away';
      }
      return null;
    }
    // Normal set to 6
    if (set.home === 7 && set.away === 6) return 'home';
    if (set.away === 7 && set.home === 6) return 'away';
    if (set.home === 7 && set.away === 5) return 'home';
    if (set.away === 7 && set.home === 5) return 'away';
    if (set.home >= 6 && set.home - set.away >= 2) return 'home';
    if (set.away >= 6 && set.away - set.home >= 2) return 'away';
    // At 6-6 with tiebreak: first to 7 with 2 pts difference
    if (set.home === 6 && set.away === 6 && set.tiebreak) {
      const { home, away } = set.tiebreak;
      if (home >= 7 && home - away >= 2) return 'home';
      if (away >= 7 && away - home >= 2) return 'away';
    }
    return null;
  }

  // 1 set to 9
  // At 8-8 with tiebreak: first to 10 with 2 pts difference
  if (set.home === 8 && set.away === 8 && set.tiebreak) {
    const { home, away } = set.tiebreak;
    if (home >= 10 && home - away >= 2) return 'home';
    if (away >= 10 && away - home >= 2) return 'away';
    return null;
  }
  if (set.home >= 9 && set.home - set.away >= 1) return 'home';
  if (set.away >= 9 && set.away - set.home >= 1) return 'away';
  return null;
}

/** Determine the winner of a match */
export function getMatchWinner(match: Match, format: MatchFormat): 'home' | 'away' | null {
  if (format === '2sets') {
    let homeWins = 0;
    let awayWins = 0;
    match.sets.forEach((set, i) => {
      const w = getSetWinner(set, format, i === 2);
      if (w === 'home') homeWins++;
      if (w === 'away') awayWins++;
    });
    if (homeWins >= 2) return 'home';
    if (awayWins >= 2) return 'away';
    return null;
  }

  // 1 set to 9 — single set
  if (match.sets.length === 0) return null;
  return getSetWinner(match.sets[0], format, false);
}

/** Check if a match score is complete */
export function isMatchComplete(match: Match, format: MatchFormat): boolean {
  return getMatchWinner(match, format) !== null;
}

/** Check if a round is complete */
export function isRoundComplete(round: Round, format: MatchFormat): boolean {
  return round.matches.every((m) => isMatchComplete(m, format));
}

/** Count total games in a set */
function getSetGames(set: SetScore): { home: number; away: number } {
  return { home: set.home, away: set.away };
}

/** Count total tiebreak points in a set */
function getSetPoints(set: SetScore): { home: number; away: number } {
  if (set.tiebreak) {
    return { home: set.tiebreak.home, away: set.tiebreak.away };
  }
  return { home: 0, away: 0 };
}

/** Calculate the final encounter result using cascading winner logic */
export function calculateEncounterResult(rounds: Round[], format: MatchFormat): EncounterResult {
  let homeMatchesWon = 0;
  let awayMatchesWon = 0;
  let homeGamesWon = 0;
  let awayGamesWon = 0;
  let homePointsWon = 0;
  let awayPointsWon = 0;

  rounds.forEach((round) => {
    round.matches.forEach((match) => {
      const winner = getMatchWinner(match, format);
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

  // Cascading winner logic
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

/** Format a match score for display */
export function formatMatchScore(match: Match, format: MatchFormat): string {
  if (match.sets.length === 0) return '—';

  return match.sets
    .map((set, i) => {
      if (format === '2sets' && i === 2) {
        // Super tiebreak
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

/** Validate set score based on format */
export function isValidSetScore(
  home: number,
  away: number,
  format: MatchFormat,
  isThirdSet: boolean
): boolean {
  if (format === '2sets' && isThirdSet) {
    return true; // Super tiebreak handled separately
  }

  if (format === '2sets') {
    // Valid: 6-0 to 6-4, 7-5, 7-6, and reverses
    if (home === 6 && away <= 4) return true;
    if (away === 6 && home <= 4) return true;
    if ((home === 7 && away === 5) || (away === 7 && home === 5)) return true;
    if ((home === 7 && away === 6) || (away === 7 && home === 6)) return true;
    return false;
  }

  // 1 set to 9
  if (home === 9 && away <= 7) return true;
  if (away === 9 && home <= 7) return true;
  if ((home === 9 && away === 8) || (away === 9 && home === 8)) return true;
  return false;
}

/** Check if a tiebreak is needed */
export function needsTiebreak(home: number, away: number, format: MatchFormat): boolean {
  if (format === '2sets') return home === 6 && away === 6;
  return home === 8 && away === 8;
}

/** Check if super tiebreak is needed (3rd set in 2sets format) */
export function needsSuperTiebreak(match: Match, format: MatchFormat): boolean {
  if (format !== '2sets') return false;
  let homeWins = 0;
  let awayWins = 0;
  match.sets.forEach((set, i) => {
    if (i < 2) {
      const w = getSetWinner(set, format, false);
      if (w === 'home') homeWins++;
      if (w === 'away') awayWins++;
    }
  });
  return homeWins === 1 && awayWins === 1;
}
