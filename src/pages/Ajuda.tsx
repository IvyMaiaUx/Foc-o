import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, MessageCircle, ChevronDown, ChevronUp } from 'lucide-react';

interface FAQ {
  id: string;
  q: string;
  a: string | React.ReactNode;
}

interface FAQCategory {
  title: string;
  faqs: FAQ[];
}

const faqData: FAQCategory[] = [
  {
    title: "Onboarding e plano inicial",
    faqs: [
      { id: "o1", q: "Por que o app faz tantas perguntas no início?", a: "As respostas ajudam o Focão a entender o perfil do seu cão e montar um plano mais coerente com a rotina, o comportamento e os objetivos da casa." },
      { id: "o2", q: "O plano inicial é igual para todos os cães?", a: "Não. O plano é organizado com base nas informações preenchidas no onboarding, como energia, comportamento, rotina, nível de treino e objetivos do tutor." },
      { id: "o3", q: "Posso alterar informações do meu cão depois?", a: "Sim. Os dados principais podem ser ajustados no perfil e nas seções de saúde, alimentação e rotina." }
    ]
  },
  {
    title: "Treinos e rotina",
    faqs: [
      { id: "t1", q: "Como funciona o treino do dia?", a: "O treino do dia é a atividade principal sugerida pelo plano atual. Ele aparece na Home e reflete o momento da jornada do seu cão." },
      { id: "t2", q: "Preciso fazer treinos longos?", a: "Não. O Focão prioriza sessões curtas, consistentes e possíveis de manter na rotina." },
      { id: "t3", q: "O que acontece quando eu concluo um treino?", a: "O app registra a sessão, coleta seu feedback e atualiza o progresso do plano e da evolução do cão." },
      { id: "t4", q: "E se eu marcar “Não concluí”?", a: "O app entende que houve tentativa real, mas não conta como treino concluído. Isso evita avançar o plano cedo demais e respeita o tempo do cão." },
      { id: "t5", q: "Posso repetir um treino?", a: "Sim. Repetir faz parte do processo, especialmente quando o cão ainda está consolidando a habilidade." }
    ]
  },
  {
    title: "Check-in e evolução",
    faqs: [
      { id: "c1", q: "Para que serve o check-in diário?", a: "O check-in ajuda o app a entender como foi o dia do cão, incluindo treino, humor, comportamento, passeio e observações importantes." },
      { id: "c2", q: "Preciso fazer check-in todo dia?", a: "Não é obrigatório, mas quanto mais consistente for o registro, mais útil fica a leitura da evolução e dos relatórios." },
      { id: "c3", q: "O que muda quando eu salvo um check-in?", a: "O app atualiza o histórico do dia, recalcula a evolução e usa essas informações para gerar leituras mais inteligentes ao longo do tempo." },
      { id: "c4", q: "Por que minha evolução está zerada?", a: "Se você começou agora ou ainda não registrou treinos e check-ins suficientes, a evolução aparece vazia de forma intencional. Ela passa a refletir o uso real do app." },
      { id: "c5", q: "O que é a sequência (streak)?", a: "É o número de dias em que houve uso real do app, como treino, tentativa de treino ou check-in." }
    ]
  },
  {
    title: "Nutrição e alimentação",
    faqs: [
      { id: "n1", q: "Como funciona a recomendação alimentar do Focão?", a: "O app identifica a ração atual do seu cão, cruza isso com o peso, a idade, a atividade e outras informações relevantes, e estima uma recomendação diária." },
      { id: "n2", q: "O cálculo usa a embalagem da ração?", a: "Sempre que possível, sim. A proposta do Focão é usar a referência nutricional da fórmula selecionada como base para a estimativa." },
      { id: "n3", q: "E se eu não encontrar a ração do meu cão?", a: "Nesse caso, o app pode usar uma estimativa simplificada ou permitir preenchimento complementar, dependendo da etapa da implementação." },
      { id: "n4", q: "A recomendação substitui orientação veterinária?", a: "Não. A estimativa do app é uma referência inicial para organização da rotina e não substitui avaliação profissional individualizada." }
    ]
  },
  {
    title: "Saúde e vacinas",
    faqs: [
      { id: "s1", q: "Posso registrar vacinas no app?", a: "Sim. O módulo de vacinas permite acompanhar histórico, próximas doses e lembretes." },
      { id: "s2", q: "O app avisa sobre vacinas próximas?", a: "Sim, quando os lembretes estiverem ativos, o app pode avisar com antecedência sobre vacinas futuras." },
      { id: "s3", q: "Posso atualizar peso e informações de saúde?", a: "Sim. O perfil de saúde do cão pode ser ajustado ao longo do tempo para manter o acompanhamento mais fiel à realidade." }
    ]
  },
  {
    title: "Assinatura e planos",
    faqs: [
      { id: "p1", q: "O Focão tem período de teste?", a: "Sim. Novos usuários podem começar com um período de teste, quando essa regra estiver ativa no app." },
      { id: "p2", q: "Qual a diferença entre free, trial e premium?", a: (
        <ul className="list-disc pl-4 space-y-1">
          <li><strong>Free:</strong> acesso básico</li>
          <li><strong>Trial:</strong> acesso temporário a recursos premium</li>
          <li><strong>Premium:</strong> acesso completo aos recursos avançados</li>
        </ul>
      )},
      { id: "p3", q: "Quais recursos podem ser premium?", a: "Dependendo da configuração do produto, itens como relatórios mais completos, insights avançados e módulos enriquecidos podem ficar disponíveis apenas em trial ou premium." },
      { id: "p4", q: "Posso cancelar depois?", a: "A lógica de cancelamento depende da plataforma de pagamento integrada ao app, mas a intenção é manter esse processo simples e transparente." }
    ]
  },
  {
    title: "Suporte e uso do app",
    faqs: [
      { id: "u1", q: "O app está funcionando, mas um botão não responde. O que faço?", a: "Feche e abra o app novamente. Se o problema continuar, registre o comportamento para revisão técnica." },
      { id: "u2", q: "Meus dados ficam salvos?", a: "Sim, a proposta do app é trabalhar com persistência real para manter seu progresso, perfil e histórico." },
      { id: "u3", q: "O Focão substitui um adestrador ou veterinário?", a: "Não. O Focão é uma ferramenta de acompanhamento e organização da rotina, pensada para apoiar o tutor com mais clareza e consistência." }
    ]
  }
];

export function Ajuda() {
  const navigate = useNavigate();
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const toggleFaq = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  return (
    <div className="min-h-screen bg-[#F7F5EF] font-sans flex flex-col">
      {/* Header */}
      <header className="px-6 pt-16 pb-6 bg-white border-b border-[#055A43]/5 flex flex-col gap-4 sticky top-0 z-10">
        <button 
          onClick={() => navigate(-1)}
          className="w-10 h-10 rounded-full bg-[#F7F5EF] border border-[#055A43]/5 flex items-center justify-center text-[#6B7A6E] active:scale-[0.98] transition-all"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="font-serif text-[32px] text-[#055A43] tracking-tight leading-none mb-2">
            Como podemos <br/> <span className="italic">ajudar?</span>
          </h1>
          <p className="text-[#6B7A6E] font-light text-[15px]">Encontre respostas rápidas ou fale conosco.</p>
        </div>
      </header>

      <main className="flex-1 px-6 py-8 overflow-y-auto pb-32">
        <motion.div 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="flex flex-col gap-8"
        >
          
          {/* Quick Actions */}
          <div className="grid grid-cols-1 gap-4">
            <button className="bg-white rounded-[1.5rem] p-5 border border-[#055A43]/5 shadow-[0_4px_24px_rgba(45,74,58,0.08)] flex items-center gap-4 active:scale-[0.98] transition-transform w-full">
              <div className="w-12 h-12 rounded-full bg-[#055A43]/5 text-[#055A43] flex items-center justify-center shrink-0">
                <MessageCircle className="w-6 h-6" />
              </div>
              <div className="text-left flex-1">
                <p className="font-medium text-[#055A43] text-[15px]">Falar com Suporte</p>
                <p className="text-[#6B7A6E] text-[13px] font-light mt-0.5">Resposta em até 48h úteis</p>
              </div>
            </button>
          </div>

          <div className="flex flex-col gap-8">
             {faqData.map((category, catIdx) => (
               <div key={catIdx}>
                 <h3 className="font-medium text-[#055A43] text-[11px] tracking-[0.15em] uppercase mb-4 px-2 opacity-80">{category.title}</h3>
                 
                 <div className="bg-white rounded-[1.5rem] border border-[#055A43]/5 shadow-[0_4px_24px_rgba(45,74,58,0.08)] flex flex-col overflow-hidden">
                   {category.faqs.map((faq) => {
                     const isExpanded = expandedId === faq.id;
                     
                     return (
                       <div key={faq.id} className="border-b border-[#055A43]/5 last:border-0 hover:bg-[#F7F5EF] transition-colors">
                         <button 
                           onClick={() => toggleFaq(faq.id)}
                           className="w-full p-5 flex justify-between items-start text-left gap-4"
                         >
                           <p className={`font-medium text-[15px] transition-colors ${isExpanded ? 'text-[#055A43]' : 'text-[#506352]'}`}>
                             {faq.q}
                           </p>
                           <div className="shrink-0 mt-0.5">
                             {isExpanded ? (
                               <ChevronUp className="w-5 h-5 text-[#055A43]" />
                             ) : (
                               <ChevronDown className="w-5 h-5 text-[#506352]/40" />
                             )}
                           </div>
                         </button>
                         <AnimatePresence>
                           {isExpanded && (
                             <motion.div
                               initial={{ height: 0, opacity: 0 }}
                               animate={{ height: "auto", opacity: 1 }}
                               exit={{ height: 0, opacity: 0 }}
                               transition={{ duration: 0.2 }}
                               className="overflow-hidden"
                             >
                               <div className="px-5 pb-5 pt-1 text-[#6B7A6E] text-[14px] font-light leading-relaxed">
                                 {faq.a}
                               </div>
                             </motion.div>
                           )}
                         </AnimatePresence>
                       </div>
                     );
                   })}
                 </div>
               </div>
             ))}
          </div>
        </motion.div>
      </main>
    </div>
  );
}
