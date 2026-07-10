import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';
import { auth, db } from '@/src/lib/firebase';
import { doc, setDoc, deleteDoc, collection, getDocs, writeBatch } from 'firebase/firestore';
import { toLocalDateKey } from '@/src/lib/dateKeys';

export function DevTools() {
  const navigate = useNavigate();
  const [status, setStatus] = useState('');

  const handleGenerateData = async () => {
    setStatus('Gerando...');
    const user = auth.currentUser;
    if (!user) {
      setStatus('Usuário não logado.');
      return;
    }

    try {
      const today = new Date();
      const batch = writeBatch(db);

      // Check-ins for the last 5 days
      for (let i = 1; i <= 5; i++) {
        const d = new Date();
        d.setDate(today.getDate() - i);
        const dateStr = toLocalDateKey(d);

        const checkinRef = doc(db, 'users', user.uid, 'checkins', dateStr);
        batch.set(checkinRef, {
          energia: i % 2 === 0 ? 'Calmo e relaxado' : 'Equilibrado',
          alimentacao: 'Comeu tudo com gosto',
          comportamento: i === 3 ? 'Reagiu a outros cães' : 'Passeio tranquilo',
          date: dateStr,
          timestamp: d.getTime()
        });
      }

      // Treinos for the last 5 days
      for (let i = 1; i <= 5; i++) {
        const d = new Date();
        d.setDate(today.getDate() - i);
        const logRef = doc(db, 'users', user.uid, 'trainingLogs', `test_${i}`);
        
        batch.set(logRef, {
          id: `test_${i}`,
          title: i === 4 ? 'Fica' : 'Senta',
          taskId: i === 4 ? 'fica' : 'senta',
          completedAt: d.getTime(),
          feedback: i === 4 ? 'hard' : 'easy',
          module: 'basics'
        });
      }

      await batch.commit();
      setStatus('Dados mockados gerados com sucesso!');
    } catch (err: any) {
      console.error(err);
      setStatus('Erro: ' + err.message);
    }
  };

  const handleClearData = async () => {
    setStatus('Limpando...');
    const user = auth.currentUser;
    if (!user) {
      setStatus('Usuário não logado.');
      return;
    }

    try {
      // Get all checkins
      const checkinsSnap = await getDocs(collection(db, 'users', user.uid, 'checkins'));
      const batch = writeBatch(db);
      checkinsSnap.forEach(doc => {
        batch.delete(doc.ref);
      });

      // Get all trainingLogs
      const logsSnap = await getDocs(collection(db, 'users', user.uid, 'trainingLogs'));
      logsSnap.forEach(doc => {
        batch.delete(doc.ref);
      });

      // Optionally clear summary
      batch.delete(doc(db, 'users', user.uid, 'evolution', 'summary'));

      await batch.commit();
      setStatus('Histórico limpo com sucesso!');
    } catch (err: any) {
      console.error(err);
      setStatus('Erro: ' + err.message);
    }
  };

  return (
    <div className="min-h-screen bg-[#F7F5EF] flex flex-col p-6">
      <header className="pt-10 flex items-center mb-8">
        <button onClick={() => navigate(-1)} className="w-10 h-10 bg-white rounded-full flex items-center justify-center border border-gray-200">
          <ChevronLeft className="w-5 h-5 text-gray-600" />
        </button>
        <h1 className="ml-4 font-bold text-xl text-gray-800">Dev Tools</h1>
      </header>

      <div className="flex flex-col gap-4">
        <button onClick={() => navigate('/admin/notificacoes')} className="bg-[#055A43] text-white p-4 rounded-xl font-medium shadow-md flex justify-center items-center">
          Acessar Central de Notificações (ADM)
        </button>

        <button onClick={handleGenerateData} className="bg-blue-600 text-white p-4 rounded-xl font-medium shadow-md">
          Gerar Dados de Teste (Últimos 5 dias)
        </button>
        <button onClick={handleClearData} className="bg-red-600 text-white p-4 rounded-xl font-medium shadow-md">
          Limpar Histórico
        </button>

        {status && (
          <div className="mt-4 p-4 rounded-xl bg-gray-100 text-gray-700 font-mono text-sm border border-gray-300">
            {status}
          </div>
        )}
      </div>
    </div>
  );
}
