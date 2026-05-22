import { User } from 'firebase/auth';

const claimEndpoint = import.meta.env.VITE_PREMIUM_CLAIM_API_URL || '';

export class PremiumClaimRepository {
  static async claimForUser(user: User): Promise<boolean> {
    if (!claimEndpoint || !user.email) return false;

    const token = await user.getIdToken();
    const response = await fetch(claimEndpoint, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email: user.email }),
    });

    if (!response.ok) {
      console.warn('[PremiumClaimRepository] claim failed', response.status);
      return false;
    }

    const data = await response.json();
    return Boolean(data?.claimed);
  }
}
