import { Match, MatchFormat, SetScore } from '@/types/encounter';
import { getMatchWinner, needsTiebreak, needsSuperTiebreak, getSetWinner, formatMatchScore } from '@/lib/scoring';
import { Minus, Plus } from 'lucide-react';
import { motion } from 'framer-motion';

interface MatchScoreCardProps {
  match: Match;
  matchIndex: number;
  format: MatchFormat;
  homePlayerNames: [string, string];
  onChange: (match: Match) => void;
}

function ScoreStepper({ value, onChange, min = 0, max = 13 }: {
  value: number; onChange: (v: number) => void; min?: number; max?: number;
}) {
  return (
    <div className="flex items-center gap-2.5">
      <button
        onClick={() => onChange(Math.max(min, value - 1))}
        className="w-9 h-9 rounded-full bg-secondary flex items-center justify-center active:scale-90 transition-transform disabled:opacity-30"
        disabled={value <= min}
      >
        <Minus className="w-4 h-4 text-foreground" />
      </button>
      <span className="w-7 text-center text-xl font-bold tabular-nums text-foreground">{value}</span>
      <button
        onClick={() => onChange(Math.min(max, value + 1))}
        className="w-9 h-9 rounded-full bg-secondary flex items-center justify-center active:scale-90 transition-transform disabled:opacity-30"
        disabled={value >= max}
      >
        <Plus className="w-4 h-4 text-foreground" />
      </button>
    </div>
  );
}

export default function MatchScoreCard({ match, matchIndex, format, homePlayerNames, onChange }: MatchScoreCardProps) {
  const winner = getMatchWinner(match, format);

  const safeMatch = match.sets.length === 0
    ? { ...match, sets: [{ home: 0, away: 0 } as SetScore] }
    : match;

  const updateSet = (setIndex: number, field: 'home' | 'away', value: number) => {
    const newSets = [...safeMatch.sets];
    if (!newSets[setIndex]) newSets[setIndex] = { home: 0, away: 0 };
    newSets[setIndex] = { ...newSets[setIndex], [field]: value };

    if (!needsTiebreak(newSets[setIndex].home, newSets[setIndex].away, format)) {
      delete newSets[setIndex].tiebreak;
    }

    if (format === '2sets' && setIndex < 2) {
      const setWinner = getSetWinner(newSets[setIndex], format, false);
      if (setWinner && !newSets[setIndex + 1] && setIndex === 0) {
        newSets.push({ home: 0, away: 0 });
      }
      if (setIndex === 1 && newSets.length === 2) {
        let hw = 0, aw = 0;
        for (let i = 0; i < 2; i++) {
          const w = getSetWinner(newSets[i], format, false);
          if (w === 'home') hw++;
          if (w === 'away') aw++;
        }
        if (hw === 1 && aw === 1 && !newSets[2]) {
          newSets.push({ home: 0, away: 0, tiebreak: { home: 0, away: 0 } });
        }
      }
    }

    const updatedMatch = { ...safeMatch, sets: newSets, winner: undefined };
    const newWinner = getMatchWinner(updatedMatch, format);
    if (newWinner) updatedMatch.winner = newWinner;
    onChange(updatedMatch);
  };

  const updateTiebreak = (setIndex: number, field: 'home' | 'away', value: number) => {
    const newSets = [...safeMatch.sets];
    const tb = newSets[setIndex].tiebreak || { home: 0, away: 0 };
    newSets[setIndex] = {
      ...newSets[setIndex],
      tiebreak: { ...tb, [field]: value },
    };

    const updatedMatch = { ...safeMatch, sets: newSets, winner: undefined };
    const newWinner = getMatchWinner(updatedMatch, format);
    if (newWinner) updatedMatch.winner = newWinner;
    onChange(updatedMatch);
  };

  return (
    <motion.div
      animate={winner ? { scale: [1, 1.01, 1] } : {}}
      transition={{ duration: 0.3 }}
      className={`ios-card p-4 ${winner ? 'ring-1 ring-success/30' : ''}`}
    >
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-semibold text-foreground">Match {matchIndex + 1}</h3>
        {winner && (
          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
            winner === 'home' ? 'bg-success/10 text-success' : 'bg-destructive/10 text-destructive'
          }`}>
            {winner === 'home' ? 'Win' : 'Loss'}
          </span>
        )}
      </div>

      <p className="text-xs text-muted-foreground mb-4">
        {homePlayerNames[0] || '?'} & {homePlayerNames[1] || '?'} vs Opponent
      </p>

      {winner && (
        <p className="text-sm font-mono text-muted-foreground mb-4">
          {formatMatchScore(safeMatch, format)}
        </p>
      )}

      {/* Set inputs */}
      <div className="flex flex-col gap-4">
        {safeMatch.sets.map((set, si) => {
          const isThirdSet = format === '2sets' && si === 2;
          const showTB = isThirdSet
            ? true
            : needsTiebreak(set.home, set.away, format);

          return (
            <div key={si} className="bg-secondary/30 rounded-xl p-4">
              <p className="text-[10px] uppercase font-semibold text-muted-foreground mb-3">
                {isThirdSet ? 'Super Tie-Break' : `Set ${si + 1}`}
              </p>

              {isThirdSet ? (
                <div className="flex items-center justify-between px-2">
                  <div className="text-center">
                    <p className="text-[11px] font-medium text-primary mb-1.5">Home</p>
                    <ScoreStepper
                      value={set.tiebreak?.home || 0}
                      onChange={v => updateTiebreak(si, 'home', v)}
                      max={30}
                    />
                  </div>
                  <span className="text-muted-foreground font-bold text-xl">–</span>
                  <div className="text-center">
                    <p className="text-[11px] font-medium text-destructive/70 mb-1.5">Away</p>
                    <ScoreStepper
                      value={set.tiebreak?.away || 0}
                      onChange={v => updateTiebreak(si, 'away', v)}
                      max={30}
                    />
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex items-center justify-between px-2">
                    <div className="text-center">
                      <p className="text-[11px] font-medium text-primary mb-1.5">Home</p>
                      <ScoreStepper
                        value={set.home}
                        onChange={v => updateSet(si, 'home', v)}
                        max={format === '2sets' ? 7 : 9}
                      />
                    </div>
                    <span className="text-muted-foreground font-bold text-xl">–</span>
                    <div className="text-center">
                      <p className="text-[11px] font-medium text-destructive/70 mb-1.5">Away</p>
                      <ScoreStepper
                        value={set.away}
                        onChange={v => updateSet(si, 'away', v)}
                        max={format === '2sets' ? 7 : 9}
                      />
                    </div>
                  </div>

                  {showTB && (
                    <div className="mt-4 pt-3 border-t border-border/50">
                      <p className="text-[10px] uppercase font-semibold text-muted-foreground mb-3">Tie-Break</p>
                      <div className="flex items-center justify-between px-2">
                        <div className="text-center">
                          <ScoreStepper
                            value={set.tiebreak?.home || 0}
                            onChange={v => updateTiebreak(si, 'home', v)}
                            max={30}
                          />
                        </div>
                        <span className="text-muted-foreground font-bold text-lg">–</span>
                        <div className="text-center">
                          <ScoreStepper
                            value={set.tiebreak?.away || 0}
                            onChange={v => updateTiebreak(si, 'away', v)}
                            max={30}
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          );
        })}
      </div>
    </motion.div>
  );
}
