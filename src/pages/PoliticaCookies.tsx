import { LegalPage } from '../components/LegalPage';
import { COOKIES } from '../content/legal/cookies';

export function PoliticaCookies() {
  return <LegalPage kicker="Documentos" markdown={COOKIES} />;
}
