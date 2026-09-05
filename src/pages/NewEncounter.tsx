import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import { motion } from 'framer-motion';
import { ArrowLeft, ChevronRight, Shield } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { EncounterMode, FormatFamily, FormatType, Encounter, createEmptyMatch } from '@/types/encounter';
import { useEncounterStore } from '@/hooks/useEncounterStore';
import { useTeamStore } from '@/hooks/useTeamStore';
import { useSyncSettings } from '@/hooks/useSyncSettings';
import { DEFAULT_FORMAT_TYPE_BY_FAMILY, FORMAT_RULES, FORMAT_TYPES_BY_FAMILY } from '@/lib/formatRules';
import { createInterclubRounds } from '@/lib/encounterRounds';

export default function NewEncounter() {
  const navigate = useNavigate();
  const { addEncounter } = useEncounterStore();
  const { players } = useTeamStore();
  const { activeTeam } = useSyncSettings();
  const isPersonalTeam = Boolean(activeTeam?.isDefault);
  const [opponentName, setOpponentName] = useState('');
  const [mode, setMode] = useState<EncounterMode>(isPersonalTeam ? 'single' : 'interclub');
  const [formatFamily, setFormatFamily] = useState<FormatFamily>('single_set');
  const [formatType, setFormatType] = useState<FormatType>('FMT_101');

  const primaryMode: EncounterMode = isPersonalTeam ? 'single' : 'interclub';
  const secondaryMode: EncounterMode = isPersonalTeam ? 'tournament' : 'single';
  const isPersonalSingle = isPersonalTeam && mode === 'single';
  const requiresOpponentName = !(mode === 'single' && isPersonalTeam);

  useEffect(() => {
    if (isPersonalTeam && mode === 'interclub') {
      setMode('single');
    }
    if (!isPersonalTeam && mode === 'tournament') {
      setMode('interclub');
    }
  }, [isPersonalTeam, mode]);

  useEffect(() => {
    const validTypes = FORMAT_TYPES_BY_FAMILY[formatFamily];
    if (!validTypes.includes(formatType)) {
      setFormatType(DEFAULT_FORMAT_TYPE_BY_FAMILY[formatFamily]);
    }
  }, [formatFamily, formatType]);

  const minPlayers = mode === 'interclub' ? 4 : 2;
  const canStart = players.length >= minPlayers && (!requiresOpponentName || Boolean(opponentName.trim()));

  const handleStart = () => {
    if (!canStart) return;

    const encounter: Encounter = {
      id: crypto.randomUUID(),
      date: new Date().toISOString(),
      opponentName: requiresOpponentName ? opponentName.trim() : 'Internal Match',
      mode,
      tournamentId: mode === 'tournament' ? crypto.randomUUID() : undefined,
      tournamentRound: mode === 'tournament' ? 1 : undefined,
      formatFamily,
      formatType,
      rounds: mode === 'interclub' ? createInterclubRounds(formatType) : [],
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
            <div className="px-4 py-3 text-sm text-muted-foreground">
              Single game uses your pair. Opponent pair can be added later if known.
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
          <motion.div
            layout
            transition={{ type: 'spring', stiffness: 500, damping: 35 }}
            className="absolute top-[3px] bottom-[3px] rounded-[8px] bg-card shadow-sm"
            style={{ width: 'calc(50% - 3px)', left: formatFamily === 'single_set' ? '3px' : 'calc(50%)' }}
          />
          <button
            onClick={() => setFormatFamily('single_set')}
            className="relative z-10 flex-1 py-2.5 text-center rounded-[8px] transition-colors"
          >
            <span className={`text-[13px] font-semibold ${formatFamily === 'single_set' ? 'text-foreground' : 'text-muted-foreground'}`}>
              Single Set
            </span>
          </button>
          <button
            onClick={() => setFormatFamily('two_sets')}
            className="relative z-10 flex-1 py-2.5 text-center rounded-[8px] transition-colors"
          >
            <span className={`text-[13px] font-semibold ${formatFamily === 'two_sets' ? 'text-foreground' : 'text-muted-foreground'}`}>
              2 Sets
            </span>
          </button>
        </div>

        <div className="mt-2 flex flex-col gap-2">
          {FORMAT_TYPES_BY_FAMILY[formatFamily].map((typeId) => {
            const active = formatType === typeId;
            return (
              <button
                key={typeId}
                type="button"
                onClick={() => setFormatType(typeId)}
                className={`text-left rounded-xl border px-3 py-2 transition ${
                  active ? 'border-primary bg-primary/5' : 'border-border bg-card'
                }`}
              >
                <p className="text-sm text-foreground">{FORMAT_RULES[typeId].label}</p>
              </button>
            );
          })}
        </div>
        <p className="text-xs text-muted-foreground mt-2 px-1">
          {FORMAT_RULES[formatType].description}
        </p>
      </section>

      {/* Start button */}
      <button
        onClick={handleStart}
        disabled={!canStart}
        className="flex items-center justify-center gap-2 w-full py-3.5 rounded-xl bg-primary text-primary-foreground font-semibold text-base disabled:opacity-40 active:scale-[0.98] transition-transform"
      >
        Start Encounter
        <ChevronRight className="w-5 h-5" />
      </button>
    </div>
  );
}
