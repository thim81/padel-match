import { useEncounterStore } from '@/hooks/useEncounterStore';
import { useTeamStore } from '@/hooks/useTeamStore';
import { formatMatchScore, getSetWinner } from '@/lib/scoring';
import { Encounter, Match, MatchFormat } from '@/types/encounter';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, Trophy, Plus, Trash2, CalendarDays } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

function EncounterDetail({ encounter, players }: { encounter: Encounter; players: { id: string; name: string }[] }) {
  const getPlayerName = (id: string) => players.find(p => p.id === id)?.name || 'Unknown';
  const isSingleMode = encounter.mode !== 'interclub' && encounter.singleMatch;

  if (isSingleMode) {
    const match = encounter.singleMatch;
    return (
      <motion.div
        initial={{ opacity: 0, height: 0 }}
        animate={{ opacity: 1, height: 'auto' }}
        exit={{ opacity: 0, height: 0 }}
        className="px-4 pb-4"
      >
        <div className="bg-secondary/40 rounded-xl p-3 border border-border/40">
          <p className="text-xs font-semibold uppercase text-muted-foreground mb-2">Single Match</p>
          <div className="flex items-center justify-between py-1">
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground truncate">
                {match.homePair[0] && match.homePair[1]
                  ? `${getPlayerName(match.homePair[0])} & ${getPlayerName(match.homePair[1])}`
                  : 'TBD'}
              </p>
              {match.winner && (
                <span className={`inline-block mt-0.5 text-[10px] font-semibold px-1.5 py-0.5 rounded ${
                  match.winner === 'home' ? 'bg-success/10 text-success' : 'bg-destructive/10 text-destructive'
                }`}>
                  {match.winner === 'home' ? 'W' : 'L'}
                </span>
              )}
            </div>
            <span className="text-sm font-mono text-muted-foreground ml-2">
              {formatMatchScore(match, encounter.format)}
            </span>
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      exit={{ opacity: 0, height: 0 }}
      className="px-4 pb-4"
    >
      <div className="flex flex-col gap-3">
        {encounter.rounds.map(round => (
          <div key={round.number} className="bg-secondary/40 rounded-xl p-3 border border-border/40">
            <p className="text-xs font-semibold uppercase text-muted-foreground mb-2">Round {round.number}</p>
            {round.matches.map((match, mi) => (
              <div key={match.id} className={`flex items-center justify-between py-2 ${mi === 0 ? 'border-b border-border/50 pb-2.5 mb-1.5' : ''}`}>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">
                    {match.homePair[0] && match.homePair[1]
                      ? `${getPlayerName(match.homePair[0])} & ${getPlayerName(match.homePair[1])}`
                      : 'TBD'}
                  </p>
                  {match.winner && (
                    <span className={`inline-block mt-0.5 text-[10px] font-semibold px-1.5 py-0.5 rounded ${
                      match.winner === 'home' ? 'bg-success/10 text-success' : 'bg-destructive/10 text-destructive'
                    }`}>
                      {match.winner === 'home' ? 'W' : 'L'}
                    </span>
                  )}
                </div>
                <span className="text-sm font-mono text-muted-foreground ml-2">
                  {formatMatchScore(match, encounter.format)}
                </span>
              </div>
            ))}
          </div>
        ))}
      </div>
    </motion.div>
  );
}

function toDayKey(isoDate: string): string {
  const d = new Date(isoDate);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function getTiebreakSummary(match: Match, format: MatchFormat): string | null {
  const details = match.sets
    .map((set, i) => {
      if (!set.tiebreak) return null;
      if (format === '2sets' && i === 2) return `STB ${set.tiebreak.home}-${set.tiebreak.away}`;
      return `TB${i + 1} ${set.tiebreak.home}-${set.tiebreak.away}`;
    })
    .filter(Boolean) as string[];

  return details.length > 0 ? details.join(' · ') : null;
}

function getCompactMatchScore(match: Match, format: MatchFormat, side: 'home' | 'away'): string {
  if (format === '1set9') {
    const firstSet = match.sets[0];
    if (!firstSet) return '-';
    const score = side === 'home' ? firstSet.home : firstSet.away;
    return `${score}${firstSet.tiebreak ? '*' : ''}`;
  }

  let wonSets = 0;
  match.sets.forEach((set, i) => {
    const winner = getSetWinner(set, format, i === 2);
    if (winner === side) wonSets++;
  });
  return String(wonSets);
}

export default function History() {
  const { encounters, deleteEncounter } = useEncounterStore();
  const { players } = useTeamStore();
  const navigate = useNavigate();
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [selectedDay, setSelectedDay] = useState<string | null>(null);
  const [pendingDelete, setPendingDelete] = useState<Encounter | null>(null);

  const completed = encounters
    .filter(e => e.status === 'completed')
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  const dayKeys = Array.from(new Set(completed.map(e => toDayKey(e.date))));

  useEffect(() => {
    if (dayKeys.length === 0) {
      setSelectedDay(null);
      return;
    }
    if (!selectedDay || !dayKeys.includes(selectedDay)) {
      setSelectedDay(dayKeys[0]);
    }
  }, [dayKeys, selectedDay]);

  const visibleEncounters = selectedDay
    ? completed.filter(e => toDayKey(e.date) === selectedDay)
    : completed;

  const monthLabel = selectedDay
    ? new Date(`${selectedDay}T00:00:00`).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
    : new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  const handleConfirmDelete = () => {
    if (!pendingDelete) return;
    deleteEncounter(pendingDelete.id);
    if (expandedId === pendingDelete.id) setExpandedId(null);
    setPendingDelete(null);
  };

  return (
    <div className="flex flex-col px-4 pt-14 pb-8 gap-6">
      <div className="flex items-end justify-between">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">History</h1>
        <p className="text-sm text-muted-foreground font-medium">{monthLabel}</p>
      </div>

      {completed.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
          <div className="w-20 h-20 rounded-3xl bg-secondary/50 flex items-center justify-center mb-4">
            <Trophy className="w-10 h-10 opacity-20" />
          </div>
          <p className="text-base font-medium text-foreground/50 mb-1">No encounters yet</p>
          <p className="text-sm text-muted-foreground mb-6">Start your first match to see results here</p>
          <button
            onClick={() => navigate('/encounter/new')}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-semibold active:scale-[0.98] transition-transform"
          >
            <Plus className="w-4 h-4" />
            New Encounter
          </button>
        </div>
      ) : (
        <>
          <div className="flex gap-2 overflow-x-auto pb-1">
            {dayKeys.map(dayKey => {
              const dayDate = new Date(`${dayKey}T00:00:00`);
              const isActive = selectedDay === dayKey;

              return (
                <button
                  key={dayKey}
                  onClick={() => setSelectedDay(dayKey)}
                  className={`shrink-0 min-w-[70px] rounded-2xl px-3 py-2.5 border transition-colors ${
                    isActive
                      ? 'bg-primary text-primary-foreground border-primary'
                      : 'bg-card text-foreground border-border'
                  }`}
                >
                  <p className={`text-[11px] font-semibold ${isActive ? 'text-primary-foreground/80' : 'text-muted-foreground'}`}>
                    {dayDate.toLocaleDateString('en-US', { weekday: 'short' })}
                  </p>
                  <p className="text-2xl leading-none mt-1 font-semibold tabular-nums">
                    {dayDate.toLocaleDateString('en-US', { day: 'numeric' })}
                  </p>
                </button>
              );
            })}
          </div>

          <div className="flex flex-col gap-3">
            {visibleEncounters.map(encounter => {
            const isExpanded = expandedId === encounter.id;
            const isWin = encounter.result?.winner === 'home';
            const isSingleMode = encounter.mode !== 'interclub' && encounter.singleMatch;
            const encounterDate = new Date(encounter.date);
            const date = encounterDate.toLocaleDateString('en-US', {
              weekday: 'short',
              day: 'numeric',
              month: 'short',
            });
            const time = encounterDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

            return (
              <div key={encounter.id} className="ios-card overflow-hidden border border-border/60 shadow-sm">
                <div className="px-4 pt-4 pb-3">
                  <div className="flex items-start gap-3">
                    <div className={`w-1 self-stretch rounded-full ${isWin ? 'bg-success' : 'bg-destructive'}`} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-baseline justify-between gap-3">
                        <p className="text-2xl font-bold leading-none tabular-nums text-foreground">
                          {encounter.result?.homeMatchesWon ?? '-'}–{encounter.result?.awayMatchesWon ?? '-'}
                        </p>
                        <p className="text-xs text-muted-foreground whitespace-nowrap">
                          {date} · {time}
                        </p>
                      </div>
                      <p className="text-base font-semibold text-foreground mt-1 truncate">
                        {encounter.mode === 'tournament' ? `at ${encounter.opponentName}` : `vs ${encounter.opponentName}`}
                      </p>
                      <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                        <CalendarDays className="w-3.5 h-3.5" />
                        <span>
                          {encounter.mode === 'tournament'
                            ? `Tornooi${encounter.tournamentRound ? ` R${encounter.tournamentRound}` : ''}`
                            : isSingleMode ? 'Single' : 'Interclub'} · {encounter.format === '2sets' ? '2 Sets' : '1 Set to 9'}
                        </span>
                      </div>
                    </div>
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-md ${isWin ? 'bg-success/10 text-success' : 'bg-destructive/10 text-destructive'}`}>
                      {isWin ? 'Win' : 'Loss'}
                    </span>
                  </div>

                  <div className={`mt-3 grid gap-1.5 ${isSingleMode ? 'grid-cols-1' : 'grid-cols-3'}`}>
                    {(isSingleMode ? [{ number: 1, matches: [encounter.singleMatch!] }] : encounter.rounds).map(round => {
                      if (isSingleMode) {
                        const match = round.matches[0];
                        const tiebreak = getTiebreakSummary(match, encounter.format);
                        return (
                          <div
                            key={`summary-single-${encounter.id}`}
                            className={`rounded-lg border px-2 py-1.5 ${
                              match.winner === 'home'
                                ? 'border-success/40 bg-success/5'
                                : match.winner === 'away'
                                  ? 'border-destructive/40 bg-destructive/5'
                                  : 'border-border/50 bg-secondary/20'
                            }`}
                          >
                            <p className="text-[9px] font-semibold uppercase tracking-wide text-muted-foreground">
                              Match
                            </p>
                            <p className={`mt-1 font-mono text-[13px] leading-tight tabular-nums ${match.winner === 'home' ? 'text-success' : 'text-foreground'}`}>
                              {getCompactMatchScore(match, encounter.format, 'home')}
                            </p>
                            <p className="mt-0.5 text-[9px] leading-none text-muted-foreground/80 tabular-nums">
                              Home
                            </p>
                            <p className={`mt-0.5 font-mono text-[13px] leading-tight tabular-nums ${match.winner === 'away' ? 'text-success' : 'text-muted-foreground'}`}>
                              {getCompactMatchScore(match, encounter.format, 'away')}
                            </p>
                            {tiebreak && (
                              <p className="mt-0.5 text-[8px] leading-tight text-muted-foreground">{tiebreak}</p>
                            )}
                          </div>
                        );
                      }

                      const homeWins = round.matches.filter(m => m.winner === 'home').length;
                      const awayWins = round.matches.filter(m => m.winner === 'away').length;
                      const roundWin = homeWins > awayWins;
                      const roundLoss = awayWins > homeWins;
                      const tiebreaks = round.matches
                        .map(match => getTiebreakSummary(match, encounter.format))
                        .filter(Boolean)
                        .join(' · ');

                      return (
                        <div
                          key={`summary-${round.number}`}
                          className={`rounded-lg border px-2 py-1.5 ${
                            roundWin
                              ? 'border-success/40 bg-success/5'
                              : roundLoss
                                ? 'border-destructive/40 bg-destructive/5'
                                : 'border-border/50 bg-secondary/20'
                          }`}
                        >
                          <p className="text-[9px] font-semibold uppercase tracking-wide text-muted-foreground">
                            R{round.number}
                          </p>
                          <div className="mt-1 flex items-center gap-1 font-mono text-[13px] leading-tight tabular-nums">
                            {round.matches.map((match, mi) => (
                              <span
                                key={`home-score-${match.id}`}
                                className={match.winner === 'home' ? 'text-success' : match.winner === 'away' ? 'text-destructive' : 'text-foreground'}
                              >
                                {getCompactMatchScore(match, encounter.format, 'home')}
                                {mi === 0 && <span className="text-muted-foreground/70"> | </span>}
                              </span>
                            ))}
                          </div>
                          <p className="mt-0.5 text-[9px] leading-none text-muted-foreground/80 tabular-nums">
                            M1 | M2
                          </p>
                          <div className="mt-0.5 flex items-center gap-1 font-mono text-[13px] leading-tight tabular-nums">
                            {round.matches.map((match, mi) => (
                              <span
                                key={`away-score-${match.id}`}
                                className={match.winner === 'away' ? 'text-success' : match.winner === 'home' ? 'text-destructive' : 'text-muted-foreground'}
                              >
                                {getCompactMatchScore(match, encounter.format, 'away')}
                                {mi === 0 && <span className="text-muted-foreground/70"> | </span>}
                              </span>
                            ))}
                          </div>
                          {tiebreaks && (
                            <p className="mt-0.5 text-[8px] leading-tight text-muted-foreground">{tiebreaks}</p>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  <div className="mt-3 pt-3 border-t border-border/50 flex items-center justify-between">
                    <button
                      onClick={() => setExpandedId(isExpanded ? null : encounter.id)}
                      className="flex items-center gap-1.5 text-sm font-medium text-primary"
                    >
                      {isExpanded ? 'Hide details' : 'Round details'}
                      <ChevronDown className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                    </button>

                    <button
                      onClick={() => setPendingDelete(encounter)}
                      className="flex items-center gap-1.5 text-sm font-medium text-destructive"
                    >
                      <Trash2 className="w-4 h-4" />
                      Delete
                    </button>
                  </div>
                </div>

                <AnimatePresence initial={false}>
                  {isExpanded && <EncounterDetail encounter={encounter} players={players} />}
                </AnimatePresence>
              </div>
            );
          })}
          </div>
        </>
      )}

      <AlertDialog open={pendingDelete !== null} onOpenChange={(open) => !open && setPendingDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Encounter?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently remove the encounter vs {pendingDelete?.opponentName ?? 'this team'} from history.
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
