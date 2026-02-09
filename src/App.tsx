import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Layout from "./components/Layout";
import Index from "./pages/Index";
import Settings from "./pages/Settings";
import History from "./pages/History";
import NewEncounter from "./pages/NewEncounter";
import RoundPage from "./pages/RoundPage";
import Results from "./pages/Results";
import NotFound from "./pages/NotFound";
import { useAppSync } from "./hooks/useAppSync";
import { useTeamStore } from "./hooks/useTeamStore";
import { useEncounterStore } from "./hooks/useEncounterStore";
import { useSyncSettings } from "./hooks/useSyncSettings";

const queryClient = new QueryClient();

const App = () => {
  const { players, setPlayersState } = useTeamStore();
  const { encounters, setEncountersState } = useEncounterStore();
  const { syncSettings, setSyncSettingsState } = useSyncSettings();

  useAppSync(syncSettings.syncToken, players, encounters, syncSettings, (state) => {
    setPlayersState(state.players);
    setEncountersState(state.encounters);
    setSyncSettingsState(state.settings);
  });

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route element={<Layout />}>
              <Route path="/" element={<Index />} />
              <Route path="/settings" element={<Settings />} />
              <Route path="/history" element={<History />} />
              <Route path="/encounter/new" element={<NewEncounter />} />
              <Route path="/encounter/:encounterId/round/:roundNumber" element={<RoundPage />} />
              <Route path="/encounter/:encounterId/results" element={<Results />} />
            </Route>
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
