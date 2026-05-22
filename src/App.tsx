import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { Welcome } from './pages/auth/Welcome';
import { Register } from './pages/auth/Register';
import { Login } from './pages/auth/Login';
import { ForgotPassword } from './pages/auth/ForgotPassword';

import { DogData } from './pages/onboarding/DogData';
import { Routine } from './pages/onboarding/Routine';
import { HealthCare } from './pages/onboarding/HealthCare';
import { Personality } from './pages/onboarding/Personality';
import { Behavior } from './pages/onboarding/Behavior';
import { TrainingBase } from './pages/onboarding/TrainingBase';
import { Goals } from './pages/onboarding/Goals';
import { Analyzing } from './pages/onboarding/Analyzing';

import { Home } from './pages/Home';
import { MainLayout } from './components/layout/MainLayout';
import { Treino } from './pages/Treino';

function RequireAuth({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();
  if (isLoading) return <div className="min-h-screen bg-[#FAFAFA] flex items-center justify-center"><div className="animate-pulse w-8 h-8 rounded-full bg-[#055A43]/20" /></div>;
  if (!user) return <Navigate to="/welcome" replace />;
  return <>{children}</>;
}

import { Plano } from './pages/Plano';
import { Checkin } from './pages/Checkin';
import { Evolucao } from './pages/Evolucao';
import { Perfil } from './pages/Perfil';

import { Nutricao } from './pages/Nutricao';
import { Vacinas } from './pages/Vacinas';
import { Assinatura } from './pages/Assinatura';
import { Ajuda } from './pages/Ajuda';
import { Agenda } from './pages/Agenda';
import { HistoricoTreinos } from './pages/HistoricoTreinos';
import { RelatorioSemanal } from './pages/RelatorioSemanal';
import { EditarPerfil } from './pages/EditarPerfil';
import { Notificacoes } from './pages/Notificacoes';
import { Suporte } from './pages/Suporte';
import { Manutencao } from './pages/Manutencao';
import { DevTools } from './pages/DevTools';

import { AdminNotificacoes } from './pages/admin/AdminNotificacoes';

export default function App() {
  const isMaintenance = import.meta.env.VITE_MAINTENANCE_MODE === 'true';

  return (
    <AuthProvider>
      <Router>
        <div className="font-sans min-h-screen bg-[#FAFAFA] text-[#5C615D] selection:bg-[#055A43]/20">
          {isMaintenance ? (
            <Manutencao />
          ) : (
            <Routes>
              <Route path="/welcome" element={<Welcome />} />
              <Route path="/register" element={<Register />} />
              <Route path="/login" element={<Login />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              
              {/* Onboarding */}
              <Route path="/onboarding/dog-data" element={<RequireAuth><DogData /></RequireAuth>} />
              <Route path="/onboarding/routine" element={<RequireAuth><Routine /></RequireAuth>} />
              <Route path="/onboarding/health-care" element={<RequireAuth><HealthCare /></RequireAuth>} />
              <Route path="/onboarding/personality" element={<RequireAuth><Personality /></RequireAuth>} />
              <Route path="/onboarding/behavior" element={<RequireAuth><Behavior /></RequireAuth>} />
              <Route path="/onboarding/training-base" element={<RequireAuth><TrainingBase /></RequireAuth>} />
              <Route path="/onboarding/goals" element={<RequireAuth><Goals /></RequireAuth>} />
              <Route path="/onboarding/analyzing" element={<RequireAuth><Analyzing /></RequireAuth>} />
              <Route path="/treino/:id?" element={<RequireAuth><Treino /></RequireAuth>} />

              {/* Core App */}
              <Route element={<RequireAuth><MainLayout /></RequireAuth>}>
                <Route path="/" element={<Home />} />
                <Route path="/plano" element={<Plano />} />
                <Route path="/checkin" element={<Checkin />} />
                <Route path="/evolucao" element={<Evolucao />} />
                <Route path="/perfil" element={<Perfil />} />
              </Route>

              {/* Secondary Modules */}
              <Route path="/nutricao" element={<RequireAuth><Nutricao /></RequireAuth>} />
              <Route path="/vacinas" element={<RequireAuth><Vacinas /></RequireAuth>} />
              <Route path="/agenda" element={<RequireAuth><Agenda /></RequireAuth>} />
              <Route path="/historico" element={<RequireAuth><HistoricoTreinos /></RequireAuth>} />
              <Route path="/relatorio" element={<RequireAuth><RelatorioSemanal /></RequireAuth>} />
              <Route path="/assinatura" element={<RequireAuth><Assinatura /></RequireAuth>} />
              <Route path="/notificacoes" element={<RequireAuth><Notificacoes /></RequireAuth>} />
              <Route path="/ajuda" element={<RequireAuth><Ajuda /></RequireAuth>} />
              <Route path="/suporte" element={<RequireAuth><Suporte /></RequireAuth>} />
              <Route path="/editar-perfil" element={<RequireAuth><EditarPerfil /></RequireAuth>} />
              <Route path="/manutencao" element={<Manutencao />} />
              <Route path="/dev-tools" element={<RequireAuth><DevTools /></RequireAuth>} />
              <Route path="/admin/notificacoes" element={<RequireAuth><AdminNotificacoes /></RequireAuth>} />

            </Routes>
          )}
        </div>
      </Router>
    </AuthProvider>
  );
}
