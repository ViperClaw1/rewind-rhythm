import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { GameProvider } from "@/hooks/useGameState";
import Index from "./pages/Index";
import AuthPage from "./pages/AuthPage";
import RulesScreen from "./pages/RulesScreen";
import SplashScreen from "./pages/SplashScreen";
import CategoriesScreen from "./pages/CategoriesScreen";
import GoodLuckScreen from "./pages/GoodLuckScreen";
import GameScreen from "./pages/GameScreen";
import GameOverScreen from "./pages/GameOverScreen";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <GameProvider>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/auth" element={<AuthPage />} />
              <Route path="/rules" element={<RulesScreen />} />
              <Route path="/splash" element={<SplashScreen />} />
              <Route path="/categories" element={<CategoriesScreen />} />
              <Route path="/good-luck" element={<GoodLuckScreen />} />
              <Route path="/game" element={<GameScreen />} />
              <Route path="/game-over" element={<GameOverScreen />} />
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </GameProvider>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
