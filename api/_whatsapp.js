import { getDb } from './_firebase.js';

const DEFAULT_API_VERSION = 'v20.0';
const DEFAULT_LANGUAGE = 'pt_BR';
const ZAPRESPONDER_API_URL = 'https://api.zapresponder.com.br/api';

function normalizePhone(phone) {
  const digits = String(phone || '').replace(/\D/g, '');
  if (!digits) return '';
  if (digits.startsWith('55')) return digits;
  if (digits.length === 10 || digits.length === 11) return `55${digits}`;
  return digits;
}

function normalizeVariables(variables) {
  if (Array.isArray(variables)) return variables.map((value) => String(value ?? ''));
  if (!variables || typeof variables !== 'object') return [];
  return Object.values(variables).map((value) => String(value ?? ''));
}

function whatsappProvider() {
  if (process.env.ZAPRESPONDER_DEPARTMENT_ID) return 'zapresponder';
  return 'whatsapp_cloud_api';
}

function zapResponderToken() {
  // NÃO cair para WHATSAPP_ACCESS_TOKEN: esse é o token da Meta Cloud API e
  // enviá-lo ao ZapResponder só gera "Please authenticate.".
  return process.env.ZAPRESPONDER_API_KEY || process.env.ZAPRESPONDER_API_TOKEN || process.env.ZAPRESPONDER_TOKEN || '';
}

function jwtPayload(token) {
  try {
    const part = String(token).split('.')[1];
    if (!part) return null;
    const padded = part.replace(/-/g, '+').replace(/_/g, '/');
    return JSON.parse(Buffer.from(padded + '='.repeat((4 - (padded.length % 4)) % 4), 'base64').toString('utf8'));
  } catch {
    return null;
  }
}

function isJwtExpired(token) {
  const payload = jwtPayload(token);
  return !!(payload && typeof payload.exp === 'number' && payload.exp * 1000 <= Date.now());
}

function cleanAuthToken(token) {
  const cleaned = String(token || '').trim().replace(/^Bearer\s+/i, '').trim();
  if (
    (cleaned.startsWith('"') && cleaned.endsWith('"')) ||
    (cleaned.startsWith("'") && cleaned.endsWith("'"))
  ) {
    return cleaned.slice(1, -1).trim();
  }
  return cleaned;
}

function tokenDiagnostics(token) {
  const value = String(token || '');
  return {
    configured: value.length > 0,
    length: value.length,
    prefix: value ? value.slice(0, 4) : '',
    suffix: value ? value.slice(-4) : '',
    looksPlaceholder: /^PREENCHER_|SUA_|SEU_|YOUR_/i.test(value),
  };
}

function messageFromNotification({ type, dogName, payload, variables, user }) {
  const params = normalizeVariables(variables);
  const tutorName = payload?.nome_tutor || payload?.tutorName || user?.name || user?.displayName || user?.fullName || user?.email?.split('@')?.[0] || 'tutor';
  const name = payload?.nome_cao || dogName || payload?.dogName || params[0] || 'seu cão';
  const appUrl = process.env.APP_PUBLIC_URL || 'https://focao.web.app';
  const trainingTitle = payload?.titulo_treino || payload?.trainingTitle || params[1] || 'Treino do dia';
  const vaccineName = payload?.nome_vacina || payload?.vaccineName || params[1] || payload?.vaccineNames || 'vacina';
  const vaccineDate = payload?.data_vacina || payload?.dueDate || params[2] || 'data indicada';
  const daysUntil = payload?.dias_restantes ?? payload?.daysUntil ?? params[3] ?? 'poucos';
  const weeklyTrainings = payload?.numero_treinos ?? payload?.trainings ?? params[1] ?? 'alguns';
  const totalTrainings = payload?.total_treinos ?? payload?.totalTrainings ?? params[2] ?? weeklyTrainings;
  const evolutionScore = payload?.pontuacao_evolucao ?? payload?.evolutionScore ?? params[3] ?? '';
  const trainLink = payload?.link_treino_especifico || payload?.trainingUrl || `${appUrl}/plano`;
  const vaccineLink = payload?.link_vacinas_app || payload?.vaccinesUrl || `${appUrl}/vacinas`;
  const weeklyReportLink = payload?.link_relatorio_semanal || payload?.weeklyReportUrl || `${appUrl}/relatorio`;
  const monthlyReportLink = payload?.link_relatorio_mensal || payload?.monthlyReportUrl || `${appUrl}/relatorio`;

  if (payload?.message) return String(payload.message);

  const messages = {
    agenda_day: `Agenda de hoje do ${name}: ${payload?.agendaSummary || 'treino, check-in e rotina em dia'}. Veja os detalhes no Focão: ${appUrl}/agenda`,
    training_reminder: `Bom dia, ${tutorName}! 🐾 O ${name} está pronto para o treino de hoje?\n\nSeu treino "${trainingTitle}" está esperando por vocês no Focão. Vamos manter a consistência e ver a evolução!\n\nClique aqui para iniciar: ${trainLink}`,
    checkin_reminder: `Como foi o dia do ${name}? Faça um check-in rápido para manter as recomendações do Focão mais precisas: ${appUrl}/checkin`,
    vaccine_reminder: `Alerta de Saúde para o ${name}! 💉\n\nLembrete: A vacina "${vaccineName}" do ${name} está agendada para ${vaccineDate} (em ${daysUntil} dias).\n\nNão se esqueça de verificar os detalhes no seu app Focão para garantir que ele esteja sempre protegido!\n👉 ${vaccineLink}`,
    weekly_report: `Boas notícias, ${tutorName}! 📊 O relatório semanal de evolução do ${name} está pronto!\n\nEsta semana, vocês completaram ${weeklyTrainings} treinos e o ${name} teve um ótimo desempenho. Continue assim!\n\nVeja todos os detalhes e os próximos passos no seu app Focão:\n👉 ${weeklyReportLink}`,
    inactivity_3d: `Oi, ${tutorName}! 💛\nO ${name} precisa da sua constância para evoluir.\n\nPercebemos que faz alguns dias desde o último acesso no Focão. Retomar agora pode fazer toda a diferença no comportamento e na rotina de vocês.\n\nSeu próximo passo já está te esperando no app:\n👉 ${appUrl}`,
    trial_ending: `Seu teste do Focão está chegando ao fim. Confira sua assinatura: ${appUrl}/assinatura`,
    payment_failed: `Não conseguimos confirmar o pagamento do Focão. Atualize a assinatura para manter o acesso: ${appUrl}/assinatura`,
    renewal_success: `Assinatura do Focão renovada com sucesso. O acesso premium continua ativo.`,
    premium_activated: `Olá ${tutorName}! 🎉 Sua assinatura Premium do Focão foi ativada com sucesso! Prepare-se para uma jornada incrível com o ${name}.\n\nAgora você tem acesso total a:\n✅ Treinos guiados e personalizados\n✅ Relatórios de evolução detalhados\n✅ Lembretes proativos de treino e vacina\n\nSeu plano inicial já está te esperando no app. Vamos começar a transformar a rotina do ${name}?\n👉 ${appUrl}`,
    referral_reward: `Sua recompensa de indicação no Focão foi liberada.`,
    monthly_report: `Parabéns pela dedicação, ${tutorName}! 🏆 Seu relatório mensal de evolução do ${name} chegou!\n\nNo último mês, vocês alcançaram marcos incríveis, com ${totalTrainings} treinos${evolutionScore ? ` e um aumento de ${evolutionScore}% no score de evolução` : ''}. É a harmonia que você sempre quis!\n\nConfira a análise completa e planeje o próximo mês no app Focão:\n👉 ${monthlyReportLink}`,
    welcome: `Bem-vinda ao Focão. O plano do ${name} já pode ser acompanhado pelo app: ${appUrl}`,
    test: `Mensagem de teste do Focão para ${name}.`,
  };

  return messages[type] || `Você tem uma nova atualização do Focão sobre ${name}: ${appUrl}`;
}

function saoPauloDateKey(value = Date.now()) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Sao_Paulo',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(new Date(value));
  const data = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${data.year}-${data.month}-${data.day}`;
}

function startOfSaoPauloDayMs(value = Date.now()) {
  return new Date(`${saoPauloDateKey(value)}T03:00:00.000Z`).getTime();
}

function notificationPreferenceKey(type) {
  const mapping = {
    welcome: 'welcome',
    agenda_day: 'agendaDay',
    weekly_report: 'weeklyReport',
    achievement: 'achievements',
    inactivity_3d: 'inactivity',
    trial_ending: 'trialAndBilling',
    payment_failed: 'trialAndBilling',
    renewal_success: 'trialAndBilling',
    premium_activated: 'trialAndBilling',
    // referral_reward: intencionalmente SEM chave de preferência -> sempre envia
    // (ainda respeita whatsappEnabled + número + anti-duplicado), pois é uma
    // recompensa que o usuário não deve "perder" por ter desligado um toggle.
    monthly_report: 'weeklyReport',
    training_reminder: 'trainingReminder',
    checkin_reminder: 'trainingReminder',
    vaccine_reminder: 'trainingReminder',
    test: 'weeklyReport',
  };
  return mapping[type] || null;
}

export async function getUserWhatsappPreferences(userId) {
  const db = getDb();
  const snap = await db.collection('users').doc(userId).get();
  if (!snap.exists) return null;
  const data = snap.data() || {};

  return {
    user: data,
    whatsappEnabled: data.whatsappEnabled === true,
    whatsappPhone: normalizePhone(data.whatsappPhone),
    whatsappNotificationTypes: data.whatsappNotificationTypes || {
      welcome: true,
      agendaDay: false,
      weeklyReport: true,
      trainingReminder: true,
      achievements: true,
      inactivity: true,
      trialAndBilling: true,
    },
    whatsappStatus: data.whatsappStatus || 'disabled',
  };
}

export async function shouldSkipWhatsappNotification(userId, type) {
  const prefs = await getUserWhatsappPreferences(userId);
  if (!prefs) return { skip: true, reason: 'user_not_found' };
  if (!prefs.whatsappEnabled) return { skip: true, reason: 'opt_out' };
  if (!prefs.whatsappPhone) return { skip: true, reason: 'missing_phone' };

  const prefKey = notificationPreferenceKey(type);
  if (prefKey && prefs.whatsappNotificationTypes?.[prefKey] === false) {
    return { skip: true, reason: `disabled_type_${type}` };
  }

  if (type === 'weekly_report') {
    const db = getDb();
    const todayKey = saoPauloDateKey();
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - 6);
    const cutoffKey = saoPauloDateKey(cutoff.getTime());
    const checkinsSnap = await db
      .collection('users')
      .doc(userId)
      .collection('checkins')
      .orderBy('date', 'desc')
      .limit(7)
      .get();

    const activeDays = new Set(
      checkinsSnap.docs
        .map((doc) => doc.data()?.date || doc.id)
        .filter((date) => typeof date === 'string' && date >= cutoffKey && date <= todayKey)
    );

    if (activeDays.size < 3) return { skip: true, reason: 'insufficient_weekly_checkins' };
  }

  const db = getDb();
  if (type !== 'test') {
    const duplicateSnap = await db
      .collection('whatsapp_notifications')
      .where('userId', '==', userId)
      .where('type', '==', type)
      .where('createdAt', '>=', startOfSaoPauloDayMs())
      .get();

    const duplicate = duplicateSnap.docs.some((doc) => {
      const status = doc.data()?.status;
      return ['pending', 'sent', 'mock_sent'].includes(status);
    });

    if (duplicate) return { skip: true, reason: 'duplicate_today' };
  }

  return { skip: false, prefs };
}

export async function sendWhatsAppTemplate({ to, templateName, variables = [], languageCode }) {
  const accessToken = process.env.WHATSAPP_ACCESS_TOKEN;
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;

  if (!accessToken || !phoneNumberId) {
    throw new Error('WHATSAPP_ACCESS_TOKEN or WHATSAPP_PHONE_NUMBER_ID is not configured.');
  }

  const params = normalizeVariables(variables);
  const bodyParameters = params.map((text) => ({ type: 'text', text }));
  const components = bodyParameters.length
    ? [{ type: 'body', parameters: bodyParameters }]
    : undefined;

  const response = await fetch(
    `https://graph.facebook.com/${process.env.WHATSAPP_API_VERSION || DEFAULT_API_VERSION}/${phoneNumberId}/messages`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        to: normalizePhone(to),
        type: 'template',
        template: {
          name: templateName,
          language: { code: languageCode || process.env.WHATSAPP_TEMPLATE_LANGUAGE || DEFAULT_LANGUAGE },
          ...(components ? { components } : {}),
        },
      }),
    }
  );

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data?.error?.message || `WhatsApp API failed with status ${response.status}`);
  }

  return {
    providerMessageId: data?.messages?.[0]?.id || null,
    raw: data,
  };
}

async function zapResponderFetch(path, { method = 'GET', token, body } = {}) {
  const response = await fetch(`${ZAPRESPONDER_API_URL.replace(/\/api$/, '')}${path}`, {
    method,
    headers: {
      Accept: 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(body ? { 'Content-Type': 'application/json' } : {}),
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  const data = await response.json().catch(() => ({}));
  return { response, data };
}

// Obtém um Token Api fresco via login (e-mail/senha) + GET /api/token.
// Só é usado se ZAPRESPONDER_EMAIL e ZAPRESPONDER_PASSWORD estiverem configurados.
// Mantém a integração funcionando mesmo quando o token estático expira.
async function mintZapResponderToken() {
  const email = process.env.ZAPRESPONDER_EMAIL;
  const password = process.env.ZAPRESPONDER_PASSWORD;
  if (!email || !password) return null;

  const login = await zapResponderFetch('/auth/login', { method: 'POST', body: { email, password } });
  if (!login.response.ok) {
    throw new Error(`ZapResponder login falhou (${login.response.status}): ${login.data?.message || login.data?.error || 'credenciais inválidas'}`);
  }
  const loginToken =
    login.data?.tokens?.access?.token ||
    login.data?.token ||
    login.data?.user?.token ||
    login.data?.user?.tokens?.access?.token;
  if (!loginToken) {
    throw new Error('Login no ZapResponder OK, mas nenhum token foi retornado no corpo da resposta.');
  }

  const apiToken = await zapResponderFetch('/api/token', { token: loginToken });
  if (!apiToken.response.ok) {
    throw new Error(`GET /api/token falhou (${apiToken.response.status}): ${apiToken.data?.message || ''}`);
  }
  return cleanAuthToken(apiToken.data?.token || loginToken);
}

async function findConnectedZapResponderDepartment(token) {
  const departmentsResult = await zapResponderFetch('/api/departamento/all', { token });
  const departments = departmentsResult.data?.departamentos;
  if (!departmentsResult.response.ok || !Array.isArray(departments)) return null;

  for (const department of departments) {
    const id = department?._id;
    if (!id) continue;

    const sessionResult = await zapResponderFetch(`/api/whatsapp/${id}`, { token });
    const session = sessionResult.data?.sessao;
    if (
      sessionResult.response.ok &&
      session &&
      (session.isConected === true || session.status === 'CONECTADO')
    ) {
      return id;
    }
  }

  return null;
}

export async function sendZapResponderMessage({ to, message }) {
  let departmentId = cleanAuthToken(process.env.ZAPRESPONDER_DEPARTMENT_ID);
  if (!departmentId) {
    throw new Error('ZAPRESPONDER_DEPARTMENT_ID não está configurado.');
  }

  let token = cleanAuthToken(zapResponderToken());
  const hasCredentials = !!(process.env.ZAPRESPONDER_EMAIL && process.env.ZAPRESPONDER_PASSWORD);

  // Sem token estático, ou token expirado: tenta gerar um novo via credenciais.
  if (!token || isJwtExpired(token)) {
    const minted = await mintZapResponderToken();
    if (minted) token = minted;
  }
  if (!token) {
    throw new Error('ZAPRESPONDER_API_KEY não está configurado (e não há ZAPRESPONDER_EMAIL/ZAPRESPONDER_PASSWORD para gerar um token).');
  }

  const messageBody = { type: 'text', number: normalizePhone(to), message };

  // Esquema oficial da API: Authorization: Bearer <JWT> (securityScheme bearerAuth).
  let { response, data } = await zapResponderFetch(`/api/whatsapp/message/${departmentId}`, {
    method: 'POST',
    token,
    body: messageBody,
  });

  if (!response.ok && /sess/i.test(String(data?.message || data?.error || ''))) {
    const connectedDepartmentId = await findConnectedZapResponderDepartment(token);
    if (connectedDepartmentId && connectedDepartmentId !== departmentId) {
      departmentId = connectedDepartmentId;
      ({ response, data } = await zapResponderFetch(`/api/whatsapp/message/${departmentId}`, {
        method: 'POST',
        token,
        body: messageBody,
      }));
    }
  }
  // 401 com credenciais disponíveis: renova o token uma vez e tenta de novo.
  if (response.status === 401 && hasCredentials) {
    const minted = await mintZapResponderToken();
    if (minted && minted !== token) {
      token = minted;
      ({ response, data } = await zapResponderFetch(`/api/whatsapp/message/${departmentId}`, {
        method: 'POST',
        token,
        body: messageBody,
      }));
    }
  }

  if (!response.ok) {
    const detail = data?.message || data?.error || `ZapResponder API falhou com status ${response.status}`;
    if (!/sess/i.test(String(detail)) && (response.status === 401 || /authenticate|unauthorized|token/i.test(String(detail)))) {
      const payload = jwtPayload(token);
      const diag = {
        ...tokenDiagnostics(token),
        isJwt: !!payload,
        expired: isJwtExpired(token),
        exp: payload?.exp ? new Date(payload.exp * 1000).toISOString() : null,
        hasCredentials,
        departmentId,
      };
      throw new Error(
        `ZapResponder authentication failed: ${detail}. ` +
        `Confira se ZAPRESPONDER_API_KEY é o "Token api" atual (GET /api/token) e não está expirado. ` +
        `diag=${JSON.stringify(diag)}`
      );
    }
    throw new Error(detail);
  }

  return {
    providerMessageId: data?.id || data?.response?.id || data?.messageId || data?.data?.id || null,
    raw: data,
  };
}

export async function enqueueAndSendWhatsappNotification(params) {
  const db = getDb();
  const now = Date.now();
  const {
    userId,
    dogId = '',
    dogName = '',
    type = 'test',
    templateName,
    payload = {},
    variables = payload,
    scheduledFor = now,
  } = params;

  if (!userId) throw new Error('userId is required.');
  if (whatsappProvider() !== 'zapresponder' && !templateName) throw new Error('templateName is required.');

  const skipCheck = await shouldSkipWhatsappNotification(userId, type);
  const prefs = skipCheck.prefs || (await getUserWhatsappPreferences(userId));

  const docRef = db.collection('whatsapp_notifications').doc();
  const baseData = {
    userId,
    dogId,
    dogName,
    type,
    status: skipCheck.skip ? 'skipped' : 'pending',
    provider: whatsappProvider(),
    templateName,
    payload: { ...payload, skipReason: skipCheck.reason || null },
    scheduledFor,
    sentAt: null,
    error: skipCheck.skip ? `Notificação ignorada: ${skipCheck.reason}` : null,
    createdAt: now,
    updatedAt: now,
  };

  await docRef.set(baseData);

  if (skipCheck.skip) {
    return { notificationId: docRef.id, status: 'skipped', reason: skipCheck.reason };
  }

  try {
    const provider = whatsappProvider();
    const result = provider === 'zapresponder'
      ? await sendZapResponderMessage({
          to: prefs.whatsappPhone,
          message: messageFromNotification({ type, dogName, payload, variables, user: prefs.user }),
        })
      : await sendWhatsAppTemplate({
          to: prefs.whatsappPhone,
          templateName,
          variables,
        });

    await docRef.update({
      status: 'sent',
      providerMessageId: result.providerMessageId,
      providerRaw: result.raw || null,
      sentAt: Date.now(),
      updatedAt: Date.now(),
      error: null,
    });

    await db.collection('users').doc(userId).set(
      {
        lastWhatsappSentAt: Date.now(),
        whatsappStatus: 'active',
      },
      { merge: true }
    );

    return { notificationId: docRef.id, status: 'sent', messageId: result.providerMessageId };
  } catch (error) {
    await docRef.update({
      status: 'failed',
      error: error.message || 'Falha no envio pelo WhatsApp.',
      updatedAt: Date.now(),
    });

    await db.collection('users').doc(userId).set(
      {
        whatsappStatus: 'failed',
      },
      { merge: true }
    );

    throw error;
  }
}
