import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { AppLaunchSplash } from './components/branding/AppLaunchSplash';
import { Welcome } from './pages/auth/Welcome';
import { Register } from './pages/auth/Register';
import { Login } from './pages/auth/Login';
import { ForgotPassword } from './pages/auth/ForgotPassword';
import { ResetPassword } from './pages/auth/ResetPassword';
import { EmailConfirmed } from './pages/auth/EmailConfirmed';
import { Ativar } from './pages/auth/Ativar';
import { EbookLanding } from './pages/EbookLanding';
import { PresellFocao } from './pages/PresellFocao';

import { DogData } from './pages/onboarding/DogData';
import { OnboardingIntro } from './pages/onboarding/OnboardingIntro';
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
  const { user, userProfile, isLoading } = useAuth();
  const location = useLocation();
  if (isLoading) return <div className="min-h-screen bg-[#FAFAFA] flex items-center justify-center"><div className="animate-pulse w-8 h-8 rounded-full bg-[#055A43]/20" /></div>;
  if (!user) return <Navigate to="/welcome" replace />;
  // Onboarding incompleto: força o fluxo antes de liberar o resto do app (exceto as
  // próprias rotas de /onboarding, senão vira loop). Só redireciona quando o perfil já
  // carregou e marca explicitamente onboardingComplete === false.
  if (userProfile?.onboardingComplete === false && !location.pathname.startsWith('/onboarding')) {
    return <Navigate to="/onboarding/intro" replace />;
  }
  return <>{children}</>;
}

const APP_ADMIN_EMAILS = new Set(['focaosupport@gmail.com']);

function RequireAppAdmin({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();
  if (isLoading) return <div className="min-h-screen bg-[#FAFAFA] flex items-center justify-center"><div className="animate-pulse w-8 h-8 rounded-full bg-[#055A43]/20" /></div>;
  if (!user) return <Navigate to="/welcome" replace />;
  if (!user.email || !APP_ADMIN_EMAILS.has(user.email.toLowerCase())) return <Navigate to="/" replace />;
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
import { RelatorioImpressao } from './pages/RelatorioImpressao';
import { EditarPerfil } from './pages/EditarPerfil';
import { Notificacoes } from './pages/Notificacoes';
import { Suporte } from './pages/Suporte';
import { Manutencao } from './pages/Manutencao';
import { SosTreinos } from './pages/SosTreinos';
import { DevTools } from './pages/DevTools';
import { AdminNotificacoes } from './pages/admin/AdminNotificacoes';
import { AdminCheckins } from './pages/admin/AdminCheckins';
import { IndiqueGanhe } from './pages/IndiqueGanhe';
import { PoliticaPrivacidade } from './pages/PoliticaPrivacidade';
import { BetaFocao } from './pages/BetaFocao';


import { LgpdBanner } from './components/LgpdBanner';
import { InstallPrompt } from './components/InstallPrompt';


export default function App() {
  const isMaintenance = import.meta.env.VITE_MAINTENANCE_MODE === 'true';
  const [showLaunchSplash, setShowLaunchSplash] = useState(true);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const ref = params.get('ref');
    if (ref) {
      localStorage.setItem('focao_referred_by', ref);
    }
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setShowLaunchSplash(false);
    }, 1650);

    return () => window.clearTimeout(timer);
  }, []);

  return (
    <AuthProvider>
      <Router>
        <div className="font-sans min-h-screen bg-[#FAFAFA] text-[#5C615D] selection:bg-[#055A43]/20">
          <AppLaunchSplash visible={showLaunchSplash} />
          {isMaintenance ? (
            <Manutencao />
          ) : (
            <>
              <Routes>
                <Route path="/welcome" element={<Welcome />} />
                <Route path="/ebook" element={<Navigate to="/ebook-comportamento-e-rotina" replace />} />
                <Route path="/ebook-comportamento-e-rotina" element={<EbookLanding />} />
                <Route path="/presell" element={<PresellFocao />} />
                <Route path="/rotina-cachorro" element={<PresellFocao />} />
                <Route path="/register" element={<Register />} />
                <Route path="/login" element={<Login />} />
                <Route path="/forgot-password" element={<ForgotPassword />} />
                <Route path="/redefinir-senha" element={<ResetPassword />} />
                <Route path="/email-confirmado" element={<EmailConfirmed />} />
                <Route path="/ativar" element={<Ativar />} />
                <Route path="/privacidade" element={<PoliticaPrivacidade />} />
                <Route path="/beta" element={<BetaFocao />} />

                
                {/* Onboarding */}
                <Route path="/onboarding/intro" element={<RequireAuth><OnboardingIntro /></RequireAuth>} />
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
                <Route path="/sos" element={<RequireAuth><SosTreinos /></RequireAuth>} />
                <Route path="/historico" element={<RequireAuth><HistoricoTreinos /></RequireAuth>} />
                <Route path="/relatorio" element={<RequireAuth><RelatorioSemanal /></RequireAuth>} />
                <Route path="/relatorio-impressao" element={<RequireAuth><RelatorioImpressao /></RequireAuth>} />
                <Route path="/assinatura" element={<RequireAuth><Assinatura /></RequireAuth>} />
                <Route path="/notificacoes" element={<RequireAuth><Notificacoes /></RequireAuth>} />
                <Route path="/ajuda" element={<RequireAuth><Ajuda /></RequireAuth>} />
                <Route path="/suporte" element={<RequireAuth><Suporte /></RequireAuth>} />
                <Route path="/editar-perfil" element={<RequireAuth><EditarPerfil /></RequireAuth>} />
                <Route path="/indique" element={<RequireAuth><IndiqueGanhe /></RequireAuth>} />
                <Route path="/manutencao" element={<Manutencao />} />
                
                {/* Admin & Dev Tools */}
                {import.meta.env.DEV && (
                  <>
                    <Route path="/dev-tools" element={<RequireAppAdmin><DevTools /></RequireAppAdmin>} />
                    <Route path="/admin/notificacoes" element={<RequireAppAdmin><AdminNotificacoes /></RequireAppAdmin>} />
                    <Route path="/admin/checkins" element={<RequireAppAdmin><AdminCheckins /></RequireAppAdmin>} />
                  </>
                )}
                
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
              <LgpdBanner />
              <InstallPrompt />
            </>
          )}
        </div>
      </Router>
    </AuthProvider>
  );
}
