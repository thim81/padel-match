import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { Home, Clock, Settings, PlusCircle, Play } from 'lucide-react';
import { useEncounterStore } from '@/hooks/useEncounterStore';

const baseTabs = [
  { path: '/', icon: Home, label: 'Home' },
  { path: '/history', icon: Clock, label: 'History' },
  { path: '/settings', icon: Settings, label: 'Settings' },
];

export default function Layout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { encounters } = useEncounterStore();
  const isEncounterRoute = location.pathname.startsWith('/encounter/');
  const inProgressEncounters = encounters.filter((enc) => enc.status === 'in-progress');
  const hasActiveEncounter = inProgressEncounters.length > 0;
  const activeEncounter = inProgressEncounters[0];

  const resumePath = (() => {
    if (!activeEncounter) return '/encounter/new';
    if (activeEncounter.mode !== 'interclub') return `/encounter/${activeEncounter.id}/single`;
    const lastRound = activeEncounter.rounds.findIndex((r) => r.matches.some((m) => !m.winner));
    const roundNum = lastRound >= 0 ? lastRound + 1 : 1;
    return `/encounter/${activeEncounter.id}/round/${roundNum}`;
  })();

  const tabs = [
    baseTabs[0],
    {
      path: hasActiveEncounter ? resumePath : '/encounter/new',
      icon: hasActiveEncounter ? Play : PlusCircle,
      label: hasActiveEncounter ? 'Resume Match' : 'New Match',
      key: 'new-or-resume',
      isActive: hasActiveEncounter ? isEncounterRoute : location.pathname === '/encounter/new',
    },
    baseTabs[1],
    baseTabs[2],
  ];

  return (
    <div className="flex flex-col min-h-screen max-w-lg mx-auto bg-background">
      <main className="flex-1 overflow-y-auto">
        <Outlet />
      </main>

      <nav className="sticky bottom-0 bg-card/80 backdrop-blur-xl border-t border-border safe-bottom">
        <div className="flex justify-around items-center h-14">
          {tabs.map(tab => {
            const isActive = 'isActive' in tab
              ? tab.isActive
              : location.pathname === tab.path;
            return (
              <button
                key={'key' in tab ? tab.key : tab.path}
                onClick={() => navigate(tab.path)}
                className="flex flex-col items-center gap-0.5 pt-1.5 pb-1 px-4 relative"
              >
                <tab.icon
                  className={`w-6 h-6 transition-colors ${
                    isActive ? 'text-primary' : 'text-muted-foreground'
                  }`}
                  strokeWidth={isActive ? 2.2 : 1.5}
                />
                <span
                  className={`text-[10px] font-medium transition-colors ${
                    isActive ? 'text-primary' : 'text-muted-foreground'
                  }`}
                >
                  {tab.label}
                </span>
                {isActive && (
                  <div className="absolute -top-[1px] left-1/2 -translate-x-1/2 w-8 h-[2px] rounded-full bg-primary" />
                )}
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
