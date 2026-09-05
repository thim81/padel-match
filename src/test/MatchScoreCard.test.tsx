import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import MatchScoreCard from '@/components/MatchScoreCard';
import { formatMatchScore } from '@/lib/scoring';
import { Match } from '@/types/encounter';

function renderScoreCard(match: Match) {
  const onChange = vi.fn();
  render(
    <MatchScoreCard
      match={match}
      matchIndex={0}
      formatType="FMT_201"
      homePlayerNames={['Player 1', 'Player 2']}
      onChange={onChange}
    />
  );

  return onChange;
}

describe('MatchScoreCard super tie-break cleanup', () => {
  it('removes a stale super tie-break when the same team wins both sets', () => {
    const onChange = renderScoreCard({
      id: 'match-1',
      homePair: ['player-1', 'player-2'],
      sets: [
        { home: 2, away: 6 },
        { home: 4, away: 5 },
        { home: 0, away: 0, tiebreak: { home: 0, away: 0 } }
      ]
    });

    fireEvent.click(screen.getAllByRole('button')[7]);

    expect(onChange).toHaveBeenCalledOnce();
    expect(onChange.mock.calls[0][0].sets).toEqual([
      { home: 2, away: 6 },
      { home: 4, away: 6 }
    ]);
  });

  it('retains the super tie-break when the first two sets are split', () => {
    const onChange = renderScoreCard({
      id: 'match-1',
      homePair: ['player-1', 'player-2'],
      sets: [
        { home: 6, away: 2 },
        { home: 2, away: 5 },
        { home: 0, away: 0, tiebreak: { home: 0, away: 0 } }
      ]
    });

    fireEvent.click(screen.getAllByRole('button')[7]);

    expect(onChange).toHaveBeenCalledOnce();
    expect(onChange.mock.calls[0][0].sets).toHaveLength(3);
    expect(onChange.mock.calls[0][0].sets[2].tiebreak).toEqual({ home: 0, away: 0 });
  });

  it('retains a played super tie-break while a set score is temporarily incomplete', () => {
    const onChange = renderScoreCard({
      id: 'match-1',
      homePair: ['player-1', 'player-2'],
      sets: [
        { home: 6, away: 2 },
        { home: 2, away: 6 },
        { home: 0, away: 0, tiebreak: { home: 10, away: 8 } }
      ]
    });

    fireEvent.click(screen.getAllByRole('button')[0]);

    expect(onChange).toHaveBeenCalledOnce();
    expect(onChange.mock.calls[0][0].sets).toHaveLength(3);
    expect(onChange.mock.calls[0][0].sets[2].tiebreak).toEqual({ home: 10, away: 8 });
  });

  it('does not display a stale super tie-break on an existing straight-set result', () => {
    renderScoreCard({
      id: 'match-1',
      homePair: ['player-1', 'player-2'],
      sets: [
        { home: 2, away: 6 },
        { home: 4, away: 6 },
        { home: 0, away: 0, tiebreak: { home: 0, away: 0 } }
      ]
    });

    expect(screen.getByText('2-6 4-6')).toBeInTheDocument();
    expect(screen.queryByText(/\[0-0\]/)).not.toBeInTheDocument();
  });
});

describe('formatMatchScore super tie-break cleanup', () => {
  it('hides a stale super tie-break from persisted straight-set results', () => {
    const match: Match = {
      id: 'match-1',
      homePair: ['player-1', 'player-2'],
      sets: [
        { home: 2, away: 6 },
        { home: 4, away: 6 },
        { home: 0, away: 0, tiebreak: { home: 0, away: 0 } }
      ]
    };

    expect(formatMatchScore(match, 'FMT_201')).toBe('2-6 4-6');
    expect(match.sets).toHaveLength(3);
  });
});
