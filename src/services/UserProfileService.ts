import type { User } from 'firebase/auth';

const CREATE_PROFILE_ENDPOINT = 'https://foc-o.vercel.app/api/create-user-profile';

export const UserProfileService = {
  async ensureProfile(user: User, name?: string, referredBy?: string) {
    const body = JSON.stringify({
      ...(name ? { name } : {}),
      ...(referredBy ? { referredBy } : {}),
    });

    // Retry com backoff: a criação de perfil é crítica (sem ela o usuário fica órfão).
    // Falhas transitórias (cold start da função, rede) não devem deixar o usuário sem perfil.
    let lastError: unknown;
    for (let attempt = 0; attempt < 3; attempt += 1) {
      try {
        const token = await user.getIdToken();
        const response = await fetch(CREATE_PROFILE_ENDPOINT, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body,
        });
        // 200 = criado; 409 = já existe (idempotente) → ambos sucesso.
        if (response.ok || response.status === 409) return;
        lastError = new Error(`Profile initialization failed (${response.status})`);
      } catch (err) {
        lastError = err;
      }
      if (attempt < 2) {
        await new Promise((resolve) => setTimeout(resolve, 400 * (attempt + 1)));
      }
    }

    throw lastError instanceof Error ? lastError : new Error('Profile initialization failed');
  },
};
