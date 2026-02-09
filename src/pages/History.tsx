import { useEncounterStore } from '@/hooks/useEncounterStore';
import { useTeamStore } from '@/hooks/useTeamStore';
import { formatMatchScore } from '@/lib/scoring';
import { Encounter } from '@/types/encounter';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, Trophy, Plus } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

function EncounterDetail({ encounter, players }: { encounter: Encounter; players: { id: string; name: string }[] }) {
  const getPlayerName = (id: string) => players.find(p => p.id === id)?.name || 'Unknown';

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      exit={{ opacity: 0, height: 0 }}
      className="px-4 pb-4"
    >
      <div className="flex flex-col gap-3">
        {encounter.rounds.map(round => (
          <div key={round.number} className="bg-secondary/50 rounded-xl p-3">
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

export default function History() {
  const { encounters } = useEncounterStore();
  const { players } = useTeamStore();
  const navigate = useNavigate();
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const completed = encounters.filter(e => e.status === 'completed');

  return (
    <div className="flex flex-col px-4 pt-14 pb-8 gap-6">
      <h1 className="text-2xl font-bold tracking-tight text-foreground">History</h1>

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
        <div className="flex flex-col gap-2">
          {completed.map(encounter => {
            const isExpanded = expandedId === encounter.id;
            const isWin = encounter.result?.winner === 'home';
            const date = new Date(encounter.date).toLocaleDateString('en-GB', {
              day: 'numeric', month: 'short', year: 'numeric'
            });

            return (
              <div key={encounter.id} className="ios-card overflow-hidden">
                <button
                  onClick={() => setExpandedId(isExpanded ? null : encounter.id)}
                  className="w-full flex items-center gap-3 px-4 py-3.5 text-left"
                >
                  <span className={`text-xs font-bold px-2 py-0.5 rounded-md ${
                    isWin ? 'bg-success/10 text-success' : 'bg-destructive/10 text-destructive'
                  }`}>
                    {isWin ? 'W' : 'L'}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-base font-semibold text-foreground truncate">
                      vs {encounter.opponentName}
                    </p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <p className="text-xs text-muted-foreground">{date}</p>
                      <span className="text-[10px] text-muted-foreground/60">·</span>
                      <p className="text-xs text-muted-foreground/60">
                        {encounter.format === '2sets' ? '2 Sets' : '1 Set to 9'}
                      </p>
                    </div>
                  </div>
                  <span className="text-lg font-bold tabular-nums text-foreground">
                    {encounter.result?.homeMatchesWon}–{encounter.result?.awayMatchesWon}
                  </span>
                  <ChevronDown
                    className={`w-4 h-4 text-muted-foreground transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                  />
                </button>

                <AnimatePresence>
                  {isExpanded && <EncounterDetail encounter={encounter} players={players} />}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
