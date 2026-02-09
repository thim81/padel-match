import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, ChevronRight, Shield } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { EncounterMode, MatchFormat, Encounter, createEmptyRound, createEmptyMatch } from '@/types/encounter';
import { useEncounterStore } from '@/hooks/useEncounterStore';
import { useTeamStore } from '@/hooks/useTeamStore';
import { useSyncSettings } from '@/hooks/useSyncSettings';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export default function NewEncounter() {
  const navigate = useNavigate();
  const { addEncounter } = useEncounterStore();
  const { players } = useTeamStore();
  const { activeTeam } = useSyncSettings();
  const isPersonalTeam = Boolean(activeTeam?.isDefault);
  const [opponentName, setOpponentName] = useState('');
  const [mode, setMode] = useState<EncounterMode>(isPersonalTeam ? 'single' : 'interclub');
  const [format, setFormat] = useState<MatchFormat>('1set9');

  const primaryMode: EncounterMode = isPersonalTeam ? 'single' : 'interclub';
  const secondaryMode: EncounterMode = isPersonalTeam ? 'tournament' : 'single';
  const isPersonalSingle = isPersonalTeam && mode === 'single';

  useEffect(() => {
    if (isPersonalTeam && mode === 'interclub') {
      setMode('single');
    }
    if (!isPersonalTeam && mode === 'tournament') {
      setMode('interclub');
    }
  }, [isPersonalTeam, mode]);

  const minPlayers = mode === 'interclub' ? 4 : 2;
  const canStart = opponentName.trim() && players.length >= minPlayers;

  const handleStart = () => {
    if (!canStart) return;

    const encounter: Encounter = {
      id: crypto.randomUUID(),
      date: new Date().toISOString(),
      opponentName: opponentName.trim(),
      mode,
      tournamentId: mode === 'tournament' ? crypto.randomUUID() : undefined,
      tournamentRound: mode === 'tournament' ? 1 : undefined,
      format,
      rounds: mode === 'interclub' ? [createEmptyRound(1), createEmptyRound(2), createEmptyRound(3)] : [],
      singleMatch: mode !== 'interclub' ? createEmptyMatch('single-match') : undefined,
      status: 'in-progress',
    };

    addEncounter(encounter);
    navigate(mode !== 'interclub' ? `/encounter/${encounter.id}/single` : `/encounter/${encounter.id}/round/1`);
  };

  return (
    <div className="flex flex-col px-4 pt-14 pb-8 gap-6">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate('/')} className="text-primary">
          <ArrowLeft className="w-6 h-6" />
        </button>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">New Encounter</h1>
      </div>

      {players.length < minPlayers && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="bg-warning/10 border border-warning/20 rounded-xl p-4"
        >
          <p className="text-sm text-foreground">
            You need {minPlayers} players in your team before starting. Go to{' '}
            <button onClick={() => navigate('/settings')} className="text-primary font-medium">
              Settings
            </button>{' '}
            to add them.
          </p>
        </motion.div>
      )}

      <section>
        <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2 px-1">
          Type
        </h2>
        <div className="relative flex bg-muted rounded-[10px] p-[3px]">
          <motion.div
            layout
            transition={{ type: 'spring', stiffness: 500, damping: 35 }}
            className="absolute top-[3px] bottom-[3px] rounded-[8px] bg-card shadow-sm"
            style={{ width: 'calc(50% - 3px)', left: mode === primaryMode ? '3px' : 'calc(50%)' }}
          />
          <button
            onClick={() => setMode(primaryMode)}
            className="relative z-10 flex-1 py-2.5 text-center rounded-[8px] transition-colors"
          >
            <span className={`text-[13px] font-semibold ${mode === primaryMode ? 'text-foreground' : 'text-muted-foreground'}`}>
              {isPersonalTeam ? 'Single Game' : 'Interclub'}
            </span>
          </button>
          <button
            onClick={() => setMode(secondaryMode)}
            className="relative z-10 flex-1 py-2.5 text-center rounded-[8px] transition-colors"
          >
            <span className={`text-[13px] font-semibold ${mode === secondaryMode ? 'text-foreground' : 'text-muted-foreground'}`}>
              {isPersonalTeam ? 'Tornooi' : 'Single Game'}
            </span>
          </button>
        </div>
      </section>

      {/* Opponent name */}
      <section>
        <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2 px-1">
          {isPersonalSingle ? 'Opponent Player' : mode === 'tournament' ? 'Host Club' : 'Opponent Team'}
        </h2>
        <div className="ios-grouped">
          {isPersonalSingle ? (
            <div className="px-4 py-3">
              <Select value={opponentName || ''} onValueChange={setOpponentName}>
                <SelectTrigger className="h-10 bg-card border-border/60 text-sm">
                  <SelectValue placeholder="Select opponent player" />
                </SelectTrigger>
                <SelectContent className="bg-popover border-border z-50">
                  {players.map((player) => (
                    <SelectItem key={player.id} value={player.name}>
                      {player.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          ) : (
            <div className="flex items-center gap-3 px-4 py-3">
              <Shield className="w-5 h-5 text-muted-foreground/50 shrink-0" />
              <Input
                value={opponentName}
                onChange={e => setOpponentName(e.target.value)}
                placeholder={mode === 'tournament' ? 'Enter club name' : 'Enter team name'}
                className="flex-1 border-0 bg-transparent p-0 h-auto text-base rounded-none focus-visible:ring-0 focus-visible:ring-offset-0 shadow-none"
              />
            </div>
          )}
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
            style={{ width: 'calc(50% - 3px)', left: format === '1set9' ? '3px' : 'calc(50%)' }}
          />
          <button
            onClick={() => setFormat('1set9')}
            className="relative z-10 flex-1 py-2.5 text-center rounded-[8px] transition-colors"
          >
            <span className={`text-[13px] font-semibold ${format === '1set9' ? 'text-foreground' : 'text-muted-foreground'}`}>
              1 Set to 9
            </span>
          </button>
          <button
            onClick={() => setFormat('2sets')}
            className="relative z-10 flex-1 py-2.5 text-center rounded-[8px] transition-colors"
          >
            <span className={`text-[13px] font-semibold ${format === '2sets' ? 'text-foreground' : 'text-muted-foreground'}`}>
              2 Sets
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
