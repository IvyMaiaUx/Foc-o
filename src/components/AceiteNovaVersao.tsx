import { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { signOut } from 'firebase/auth';
import { auth } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';
import { LEGAL_URLS } from '../config/legal';
import {
  documentosDesatualizados,
  ehRotaLegal,
  precisaAceitarNovamente,
  registrarAceite,
  type AceiteAtual,
} from '../lib/aceiteLegal';

/**
 * Pede aceite quando os documentos mudam de versão.
 *
 * Sem isto, o aceite no cadastro cobriria só quem criar conta de agora em diante:
 * quem já tem conta nunca aceitou nada, e a afirmação dos Termos §2 continuaria
 * falsa para a base inteira. É bloqueante de propósito — se a pessoa puder
 * dispensar, o registro não vale como prova de nada.
 *
 * Bloqueante não é o mesmo que sem saída. O aceite depende de um endpoint, e este
 * modal é justamente o mecanismo que recupera quem ficou sem registro — se ele for
 * a única tela possível e o endpoint estiver fora, a dependência é circular e
 * ninguém entra nem sai. Por isso existe o "Sair da conta": não afrouxa o bloqueio
 * (sem aceitar continua sem usar o app), só impede que a pessoa fique presa dentro
 * dele. Hoje `aceiteAtual` não existe para ninguém, então o primeiro deploy joga
 * 100% da base aqui — o custo de errar isso é a base inteira, não uma fatia.
 */
export function AceiteNovaVersao() {
  const { user, userProfile, refreshProfile } = useAuth() as {
    user: unknown;
    userProfile: ({ aceiteAtual?: AceiteAtual } & Record<string, unknown>) | null;
    refreshProfile: () => Promise<void>;
  };

  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState('');
  const [aceito, setAceito] = useState(false);
  const [saindo, setSaindo] = useState(false);
  const navigate = useNavigate();
  const { pathname } = useLocation();

  const precisa =
    !!user &&
    !!userProfile &&
    !ehRotaLegal(pathname) &&
    precisaAceitarNovamente(userProfile.aceiteAtual);
  const mudaram = documentosDesatualizados(userProfile?.aceiteAtual);

  // Some assim que o perfil volta com o aceite novo, sem precisar recarregar.
  useEffect(() => {
    if (!precisa) {
      setAceito(false);
      setErro('');
    }
  }, [precisa]);

  // O perfil no contexto e buscado uma vez, nao e um listener. Logo apos o
  // cadastro ele ainda nao tem o aceite que acabou de ser gravado, e o modal
  // apareceria por engano. Revalida uma vez por usuario antes de exibir.
  const revalidou = useRef<string | null>(null);
  const uid = (userProfile as { uid?: string } | null)?.uid || null;

  useEffect(() => {
    if (!precisa || !uid || revalidou.current === uid) return;
    revalidou.current = uid;
    refreshProfile().catch(() => {});
  }, [precisa, uid, refreshProfile]);

  if (!precisa || revalidou.current !== uid) return null;

  const confirmar = async () => {
    setErro('');
    setEnviando(true);
    try {
      await registrarAceite('nova_versao');
      await refreshProfile();
    } catch {
      setErro('Não foi possível registrar agora. Tente novamente.');
    } finally {
      setEnviando(false);
    }
  };

  // Retry: depois do erro o botao volta a ficar clicavel (so `enviando` o trava),
  // entao tentar de novo e um clique. O rotulo muda para dizer isso.
  const sair = async () => {
    setSaindo(true);
    try {
      await signOut(auth);
      navigate('/welcome', { replace: true });
    } catch {
      setErro('Não foi possível sair agora. Tente novamente.');
      setSaindo(false);
    }
  };

  const primeiroAceite = !userProfile?.aceiteAtual?.aceito_em;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Atualização dos documentos"
      className="fixed inset-0 z-[200] flex items-end justify-center bg-black/45 p-4 backdrop-blur-sm sm:items-center"
    >
      <div className="w-full max-w-md rounded-2xl bg-[#FFFEFB] p-6 shadow-[0_20px_60px_rgba(0,0,0,0.25)]">
        <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#055A43]/70">
          {primeiroAceite ? 'Antes de continuar' : 'Atualizamos nossos documentos'}
        </p>
        <h2 className="mt-2 font-serif text-[22px] leading-tight text-[#055A43]">
          {primeiroAceite ? 'Precisamos do seu aceite' : 'O que mudou precisa do seu aceite'}
        </h2>

        <p className="mt-3 text-[13.5px] leading-relaxed text-[#506352]">
          {primeiroAceite
            ? 'Para continuar usando o Focão, confirme que leu e concorda com nossos documentos.'
            : `Atualizamos ${mudaram.length === 1 ? 'um documento' : 'nossos documentos'} e precisamos do seu aceite para continuar.`}
        </p>

        {!primeiroAceite && mudaram.length > 0 && (
          <ul className="mt-3 list-disc space-y-1 pl-5 text-[13px] text-[#506352]">
            {mudaram.map((doc) => (
              <li key={doc}>{doc}</li>
            ))}
          </ul>
        )}

        <label className="mt-5 flex cursor-pointer items-start gap-2.5">
          <input
            type="checkbox"
            checked={aceito}
            onChange={(e) => setAceito(e.target.checked)}
            className="mt-0.5 h-4 w-4 shrink-0 accent-[#055A43]"
          />
          <span className="text-[12.5px] leading-[1.5] text-[#6B7A6E]">
            Li e concordo com os{' '}
            <a href={LEGAL_URLS.termos} target="_blank" rel="noopener noreferrer" className="text-[#055A43] underline underline-offset-2">
              Termos de Uso
            </a>
            {' '}e estou ciente da{' '}
            <a href={LEGAL_URLS.privacidade} target="_blank" rel="noopener noreferrer" className="text-[#055A43] underline underline-offset-2">
              Política de Privacidade
            </a>{' '}
            e da{' '}
            <a href={LEGAL_URLS.cookies} target="_blank" rel="noopener noreferrer" className="text-[#055A43] underline underline-offset-2">
              Política de Cookies
            </a>
            .
          </span>
        </label>

        {erro && <p className="mt-3 text-[12.5px] font-medium text-red-600">{erro}</p>}

        <button
          type="button"
          onClick={confirmar}
          disabled={!aceito || enviando || saindo}
          className="mt-5 w-full rounded-xl bg-[#055A43] px-4 py-3 text-[14px] font-semibold text-white transition active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-40"
        >
          {enviando ? 'Registrando…' : erro ? 'Tentar de novo' : 'Aceitar e continuar'}
        </button>

        {/* A saída fica sempre visível, e não só depois de dar erro: quem não quer
            aceitar tem o mesmo direito de sair que quem tentou e não conseguiu. */}
        <button
          type="button"
          onClick={sair}
          disabled={enviando || saindo}
          className="mt-2 w-full rounded-xl px-4 py-3 text-[13px] font-medium text-[#6B7A6E] underline underline-offset-2 transition disabled:cursor-not-allowed disabled:opacity-40"
        >
          {saindo ? 'Saindo…' : 'Sair da conta'}
        </button>
      </div>
    </div>
  );
}
