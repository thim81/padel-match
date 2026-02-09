import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, ChevronRight, Shield } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { MatchFormat, Encounter, createEmptyRound } from '@/types/encounter';
import { useEncounterStore } from '@/hooks/useEncounterStore';
import { useTeamStore } from '@/hooks/useTeamStore';

export default function NewEncounter() {
  const navigate = useNavigate();
  const { addEncounter } = useEncounterStore();
  const { players } = useTeamStore();
  const [opponentName, setOpponentName] = useState('');
  const [format, setFormat] = useState<MatchFormat>('2sets');

  const canStart = opponentName.trim() && players.length === 4;

  const handleStart = () => {
    if (!canStart) return;

    const encounter: Encounter = {
      id: crypto.randomUUID(),
      date: new Date().toISOString(),
      opponentName: opponentName.trim(),
      format,
      rounds: [createEmptyRound(1), createEmptyRound(2), createEmptyRound(3)],
      status: 'in-progress',
    };

    addEncounter(encounter);
    navigate(`/encounter/${encounter.id}/round/1`);
  };

  return (
    <div className="flex flex-col px-4 pt-14 pb-8 gap-6">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate('/')} className="text-primary">
          <ArrowLeft className="w-6 h-6" />
        </button>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">New Encounter</h1>
      </div>

      {players.length < 4 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="bg-warning/10 border border-warning/20 rounded-xl p-4"
        >
          <p className="text-sm text-foreground">
            You need 4 players in your team before starting. Go to{' '}
            <button onClick={() => navigate('/settings')} className="text-primary font-medium">
              Settings
            </button>{' '}
            to add them.
          </p>
        </motion.div>
      )}

      {/* Opponent name */}
      <section>
        <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2 px-1">
          Opponent Team
        </h2>
        <div className="ios-grouped">
          <div className="flex items-center gap-3 px-4 py-3">
            <Shield className="w-5 h-5 text-muted-foreground/50 shrink-0" />
            <Input
              value={opponentName}
              onChange={e => setOpponentName(e.target.value)}
              placeholder="Enter team name"
              className="flex-1 border-0 bg-transparent p-0 h-auto text-base rounded-none focus-visible:ring-0 focus-visible:ring-offset-0 shadow-none"
            />
          </div>
        </div>
      </section>

      {/* Match format — iOS segmented control */}
      <section>
        <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2 px-1">
          Match Format
        </h2>
        <div className="relative flex bg-muted rounded-[10px] p-[3px]">
          {/* Sliding pill */}
          <motion.div
            layout
            transition={{ type: 'spring', stiffness: 500, damping: 35 }}
            className="absolute top-[3px] bottom-[3px] rounded-[8px] bg-card shadow-sm"
            style={{ width: 'calc(50% - 3px)', left: format === '2sets' ? '3px' : 'calc(50%)' }}
          />
          <button
            onClick={() => setFormat('2sets')}
            className="relative z-10 flex-1 py-2.5 text-center rounded-[8px] transition-colors"
          >
            <span className={`text-[13px] font-semibold ${format === '2sets' ? 'text-foreground' : 'text-muted-foreground'}`}>
              2 Sets
            </span>
          </button>
          <button
            onClick={() => setFormat('1set9')}
            className="relative z-10 flex-1 py-2.5 text-center rounded-[8px] transition-colors"
          >
            <span className={`text-[13px] font-semibold ${format === '1set9' ? 'text-foreground' : 'text-muted-foreground'}`}>
              1 Set to 9
            </span>
          </button>
        </div>
        <p className="text-xs text-muted-foreground mt-2 px-1">
          {format === '2sets'
            ? 'Sets to 6 · TB at 6-6 (first to 7) · 3rd set super TB (first to 10)'
            : 'Single set to 9 · Tie-break at 8–8 (first to 10)'}
        </p>
      </section>

      {/* Start button */}
      <motion.button
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        onClick={handleStart}
        disabled={!canStart}
        className="flex items-center justify-center gap-2 w-full py-3.5 rounded-xl bg-primary text-primary-foreground font-semibold text-base disabled:opacity-40 active:scale-[0.98] transition-transform"
      >
        Start Encounter
        <ChevronRight className="w-5 h-5" />
      </motion.button>
    </div>
  );
}
