import React, { useState } from 'react';
import { ArrowLeft, User, Mail, Lock, CheckCircle } from 'lucide-react';

interface AuthViewProps {
  onBack: () => void;
  onSuccess: () => void;
}

export const AuthView: React.FC<AuthViewProps> = ({ onBack, onSuccess }) => {
  const [isLogin, setIsLogin] = useState(false); // Default to register as per prompt "cria uma conta"
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    // Simulate API call
    setTimeout(() => {
      setLoading(false);
      onSuccess();
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col relative">
      <div className="absolute top-4 left-4 z-10">
        <button onClick={onBack} className="bg-white p-2 rounded-full shadow-md text-gray-600 hover:text-brand-900">
          <ArrowLeft size={24} />
        </button>
      </div>

      <div className="flex-1 flex flex-col justify-center items-center p-6">
        <div className="w-full max-w-md bg-white rounded-2xl shadow-xl overflow-hidden">
          <div className="bg-brand-900 p-8 text-center">
            <h2 className="text-3xl font-bold text-white mb-2">Barber<span className="text-brand-500">Class</span></h2>
            <p className="text-gray-300">{isLogin ? 'Bem-vindo de volta!' : 'Crie sua conta para finalizar'}</p>
          </div>

          <div className="p-8">
            <form onSubmit={handleSubmit} className="space-y-4">
              {!isLogin && (
                <div className="space-y-1">
                  <label className="text-sm font-bold text-gray-700">Nome Completo</label>
                  <div className="relative">
                    <User className="absolute left-3 top-3 text-gray-400" size={20} />
                    <input type="text" className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:border-brand-500 transition" placeholder="Seu nome" required />
                  </div>
                </div>
              )}
              
              <div className="space-y-1">
                <label className="text-sm font-bold text-gray-700">Email</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 text-gray-400" size={20} />
                  <input type="email" className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:border-brand-500 transition" placeholder="seu@email.com" required />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-sm font-bold text-gray-700">Senha</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 text-gray-400" size={20} />
                  <input type="password" className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:border-brand-500 transition" placeholder="••••••••" required />
                </div>
              </div>

              <button 
                type="submit" 
                disabled={loading}
                className="w-full bg-brand-500 text-brand-900 font-bold py-4 rounded-xl hover:bg-brand-400 transition transform hover:-translate-y-1 shadow-lg mt-6 flex items-center justify-center"
              >
                {loading ? (
                  <span className="animate-pulse">Processando...</span>
                ) : (
                  <>{isLogin ? 'Entrar' : 'Criar Conta'}</>
                )}
              </button>
            </form>

            <div className="mt-6 text-center">
              <button 
                onClick={() => setIsLogin(!isLogin)}
                className="text-sm text-gray-500 hover:text-brand-900 underline"
              >
                {isLogin ? 'Não tem uma conta? Cadastre-se' : 'Já tem uma conta? Faça login'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};