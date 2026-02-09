import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Trophy, CheckCircle2 } from 'lucide-react';
import { useEncounterStore } from '@/hooks/useEncounterStore';
import { useTeamStore } from '@/hooks/useTeamStore';
import { calculateEncounterResult, calculateSingleEncounterResult, formatMatchScore, getSetWinner } from '@/lib/scoring';
import { Encounter, createEmptyMatch } from '@/types/encounter';

export default function Results() {
  const { encounterId } = useParams<{ encounterId: string }>();
  const navigate = useNavigate();
  const { encounters, getEncounter, updateEncounter, addEncounter } = useEncounterStore();
  const { players } = useTeamStore();

  const encounter = getEncounter(encounterId || '');

  if (!encounter) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-muted-foreground">Encounter not found</p>
      </div>
    );
  }

  const isSingleMode = encounter.mode !== 'interclub';
  const result = isSingleMode && encounter.singleMatch
    ? calculateSingleEncounterResult(encounter.singleMatch, encounter.format)
    : calculateEncounterResult(encounter.rounds, encounter.format);
  const isWin = result.winner === 'home';
  const getPlayerName = (id: string) => players.find(p => p.id === id)?.name || '?';
  const tournamentRunId = encounter.mode === 'tournament' ? (encounter.tournamentId || encounter.id) : '';
  const tournamentMatches = encounter.mode === 'tournament'
    ? encounters
        .filter((item) => item.mode === 'tournament' && (item.tournamentId || item.id) === tournamentRunId)
        .sort((a, b) => {
          const roundDiff = (a.tournamentRound || 1) - (b.tournamentRound || 1);
          if (roundDiff !== 0) return roundDiff;
          return new Date(a.date).getTime() - new Date(b.date).getTime();
        })
    : [];

  const handleClose = () => {
    updateEncounter(encounter.id, { status: 'completed', result });
    navigate('/');
  };

  const handleNextTournamentRound = () => {
    updateEncounter(encounter.id, { status: 'completed', result });
    const nextMatch = createEmptyMatch('single-match');
    if (encounter.singleMatch?.homePair[0] && encounter.singleMatch?.homePair[1]) {
      nextMatch.homePair = [...encounter.singleMatch.homePair] as [string, string];
    }

    const nextEncounter: Encounter = {
      id: crypto.randomUUID(),
      date: new Date().toISOString(),
      opponentName: encounter.opponentName,
      mode: 'tournament',
      tournamentId: encounter.tournamentId || encounter.id,
      tournamentRound: (encounter.tournamentRound || 1) + 1,
      format: encounter.format,
      rounds: [],
      singleMatch: nextMatch,
      status: 'in-progress',
    };

    addEncounter(nextEncounter);
    navigate('/');
  };

  return (
    <div className="flex flex-col px-4 pt-14 pb-8 gap-6">
      {/* Winner announcement */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="text-center py-6"
      >
        <motion.div
          initial={{ rotate: -10 }}
          animate={{ rotate: 0 }}
          transition={{ type: 'spring', stiffness: 200 }}
          className={`inline-flex items-center justify-center w-20 h-20 rounded-3xl mb-4 ${
            isWin ? 'bg-success/10' : 'bg-destructive/10'
          }`}
        >
          <Trophy className={`w-10 h-10 ${isWin ? 'text-success' : 'text-destructive'}`} />
        </motion.div>

        <h1 className="text-2xl font-bold text-foreground">
          {isWin ? 'Victory!' : 'Defeat'}
        </h1>
        <p className="text-muted-foreground mt-1">
          {encounter.mode === 'tournament' ? `at ${encounter.opponentName}` : `vs ${encounter.opponentName}`}
        </p>

        <div className="flex items-center justify-center gap-4 mt-4">
          <div className="text-center">
            <p className="text-3xl font-bold tabular-nums text-foreground">{result.homeMatchesWon}</p>
            <p className="text-xs text-muted-foreground">Home</p>
          </div>
          <span className="text-2xl text-muted-foreground">–</span>
          <div className="text-center">
            <p className="text-3xl font-bold tabular-nums text-foreground">{result.awayMatchesWon}</p>
            <p className="text-xs text-muted-foreground">Away</p>
          </div>
        </div>

        {encounter.mode === 'tournament' && (
          <div className="mt-5 flex flex-col gap-2">
            {isWin && (
              <motion.button
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
                onClick={handleNextTournamentRound}
                className="flex items-center justify-center gap-2 w-full py-3.5 rounded-xl bg-primary text-primary-foreground font-semibold text-base shadow-sm active:scale-[0.98] transition-transform"
              >
                Next Tournament Round
              </motion.button>
            )}

            <motion.button
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: isWin ? 0.35 : 0.3 }}
              onClick={handleClose}
              className={`flex items-center justify-center gap-2 w-full py-3.5 rounded-xl font-semibold text-base active:scale-[0.98] transition-transform ${
                isWin
                  ? 'bg-secondary text-foreground'
                  : 'bg-primary text-primary-foreground shadow-sm'
              }`}
            >
              <CheckCircle2 className="w-5 h-5" />
              End Tornooi
            </motion.button>
          </div>
        )}
      </motion.div>

      {/* Tiebreak details if needed */}
      {result.homeMatchesWon === result.awayMatchesWon && (
        <div className="ios-card p-4">
          <p className="text-xs font-semibold uppercase text-muted-foreground mb-2">Tiebreaker</p>
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Games:</span>
            <span className="font-semibold text-foreground">{result.homeGamesWon} – {result.awayGamesWon}</span>
          </div>
          {result.homeGamesWon === result.awayGamesWon && (
            <div className="flex items-center justify-between text-sm mt-1">
              <span className="text-muted-foreground">Points:</span>
              <span className="font-semibold text-foreground">{result.homePointsWon} – {result.awayPointsWon}</span>
            </div>
          )}
        </div>
      )}

      {encounter.mode === 'tournament' ? (
        <section>
          <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2 px-1">
            Tornooi Results
          </h2>
          <div className="flex flex-col gap-2">
            {tournamentMatches.map((matchEncounter) => {
              const matchResult = matchEncounter.id === encounter.id
                ? result
                : matchEncounter.result;

              return (
                <div key={matchEncounter.id} className="ios-card p-4">
                  {(() => {
                    const sets = matchEncounter.singleMatch?.sets ?? [];
                    const homePoints = matchResult?.homePointsWon ?? 0;
                    const awayPoints = matchResult?.awayPointsWon ?? 0;

                    return (
                      <>
                        <div className="flex items-center justify-between">
                          <p className="text-xs font-semibold uppercase text-muted-foreground">
                            Round {matchEncounter.tournamentRound || 1}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(matchEncounter.date).toLocaleDateString('en-US', { day: 'numeric', month: 'short' })}
                          </p>
                        </div>
                        <div className="flex items-center justify-between mt-2">
                          <p className="text-sm font-medium text-foreground truncate">
                            at {matchEncounter.opponentName}
                          </p>
                          <p className="text-lg font-bold tabular-nums text-foreground">
                            {matchResult ? `${matchResult.homeMatchesWon}–${matchResult.awayMatchesWon}` : '—'}
                          </p>
                        </div>

                        {sets.length > 0 && (
                          <div className="mt-3 rounded-lg border border-border/50 bg-secondary/20 px-3 py-2">
                            <div className="flex items-center justify-between">
                              <p className="text-[10px] font-semibold uppercase text-muted-foreground">
                                Set Results
                              </p>
                              <p className="text-[10px] font-semibold uppercase text-muted-foreground tabular-nums">
                                Pts {homePoints}–{awayPoints}
                              </p>
                            </div>

                            <div className="mt-1 flex items-center justify-center gap-3 font-mono tabular-nums">
                              {sets.map((set, si) => {
                                const winner = getSetWinner(set, matchEncounter.format, matchEncounter.format === '2sets' && si === 2);
                                const homeScoreClass = winner === 'home'
                                  ? 'text-success font-bold'
                                  : winner === 'away'
                                    ? 'text-destructive'
                                    : 'text-muted-foreground';
                                return (
                                  <div key={`home-set-${si}`} className={`text-lg leading-none ${homeScoreClass}`}>
                                    {set.home}
                                    {set.tiebreak && (
                                      <sup className="ml-0.5 text-[10px] align-top">
                                        {set.tiebreak.home}
                                      </sup>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                            <div className="mt-1 flex items-center justify-center gap-3 text-[10px] text-muted-foreground tabular-nums">
                              {sets.map((_, si) => (
                                <div key={`set-label-${si}`}>{si + 1}</div>
                              ))}
                            </div>
                            <div className="mt-1 flex items-center justify-center gap-3 font-mono tabular-nums">
                              {sets.map((set, si) => {
                                const winner = getSetWinner(set, matchEncounter.format, matchEncounter.format === '2sets' && si === 2);
                                const awayScoreClass = winner === 'away'
                                  ? 'text-success font-bold'
                                  : winner === 'home'
                                    ? 'text-destructive'
                                    : 'text-muted-foreground';
                                return (
                                  <div key={`away-set-${si}`} className={`text-lg leading-none ${awayScoreClass}`}>
                                    {set.away}
                                    {set.tiebreak && (
                                      <sup className="ml-0.5 text-[10px] align-top">
                                        {set.tiebreak.away}
                                      </sup>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}
                      </>
                    );
                  })()}
                </div>
              );
            })}
          </div>
        </section>
      ) : isSingleMode ? (
        <section>
          <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2 px-1">
            Match Summary
          </h2>
          {encounter.singleMatch && (
            <div className="ios-card p-4">
              <div className="flex items-center justify-between py-1">
                <div className={`w-1 self-stretch rounded-full mr-3 ${
                  encounter.singleMatch.winner === 'home' ? 'bg-success' : encounter.singleMatch.winner === 'away' ? 'bg-destructive' : 'bg-border'
                }`} />
                <div className="flex-1">
                  <p className="text-sm font-medium text-foreground">
                    {getPlayerName(encounter.singleMatch.homePair[0])} & {getPlayerName(encounter.singleMatch.homePair[1])}
                    {encounter.mode === 'single' &&
                    encounter.singleMatch.awayPair?.[0] &&
                    encounter.singleMatch.awayPair?.[1]
                      ? ` vs ${getPlayerName(encounter.singleMatch.awayPair[0])} & ${getPlayerName(encounter.singleMatch.awayPair[1])}`
                      : ''}
                  </p>
                  <span className={`inline-block mt-0.5 text-[10px] font-semibold px-1.5 py-0.5 rounded ${
                    encounter.singleMatch.winner === 'home' ? 'bg-success/10 text-success' : 'bg-destructive/10 text-destructive'
                  }`}>
                    {encounter.singleMatch.winner === 'home' ? 'W' : 'L'}
                  </span>
                </div>
                <span className="text-sm font-mono text-muted-foreground">
                  {formatMatchScore(encounter.singleMatch, encounter.format)}
                </span>
              </div>
            </div>
          )}
        </section>
      ) : (
        <section>
          <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2 px-1">
            Round Breakdown
          </h2>
          <div className="flex flex-col gap-2">
            {encounter.rounds.map(round => (
              <div key={round.number} className="ios-card p-4">
                <p className="text-xs font-semibold uppercase text-muted-foreground mb-3">Round {round.number}</p>
                {round.matches.map((match, mi) => (
                  <div
                    key={match.id}
                    className={`flex items-center justify-between py-2.5 ${
                      mi === 0 ? 'border-b border-border/50 pb-3 mb-2' : ''
                    }`}
                  >
                    <div className={`w-1 self-stretch rounded-full mr-3 ${
                      match.winner === 'home' ? 'bg-success' : match.winner === 'away' ? 'bg-destructive' : 'bg-border'
                    }`} />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-foreground">
                        {getPlayerName(match.homePair[0])} & {getPlayerName(match.homePair[1])}
                      </p>
                      <div className="flex items-center gap-1 mt-0.5">
                        <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${
                          match.winner === 'home' ? 'bg-success/10 text-success' : 'bg-destructive/10 text-destructive'
                        }`}>
                          {match.winner === 'home' ? 'W' : 'L'}
                        </span>
                      </div>
                    </div>
                    <span className="text-sm font-mono text-muted-foreground">
                      {formatMatchScore(match, encounter.format)}
                    </span>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </section>
      )}

      {encounter.mode !== 'tournament' && (
        <motion.button
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          onClick={handleClose}
          className="flex items-center justify-center gap-2 w-full py-3.5 rounded-xl bg-primary text-primary-foreground font-semibold text-base shadow-sm active:scale-[0.98] transition-transform"
        >
          <CheckCircle2 className="w-5 h-5" />
          Close Encounter
        </motion.button>
      )}
    </div>
  );
}
