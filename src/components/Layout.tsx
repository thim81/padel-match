import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { Home, Clock, Settings, PlusCircle } from 'lucide-react';

const tabs = [
  { path: '/', icon: Home, label: 'Home' },
  { path: '/encounter/new', icon: PlusCircle, label: 'New Match' },
  { path: '/history', icon: Clock, label: 'History' },
  { path: '/settings', icon: Settings, label: 'Settings' },
];

export default function Layout() {
  const location = useLocation();
  const navigate = useNavigate();
  const isEncounterRoute = location.pathname.startsWith('/encounter/');

  return (
    <div className="flex flex-col min-h-screen max-w-lg mx-auto bg-background">
      <main className="flex-1 overflow-y-auto">
        <Outlet />
      </main>

      <nav className="sticky bottom-0 bg-card/80 backdrop-blur-xl border-t border-border safe-bottom">
        <div className="flex justify-around items-center h-14">
          {tabs.map(tab => {
            const isActive = tab.path === '/encounter/new'
              ? isEncounterRoute
              : location.pathname === tab.path;
            return (
              <button
                key={tab.path}
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
