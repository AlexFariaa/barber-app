import React from 'react';
import { CartItem } from '../types';
import { ArrowLeft, Trash2, Calendar, Clock, ShoppingCart, Plus } from 'lucide-react';

interface CartViewProps {
  cart: CartItem[];
  onRemoveItem: (id: string) => void;
  onAddMoreServices: () => void;
  onCheckout: () => void;
  onBack: () => void;
}

export const CartView: React.FC<CartViewProps> = ({ cart, onRemoveItem, onAddMoreServices, onCheckout, onBack }) => {
  const total = cart.reduce((sum, item) => sum + item.price, 0);

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      <header className="bg-white shadow-sm p-4 sticky top-0 z-30">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <button onClick={onBack} className="p-2 -ml-2 hover:bg-gray-100 rounded-full">
              <ArrowLeft size={20} className="text-gray-600" />
            </button>
            <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <ShoppingCart size={20} /> Carrinho
            </h1>
          </div>
        </div>
      </header>

      <div className="max-w-3xl mx-auto p-4 space-y-4">
        {cart.length === 0 ? (
          <div className="text-center py-20">
            <div className="bg-gray-200 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-4">
              <ShoppingCart size={40} className="text-gray-400" />
            </div>
            <h2 className="text-xl font-bold text-gray-800 mb-2">Seu carrinho está vazio</h2>
            <p className="text-gray-500 mb-6">Aproveite para agendar um novo visual.</p>
            <button 
              onClick={onAddMoreServices}
              className="bg-brand-500 text-brand-900 font-bold px-6 py-3 rounded-xl hover:bg-brand-400 transition"
            >
              Ver Serviços
            </button>
          </div>
        ) : (
          <>
            <div className="space-y-4">
              {cart.map((item) => (
                <div key={item.id} className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                  <div className="flex-1">
                    <h3 className="font-bold text-gray-900 text-lg">{item.service.name}</h3>
                    <p className="text-xs text-gray-500 mb-2">{item.unitName}</p>
                    <div className="flex flex-wrap gap-3 text-sm text-gray-600">
                      <div className="flex items-center bg-gray-100 px-2 py-1 rounded">
                         <Calendar size={14} className="mr-1" /> {item.date.toLocaleDateString()}
                      </div>
                      <div className="flex items-center bg-gray-100 px-2 py-1 rounded">
                         <Clock size={14} className="mr-1" /> {item.time}
                      </div>
                      <div className="flex items-center bg-gray-100 px-2 py-1 rounded">
                         <span className="font-bold mr-1">Pro:</span> {item.professional ? item.professional.name : 'Sem preferência'}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between sm:justify-end gap-4 border-t sm:border-0 pt-3 sm:pt-0">
                    <span className="font-bold text-brand-900 text-lg">R$ {item.price.toFixed(2)}</span>
                    <button 
                      onClick={() => onRemoveItem(item.id)}
                      className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition"
                    >
                      <Trash2 size={20} />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Add More Button */}
            <button 
              onClick={onAddMoreServices}
              className="w-full border-2 border-dashed border-brand-500 text-brand-900 font-bold py-4 rounded-xl hover:bg-brand-50 transition flex items-center justify-center gap-2"
            >
              <Plus size={20} /> Adicionar mais serviços
            </button>
          </>
        )}
      </div>

      {cart.length > 0 && (
        <div className="fixed bottom-0 left-0 w-full bg-white border-t border-gray-200 p-4 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)] z-40">
           <div className="max-w-3xl mx-auto flex justify-between items-center">
              <div>
                <p className="text-gray-500 text-sm">Total a pagar</p>
                <p className="text-2xl font-bold text-brand-900">R$ {total.toFixed(2)}</p>
              </div>
              <button 
                onClick={onCheckout}
                className="bg-brand-900 text-white px-8 py-3 rounded-xl font-bold hover:bg-gray-800 shadow-lg"
              >
                Finalizar
              </button>
           </div>
        </div>
      )}
    </div>
  );
};