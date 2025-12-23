import React, { useState, useMemo, useEffect } from 'react';
import { BarberUnit, UnitTab, Service, Professional, CartItem } from '../types';
import { ArrowLeft, MapPin, Heart, Star, Clock, Calendar, Check, MessageSquare, Users, ChevronRight, ShoppingCart, VolumeX, AlertCircle } from 'lucide-react';
import { AIChat } from './AIChat';

interface UnitDetailsProps {
  unit: BarberUnit;
  onBack: () => void;
  onAddToCart: (item: CartItem) => void;
  onBookingConfirm: (item: CartItem) => void;
}

type BookingStep = 'LIST' | 'DATETIME' | 'CONFIRM';

export const UnitDetails: React.FC<UnitDetailsProps> = ({ unit, onBack, onAddToCart, onBookingConfirm }) => {
  const [activeTab, setActiveTab] = useState<UnitTab>(UnitTab.SERVICES);
  const [isFavorite, setIsFavorite] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Booking Flow State
  const [bookingStep, setBookingStep] = useState<BookingStep>('LIST');
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedProId, setSelectedProId] = useState<string | null>('any'); // 'any' for no preference
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [silentMode, setSilentMode] = useState(false);
  const [notes, setNotes] = useState('');

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleBack = () => {
    if (bookingStep === 'CONFIRM') {
      setBookingStep('DATETIME');
    } else if (bookingStep === 'DATETIME') {
      setBookingStep('LIST');
      setSelectedService(null);
      setSelectedTime(null);
    } else {
      onBack();
    }
  };

  const startBooking = (service: Service) => {
    setSelectedService(service);
    setBookingStep('DATETIME');
    // Reset selections
    setSelectedTime(null);
    setSilentMode(false);
    setNotes('');
  };

  const createCartItem = (): CartItem | null => {
    if (!selectedService || !selectedTime) return null;
    
    const selectedPro = selectedProId === 'any' 
      ? null 
      : unit.professionals.find(p => p.id === selectedProId) || null;

    return {
      id: Math.random().toString(36).substr(2, 9),
      service: selectedService,
      professional: selectedPro,
      date: selectedDate,
      time: selectedTime,
      unitName: unit.name,
      price: selectedService.price
    };
  };

  // Mock Data Generators
  const getNextDays = () => {
    const days = [];
    for (let i = 0; i < 14; i++) { // Show 2 weeks
      const d = new Date();
      d.setDate(d.getDate() + i);
      days.push(d);
    }
    return days;
  };

  // Helper to check if the selected pro (or any) works on a specific date
  const isDayAvailable = (date: Date) => {
    const dayOfWeek = date.getDay(); // 0 = Domingo, 1 = Segunda...
    
    const targetPros = selectedProId === 'any'
      ? unit.professionals
      : unit.professionals.filter(p => p.id === selectedProId);
    
    // Returns true if AT LEAST ONE of the target pros has a schedule entry for this day that says isOpen: true
    return targetPros.some(pro => {
      // Se schedule não existir, assume aberto (fallback) ou fechado dependendo da regra de negócio.
      // Aqui vamos assumir fechado se não tiver schedule definido explicitamente.
      const daySchedule = pro.schedule?.find(d => d.dayOfWeek === dayOfWeek);
      return daySchedule?.isOpen;
    });
  };

  // Ensure selectedDate is valid when changing professionals
  useEffect(() => {
    if (bookingStep === 'DATETIME' && !isDayAvailable(selectedDate)) {
      // If current date becomes unavailable (e.g. switched pro), try to find next available date
      const days = getNextDays();
      const nextAvailable = days.find(d => isDayAvailable(d));
      if (nextAvailable) {
        setSelectedDate(nextAvailable);
        setSelectedTime(null);
      }
    }
  }, [selectedProId, bookingStep]);


  // --- Dynamic Time Slot Logic ---
  const availableSlots = useMemo(() => {
    if (!selectedService) return [];

    const dayOfWeek = selectedDate.getDay(); // 0 = Sunday
    const slots = new Set<string>();
    const interval = 30; // Minutes between slots

    // Helper: Time string "HH:MM" to minutes from midnight
    const toMinutes = (timeStr: string) => {
      const [h, m] = timeStr.split(':').map(Number);
      return h * 60 + m;
    };

    // Helper: Minutes to "HH:MM"
    const toTimeStr = (mins: number) => {
      const h = Math.floor(mins / 60);
      const m = mins % 60;
      return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
    };

    // Determine which professionals to check
    const targetPros = selectedProId === 'any'
      ? unit.professionals
      : unit.professionals.filter(p => p.id === selectedProId);

    targetPros.forEach(pro => {
      const schedule = pro.schedule?.find(d => d.dayOfWeek === dayOfWeek);
      
      // If pro works today
      if (schedule && schedule.isOpen) {
        const startMins = toMinutes(schedule.start);
        const endMins = toMinutes(schedule.end);
        const lunchStartMins = schedule.lunchStart ? toMinutes(schedule.lunchStart) : -1;
        const lunchEndMins = schedule.lunchEnd ? toMinutes(schedule.lunchEnd) : -1;
        
        const serviceDuration = selectedService.durationMin;

        // Iterate through the day
        for (let time = startMins; time < endMins; time += interval) {
          const slotEnd = time + serviceDuration;

          // 1. Check if service finishes before work day ends
          if (slotEnd > endMins) continue;

          // 2. Check lunch conflict
          if (lunchStartMins !== -1 && lunchEndMins !== -1) {
             // If slot starts inside lunch OR ends inside lunch OR spans over lunch
             const startsInLunch = time >= lunchStartMins && time < lunchEndMins;
             const endsInLunch = slotEnd > lunchStartMins && slotEnd <= lunchEndMins;
             const spansLunch = time < lunchStartMins && slotEnd > lunchEndMins;
             
             if (startsInLunch || endsInLunch || spansLunch) continue;
          }

          // If valid, add to set (Set handles deduplication for "any" case)
          slots.add(toTimeStr(time));
        }
      }
    });

    // Convert to array and sort
    return Array.from(slots).sort();

  }, [selectedDate, selectedProId, selectedService, unit.professionals]);


  // --- Render Functions for Booking Steps ---

  const renderDateTimeSelection = () => {
    const days = getNextDays();

    return (
      <div className="pb-24 space-y-6 animate-fadeIn">
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-lg font-bold text-gray-800 mb-1">Serviço Selecionado</h3>
          <div className="flex justify-between items-center text-gray-600">
             <span>{selectedService?.name}</span>
             <span className="font-bold text-brand-900">R$ {selectedService?.price.toFixed(2)}</span>
          </div>
        </div>

        {/* Professional Selection */}
        <div>
          <h3 className="font-bold text-gray-800 mb-3 px-1">Escolha o Profissional</h3>
          <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
            {/* No Preference Option */}
            <button
              onClick={() => { setSelectedProId('any'); setSelectedTime(null); }}
              className={`p-3 rounded-xl border flex flex-col items-center text-center transition ${
                selectedProId === 'any'
                  ? 'bg-brand-500/20 border-brand-500'
                  : 'bg-white border-gray-200 hover:bg-gray-50'
              }`}
            >
              <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-2 ${selectedProId === 'any' ? 'bg-brand-500 text-brand-900' : 'bg-gray-100 text-gray-400'}`}>
                <Users size={20} />
              </div>
              <span className={`text-xs font-bold ${selectedProId === 'any' ? 'text-brand-900' : 'text-gray-600'}`}>Sem preferência</span>
            </button>

            {/* Professionals List */}
            {unit.professionals.map((pro) => (
              <button
                key={pro.id}
                onClick={() => { setSelectedProId(pro.id); setSelectedTime(null); }}
                className={`p-3 rounded-xl border flex flex-col items-center text-center transition ${
                  selectedProId === pro.id
                    ? 'bg-brand-500/20 border-brand-500'
                    : 'bg-white border-gray-200 hover:bg-gray-50'
                }`}
              >
                <img 
                  src={pro.photoUrl} 
                  alt={pro.name} 
                  className={`w-12 h-12 rounded-full object-cover mb-2 border-2 ${selectedProId === pro.id ? 'border-brand-500' : 'border-transparent'}`} 
                />
                <span className={`text-xs font-bold truncate w-full ${selectedProId === pro.id ? 'text-brand-900' : 'text-gray-600'}`}>{pro.name.split(' ')[0]}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Date Selection */}
        <div>
          <h3 className="font-bold text-gray-800 mb-3 px-1">Escolha o Dia</h3>
          <div className="flex space-x-3 overflow-x-auto pb-2 no-scrollbar px-1">
            {days.map((date, idx) => {
              const isSelected = date.toDateString() === selectedDate.toDateString();
              const isAvailable = isDayAvailable(date);
              const weekDays = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
              
              return (
                <button
                  key={idx}
                  disabled={!isAvailable}
                  onClick={() => { setSelectedDate(date); setSelectedTime(null); }}
                  className={`flex flex-col items-center justify-center min-w-[70px] p-3 rounded-xl border transition ${
                    isSelected 
                      ? 'bg-brand-500 border-brand-500 text-brand-900 shadow-md transform scale-105' 
                      : isAvailable 
                        ? 'bg-white border-gray-200 text-gray-500 hover:border-brand-300'
                        : 'bg-gray-50 border-gray-100 text-gray-300 cursor-not-allowed opacity-60'
                  }`}
                >
                  <span className="text-xs font-bold uppercase">{weekDays[date.getDay()]}</span>
                  <span className="text-lg font-bold">{date.getDate()}</span>
                  {!isAvailable && <span className="text-[10px] text-red-300 font-medium">Fechado</span>}
                </button>
              );
            })}
          </div>
        </div>

        {/* Time Selection */}
        <div>
          <h3 className="font-bold text-gray-800 mb-3 px-1">Horários Disponíveis</h3>
          {availableSlots.length > 0 ? (
            <div className="grid grid-cols-4 gap-3">
              {availableSlots.map((time, idx) => (
                <button
                  key={idx}
                  onClick={() => setSelectedTime(time)}
                  className={`py-2 px-1 rounded-lg text-sm font-bold border transition ${
                    selectedTime === time
                      ? 'bg-brand-900 text-white border-brand-900'
                      : 'bg-white text-gray-600 border-gray-200 hover:border-brand-500'
                  }`}
                >
                  {time}
                </button>
              ))}
            </div>
          ) : (
             <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-xl flex items-center text-yellow-800">
                <AlertCircle size={24} className="mr-3 flex-shrink-0" />
                <p className="text-sm">
                  {isDayAvailable(selectedDate) 
                    ? "Nenhum horário disponível para esta data. Tente mudar o dia." 
                    : "O profissional selecionado não trabalha neste dia."}
                </p>
             </div>
          )}
        </div>

        {/* Floating Button */}
        <div className="fixed bottom-0 left-0 w-full p-4 bg-white/80 backdrop-blur-md border-t border-gray-200 z-30">
          <div className="max-w-3xl mx-auto">
             <button 
                onClick={() => setBookingStep('CONFIRM')}
                disabled={!selectedTime}
                className="w-full bg-brand-500 text-brand-900 py-4 rounded-xl font-bold shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center hover:bg-brand-400 transition"
             >
                Continuar <ChevronRight size={20} className="ml-1" />
             </button>
          </div>
        </div>
      </div>
    );
  };

  const renderConfirmation = () => {
    const selectedPro = selectedProId === 'any' 
      ? { name: 'Sem preferência', photoUrl: null } 
      : unit.professionals.find(p => p.id === selectedProId);

    return (
      <div className="pb-24 space-y-6 animate-fadeIn">
        <h3 className="text-xl font-bold text-gray-800">Confirme seu agendamento</h3>

        {/* Summary Card */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-4 border-b border-gray-100 flex gap-4">
             <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
               <Calendar size={24} className="text-gray-400" />
             </div>
             <div>
               <h4 className="font-bold text-gray-900 text-lg">{selectedService?.name}</h4>
               <p className="text-gray-500 text-sm">{unit.name}</p>
             </div>
          </div>
          <div className="p-4 space-y-3 bg-gray-50/50">
             <div className="flex justify-between items-center text-sm">
               <span className="text-gray-500">Data</span>
               <span className="font-bold text-gray-900">{selectedDate.toLocaleDateString()} às {selectedTime}</span>
             </div>
             <div className="flex justify-between items-center text-sm">
               <span className="text-gray-500">Profissional</span>
               <div className="flex items-center">
                 {selectedPro?.photoUrl && (
                   <img src={selectedPro.photoUrl} className="w-5 h-5 rounded-full mr-2" alt="" />
                 )}
                 <span className="font-bold text-gray-900">{selectedPro?.name}</span>
               </div>
             </div>
             <div className="flex justify-between items-center text-sm pt-2 border-t border-gray-200">
               <span className="text-gray-500">Total</span>
               <span className="font-bold text-brand-900 text-lg">R$ {selectedService?.price.toFixed(2)}</span>
             </div>
          </div>
        </div>

        {/* Preferences */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-blue-100 p-2 rounded-full text-blue-600">
                <VolumeX size={20} />
              </div>
              <div>
                <p className="font-bold text-gray-900 text-sm">Atendimento Silencioso</p>
                <p className="text-xs text-gray-500">Não quero conversar durante o serviço</p>
              </div>
            </div>
            <button 
              onClick={() => setSilentMode(!silentMode)}
              className={`w-12 h-6 rounded-full transition-colors relative ${silentMode ? 'bg-brand-500' : 'bg-gray-300'}`}
            >
              <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${silentMode ? 'left-7' : 'left-1'}`} />
            </button>
          </div>

          <div>
             <label className="block text-sm font-bold text-gray-700 mb-2">Observações (Opcional)</label>
             <textarea 
               value={notes}
               onChange={(e) => setNotes(e.target.value)}
               placeholder="Ex: Tenho alergia a loção pós-barba X..."
               className="w-full p-3 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-brand-500 resize-none h-24"
             />
          </div>
        </div>

        {/* Action Buttons */}
        <div className="fixed bottom-0 left-0 w-full p-4 bg-white border-t border-gray-200 z-30">
          <div className="max-w-3xl mx-auto flex gap-3">
             <button 
                onClick={() => {
                   const item = createCartItem();
                   if (item) onAddToCart(item);
                }}
                className="flex-1 border border-brand-900 text-brand-900 py-3 rounded-xl font-bold hover:bg-gray-50 flex items-center justify-center gap-2"
             >
                <ShoppingCart size={18} />
                Carrinho
             </button>
             <button 
                onClick={() => {
                   const item = createCartItem();
                   if (item) onBookingConfirm(item);
                }}
                className="flex-1 bg-brand-900 text-white py-3 rounded-xl font-bold hover:bg-gray-800 shadow-lg"
             >
                Confirmar Agendamento
             </button>
          </div>
        </div>
      </div>
    );
  };

  // Helper function to render default tab content
  const renderTabContent = () => {
    switch (activeTab) {
      case UnitTab.SERVICES:
        return (
          <div className="space-y-4 pb-20">
            <h3 className="text-xl font-bold text-gray-800 mb-4">Serviços Disponíveis</h3>
            {unit.services.map((service) => (
              <div key={service.id} className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex justify-between items-center">
                <div>
                  <h4 className="font-bold text-lg text-gray-900">{service.name}</h4>
                  <p className="text-sm text-gray-500">{service.description}</p>
                  <div className="flex items-center mt-1 text-xs text-gray-400">
                    <Clock size={12} className="mr-1" /> {service.durationMin} min
                  </div>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <span className="font-bold text-brand-900">R$ {service.price.toFixed(2)}</span>
                  <button 
                    onClick={() => startBooking(service)}
                    className="bg-brand-500 text-brand-900 text-sm font-bold px-4 py-2 rounded-lg hover:bg-brand-400 transition"
                  >
                    Agendar
                  </button>
                </div>
              </div>
            ))}
          </div>
        );

      case UnitTab.DETAILS:
        return (
          <div className="space-y-6 pb-20 bg-white p-6 rounded-xl shadow-sm">
            <div>
              <h3 className="text-xl font-bold text-gray-800 mb-2">Sobre a Unidade</h3>
              <p className="text-gray-600 leading-relaxed">{unit.description}</p>
            </div>
            
            <div className="border-t pt-4">
              <h4 className="font-bold text-gray-800 mb-2">Contato & Endereço</h4>
              <p className="flex items-center text-gray-600 mb-2"><MapPin size={16} className="mr-2 text-brand-500" /> {unit.address}</p>
              <p className="flex items-center text-gray-600"><Clock size={16} className="mr-2 text-brand-500" /> {unit.openingHours}</p>
              <p className="flex items-center text-gray-600 mt-2 text-sm">Tel: {unit.phone}</p>
            </div>

            <div className="border-t pt-4">
               <h4 className="font-bold text-gray-800 mb-2">Localização</h4>
               <div className="w-full h-40 bg-gray-200 rounded-lg flex items-center justify-center text-gray-500">
                 {/* Placeholder for real map integration */}
                 <div className="text-center">
                   <MapPin size={32} className="mx-auto mb-2 text-gray-400" />
                   <span>Mapa Interativo indisponível na demo</span>
                 </div>
               </div>
               <button 
                  onClick={() => window.open(`https://maps.google.com/?q=${unit.coordinates.lat},${unit.coordinates.lng}`, '_blank')}
                  className="mt-3 w-full border border-brand-500 text-brand-900 py-2 rounded-lg font-medium hover:bg-brand-500/10"
                >
                  Abrir no Google Maps
                </button>
            </div>
          </div>
        );

      case UnitTab.PROFESSIONALS:
        return (
          <div className="grid grid-cols-2 gap-4 pb-20">
            {unit.professionals.map((pro) => (
              <div key={pro.id} className="bg-white p-4 rounded-xl shadow-sm flex flex-col items-center text-center">
                <img src={pro.photoUrl} alt={pro.name} className="w-20 h-20 rounded-full object-cover mb-3 border-2 border-brand-500" />
                <h4 className="font-bold text-gray-900">{pro.name}</h4>
                <p className="text-sm text-brand-900/70 font-medium">{pro.role}</p>
              </div>
            ))}
          </div>
        );

      case UnitTab.SUBSCRIPTIONS:
        return (
          <div className="space-y-4 pb-20">
            <div className="bg-brand-900 text-brand-500 p-6 rounded-xl mb-6">
               <h3 className="font-bold text-2xl mb-2">Seja VIP</h3>
               <p className="text-white/80 text-sm">Economize dinheiro e mantenha o estilo sempre em dia com nossos planos mensais.</p>
            </div>
            {unit.subscriptions.map((sub) => (
              <div key={sub.id} className="bg-white border-2 border-transparent hover:border-brand-500 transition p-6 rounded-xl shadow-sm relative overflow-hidden">
                <div className="flex justify-between items-start mb-4">
                  <h4 className="font-bold text-xl text-gray-900">{sub.name}</h4>
                  <span className="bg-gray-100 text-gray-800 px-3 py-1 rounded-full text-sm font-bold">R$ {sub.price.toFixed(2)}/mês</span>
                </div>
                <ul className="space-y-2 mb-6">
                  {sub.benefits.map((benefit, i) => (
                    <li key={i} className="flex items-center text-gray-600 text-sm">
                      <Check size={16} className="text-green-500 mr-2" />
                      {benefit}
                    </li>
                  ))}
                </ul>
                <button 
                  onClick={() => showToast(`Assinatura ${sub.name} selecionada!`)}
                  className="w-full bg-brand-900 text-white py-3 rounded-lg font-bold hover:bg-gray-800"
                >
                  Assinar Agora
                </button>
              </div>
            ))}
          </div>
        );

      case UnitTab.REVIEWS:
        return (
          <div className="pb-20">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-2xl font-bold text-gray-900">{unit.rating} <span className="text-sm text-gray-500 font-normal">/ 5.0</span></h3>
                <div className="flex text-yellow-400">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} size={16} fill={i < Math.floor(unit.rating) ? "currentColor" : "none"} />
                  ))}
                </div>
              </div>
              <button 
                className="text-brand-900 font-bold text-sm border-b-2 border-brand-500"
                onClick={() => showToast("Funcionalidade de avaliar em breve!")}
              >
                Avaliar Unidade
              </button>
            </div>

            <div className="space-y-4">
              {unit.reviews.map((review) => (
                <div key={review.id} className="bg-white p-4 rounded-xl shadow-sm">
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-bold text-gray-900">{review.author}</span>
                    <span className="text-xs text-gray-400">{new Date(review.date).toLocaleDateString()}</span>
                  </div>
                  <div className="flex text-yellow-400 mb-2">
                     {[...Array(5)].map((_, i) => (
                        <Star key={i} size={12} fill={i < review.rating ? "currentColor" : "none"} />
                      ))}
                  </div>
                  <p className="text-gray-600 text-sm">{review.comment}</p>
                </div>
              ))}
            </div>
          </div>
        );
      
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 relative">
      {/* Toast */}
      {toastMessage && (
        <div className="fixed top-4 left-1/2 transform -translate-x-1/2 bg-gray-900 text-white px-6 py-3 rounded-full shadow-xl z-[60] text-sm font-medium animate-bounce">
          {toastMessage}
        </div>
      )}

      {/* Dynamic Header */}
      <div className={`relative transition-all duration-300 ${bookingStep === 'LIST' ? 'h-64' : 'h-32'}`}>
        <img src={unit.imageUrl} alt={unit.name} className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
        
        {/* Header Actions */}
        <div className="absolute top-4 left-4">
          <button onClick={handleBack} className="bg-white/20 backdrop-blur-md p-2 rounded-full text-white hover:bg-white/30 transition">
            <ArrowLeft size={24} />
          </button>
        </div>
        
        {bookingStep === 'LIST' && (
          <div className="absolute top-4 right-4 flex gap-3">
            <button 
              onClick={() => window.open(`https://maps.google.com/?q=${unit.coordinates.lat},${unit.coordinates.lng}`, '_blank')}
              className="bg-white/20 backdrop-blur-md p-2 rounded-full text-white hover:bg-white/30 transition"
            >
              <MapPin size={24} />
            </button>
            <button 
              onClick={() => setIsFavorite(!isFavorite)}
              className={`bg-white/20 backdrop-blur-md p-2 rounded-full transition ${isFavorite ? 'text-red-500' : 'text-white'}`}
            >
              <Heart size={24} fill={isFavorite ? "currentColor" : "none"} />
            </button>
          </div>
        )}

        {/* Unit Title */}
        <div className="absolute bottom-6 left-6 right-6">
          <h1 className="text-white font-bold leading-tight shadow-sm transition-all text-xl">
            {bookingStep === 'LIST' ? unit.name : 'Agendamento'}
          </h1>
          {bookingStep === 'LIST' && <p className="text-white/80 text-sm mt-1">{unit.address}</p>}
        </div>
      </div>

      {/* Navigation Tabs - Sticky (Only in List Mode) */}
      {bookingStep === 'LIST' && (
        <div className="sticky top-0 bg-white shadow-sm z-40 overflow-x-auto no-scrollbar">
          <div className="flex px-4 min-w-max">
            {Object.values(UnitTab).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-4 text-sm font-bold border-b-2 transition whitespace-nowrap ${
                  activeTab === tab 
                    ? 'border-brand-500 text-brand-900' 
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Steps Indicator */}
      {bookingStep !== 'LIST' && (
         <div className="bg-white border-b px-4 py-3 flex items-center justify-center space-x-2 sticky top-0 z-40">
            <div className={`w-3 h-3 rounded-full ${bookingStep === 'DATETIME' ? 'bg-brand-500' : 'bg-gray-300'}`} />
            <div className="w-8 h-0.5 bg-gray-200" />
            <div className={`w-3 h-3 rounded-full ${bookingStep === 'CONFIRM' ? 'bg-brand-500' : 'bg-gray-300'}`} />
         </div>
      )}

      {/* Content Area */}
      <div className="p-4 max-w-3xl mx-auto">
        {bookingStep === 'LIST' && renderTabContent()}
        {bookingStep === 'DATETIME' && renderDateTimeSelection()}
        {bookingStep === 'CONFIRM' && renderConfirmation()}
      </div>

      {/* AI Chat Bot (Only in List Mode) */}
      {bookingStep === 'LIST' && (
        <AIChat context={`Unidade: ${unit.name}. Serviços: ${unit.services.map(s => s.name).join(', ')}. Estilo: ${unit.description}`} />
      )}
    </div>
  );
};