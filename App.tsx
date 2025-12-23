import React, { useState, useEffect } from 'react';
import { ViewState, BarberUnit, CartItem } from './types';
import { MOCK_UNITS } from './constants';
import { UnitDetails } from './components/UnitDetails';
import { AdminView } from './components/AdminView';
import { CartView } from './components/CartView';
import { AuthView } from './components/AuthView';
import { fetchUnits } from './services/dataService';
import { Scissors, User, Settings, ArrowRight, Loader2 } from 'lucide-react';

const App: React.FC = () => {
  const [view, setView] = useState<ViewState>(ViewState.LANDING);
  const [selectedUnit, setSelectedUnit] = useState<BarberUnit | null>(null);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [pendingBooking, setPendingBooking] = useState<CartItem | null>(null);
  
  // Data State
  const [units, setUnits] = useState<BarberUnit[]>([]);
  const [loading, setLoading] = useState(true);

  // Função centralizada para recarregar dados
  const refreshData = async () => {
    setLoading(true);
    const data = await fetchUnits();
    if (data.length > 0) {
      setUnits(data);
      
      // Se houver uma unidade selecionada, atualiza seus dados também para refletir mudanças (ex: novos profissionais)
      if (selectedUnit) {
        const updatedSelected = data.find(u => u.id === selectedUnit.id);
        if (updatedSelected) {
          setSelectedUnit(updatedSelected);
        }
      }
    } else {
      // Fallback to mock data if DB is empty or connection fails
      console.log("Using mock data as fallback");
      setUnits(MOCK_UNITS);
    }
    setLoading(false);
  };

  useEffect(() => {
    refreshData();
  }, []);

  const handleUnitSelect = (unit: BarberUnit) => {
    setSelectedUnit(unit);
    setView(ViewState.CLIENT_UNIT);
  };

  const handleAddToCart = (item: CartItem) => {
    setCart(prev => [...prev, item]);
    setView(ViewState.CART);
  };

  const handleRemoveFromCart = (id: string) => {
    setCart(prev => prev.filter(item => item.id !== id));
  };

  const handleBookingConfirm = (item: CartItem) => {
    // When confirming immediately, we add to "pending" then send to Login
    setPendingBooking(item);
    setView(ViewState.LOGIN);
  };

  const handleCheckout = () => {
    // Checkout from cart also sends to Login
    setPendingBooking(null); // Assuming bulk checkout logic would differ, but for simplicity:
    setView(ViewState.LOGIN);
  };

  const handleLoginSuccess = () => {
    if (pendingBooking) {
      // User came from direct "Confirm Appointment"
      // In a real app, we would save the booking here
      alert("Agendamento realizado com sucesso! Verifique seu email.");
      setPendingBooking(null);
      setView(ViewState.CLIENT_LIST);
    } else {
      // User came from Cart Checkout
      alert("Pedido realizado com sucesso!");
      setCart([]);
      setView(ViewState.CLIENT_LIST);
    }
  };

  const renderLanding = () => (
    <div className="min-h-screen bg-brand-900 flex flex-col items-center justify-center p-6 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
         <div className="absolute top-10 left-10 w-64 h-64 bg-brand-500 rounded-full blur-3xl"></div>
         <div className="absolute bottom-10 right-10 w-96 h-96 bg-white rounded-full blur-3xl"></div>
      </div>

      <div className="z-10 text-center mb-12">
        <div className="flex justify-center mb-4">
           <div className="bg-brand-500 p-4 rounded-full">
             <Scissors size={48} className="text-brand-900" />
           </div>
        </div>
        <h1 className="text-4xl md:text-6xl font-extrabold text-white mb-2 tracking-tight">
          Barber<span className="text-brand-500">Class</span>
        </h1>
        <p className="text-gray-400 text-lg max-w-md mx-auto">
          Estilo, tradição e modernidade. Agende seu horário ou gerencie sua barbearia.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-2xl z-10">
        <button 
          onClick={() => setView(ViewState.CLIENT_LIST)}
          className="group relative bg-white hover:bg-gray-50 p-8 rounded-2xl shadow-xl transition-all transform hover:-translate-y-1 flex flex-col items-center border-l-8 border-brand-500"
        >
          <div className="bg-gray-100 p-4 rounded-full mb-4 group-hover:bg-brand-500 transition-colors">
            <User size={32} className="text-gray-800 group-hover:text-brand-900" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900">Sou Cliente</h2>
          <p className="text-gray-500 text-center mt-2 text-sm">Encontre uma unidade, agende serviços e veja avaliações.</p>
          <ArrowRight className="absolute bottom-6 right-6 text-gray-300 group-hover:text-brand-500" />
        </button>

        <button 
          onClick={() => setView(ViewState.ADMIN)}
          className="group relative bg-brand-800 hover:bg-brand-700 p-8 rounded-2xl shadow-xl transition-all transform hover:-translate-y-1 flex flex-col items-center border-l-8 border-gray-600"
        >
           <div className="bg-gray-700 p-4 rounded-full mb-4 group-hover:bg-white transition-colors">
            <Settings size={32} className="text-white group-hover:text-brand-900" />
          </div>
          <h2 className="text-2xl font-bold text-white">Sou Admin</h2>
          <p className="text-gray-400 text-center mt-2 text-sm">Gerencie agendamentos, profissionais e relatórios.</p>
          <ArrowRight className="absolute bottom-6 right-6 text-gray-600 group-hover:text-white" />
        </button>
      </div>
      
      <p className="text-gray-600 text-xs mt-12">v1.0.0 - Powered by BarberClass Tech</p>
    </div>
  );

  const renderClientList = () => (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm p-4 sticky top-0 z-30">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <button onClick={() => setView(ViewState.LANDING)} className="p-2 -ml-2 hover:bg-gray-100 rounded-full">
              <ArrowRight className="transform rotate-180 text-gray-600" size={20} />
            </button>
            <h1 className="text-xl font-bold text-gray-900">Unidades Disponíveis</h1>
          </div>
          <div className="relative cursor-pointer" onClick={() => setView(ViewState.CART)}>
            <Scissors className="text-brand-500" />
            {cart.length > 0 && (
              <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold w-5 h-5 flex items-center justify-center rounded-full">
                {cart.length}
              </span>
            )}
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto p-4 space-y-6">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 text-gray-400">
            <Loader2 className="w-10 h-10 animate-spin mb-4 text-brand-500" />
            <p>Carregando unidades...</p>
          </div>
        ) : units.map((unit) => (
          <div 
            key={unit.id}
            onClick={() => handleUnitSelect(unit)}
            className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-xl transition cursor-pointer group"
          >
            <div className="h-48 overflow-hidden relative">
              <img src={unit.imageUrl} alt={unit.name} className="w-full h-full object-cover group-hover:scale-105 transition duration-500" />
              <div className="absolute top-3 right-3 bg-white/90 backdrop-blur px-2 py-1 rounded-lg text-xs font-bold flex items-center shadow-sm">
                <span className="text-yellow-500 mr-1">★</span> {unit.rating}
              </div>
            </div>
            <div className="p-5">
              <h2 className="text-xl font-bold text-gray-900 mb-1">{unit.name}</h2>
              <p className="text-gray-500 text-sm mb-4">{unit.address}</p>
              <div className="flex items-center justify-between">
                <div className="flex -space-x-2">
                   {unit.professionals && unit.professionals.slice(0, 3).map((p, i) => (
                     <img key={i} className="w-8 h-8 rounded-full border-2 border-white" src={p.photoUrl} alt={p.name} />
                   ))}
                   {unit.professionals && unit.professionals.length > 3 && (
                     <div className="w-8 h-8 rounded-full border-2 border-white bg-gray-200 flex items-center justify-center text-xs font-bold text-gray-600">
                       +{unit.professionals.length - 3}
                     </div>
                   )}
                </div>
                <span className="text-brand-900 font-bold text-sm bg-brand-500/20 px-3 py-1 rounded-full group-hover:bg-brand-500 group-hover:text-brand-900 transition">
                  Ver Detalhes
                </span>
              </div>
            </div>
          </div>
        ))}
        {!loading && units.length === 0 && (
            <div className="text-center py-20 text-gray-500">
                <p>Nenhuma unidade encontrada.</p>
            </div>
        )}
      </div>
    </div>
  );

  return (
    <>
      {view === ViewState.LANDING && renderLanding()}
      {view === ViewState.CLIENT_LIST && renderClientList()}
      {view === ViewState.CLIENT_UNIT && selectedUnit && (
        <UnitDetails 
          unit={selectedUnit} 
          onBack={() => setView(ViewState.CLIENT_LIST)} 
          onAddToCart={handleAddToCart}
          onBookingConfirm={handleBookingConfirm}
        />
      )}
      {view === ViewState.CART && (
        <CartView 
          cart={cart}
          onRemoveItem={handleRemoveFromCart}
          onAddMoreServices={() => setView(ViewState.CLIENT_UNIT)}
          onCheckout={handleCheckout}
          onBack={() => setView(ViewState.CLIENT_UNIT)}
        />
      )}
      {view === ViewState.LOGIN && (
        <AuthView 
          onBack={() => setView(pendingBooking ? ViewState.CLIENT_UNIT : ViewState.CART)} 
          onSuccess={handleLoginSuccess}
        />
      )}
      {view === ViewState.ADMIN && (
        <AdminView 
          onBack={() => setView(ViewState.LANDING)} 
          onUpdate={refreshData}
        />
      )}
    </>
  );
};

export default App;