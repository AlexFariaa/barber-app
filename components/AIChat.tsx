import React, { useState } from 'react';
import { MessageCircle, X, Send, Sparkles } from 'lucide-react';
import { getStyleAdvice } from '../services/geminiService';

interface AIChatProps {
  context: string;
}

export const AIChat: React.FC<AIChatProps> = ({ context }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<{ role: 'user' | 'ai'; text: string }[]>([
    { role: 'ai', text: 'Olá! Sou seu consultor de estilo virtual. Dúvidas sobre qual corte combina com você?' }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSend = async () => {
    if (!input.trim()) return;
    
    const userMsg = input;
    setInput('');
    setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setLoading(true);

    const response = await getStyleAdvice(userMsg, context);
    
    setMessages(prev => [...prev, { role: 'ai', text: response }]);
    setLoading(false);
  };

  if (!isOpen) {
    return (
      <button 
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 bg-brand-500 hover:bg-brand-400 text-brand-900 p-4 rounded-full shadow-lg transition-transform hover:scale-110 z-50 flex items-center justify-center"
      >
        <Sparkles className="w-6 h-6 mr-2" />
        <span className="font-bold text-sm">IA Stylist</span>
      </button>
    );
  }

  return (
    <div className="fixed bottom-6 right-6 w-80 sm:w-96 h-[500px] bg-white rounded-xl shadow-2xl z-50 flex flex-col border border-gray-200">
      <div className="bg-brand-900 text-white p-4 rounded-t-xl flex justify-between items-center">
        <div className="flex items-center">
          <Sparkles className="w-5 h-5 text-brand-500 mr-2" />
          <h3 className="font-bold">Consultor IA</h3>
        </div>
        <button onClick={() => setIsOpen(false)} className="text-gray-400 hover:text-white">
          <X size={20} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
        {messages.map((msg, idx) => (
          <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[80%] p-3 rounded-lg text-sm ${
              msg.role === 'user' 
                ? 'bg-brand-500 text-brand-900 font-medium' 
                : 'bg-white border border-gray-200 text-gray-700 shadow-sm'
            }`}>
              {msg.text}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="bg-gray-200 p-3 rounded-lg text-xs animate-pulse text-gray-500">
              Digitando...
            </div>
          </div>
        )}
      </div>

      <div className="p-3 border-t bg-white rounded-b-xl flex gap-2">
        <input 
          type="text" 
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSend()}
          placeholder="Ex: Qual corte combina com rosto redondo?"
          className="flex-1 border border-gray-300 rounded-full px-4 py-2 text-sm focus:outline-none focus:border-brand-500"
        />
        <button 
          onClick={handleSend}
          disabled={loading}
          className="bg-brand-900 text-brand-500 p-2 rounded-full hover:bg-gray-800 disabled:opacity-50"
        >
          <Send size={18} />
        </button>
      </div>
    </div>
  );
};