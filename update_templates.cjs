const fs = require('fs');

const file = 'src/lib/trainingTemplates.ts';
let content = fs.readFileSync(file, 'utf8');

if (!content.includes('beforeStart?: string;')) {
    content = content.replace(
        'steps: string[];',
        'steps: string[];\n  beforeStart?: string;'
    );
}

const lines = content.split('\n');

const variations = {
  'iniciante': 'Use reforço positivo, faça sessões curtas e escolha um ambiente calmo. Avance apenas quando o cão estiver confortável.',
  'intermediário': 'Mantenha o foco na calma. Ajuste a distância ou a distração se o cão se dispersar, e sempre recompense bons comportamentos.',
  'avançado': 'Em cenários com mais distrações, o ritmo do cão e a clareza da sua comunicação são essenciais. Respeite os sinais de desconforto.'
};

for (let i = 0; i < lines.length; i++) {
    let line = lines[i];
    
    // Look for level to map beforeStart
    if (line.includes('level:')) {
        let levelMatch = line.match(/level:\s*'([^']+)'/);
        if (levelMatch) {
            let level = levelMatch[1];
            let beforeStartText = variations[level] || variations['iniciante'];
            
            // Customize slightly based on tags or text
            if (line.includes('b5-')) {
                beforeStartText = 'Priorize sempre a sensação de segurança. Trabalhe à distância e recompense a tranquilidade antes de qualquer aproximação.';
            } else if (line.includes('b6-')) {
                beforeStartText = 'A independência se constrói aos poucos. Aja com naturalidade e evite fazer muita festa nas idas e vindas.';
            } else if (line.includes('b7-')) {
                beforeStartText = 'Paciência é fundamental. Foque em recompensar os acertos nos horários certos, sem dar broncas nos erros.';
            } else if (line.includes('b8-')) {
                beforeStartText = 'Apresente os estímulos físicos com muita leveza. Crie associações positivas a cada movimento e sem forçar.';
            }

            // Insert beforeStart before 'steps: ['
            let stepsIndex = i;
            while(stepsIndex < lines.length && !lines[stepsIndex].includes('steps: [')) {
                stepsIndex++;
            }
            if (stepsIndex < lines.length && !lines[stepsIndex-1].includes('beforeStart:')) {
                lines[stepsIndex] = `    beforeStart: '${beforeStartText}',\n` + lines[stepsIndex];
            }
        }
    }
}

fs.writeFileSync(file, lines.join('\n'));
console.log('Templates updated with beforeStart');
