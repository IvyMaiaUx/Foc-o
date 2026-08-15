import React, { Suspense, lazy, useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { AppLaunchSplash } from './components/branding/AppLaunchSplash';
import { MainLayout } from './components/layout/MainLayout';
import { LgpdBanner } from './components/LgpdBanner';
import { InstallPrompt } from './components/InstallPrompt';
import { Manutencao } from './pages/Manutencao';

// Cada página vira um chunk sob demanda: o navegador só baixa o código da tela que
// vai renderizar, em vez de um bundle único com as ~50 páginas. As páginas usam
// export nomeado, então adaptamos para o { default } que o React.lazy espera.
function lazyPage(factory: () => Promise<Record<string, any>>, name: string) {
  return lazy(() => factory().then((m) => ({ default: m[name] })));
}

// Auth
const Welcome = lazyPage(() => import('./pages/auth/Welcome'), 'Welcome');
const Register = lazyPage(() => import('./pages/auth/Register'), 'Register');
const Login = lazyPage(() => import('./pages/auth/Login'), 'Login');
const ForgotPassword = lazyPage(() => import('./pages/auth/ForgotPassword'), 'ForgotPassword');
const ResetPassword = lazyPage(() => import('./pages/auth/ResetPassword'), 'ResetPassword');
const EmailConfirmed = lazyPage(() => import('./pages/auth/EmailConfirmed'), 'EmailConfirmed');
const Ativar = lazyPage(() => import('./pages/auth/Ativar'), 'Ativar');
const EbookLanding = lazyPage(() => import('./pages/EbookLanding'), 'EbookLanding');
const FimDaCulpaLanding = lazyPage(() => import('./pages/FimDaCulpaLanding'), 'FimDaCulpaLanding');
const PresellFocao = lazyPage(() => import('./pages/PresellFocao'), 'PresellFocao');
const PoliticaPrivacidade = lazyPage(() => import('./pages/PoliticaPrivacidade'), 'PoliticaPrivacidade');
const BetaFocao = lazyPage(() => import('./pages/BetaFocao'), 'BetaFocao');

// Onboarding
const OnboardingIntro = lazyPage(() => import('./pages/onboarding/OnboardingIntro'), 'OnboardingIntro');
const DogData = lazyPage(() => import('./pages/onboarding/DogData'), 'DogData');
const Routine = lazyPage(() => import('./pages/onboarding/Routine'), 'Routine');
const HealthCare = lazyPage(() => import('./pages/onboarding/HealthCare'), 'HealthCare');
const Personality = lazyPage(() => import('./pages/onboarding/Personality'), 'Personality');
const Behavior = lazyPage(() => import('./pages/onboarding/Behavior'), 'Behavior');
const TrainingBase = lazyPage(() => import('./pages/onboarding/TrainingBase'), 'TrainingBase');
const Goals = lazyPage(() => import('./pages/onboarding/Goals'), 'Goals');
const Analyzing = lazyPage(() => import('./pages/onboarding/Analyzing'), 'Analyzing');

// Core app
const Home = lazyPage(() => import('./pages/Home'), 'Home');
const Treino = lazyPage(() => import('./pages/Treino'), 'Treino');
const EscolherTreino = lazyPage(() => import('./pages/EscolherTreino'), 'EscolherTreino');
const Plano = lazyPage(() => import('./pages/Plano'), 'Plano');
const Checkin = lazyPage(() => import('./pages/Checkin'), 'Checkin');
const Evolucao = lazyPage(() => import('./pages/Evolucao'), 'Evolucao');
const Perfil = lazyPage(() => import('./pages/Perfil'), 'Perfil');

// Secondary modules
const Nutricao = lazyPage(() => import('./pages/Nutricao'), 'Nutricao');
const Vacinas = lazyPage(() => import('./pages/Vacinas'), 'Vacinas');
const Assinatura = lazyPage(() => import('./pages/Assinatura'), 'Assinatura');
const Ajuda = lazyPage(() => import('./pages/Ajuda'), 'Ajuda');
const Agenda = lazyPage(() => import('./pages/Agenda'), 'Agenda');
const HistoricoTreinos = lazyPage(() => import('./pages/HistoricoTreinos'), 'HistoricoTreinos');
const RelatorioSemanal = lazyPage(() => import('./pages/RelatorioSemanal'), 'RelatorioSemanal');
const RelatorioImpressao = lazyPage(() => import('./pages/RelatorioImpressao'), 'RelatorioImpressao');
const EditarPerfil = lazyPage(() => import('./pages/EditarPerfil'), 'EditarPerfil');
const Notificacoes = lazyPage(() => import('./pages/Notificacoes'), 'Notificacoes');
const Suporte = lazyPage(() => import('./pages/Suporte'), 'Suporte');
const SosTreinos = lazyPage(() => import('./pages/SosTreinos'), 'SosTreinos');
const IndiqueGanhe = lazyPage(() => import('./pages/IndiqueGanhe'), 'IndiqueGanhe');

// Admin & dev (só montam em DEV)
const DevTools = lazyPage(() => import('./pages/DevTools'), 'DevTools');
const AdminNotificacoes = lazyPage(() => import('./pages/admin/AdminNotificacoes'), 'AdminNotificacoes');
const AdminCheckins = lazyPage(() => import('./pages/admin/AdminCheckins'), 'AdminCheckins');

function RouteFallback() {
  return (
    <div className="min-h-screen bg-[#F7F5EF] flex items-center justify-center">
      <div className="animate-pulse w-8 h-8 rounded-full bg-[#055A43]/20" />
    </div>
  );
}

function RequireAuth({ children }: { children: React.ReactNode }) {
  const { user, userProfile, isLoading } = useAuth();
  const location = useLocation();
  if (isLoading) return <div className="min-h-screen bg-[#F7F5EF] flex items-center justify-center"><div className="animate-pulse w-8 h-8 rounded-full bg-[#055A43]/20" /></div>;
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
  if (isLoading) return <div className="min-h-screen bg-[#F7F5EF] flex items-center justify-center"><div className="animate-pulse w-8 h-8 rounded-full bg-[#055A43]/20" /></div>;
  if (!user) return <Navigate to="/welcome" replace />;
  if (!user.email || !APP_ADMIN_EMAILS.has(user.email.toLowerCase())) return <Navigate to="/inicio" replace />;
  return <>{children}</>;
}

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
        <div className="font-sans min-h-screen bg-[#F7F5EF] text-[#6B7A6E] selection:bg-[#055A43]/20">
          <AppLaunchSplash visible={showLaunchSplash} />
          {isMaintenance ? (
            <Manutencao />
          ) : (
            <>
              <Suspense fallback={<RouteFallback />}>
                <Routes>
                  <Route path="/welcome" element={<Welcome />} />
                  <Route path="/ebook" element={<Navigate to="/ebook-comportamento-e-rotina" replace />} />
                  <Route path="/ebook-comportamento-e-rotina" element={<EbookLanding />} />
                  <Route path="/ebook-fim-da-culpa" element={<FimDaCulpaLanding />} />
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
                  <Route path="/escolher-treino" element={<RequireAuth><EscolherTreino /></RequireAuth>} />

                  {/* "/" é a landing pública estática (public/index.html), servida direto
                      pelo Firebase Hosting antes de chegar no React (o app React foi
                      renomeado pra app.html — ver vite.config.ts). Essa rota só existe
                      como rede de segurança (dev local, links antigos etc.). */}
                  <Route path="/" element={<Navigate to="/inicio" replace />} />

                  {/* Core App */}
                  <Route element={<RequireAuth><MainLayout /></RequireAuth>}>
                    <Route path="/inicio" element={<Home />} />
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

                  <Route path="*" element={<Navigate to="/inicio" replace />} />
                </Routes>
              </Suspense>
              <LgpdBanner />
              <InstallPrompt />
            </>
          )}
        </div>
      </Router>
    </AuthProvider>
  );
}
