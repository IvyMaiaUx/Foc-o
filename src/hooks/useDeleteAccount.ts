import { useState } from 'react';
import {
  getAuth,
  deleteUser,
  EmailAuthProvider,
  reauthenticateWithCredential,
} from 'firebase/auth';
import {
  getFirestore,
  doc,
  collection,
  getDocs,
  deleteDoc,
  writeBatch,
} from 'firebase/firestore';
import {
  getStorage,
  ref,
  listAll,
  deleteObject,
} from 'firebase/storage';

export function useDeleteAccount() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function deleteUserSubcollections(uid: string) {
    const db = getFirestore();
    // O Firestore NÃO apaga subcoleção junto com o documento pai: o que não
    // estiver nesta lista fica órfão no banco depois que a conta some. A lista
    // anterior tinha quatro nomes, dois deles inexistentes ('dogs', 'sessions')
    // e o de perfil do cão no plural errado — na prática vacinas, treinos,
    // check-ins e eventos sobreviviam a um "excluir todos os meus dados".
    //
    // A fonte desta lista é o firestore.rules, que declara toda subcoleção que
    // pode existir sob /users/{uid}. Ao criar uma subcoleção nova lá, acrescente
    // aqui também, senão ela passa a escapar da exclusão em silêncio.
    const subcollections = [
      'adminReports',
      'checkins',
      'completedTrainings',
      'customEventCompletions',
      'customEvents',
      'dailyCheckins',
      'dog',
      'dogs',
      'evolution',
      'missions',
      'notifications',
      'plan',
      'sessions',
      'trainingHistory',
      'trainingLogs',
      'trainingSessions',
      'vaccines',
    ];

    for (const sub of subcollections) {
      const colRef = collection(db, 'users', uid, sub);
      const snap = await getDocs(colRef);

      const batch = writeBatch(db);
      snap.docs.forEach(d => batch.delete(d.ref));
      if (!snap.empty) await batch.commit();
    }
  }

  async function deleteUserStorage(uid: string) {
    const storage = getStorage();

    const paths = [
      `dogs/${uid}`,
      `support/${uid}`,
    ];

    for (const path of paths) {
      try {
        const folderRef = ref(storage, path);
        const { items } = await listAll(folderRef);
        await Promise.all(items.map(item => deleteObject(item)));
      } catch {
        // pasta pode não existir — tudo bem
      }
    }
  }

  async function deleteAccount(password?: string) {
    const auth = getAuth();
    const user = auth.currentUser;

    if (!user) {
      setError('Nenhum usuário autenticado.');
      return false;
    }

    setLoading(true);
    setError(null);

    try {
      const uid = user.uid;
      const db = getFirestore();

      // 1. Se necessário, re-autenticar (evita erro "requires-recent-login")
      if (password && user.email) {
        const credential = EmailAuthProvider.credential(user.email, password);
        await reauthenticateWithCredential(user, credential);
      }

      // 2. Deletar sub-coleções
      await deleteUserSubcollections(uid);

      // 3. Deletar documento raiz do usuário
      await deleteDoc(doc(db, 'users', uid));

      // 4. Deletar arquivos do Storage
      await deleteUserStorage(uid);

      // 5. Deletar conta no Firebase Auth (deve ser o último passo)
      await deleteUser(user);

      return true;
    } catch (err: any) {
      if (err.code === 'auth/requires-recent-login') {
        setError(
          'Por segurança, faça login novamente antes de excluir sua conta.'
        );
      } else {
        setError('Erro ao excluir conta. Tente novamente ou entre em contato com o suporte.');
        console.error('deleteAccount error:', err);
      }
      return false;
    } finally {
      setLoading(false);
    }
  }

  return { deleteAccount, loading, error };
}
