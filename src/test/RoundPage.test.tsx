import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import RoundPage from '@/pages/RoundPage';
import { createEmptyRound, Encounter } from '@/types/encounter';

const encounter: Encounter = {
  id: 'encounter-1',
  date: '2026-09-05T10:00:00.000Z',
  opponentName: 'Opponent',
  mode: 'interclub',
  formatFamily: 'two_sets',
  formatType: 'FMT_201',
  rounds: [createEmptyRound(1), createEmptyRound(2)],
  status: 'in-progress'
};

vi.mock('@/hooks/useEncounterStore', () => ({
  useEncounterStore: () => ({
    getEncounter: () => encounter,
    updateEncounter: vi.fn()
  })
}));

vi.mock('@/hooks/useTeamStore', () => ({
  useTeamStore: () => ({ players: [] })
}));

describe('RoundPage', () => {
  it('redirects a removed round 3 route to the last available round', async () => {
    render(
      <MemoryRouter initialEntries={['/encounter/encounter-1/round/3']}>
        <Routes>
          <Route path="/encounter/:encounterId/round/:roundNumber" element={<RoundPage />} />
        </Routes>
      </MemoryRouter>
    );

    expect(await screen.findByRole('heading', { name: 'Round 2' })).toBeInTheDocument();
  });
});
