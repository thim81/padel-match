import { useNavigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, ChevronRight, CheckCircle2 } from 'lucide-react';
import { useEncounterStore } from '@/hooks/useEncounterStore';
import { useTeamStore } from '@/hooks/useTeamStore';
import MatchScoreCard from '@/components/MatchScoreCard';
import { Encounter, Match, createEmptyMatch } from '@/types/encounter';
import { calculateSingleEncounterResult, isMatchComplete } from '@/lib/scoring';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import PlayerAvatar from '@/components/PlayerAvatar';

export default function SingleMatchPage() {
  const { encounterId } = useParams<{ encounterId: string }>();
  const navigate = useNavigate();
  const { getEncounter, updateEncounter, addEncounter } = useEncounterStore();
  const { players } = useTeamStore();

  const encounter = getEncounter(encounterId || '');

  if (!encounter || encounter.mode === 'interclub' || !encounter.singleMatch) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-muted-foreground">Single match not found</p>
      </div>
    );
  }

  const match = encounter.singleMatch;
  const isSingleMode = encounter.mode === 'single';
  const awayPair = match.awayPair ?? ['', ''];

  const updatePair = (position: 0 | 1, playerId: string) => {
    const nextPair: [string, string] = [...match.homePair] as [string, string];
    nextPair[position] = playerId;
    const nextMatch: Match = { ...match, homePair: nextPair };
    updateEncounter(encounter.id, { singleMatch: nextMatch });
  };

  const updateAwayPair = (position: 0 | 1, playerId: string) => {
    const nextPair: [string, string] = [...awayPair] as [string, string];
    nextPair[position] = playerId;
    const nextMatch: Match = { ...match, awayPair: nextPair };
    updateEncounter(encounter.id, { singleMatch: nextMatch });
  };

  const updateMatch = (nextMatch: Match) => {
    updateEncounter(encounter.id, { singleMatch: nextMatch });
  };

  const getAvailablePlayers = (target: 'home' | 'away', position: 0 | 1) => {
    const currentPair = target === 'home' ? match.homePair : awayPair;
    const otherPair = target === 'home' ? awayPair : match.homePair;
    const selectedCurrent = currentPair[position];
    const selectedSibling = currentPair[position === 0 ? 1 : 0];

    return players.filter((player) => {
      if (player.id === selectedCurrent) return true;
      if (player.id === selectedSibling) return false;
      if (otherPair.includes(player.id)) return false;
      return true;
    });
  };

  const selectedA = match.homePair[0];
  const selectedB = match.homePair[1];
  const selectedC = awayPair[0];
  const selectedD = awayPair[1];
  const availableA = getAvailablePlayers('home', 0);
  const availableB = getAvailablePlayers('home', 1);
  const availableC = getAvailablePlayers('away', 0);
  const availableD = getAvailablePlayers('away', 1);
  const playersAssigned = Boolean(selectedA && selectedB);
  const awayPairAssigned = Boolean(selectedC && selectedD);
  const matchComplete = playersAssigned && isMatchComplete(match, encounter.format);
  const isTournamentPairLocked =
    encounter.mode === 'tournament' &&
    (encounter.tournamentRound || 1) > 1 &&
    playersAssigned;

  const getPlayerName = (id: string) => players.find((player) => player.id === id)?.name || '?';
  const matchScoreHome = match.winner === 'home' ? 1 : 0;
  const matchScoreAway = match.winner === 'away' ? 1 : 0;
  const result = calculateSingleEncounterResult(match, encounter.format);
  const isTournamentWin = encounter.mode === 'tournament' && result.winner === 'home';

  const renderPlayerSelect = (
    label: string,
    value: string,
    onChange: (value: string) => void,
    availablePlayers: typeof players,
    disabled = false
  ) => (
    <div>
      <label className="text-[10px] uppercase text-muted-foreground font-medium tracking-wide">{label}</label>
      <Select value={value || ''} onValueChange={onChange} disabled={disabled}>
        <SelectTrigger className="mt-1 bg-card border-border/50 h-10 rounded-lg text-sm">
          <SelectValue placeholder="Select..." />
        </SelectTrigger>
        <SelectContent className="bg-popover border-border z-50">
          {availablePlayers.map((player) => (
            <SelectItem key={player.id} value={player.id}>
              <div className="flex items-center gap-2">
                <PlayerAvatar name={player.name} size="sm" />
                <span>{player.name}</span>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );

  const handleCloseEncounter = () => {
    updateEncounter(encounter.id, { status: 'completed', result });
    navigate('/');
  };

  const handleNextTournamentRound = () => {
    updateEncounter(encounter.id, { status: 'completed', result });
    const nextMatch = createEmptyMatch('single-match');
    if (match.homePair[0] && match.homePair[1]) {
      nextMatch.homePair = [...match.homePair] as [string, string];
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
    <div className="flex flex-col px-4 pt-14 pb-8 gap-5">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate('/')} className="text-primary">
          <ArrowLeft className="w-6 h-6" />
        </button>
        <div className="flex-1">
          <h1 className="text-xl font-bold text-foreground">
            {encounter.mode === 'tournament'
              ? `Tornooi${encounter.tournamentRound ? ` · Round ${encounter.tournamentRound}` : ''}`
              : 'Single Game'}
          </h1>
          <p className="text-xs text-muted-foreground">
            {encounter.mode === 'tournament' ? `at ${encounter.opponentName}` : `vs ${encounter.opponentName}`}
          </p>
        </div>
        <div className="bg-secondary rounded-lg px-3 py-1.5">
          <span className="text-lg font-bold tabular-nums text-foreground">
            {matchScoreHome}–{matchScoreAway}
          </span>
        </div>
      </div>

      <section>
        <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2 px-1">
          {isSingleMode ? 'Assign Pairs' : 'Assign Pair'}
        </h2>
        <div className="ios-card p-4">
          {isSingleMode ? (
            <>
              <p className="text-[10px] uppercase text-muted-foreground font-semibold tracking-wide mb-2">Pair A</p>
              <div className="grid grid-cols-2 gap-3">
                {renderPlayerSelect('Player A', selectedA, (value) => updatePair(0, value), availableA)}
                {renderPlayerSelect('Player B', selectedB, (value) => updatePair(1, value), availableB)}
              </div>
              <div className="my-3 border-t border-border/50" />
              <p className="text-[10px] uppercase text-muted-foreground font-semibold tracking-wide mb-2">Pair B</p>
              <p className="text-[11px] text-muted-foreground mb-2">Optional opponent pair</p>
              <div className="grid grid-cols-2 gap-3">
                {renderPlayerSelect('Player C', selectedC, (value) => updateAwayPair(0, value), availableC)}
                {renderPlayerSelect('Player D', selectedD, (value) => updateAwayPair(1, value), availableD)}
              </div>
            </>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              {renderPlayerSelect('Player A', selectedA, (value) => updatePair(0, value), availableA, isTournamentPairLocked)}
              {renderPlayerSelect('Player B', selectedB, (value) => updatePair(1, value), availableB, isTournamentPairLocked)}
            </div>
          )}
        </div>
        {isTournamentPairLocked && (
          <p className="text-[11px] text-muted-foreground mt-2">
            Pair is fixed for this Tornooi round.
          </p>
        )}
      </section>

      {playersAssigned && (
        <motion.section initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2 px-1">
            Score
          </h2>
          <MatchScoreCard
            match={match}
            matchIndex={0}
            format={encounter.format}
            homePlayerNames={[getPlayerName(selectedA), getPlayerName(selectedB)]}
            awayPlayerNames={isSingleMode && awayPairAssigned ? [getPlayerName(selectedC), getPlayerName(selectedD)] : undefined}
            onChange={updateMatch}
          />
        </motion.section>
      )}

      {encounter.mode === 'tournament' && matchComplete ? (
        <div className="mt-2 flex flex-col gap-2">
          {isTournamentWin && (
            <motion.button
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              onClick={handleNextTournamentRound}
              className="flex items-center justify-center gap-2 w-full py-3.5 rounded-xl bg-primary text-primary-foreground font-semibold text-base shadow-sm active:scale-[0.98] transition-transform"
            >
              Next Tournament Round
            </motion.button>
          )}

          <motion.button
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            onClick={handleCloseEncounter}
            className={`flex items-center justify-center gap-2 w-full py-3.5 rounded-xl font-semibold text-base active:scale-[0.98] transition-transform ${
              isTournamentWin
                ? 'bg-secondary text-foreground'
                : 'bg-primary text-primary-foreground shadow-sm'
            }`}
          >
            <CheckCircle2 className="w-5 h-5" />
            End Tornooi
          </motion.button>

          <button
            onClick={() => navigate(`/encounter/${encounter.id}/results`)}
            className="text-xs font-medium text-primary self-center mt-1"
          >
            View Tornooi Results
          </button>
        </div>
      ) : encounter.mode === 'single' && matchComplete ? (
        <div className="mt-2 flex flex-col gap-2">
          <motion.button
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            onClick={handleCloseEncounter}
            className="flex items-center justify-center gap-2 w-full py-3.5 rounded-xl bg-primary text-primary-foreground font-semibold text-base shadow-sm active:scale-[0.98] transition-transform"
          >
            <CheckCircle2 className="w-5 h-5" />
            Close Encounter
          </motion.button>
          <button
            onClick={() => navigate(`/encounter/${encounter.id}/results`)}
            className="text-xs font-medium text-primary self-center mt-1"
          >
            View Results
          </button>
        </div>
      ) : (
        <motion.button
          initial={{ opacity: 0 }}
          animate={{ opacity: matchComplete ? 1 : 0.4 }}
          onClick={() => navigate(`/encounter/${encounter.id}/results`)}
          disabled={!matchComplete}
          className="flex items-center justify-center gap-2 w-full py-3.5 rounded-xl bg-primary text-primary-foreground font-semibold text-base disabled:opacity-40 active:scale-[0.98] transition-transform mt-2"
        >
          View Results
          <ChevronRight className="w-5 h-5" />
        </motion.button>
      )}
    </div>
  );
}
