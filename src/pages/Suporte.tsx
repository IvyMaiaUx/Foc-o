import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Send, Paperclip, Loader2, Info, X } from 'lucide-react';
import { auth, storage } from '../lib/firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { SupportRepository } from '../repositories/SupportRepository';
import { DogRepository } from '../repositories/DogRepository';
import { SupportMessage } from '../types';

export function Suporte() {
  const navigate = useNavigate();
  const [messages, setMessages] = useState<SupportMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [userName, setUserName] = useState<string>('');
  
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  useEffect(() => {
    let unsubscribe = () => {};

    const initChat = async () => {
      const user = auth.currentUser;
      if (!user) return;

      try {
        const dogProfile = await DogRepository.getDogProfile(user.uid);
        const dogName = dogProfile?.name || 'Cãozinho';
        const name = user.displayName || user.email?.split('@')[0] || 'Tutor';
        setUserName(name);
        
        await SupportRepository.createOrGetThread(user.uid, name, dogName);
        
        unsubscribe = SupportRepository.subscribeToMessages(user.uid, (msgs) => {
          setMessages(msgs);
          setLoading(false);
          setTimeout(() => {
            if (scrollRef.current) {
               scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
            }
          }, 100);
        });
      } catch (error) {
        console.error("Error initializing chat", error);
        setLoading(false);
      }
    };

    initChat();
    return () => unsubscribe();
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      alert('A imagem deve ter no máximo 5MB');
      return;
    }

    setSelectedImage(file);
    const reader = new FileReader();
    reader.onload = (e) => setPreviewUrl(e.target?.result as string);
    reader.readAsDataURL(file);
  };

  const removeImage = () => {
    setSelectedImage(null);
    setPreviewUrl(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSend = async () => {
    if (!inputText.trim() && !selectedImage) return;
    const user = auth.currentUser;
    if (!user) return;

    setSending(true);
    try {
      let imageUrl: string | undefined = undefined;

      if (selectedImage) {
        const fileRef = ref(storage, `support/${user.uid}/${Date.now()}_${selectedImage.name}`);
        const snapshot = await uploadBytes(fileRef, selectedImage);
        imageUrl = await getDownloadURL(snapshot.ref);
      }

      await SupportRepository.sendMessage(user.uid, inputText || 'Enviou uma imagem', imageUrl, userName);
      
      setInputText('');
      removeImage();
    } catch (e) {
      console.error(e);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FAFAFA] font-sans flex flex-col">
      {/* Header */}
      <header className="px-6 pt-16 pb-4 bg-white flex items-center justify-between sticky top-0 z-10 shadow-sm">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => navigate(-1)}
            className="w-10 h-10 rounded-full bg-[#FAFAFA] border border-[#055A43]/10 flex items-center justify-center text-[#5C615D] active:scale-[0.98] transition-all"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="font-serif text-xl text-[#055A43]">Equipe Focão</h1>
            <p className="text-xs text-[#5C615D]">Suporte</p>
          </div>
        </div>
      </header>

      {/* Aviso de resposta */}
      <div className="bg-[#055A43]/5 border-b border-[#055A43]/10 py-2.5 px-6 flex items-center justify-center gap-2">
        <Info className="w-4 h-4 text-[#055A43]/70" />
        <span className="text-[11px] text-[#055A43]/80 font-medium uppercase tracking-wide">Resposta em até 48h úteis</span>
      </div>

      <main 
        ref={scrollRef}
        className="flex-1 px-4 py-6 overflow-y-auto flex flex-col gap-4"
        style={{ paddingBottom: '100px' }}
      >
        {loading ? (
           <div className="flex justify-center items-center h-full">
               <Loader2 className="w-6 h-6 text-[#055A43]/50 animate-spin" />
           </div>
        ) : messages.length === 0 ? (
           <div className="flex flex-col items-center justify-center h-full text-center px-6">
              <div className="w-16 h-16 bg-[#055A43]/10 rounded-full flex items-center justify-center mb-4">
                 <span className="text-2xl">👋</span>
              </div>
              <p className="text-[#055A43] font-medium text-lg mb-2">Como podemos ajudar?</p>
              <p className="text-[#5C615D] text-sm font-light">
                 Envie suas dúvidas sobre treinamento, comportamento ou nutrição. Nossos especialistas responderão em breve.
              </p>
           </div>
        ) : (
          messages.reduce((acc, msg, idx, arr) => {
            const dateStr = new Date(msg.createdAt).toLocaleDateString();
            const prevDateStr = idx > 0 ? new Date(arr[idx - 1].createdAt).toLocaleDateString() : null;
            const showSeparator = dateStr !== prevDateStr;

            const formatDateSeparator = (timestamp: number) => {
              const date = new Date(timestamp);
              const today = new Date();
              const yesterday = new Date(today);
              yesterday.setDate(yesterday.getDate() - 1);
            
              if (date.toDateString() === today.toDateString()) {
                return 'Hoje';
              } else if (date.toDateString() === yesterday.toDateString()) {
                return 'Ontem';
              } else {
                return date.toLocaleDateString('pt-BR', { day: 'numeric', month: 'long' });
              }
            };

            acc.push(
              <React.Fragment key={msg.id}>
                {showSeparator && (
                  <div className="flex justify-center my-4">
                    <span className="text-[11px] font-medium text-[#5C615D]/60 bg-gray-100 px-3 py-1 rounded-full uppercase tracking-widest">
                      {formatDateSeparator(msg.createdAt)}
                    </span>
                  </div>
                )}
                <div 
                  className={`flex w-full ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                   <div 
                     className={`max-w-[80%] rounded-2xl px-4 py-3 text-[15px] ${
                        msg.sender === 'user' 
                          ? 'bg-[#055A43] text-white rounded-br-sm' 
                          : 'bg-white border border-gray-100 text-[#5C615D] rounded-bl-sm shadow-sm'
                     }`}
                   >
                     {msg.imageUrl && (
                        <img src={msg.imageUrl} alt="Anexo" className="w-full rounded-xl mb-2" />
                     )}
                     <p className="leading-relaxed whitespace-pre-wrap">{msg.text}</p>
                     <span className={`text-[10px] opacity-60 mt-1 block w-full ${msg.sender === 'user' ? 'text-right' : 'text-left'}`}>
                        {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                     </span>
                   </div>
                </div>
              </React.Fragment>
            );
            return acc;
          }, [] as React.ReactNode[])
        )}
      </main>

      {/* Input Area */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-gray-100 pb-safe">
        <div className="flex flex-col gap-2 max-w-2xl mx-auto">
          {previewUrl && (
            <div className="relative self-start mb-2">
              <img src={previewUrl} alt="Preview" className="h-20 w-auto rounded-xl object-cover border border-gray-200" />
              <button
                onClick={removeImage}
                className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 shadow-md"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}
          <div className="flex items-end gap-2">
            <button 
               onClick={() => fileInputRef.current?.click()}
               className="w-12 h-12 rounded-full flex items-center justify-center bg-[#FAFAFA] border border-gray-200 text-[#5C615D] active:scale-[0.98] shrink-0"
            >
               <Paperclip className="w-5 h-5" />
            </button>
            <input 
               type="file" 
               accept="image/*" 
               ref={fileInputRef}
               className="hidden"
               onChange={handleFileChange}
            />
            <div className="flex-1 bg-[#FAFAFA] border border-gray-200 rounded-2xl flex items-center px-4 py-1">
               <textarea 
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  placeholder="Digite sua mensagem..."
                  className="w-full bg-transparent border-none focus:ring-0 resize-none py-3 text-[15px] text-[#055A43] placeholder-[#5C615D]/50"
                  rows={1}
                  onKeyDown={(e) => {
                     if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSend();
                     }
                  }}
               />
            </div>
            <button 
               onClick={handleSend}
               disabled={(!inputText.trim() && !selectedImage) || sending}
               className="w-12 h-12 rounded-full bg-[#055A43] text-white flex items-center justify-center disabled:opacity-50 active:scale-[0.98] transition-transform shrink-0"
            >
               {sending ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5 ml-1" />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
