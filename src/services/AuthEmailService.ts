import type { User } from 'firebase/auth';

const AUTH_EMAIL_ENDPOINT = 'https://app.focaoapp.com.br/api/send-auth-email';

async function request(body: Record<string, string>, token?: string) {
  const response = await fetch(AUTH_EMAIL_ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    throw new Error(`Auth email request failed (${response.status})`);
  }
}

export const AuthEmailService = {
  async sendVerification(user: User) {
    const token = await user.getIdToken();
    await request({ type: 'verification' }, token);
  },

  async sendPasswordReset(email: string, redirect?: 'ativar' | 'assinatura') {
    await request({
      type: 'password_reset',
      email: email.trim().toLowerCase(),
      ...(redirect ? { redirect } : {}),
    });
  },
};
