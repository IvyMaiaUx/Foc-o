import { LegalPage } from '../components/LegalPage';
import { PRIVACIDADE } from '../content/legal/privacidade';

export function PoliticaPrivacidade() {
  return <LegalPage kicker="Documentos" markdown={PRIVACIDADE} />;
}
