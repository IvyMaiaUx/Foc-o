import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, MessageSquareText } from 'lucide-react';
import { db } from '@/src/lib/firebase';
import { collection, getDocs } from 'firebase/firestore';

interface CheckinNote {
  userId: string;
  userName: string;
  date: string;
  comportamento?: string;
  note: string;
}

export function AdminCheckins() {
  const navigate = useNavigate();
  const [notes, setNotes] = useState<CheckinNote[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const load = async () => {
      try {
        const usersSnap = await getDocs(collection(db, 'users'));
        const all: CheckinNote[] = [];

        // Para cada usuário, lê os check-ins e coleta os que têm observação (context.notes).
        // Volume aceitável para o painel admin no estágio atual; se a base crescer muito,
        // migrar para uma coleção achatada de observações ou uma collection group query.
        for (const userDoc of usersSnap.docs) {
          const u = userDoc.data() as any;
          const userName = u?.name || userDoc.id;
          const checkinsSnap = await getDocs(collection(db, 'users', userDoc.id, 'checkins'));
          checkinsSnap.forEach((c) => {
            const data = c.data() as any;
            const note = String(data?.context?.notes || '').trim();
            if (note) {
              all.push({
                userId: userDoc.id,
                userName,
                date: data?.date || c.id,
                comportamento: data?.comportamento,
                note,
              });
            }
          });
        }

        all.sort((a, b) => (b.date || '').localeCompare(a.date || ''));
        setNotes(all);
      } catch (err) {
        console.error('[AdminCheckins] erro ao carregar observações', err);
        setError('Não foi possível carregar as observações. Verifique se você tem acesso de admin.');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  return (
    <div className="min-h-screen bg-[#FAFAFA] font-sans flex flex-col pb-safe">
      <header className="px-6 pt-16 pb-4 bg-white flex items-center gap-4 sticky top-0 z-10">
        <button
          onClick={() => navigate(-1)}
          className="w-10 h-10 rounded-full bg-[#FAFAFA] border border-[#055A43]/5 flex items-center justify-center text-[#5C615D] active:scale-[0.98] transition-all"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <div>
          <p className="text-[10px] font-medium text-[#506352] tracking-[0.15em] uppercase mb-0.5">Admin</p>
          <h1 className="font-serif text-[24px] text-[#055A43] tracking-tight leading-none">
            Observações dos check-ins
          </h1>
        </div>
      </header>

      <main className="flex-1 px-6 py-6 flex flex-col gap-3 max-w-lg mx-auto w-full">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 rounded-full border-2 border-[#055A43]/20 border-t-[#055A43] animate-spin" />
          </div>
        ) : error ? (
          <p className="text-red-500 text-sm text-center py-10">{error}</p>
        ) : notes.length === 0 ? (
          <div className="text-center py-16 text-[#5C615D]/70 flex flex-col items-center gap-3">
            <MessageSquareText className="w-10 h-10 text-[#055A43]/20" />
            <p>Nenhuma observação registrada ainda.</p>
          </div>
        ) : (
          <>
            <p className="text-[12px] text-[#5C615D]/70 mb-1">{notes.length} observação(ões)</p>
            {notes.map((n, i) => (
              <div
                key={`${n.userId}-${n.date}-${i}`}
                className="bg-white border border-[#055A43]/10 rounded-2xl p-4 shadow-[0_4px_16px_rgb(0,0,0,0.02)]"
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="font-semibold text-sm text-[#055A43]">{n.userName}</span>
                  <span className="text-[11px] text-[#5C615D]/60">{n.date}</span>
                </div>
                {n.comportamento && (
                  <span className="inline-block text-[10px] uppercase tracking-wide text-[#506352] bg-[#055A43]/5 px-2 py-0.5 rounded-full mb-2">
                    {n.comportamento}
                  </span>
                )}
                <p className="text-[14px] text-[#3A3F3B] leading-relaxed whitespace-pre-wrap">{n.note}</p>
              </div>
            ))}
          </>
        )}
      </main>
    </div>
  );
}
