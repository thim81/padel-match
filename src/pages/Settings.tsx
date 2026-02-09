import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Minus, CheckCircle2, RefreshCw } from 'lucide-react';
import { useTeamStore } from '@/hooks/useTeamStore';
import { Input } from '@/components/ui/input';
import PlayerAvatar from '@/components/PlayerAvatar';
import { useSyncSettings } from '@/hooks/useSyncSettings';

export default function Settings() {
  const { players, addPlayer, updatePlayer, removePlayer } = useTeamStore();
  const { syncSettings, updateSyncToken } = useSyncSettings();
  const [newName, setNewName] = useState('');
  const [syncTokenValue, setSyncTokenValue] = useState(syncSettings.syncToken);

  const handleAdd = () => {
    const trimmed = newName.trim();
    if (trimmed && players.length < 4) {
      addPlayer(trimmed);
      setNewName('');
    }
  };

  const teamComplete = players.length === 4;

  useEffect(() => {
    setSyncTokenValue(syncSettings.syncToken);
  }, [syncSettings.syncToken]);

  const handleSyncTokenBlur = () => {
    const normalized = syncTokenValue.trim();
    if (normalized !== syncSettings.syncToken) {
      updateSyncToken(normalized);
    }
  };

  return (
    <div className="flex flex-col px-4 pt-14 pb-8 gap-6">
      <h1 className="text-2xl font-bold tracking-tight text-foreground">Settings</h1>

      {/* Team section */}
      <section>
        <div className="flex items-center justify-between mb-2 px-1">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Your Team ({players.length}/4)
          </h2>
          {teamComplete && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex items-center gap-1"
            >
              <CheckCircle2 className="w-3.5 h-3.5 text-success" />
              <span className="text-[11px] font-medium text-success">Ready</span>
            </motion.div>
          )}
        </div>

        <div className="ios-grouped">
          <AnimatePresence initial={false}>
            {players.map((player, i) => (
              <motion.div
                key={player.id}
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
              >
                <div className="flex items-center gap-3 px-4 py-3">
                  <PlayerAvatar name={player.name || 'P'} />
                  <Input
                    value={player.name}
                    onChange={e => updatePlayer(player.id, e.target.value)}
                    className="flex-1 border-0 bg-transparent p-0 h-auto text-base rounded-none focus-visible:ring-0 focus-visible:ring-offset-0 shadow-none"
                    placeholder="Player name"
                  />
                  <button
                    onClick={() => removePlayer(player.id)}
                    className="w-6 h-6 rounded-full bg-destructive/10 flex items-center justify-center active:scale-95 transition-transform"
                  >
                    <Minus className="w-3.5 h-3.5 text-destructive" />
                  </button>
                </div>
                {i < players.length - 1 && <div className="ios-separator" />}
              </motion.div>
            ))}
          </AnimatePresence>

          {players.length === 0 && (
            <div className="px-4 py-6 text-center text-muted-foreground text-sm">
              No players added yet
            </div>
          )}
        </div>

        {!teamComplete && (
          <div className="ios-grouped mt-4">
            <div className="flex items-center gap-3 px-4 py-3">
              <div className="flex items-center justify-center w-8 h-8 rounded-full bg-success/10">
                <Plus className="w-4 h-4 text-success" />
              </div>
              <Input
                value={newName}
                onChange={e => setNewName(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleAdd()}
                placeholder="Add player name"
                className="flex-1 border-0 bg-transparent p-0 h-auto text-base rounded-none focus-visible:ring-0 focus-visible:ring-offset-0 shadow-none"
              />
              <button
                onClick={handleAdd}
                disabled={!newName.trim()}
                className="text-primary font-medium text-sm disabled:opacity-40"
              >
                Add
              </button>
            </div>
          </div>
        )}
      </section>

      <section>
        <div className="flex items-center gap-2 mb-2 px-1">
          <RefreshCw className="w-3.5 h-3.5 text-muted-foreground" />
          <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Cloud Sync
          </h2>
        </div>
        <div className="ios-grouped">
          <div className="px-4 py-3">
            <Input
              type="password"
              value={syncTokenValue}
              onChange={(e) => setSyncTokenValue(e.target.value)}
              onBlur={handleSyncTokenBlur}
              placeholder="Enter sync key"
              className="border-border/60 h-10 text-sm rounded-lg"
            />
            <p className="mt-2 text-[11px] leading-tight text-muted-foreground">
              Use the same key on multiple devices to keep players and encounters in sync.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
