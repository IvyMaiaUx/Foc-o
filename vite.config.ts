import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig} from 'vite';

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    build: {
      sourcemap: false,
      rollupOptions: {
        // O app React não é mais "index.html": esse nome agora pertence à landing
        // pública estática (public/index.html), que o Firebase Hosting serve
        // direto na raiz do domínio, antes até de consultar firebase.json#rewrites.
        input: path.resolve(__dirname, 'app.html'),
        output: {
          // Separa as libs pesadas em chunks próprios para o navegador baixá-las em
          // paralelo e reaproveitá-las do cache entre deploys (o hash só muda quando
          // a lib muda, não a cada alteração de código nosso).
          manualChunks(id) {
            if (!id.includes('node_modules')) return;
            if (id.includes('firebase')) return 'firebase';
            if (id.includes('react-router')) return 'react-router';
            if (id.includes('react-dom') || id.includes('/react/') || id.includes('scheduler')) return 'react';
            if (id.includes('motion')) return 'motion';
            if (id.includes('date-fns')) return 'date-fns';
            if (id.includes('lucide-react')) return 'icons';
          },
        },
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modifyâfile watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
    },
  };
});
