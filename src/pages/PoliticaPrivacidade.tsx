import React from 'react';

export function PoliticaPrivacidade() {
  const updated = '02 de junho de 2025';

  return (
    <div style={{
      maxWidth: '680px',
      margin: '0 auto',
      padding: '48px 24px 80px',
      color: 'var(--color-text, #1a1a1a)',
      fontFamily: 'Manrope, sans-serif',
      lineHeight: '1.75',
    }}>
      {/* Cabeçalho */}
      <div style={{ marginBottom: '40px' }}>
        <p style={{ fontSize: '12px', color: '#888', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '.06em' }}>
          Focão App
        </p>
        <h1 style={{ fontSize: '28px', fontWeight: 700, margin: '0 0 8px', color: '#055A43' }}>
          Política de Privacidade
        </h1>
        <p style={{ fontSize: '13px', color: '#888', margin: 0 }}>
          Última atualização: {updated}
        </p>
      </div>

      <Section title="1. Quem somos">
        <p>
          O Focão é um aplicativo de treinos guiados e rotina inteligente para cães,
          desenvolvido e operado por <strong>Isabelle / Focão App</strong>
          {' '}(o "Controlador"), com sede no Brasil.
        </p>
        <p>
          Contato: <a href="mailto:privacidade@focao.app" style={{ color: '#055A43' }}>privacidade@focao.app</a>
        </p>
      </Section>

      <Section title="2. Dados que coletamos">
        <Table rows={[
          ['Dados de conta', 'Nome, endereço de e-mail, senha (hash)', 'Criar e autenticar sua conta'],
          ['Perfil do cão', 'Nome, raça, idade, comportamentos informados', 'Personalizar os treinos'],
          ['Logs de treino', 'Exercícios realizados, datas, progresso', 'Gerar evolução semanal e insights'],
          ['Dados de pagamento', 'Processados pelo Stripe (não armazenamos cartão)', 'Ativar assinatura premium'],
          ['Dados técnicos', 'IP, tipo de dispositivo, logs de erro', 'Segurança e melhoria do serviço'],
        ]} />
        <p style={{ marginTop: '12px', fontSize: '13px', color: '#666' }}>
          Não coletamos dados sensíveis (saúde, biometria, localização precisa).
        </p>
      </Section>

      <Section title="3. Como usamos seus dados">
        <ul style={{ paddingLeft: '20px', margin: 0 }}>
          <li>Fornecer, personalizar e melhorar o app</li>
          <li>Enviar notificações de lembrete de treino (com sua permissão)</li>
          <li>Processar pagamentos de assinatura</li>
          <li>Garantir a segurança da plataforma</li>
          <li>Cumprir obrigações legais</li>
        </ul>
        <p style={{ marginTop: '12px' }}>
          Não vendemos seus dados a terceiros para fins publicitários.
        </p>
      </Section>

      <Section title="4. Compartilhamento com terceiros">
        <Table rows={[
          ['Google Firebase', 'Autenticação, banco de dados, hospedagem', 'firestore.google.com'],
          ['Stripe', 'Processamento de pagamentos', 'stripe.com/privacy'],
          ['Google Analytics (opcional)', 'Métricas de uso do app', 'policies.google.com/privacy'],
        ]} headers={['Serviço', 'Finalidade', 'Política']} />
        <p style={{ marginTop: '12px', fontSize: '13px', color: '#666' }}>
          Todos os parceiros operam sob suas próprias políticas de privacidade e
          contratos de proteção de dados compatíveis com a LGPD/GDPR.
        </p>
      </Section>

      <Section title="5. Seus direitos (LGPD — Lei 13.709/2018)">
        <p>Você tem direito a:</p>
        <ul style={{ paddingLeft: '20px', margin: 0 }}>
          <li><strong>Acesso</strong> — solicitar uma cópia dos seus dados</li>
          <li><strong>Correção</strong> — atualizar dados incorretos ou incompletos</li>
          <li><strong>Exclusão</strong> — apagar sua conta e todos os dados associados</li>
          <li><strong>Portabilidade</strong> — receber seus dados em formato estruturado</li>
          <li><strong>Revogação de consentimento</strong> — a qualquer momento, sem prejuízo</li>
          <li><strong>Informação</strong> — saber com quem compartilhamos seus dados</li>
        </ul>
        <p style={{ marginTop: '12px' }}>
          Para exercer qualquer direito, acesse <strong>Configurações → Minha conta → Excluir conta</strong> no app,
          ou envie um e-mail para{' '}
          <a href="mailto:privacidade@focao.app" style={{ color: '#055A43' }}>privacidade@focao.app</a>.
          Respondemos em até 15 dias úteis.
        </p>
      </Section>

      <Section title="6. Retenção de dados">
        <p>
          Mantemos seus dados enquanto sua conta estiver activa. Ao excluir sua conta,
          os dados pessoais são removidos em até 30 dias, exceto quando há
          obrigação legal de retenção (ex: registros fiscais por 5 anos).
        </p>
      </Section>

      <Section title="7. Segurança">
        <p>
          Utilizamos criptografia em trânsito (HTTPS/TLS) e em repouso (Firebase),
          controles de acesso baseados em papéis e autenticação segura.
          Nenhum sistema é 100% seguro — em caso de incidente que afete seus dados,
          você será notificado conforme exige a LGPD.
        </p>
      </Section>

      <Section title="8. Cookies">
        <p>
          Usamos cookies estritamente necessários para manter sua sessão autenticada.
          Não utilizamos cookies de rastreamento publicitário de terceiros.
        </p>
      </Section>

      <Section title="9. Alterações nesta política">
        <p>
          Quando fizermos alterações relevantes, notificaremos você por e-mail ou
          notificação no app com pelo menos 7 dias de antecedência.
        </p>
      </Section>

      <Section title="10. Contato e DPO">
        <p>
          Encarregado de Proteção de Dados (DPO):{' '}
          <a href="mailto:privacidade@focao.app" style={{ color: '#055A43' }}>privacidade@focao.app</a>
        </p>
        <p>
          Também é possível registrar reclamações junto à Autoridade Nacional de
          Proteção de Dados (ANPD): <a href="https://www.gov.br/anpd" target="_blank" rel="noreferrer" style={{ color: '#055A43' }}>gov.br/anpd</a>
        </p>
      </Section>
    </div>
  );
}

// ─── Sub-componentes ──────────────────────────────────────────────────────────

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section style={{ marginBottom: '36px' }}>
      <h2 style={{
        fontSize: '16px',
        fontWeight: 600,
        color: '#055A43',
        marginBottom: '12px',
        paddingBottom: '8px',
        borderBottom: '1px solid rgba(5,90,67,0.12)',
      }}>
        {title}
      </h2>
      {children}
    </section>
  );
}

function Table({
  rows,
  headers = ['Dado', 'Descrição', 'Finalidade'],
}: {
  rows: string[][];
  headers?: string[];
}) {
  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={{
        width: '100%',
        borderCollapse: 'collapse',
        fontSize: '13px',
      }}>
        <thead>
          <tr>
            {headers.map(h => (
              <th key={h} style={{
                textAlign: 'left',
                padding: '8px 12px',
                background: 'rgba(5,90,67,0.06)',
                fontWeight: 600,
                color: '#055A43',
                borderBottom: '1px solid rgba(5,90,67,0.1)',
              }}>
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i} style={{ borderBottom: '1px solid rgba(0,0,0,0.05)' }}>
              {row.map((cell, j) => (
                <td key={j} style={{
                  padding: '8px 12px',
                  verticalAlign: 'top',
                  color: j === 0 ? '#333' : '#555',
                  fontWeight: j === 0 ? 500 : 400,
                }}>
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
