import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Plus, Clock, Trophy, ChevronRight, Play } from 'lucide-react';
import { useEncounterStore } from '@/hooks/useEncounterStore';

const Index = () => {
  const navigate = useNavigate();
  const { encounters } = useEncounterStore();

  const inProgress = encounters.filter(e => e.status === 'in-progress');
  const completed = encounters.filter(e => e.status === 'completed');
  const wins = completed.filter(e => e.result?.winner === 'home').length;

  return (
    <div className="flex flex-col px-4 pt-16 pb-8 gap-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center"
      >
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 mb-4">
          <Trophy className="w-8 h-8 text-primary" />
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          Padel Interclub
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Track your interclub encounters
        </p>
      </motion.div>

      {/* Quick stats */}
      {completed.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="flex gap-3"
        >
          <div className="flex-1 bg-card rounded-2xl p-3 text-center shadow-sm border border-border/50">
            <p className="text-2xl font-bold tabular-nums text-foreground">{completed.length}</p>
            <p className="text-[11px] text-muted-foreground font-medium">Played</p>
          </div>
          <div className="flex-1 bg-card rounded-2xl p-3 text-center shadow-sm border border-border/50">
            <p className="text-2xl font-bold tabular-nums text-success">{wins}</p>
            <p className="text-[11px] text-muted-foreground font-medium">Wins</p>
          </div>
          <div className="flex-1 bg-card rounded-2xl p-3 text-center shadow-sm border border-border/50">
            <p className="text-2xl font-bold tabular-nums text-destructive">{completed.length - wins}</p>
            <p className="text-[11px] text-muted-foreground font-medium">Losses</p>
          </div>
        </motion.div>
      )}

      {/* In progress encounters */}
      {inProgress.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="flex flex-col gap-2"
        >
          <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground px-1">
            In Progress
          </h2>
          {inProgress.map(enc => (
            <button
              key={enc.id}
              onClick={() => {
                const lastRound = enc.rounds.findIndex(r =>
                  r.matches.some(m => !m.winner)
                );
                const roundNum = lastRound >= 0 ? lastRound + 1 : 1;
                navigate(`/encounter/${enc.id}/round/${roundNum}`);
              }}
              className="ios-card p-4 flex items-center gap-3 active:scale-[0.98] transition-transform text-left shadow-sm"
            >
              <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-warning/10">
                <Play className="w-5 h-5 text-warning" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-foreground truncate">vs {enc.opponentName}</p>
                <p className="text-xs text-muted-foreground">
                  {enc.format === '2sets' ? '2 Sets' : '1 Set to 9'}
                </p>
              </div>
              <ChevronRight className="w-5 h-5 text-muted-foreground/50" />
            </button>
          ))}
        </motion.div>
      )}

      {/* Action cards */}
      <div className="flex flex-col gap-3">
        <motion.button
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          onClick={() => navigate('/encounter/new')}
          className="ios-card p-5 flex items-center gap-4 active:scale-[0.98] transition-transform text-left shadow-sm"
        >
          <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-primary text-primary-foreground">
            <Plus className="w-6 h-6" />
          </div>
          <div className="flex-1">
            <h2 className="text-base font-semibold text-foreground">New Encounter</h2>
            <p className="text-sm text-muted-foreground">Start a new interclub match</p>
          </div>
          <ChevronRight className="w-5 h-5 text-muted-foreground/40" />
        </motion.button>

        <motion.button
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          onClick={() => navigate('/history')}
          className="ios-card p-5 flex items-center gap-4 active:scale-[0.98] transition-transform text-left shadow-sm"
        >
          <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-secondary text-foreground">
            <Clock className="w-6 h-6" />
          </div>
          <div className="flex-1">
            <h2 className="text-base font-semibold text-foreground">Previous Encounters</h2>
            <p className="text-sm text-muted-foreground">View your match history</p>
          </div>
          <ChevronRight className="w-5 h-5 text-muted-foreground/40" />
        </motion.button>
      </div>
    </div>
  );
};

export default Index;
