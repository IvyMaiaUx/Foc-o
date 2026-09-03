import { LegalPage } from '../components/LegalPage';
import { TERMOS } from '../content/legal/termos';

export function TermosDeUso() {
  return <LegalPage kicker="Documentos" markdown={TERMOS} />;
}
