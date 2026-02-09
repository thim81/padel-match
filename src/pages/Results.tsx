import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Trophy, Home } from 'lucide-react';
import { useEncounterStore } from '@/hooks/useEncounterStore';
import { useTeamStore } from '@/hooks/useTeamStore';
import { calculateEncounterResult, formatMatchScore } from '@/lib/scoring';

export default function Results() {
  const { encounterId } = useParams<{ encounterId: string }>();
  const navigate = useNavigate();
  const { getEncounter, updateEncounter } = useEncounterStore();
  const { players } = useTeamStore();

  const encounter = getEncounter(encounterId || '');

  if (!encounter) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-muted-foreground">Encounter not found</p>
      </div>
    );
  }

  const result = calculateEncounterResult(encounter.rounds, encounter.format);
  const isWin = result.winner === 'home';
  const getPlayerName = (id: string) => players.find(p => p.id === id)?.name || '?';

  const handleClose = () => {
    updateEncounter(encounter.id, { status: 'completed', result });
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
        <p className="text-muted-foreground mt-1">vs {encounter.opponentName}</p>

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

      {/* Round breakdown */}
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

      {/* Close button — secondary style */}
      <motion.button
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        onClick={handleClose}
        className="flex items-center justify-center gap-2 w-full py-3.5 rounded-xl bg-secondary text-foreground font-semibold text-base active:scale-[0.98] transition-transform"
      >
        <Home className="w-5 h-5" />
        Close Encounter
      </motion.button>
    </div>
  );
}
