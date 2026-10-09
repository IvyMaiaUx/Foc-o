import { withUtm, type UtmContext } from './utm';
import { ENGINE_URL } from './destinos';

/** URL do quiz embutido (engine.focaoapp.com.br/q/[id]) com UTMs repassados. */
export function quizEmbedUrl(quizId: string, ctx: UtmContext): string {
  return withUtm(`${ENGINE_URL}/q/${quizId}`, ctx);
}
