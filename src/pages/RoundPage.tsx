import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, ChevronDown, ChevronRight } from 'lucide-react';
import { useEncounterStore } from '@/hooks/useEncounterStore';
import { useTeamStore } from '@/hooks/useTeamStore';
import PlayerPairSelector from '@/components/PlayerPairSelector';
import MatchScoreCard from '@/components/MatchScoreCard';
import { isRoundComplete } from '@/lib/scoring';
import { Match } from '@/types/encounter';
import { useEffect, useState } from 'react';

export default function RoundPage() {
  const { encounterId, roundNumber } = useParams<{ encounterId: string; roundNumber: string }>();
  const navigate = useNavigate();
  const { getEncounter, updateEncounter } = useEncounterStore();
  const { players } = useTeamStore();

  const encounter = getEncounter(encounterId || '');
  useEffect(() => {
    if (encounter && encounter.mode !== 'interclub') {
      navigate(`/encounter/${encounter.id}/single`, { replace: true });
    }
  }, [encounter, navigate]);

  if (encounter && encounter.mode !== 'interclub') return null;

  const roundIdx = parseInt(roundNumber || '1') - 1;
  const round = encounter?.rounds[roundIdx];

  if (!encounter || !round) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-muted-foreground">Encounter not found</p>
      </div>
    );
  }

  const getPlayerName = (id: string) => players.find(p => p.id === id)?.name || '?';

  const updateMatch = (matchIdx: number, updatedMatch: Match) => {
    const newRounds = [...encounter.rounds];
    const newMatches = [...newRounds[roundIdx].matches] as [Match, Match];
    newMatches[matchIdx] = updatedMatch;
    newRounds[roundIdx] = { ...newRounds[roundIdx], matches: newMatches };
    updateEncounter(encounter.id, { rounds: newRounds });
  };

  const updatePair = (matchIdx: number, pair: [string, string]) => {
    const newRounds = [...encounter.rounds];
    const newMatches = [...newRounds[roundIdx].matches] as [Match, Match];
    newMatches[matchIdx] = { ...newMatches[matchIdx], homePair: pair };
    newRounds[roundIdx] = { ...newRounds[roundIdx], matches: newMatches };
    updateEncounter(encounter.id, { rounds: newRounds });
  };

  const roundComplete = isRoundComplete(round, encounter.format);
  const pairsAssigned = round.matches.every(m => m.homePair[0] && m.homePair[1]);
  const isLastRound = roundIdx === 2;
  const [showAssignPlayers, setShowAssignPlayers] = useState(true);

  useEffect(() => {
    if (!pairsAssigned) {
      setShowAssignPlayers(true);
      return;
    }
    setShowAssignPlayers(false);
  }, [pairsAssigned, roundIdx]);

  // Calculate running score
  let homeWins = 0;
  let awayWins = 0;
  encounter.rounds.forEach((r, i) => {
    if (i <= roundIdx) {
      r.matches.forEach(m => {
        if (m.winner === 'home') homeWins++;
        if (m.winner === 'away') awayWins++;
      });
    }
  });

  const handleNext = () => {
    if (isLastRound) {
      navigate(`/encounter/${encounter.id}/results`);
    } else {
      navigate(`/encounter/${encounter.id}/round/${roundIdx + 2}`);
    }
  };

  return (
    <div className="flex flex-col px-4 pt-14 pb-8 gap-5">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => {
            if (roundIdx === 0) navigate('/');
            else navigate(`/encounter/${encounter.id}/round/${roundIdx}`);
          }}
          className="text-primary"
        >
          <ArrowLeft className="w-6 h-6" />
        </button>
        <div className="flex-1">
          <h1 className="text-xl font-bold text-foreground">Round {round.number}</h1>
          <p className="text-xs text-muted-foreground">vs {encounter.opponentName}</p>
        </div>
        <div className="bg-secondary rounded-lg px-3 py-1.5">
          <span className="text-lg font-bold tabular-nums text-foreground">
            {homeWins}–{awayWins}
          </span>
        </div>
      </div>

      {/* Player pairs */}
      <section>
        <button
          type="button"
          onClick={() => setShowAssignPlayers((prev) => !prev)}
          className="w-full flex items-center justify-between mb-2 px-1"
        >
          <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Assign Players
          </h2>
          <ChevronDown
            className={`w-4 h-4 text-muted-foreground transition-transform ${
              showAssignPlayers ? 'rotate-180' : ''
            }`}
          />
        </button>
        {showAssignPlayers && (
          <PlayerPairSelector
            players={players}
            match1Pair={round.matches[0].homePair}
            match2Pair={round.matches[1].homePair}
            onMatch1Change={pair => updatePair(0, pair)}
            onMatch2Change={pair => updatePair(1, pair)}
          />
        )}
      </section>

      {/* Match scores */}
      {pairsAssigned && (
        <motion.section
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2 px-1">
            Scores
          </h2>
          <div className="flex flex-col gap-3">
            {round.matches.map((match, mi) => (
              <MatchScoreCard
                key={match.id}
                match={match}
                matchIndex={mi}
                format={encounter.format}
                homePlayerNames={[
                  getPlayerName(match.homePair[0]),
                  getPlayerName(match.homePair[1]),
                ]}
                onChange={m => updateMatch(mi, m)}
              />
            ))}
          </div>
        </motion.section>
      )}

      {/* Next button */}
      <motion.button
        initial={{ opacity: 0 }}
        animate={{ opacity: roundComplete ? 1 : 0.4 }}
        onClick={handleNext}
        disabled={!roundComplete}
        className="flex items-center justify-center gap-2 w-full py-3.5 rounded-xl bg-primary text-primary-foreground font-semibold text-base disabled:opacity-40 active:scale-[0.98] transition-transform mt-2"
      >
        {isLastRound ? 'View Results' : 'Next Round'}
        <ChevronRight className="w-5 h-5" />
      </motion.button>
    </div>
  );
}
