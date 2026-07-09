export type AppBaseType = 'beta' | 'production';

export function isBetaEnvironment() {
  if (typeof window === 'undefined') return false;
  return window.location.hostname.includes('focao-beta');
}

export function getAppBaseType(): AppBaseType {
  return isBetaEnvironment() ? 'beta' : 'production';
}

export function getBetaRegistrationMetadata() {
  return {
    registrationSource: 'beta-domain',
    acquisitionSource: 'beta',
    betaCohort: 'wave_1',
    betaVersion: 'v1',
  };
}
