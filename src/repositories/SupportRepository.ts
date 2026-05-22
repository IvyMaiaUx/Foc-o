import { collection, doc, setDoc, addDoc, updateDoc, onSnapshot, query, orderBy, getDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { SupportThread, SupportMessage } from '../types';

export class SupportRepository {
  static async createOrGetThread(userId: string, userName: string, dogName: string): Promise<string> {
    const threadRef = doc(db, 'supportThreads', userId);
    const snap = await getDoc(threadRef);
    if (!snap.exists()) {
      const thread: SupportThread = {
        id: userId,
        userId,
        userName,
        dogName,
        status: 'open',
        lastMessageAt: Date.now(),
        unreadAdmin: false,
        unreadUser: false,
      };
      await setDoc(threadRef, thread);
    }
    return userId; // Thread ID defaults to user ID
  }

  static async sendMessage(userId: string, text: string, imageUrl?: string, userName?: string): Promise<void> {
    const messagesRef = collection(db, 'supportThreads', userId, 'messages');
    const msg: Omit<SupportMessage, 'id'> = {
      text,
      sender: 'user',
      createdAt: Date.now(),
      ...(imageUrl && { imageUrl }),
    };
    await addDoc(messagesRef, msg);

    // Update thread metadata
    const threadRef = doc(db, 'supportThreads', userId);
    await setDoc(threadRef, {
      userId,
      ...(userName && { userName }),
      status: 'waiting_support',
      updatedAt: Date.now(),
      lastMessage: text,
      unreadCount: 1, // Reset or increment unreadCount
      lastMessageAt: Date.now(),
      unreadAdmin: true
    }, { merge: true });
  }

  static subscribeToThread(userId: string, callback: (thread: Partial<SupportThread> | null) => void): () => void {
    return onSnapshot(doc(db, 'supportThreads', userId), (docSnap) => {
      if (docSnap.exists()) {
        callback({ id: docSnap.id, ...docSnap.data() } as SupportThread);
      } else {
        callback(null);
      }
    }, () => {
      // Ignore
    });
  }

  static subscribeToMessages(userId: string, callback: (msgs: SupportMessage[]) => void): () => void {
    const q = query(collection(db, 'supportThreads', userId, 'messages'), orderBy('createdAt', 'asc'));
    return onSnapshot(q, (snapshot) => {
      const msgs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as SupportMessage));
      callback(msgs);
      // Mark as read when subscribing/getting new messages
      if (msgs.length > 0) {
        // optionally update unreadUser = false here or let the parent do it
        updateDoc(doc(db, 'supportThreads', userId), { unreadUser: false }).catch(console.error);
      }
    }, () => {
      // Ignore
    });
  }
}
