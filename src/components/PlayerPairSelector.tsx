import { Player } from '@/types/encounter';
import PlayerAvatar from '@/components/PlayerAvatar';
import { X } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface PlayerPairSelectorProps {
  players: Player[];
  match1Pair: [string, string];
  match2Pair: [string, string];
  onMatch1Change: (pair: [string, string]) => void;
  onMatch2Change: (pair: [string, string]) => void;
}

export default function PlayerPairSelector({
  players,
  match1Pair,
  match2Pair,
  onMatch1Change,
  onMatch2Change,
}: PlayerPairSelectorProps) {
  const allSelected = [...match1Pair, ...match2Pair].filter(Boolean);

  const getAvailable = (currentPair: [string, string], position: 0 | 1) => {
    const otherInPair = currentPair[position === 0 ? 1 : 0];
    return players.filter(p => {
      if (p.id === currentPair[position]) return true;
      if (p.id === otherInPair) return false;
      return !allSelected.includes(p.id) || p.id === currentPair[position];
    });
  };

  const allPairsAssigned = match1Pair.every(Boolean) && match2Pair.every(Boolean);

  const renderSelect = (
    pair: [string, string],
    onChange: (pair: [string, string]) => void,
    position: 0 | 1,
    label: string
  ) => {
    const available = getAvailable(pair, position);
    const selectedPlayer = players.find((player) => player.id === pair[position]);

    return (
      <div className="flex-1">
        <label className="text-[10px] uppercase text-muted-foreground font-medium tracking-wide">{label}</label>
        <div className="mt-1 flex items-center gap-1.5">
          <Select
            value={pair[position] ?? ''}
            onValueChange={(value) => {
              const newPair: [string, string] = [...pair] as [string, string];
              newPair[position] = value;
              onChange(newPair);
            }}
          >
            <SelectTrigger className="bg-card border-border/50 h-10 rounded-lg text-sm flex-1">
              {selectedPlayer ? (
                <div className="flex min-w-0 items-center gap-2">
                  <PlayerAvatar name={selectedPlayer.name} size="sm" />
                  <span className="truncate">{selectedPlayer.name}</span>
                </div>
              ) : (
                <SelectValue placeholder="Select..." />
              )}
            </SelectTrigger>
            <SelectContent className="bg-popover border-border z-50">
              {available.map(p => (
                <SelectItem key={p.id} value={p.id}>
                  <div className="flex items-center gap-2">
                    <PlayerAvatar name={p.name} size="sm" />
                    <span>{p.name}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {pair[position] && (
            <button
              type="button"
              onClick={() => {
                const newPair: [string, string] = [...pair] as [string, string];
                newPair[position] = '';
                onChange(newPair);
              }}
              className="h-8 w-8 shrink-0 rounded-md border border-border/60 bg-background text-muted-foreground hover:text-foreground"
              aria-label={`Reset ${label.toLowerCase()}`}
              title="Reset player"
            >
              <X className="mx-auto h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col gap-3">
      <div className="ios-card p-4">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-5 h-5 rounded-md bg-primary/10 flex items-center justify-center">
            <span className="text-[10px] font-bold text-primary">1</span>
          </div>
          <p className="text-xs font-semibold uppercase text-muted-foreground">Match 1 — Home Pair</p>
        </div>
        <div className="flex gap-3">
          {renderSelect(match1Pair, onMatch1Change, 0, 'Player A')}
          {renderSelect(match1Pair, onMatch1Change, 1, 'Player B')}
        </div>
      </div>

      <div className="ios-card p-4">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-5 h-5 rounded-md bg-accent-foreground/10 flex items-center justify-center">
            <span className="text-[10px] font-bold text-accent-foreground/60">2</span>
          </div>
          <p className="text-xs font-semibold uppercase text-muted-foreground">Match 2 — Home Pair</p>
        </div>
        <div className="flex gap-3">
          {renderSelect(match2Pair, onMatch2Change, 0, 'Player A')}
          {renderSelect(match2Pair, onMatch2Change, 1, 'Player B')}
        </div>
      </div>

      {allPairsAssigned && (
        <div className="flex items-center justify-center gap-1.5 py-1">
          <div className="w-1.5 h-1.5 rounded-full bg-success" />
          <span className="text-[11px] font-medium text-success">All players assigned</span>
        </div>
      )}
    </div>
  );
}
