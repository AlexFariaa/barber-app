import React, { useState, useEffect, useMemo } from 'react';
import { 
  Users, Calendar, DollarSign, Scissors, Save, Plus, Trash2, 
  Settings as SettingsIcon, LayoutDashboard, Clock, Link as LinkIcon, CheckCircle, Search, Filter 
} from 'lucide-react';
import { Professional, WorkDay, UnitSettings, BarberUnit } from '../types';
import { fetchUnits, createProfessional, updateProfessional, fetchUnitSettings, saveUnitSettings } from '../services/dataService';

interface AdminViewProps {
  onBack: () => void;
  onUpdate: () => Promise<void>; // Função para forçar atualização no componente pai
}

type AdminTab = 'DASHBOARD' | 'PROFESSIONALS' | 'SETTINGS';

const DAYS_OF_WEEK = [
  'Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'
];

export const AdminView: React.FC<AdminViewProps> = ({ onBack, onUpdate }) => {
  const [activeTab, setActiveTab] = useState<AdminTab>('DASHBOARD');
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  // Data States
  const [units, setUnits] = useState<BarberUnit[]>([]);
  const [allProfessionals, setAllProfessionals] = useState<Professional[]>([]);
  
  // Settings State
  const [settings, setSettings] = useState<UnitSettings>({
    unitId: '',
    webhookUrl: '',
    googleCalendarApiKey: '',
    calendarId: '',
    notificationEmail: '',
    autoConfirm: false
  });

  // Filter States
  const [filterText, setFilterText] = useState('');
  const [filterUnitId, setFilterUnitId] = useState('all');

  // Editor States
  const [editingPro, setEditingPro] = useState<Professional | null>(null);
  const [isNewPro, setIsNewPro] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    // Fetch All Units
    const unitsData = await fetchUnits();
    setUnits(unitsData);

    // Flatten Professionals list for easier management table
    const flatPros: Professional[] = [];
    unitsData.forEach(unit => {
      flatPros.push(...unit.professionals);
      // Se não tiver configurações carregadas, carrega da primeira unidade
      if (!settings.unitId && unitsData.length > 0) {
         fetchUnitSettings(unitsData[0].id).then(s => {
            if(s) setSettings(s);
            else setSettings(prev => ({ ...prev, unitId: unitsData[0].id }));
         });
      }
    });
    setAllProfessionals(flatPros);
    setLoading(false);
  };

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  // --- Handlers ---

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const success = await saveUnitSettings(settings);
    if (success) showToast('Configurações salvas com sucesso!');
    else showToast('Erro ao salvar configurações.');
    setLoading(false);
  };

  const handleSavePro = async () => {
    if (!editingPro) return;
    
    if (!editingPro.unitId) {
      showToast("Erro: Selecione uma unidade para o profissional.");
      return;
    }

    setLoading(true);

    // Garantir que schedule seja um array válido antes de salvar
    const cleanPro = {
      ...editingPro,
      schedule: Array.isArray(editingPro.schedule) ? editingPro.schedule.filter(d => d !== null && d !== undefined) : []
    };

    let success = false;

    if (isNewPro) {
      const created = await createProfessional(editingPro.unitId, cleanPro);
      if (created) {
        // Update local list
        setAllProfessionals([...allProfessionals, created]);
        setEditingPro(null);
        showToast('Profissional cadastrado!');
        success = true;
      }
    } else {
      const updated = await updateProfessional(cleanPro);
      if (updated) {
        // Update local list
        setAllProfessionals(allProfessionals.map(p => p.id === cleanPro.id ? cleanPro : p));
        setEditingPro(null);
        showToast('Profissional atualizado!');
        success = true;
      }
    }

    if (success) {
      // Sincroniza com o App pai para que o cliente veja as mudanças
      await onUpdate();
    }

    setLoading(false);
  };

  const initNewPro = () => {
    // Default to filter unit or first unit
    const defaultUnitId = filterUnitId !== 'all' ? filterUnitId : (units[0]?.id || '');

    setEditingPro({
      id: '',
      unitId: defaultUnitId,
      name: '',
      role: 'Barbeiro',
      photoUrl: 'https://picsum.photos/200',
      schedule: DAYS_OF_WEEK.map((_, i) => ({
        dayOfWeek: i,
        isOpen: i !== 0, // Closed on Sundays by default
        start: '09:00',
        end: '18:00',
        lunchStart: '12:00',
        lunchEnd: '13:00'
      }))
    });
    setIsNewPro(true);
  };

  const updateSchedule = (dayIndex: number, field: keyof WorkDay, value: any) => {
    if (!editingPro) return;
    
    const currentSchedule = Array.isArray(editingPro.schedule) ? [...editingPro.schedule] : [];
    const existingDayIndex = currentSchedule.findIndex(d => d && d.dayOfWeek === dayIndex);

    if (existingDayIndex >= 0) {
      currentSchedule[existingDayIndex] = {
        ...currentSchedule[existingDayIndex],
        [field]: value
      };
    } else {
      const newDay: WorkDay = {
        dayOfWeek: dayIndex,
        isOpen: field === 'isOpen' ? value : false,
        start: '09:00',
        end: '18:00',
        lunchStart: '12:00',
        lunchEnd: '13:00'
      };
      if (field !== 'isOpen') {
        (newDay as any)[field] = value;
      }
      currentSchedule.push(newDay);
    }

    setEditingPro({ ...editingPro, schedule: currentSchedule });
  };

  const filteredProfessionals = useMemo(() => {
    return allProfessionals.filter(p => {
      const matchesText = 
        p.name.toLowerCase().includes(filterText.toLowerCase()) || 
        p.role.toLowerCase().includes(filterText.toLowerCase());
      
      const matchesUnit = filterUnitId === 'all' || p.unitId === filterUnitId;
      
      return matchesText && matchesUnit;
    });
  }, [allProfessionals, filterText, filterUnitId]);

  // --- Render Sections ---

  const renderDashboard = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 animate-fadeIn">
      {[
        { label: 'Agendamentos Hoje', value: '24', icon: Calendar, color: 'text-blue-500', bg: 'bg-blue-100' },
        { label: 'Faturamento', value: 'R$ 1.850', icon: DollarSign, color: 'text-green-500', bg: 'bg-green-100' },
        { label: 'Novos Clientes', value: '5', icon: Users, color: 'text-purple-500', bg: 'bg-purple-100' },
        { label: 'Profissionais', value: allProfessionals.length, icon: Scissors, color: 'text-brand-500', bg: 'bg-yellow-100' },
      ].map((stat, idx) => (
        <div key={idx} className="bg-white p-6 rounded-xl shadow-sm flex items-center space-x-4">
          <div className={`p-3 rounded-full ${stat.bg} ${stat.color}`}>
            <stat.icon size={24} />
          </div>
          <div>
            <p className="text-gray-500 text-sm font-medium">{stat.label}</p>
            <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
          </div>
        </div>
      ))}
      
      <div className="lg:col-span-4 bg-white p-6 rounded-xl shadow-sm">
        <h3 className="font-bold text-lg mb-4 text-gray-800">Visão Geral</h3>
        <p className="text-gray-500">Selecione "Profissionais" para gerenciar a equipe ou "Integrações" para configurar o sistema.</p>
      </div>
    </div>
  );

  const renderProfessionals = () => {
    if (editingPro) {
      return (
        <div className="bg-white rounded-xl shadow-sm p-6 animate-fadeIn">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-gray-800">
              {isNewPro ? 'Novo Profissional' : `Editando: ${editingPro.name}`}
            </h2>
            <button 
              onClick={() => setEditingPro(null)}
              className="text-gray-500 hover:text-gray-700"
            >
              Cancelar
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Basic Info */}
            <div className="space-y-4">
              <h3 className="font-bold text-gray-700 border-b pb-2">Dados Básicos</h3>
              
              {/* Unit Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">Unidade</label>
                <select 
                  value={editingPro.unitId}
                  onChange={e => setEditingPro({...editingPro, unitId: e.target.value})}
                  className="w-full p-2 border rounded-lg focus:border-brand-500 outline-none bg-white"
                >
                  <option value="" disabled>Selecione uma unidade</option>
                  {units.map(u => (
                    <option key={u.id} value={u.id}>{u.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">Nome Completo</label>
                <input 
                  type="text" 
                  value={editingPro.name} 
                  onChange={e => setEditingPro({...editingPro, name: e.target.value})}
                  className="w-full p-2 border rounded-lg focus:border-brand-500 outline-none" 
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">Cargo</label>
                <select 
                  value={editingPro.role}
                  onChange={e => setEditingPro({...editingPro, role: e.target.value})}
                  className="w-full p-2 border rounded-lg focus:border-brand-500 outline-none"
                >
                  <option>Barbeiro</option>
                  <option>Master Barber</option>
                  <option>Colorista</option>
                  <option>Recepcionista</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">URL da Foto</label>
                <input 
                  type="text" 
                  value={editingPro.photoUrl} 
                  onChange={e => setEditingPro({...editingPro, photoUrl: e.target.value})}
                  className="w-full p-2 border rounded-lg focus:border-brand-500 outline-none text-sm" 
                />
                <img src={editingPro.photoUrl} alt="Preview" className="w-16 h-16 rounded-full mt-2 object-cover border" />
              </div>
            </div>

            {/* Schedule Matrix */}
            <div className="lg:col-span-2 space-y-4">
              <h3 className="font-bold text-gray-700 border-b pb-2 flex items-center gap-2">
                <Clock size={18} /> Agenda de Trabalho
              </h3>
              <div className="bg-gray-50 p-4 rounded-lg space-y-3">
                {DAYS_OF_WEEK.map((dayName, idx) => {
                  const daySchedule = editingPro.schedule?.find(d => d && d.dayOfWeek === idx) || {
                    dayOfWeek: idx, isOpen: false, start: '09:00', end: '18:00', lunchStart: '12:00', lunchEnd: '13:00'
                  };

                  return (
                    <div key={idx} className="flex items-center gap-4 text-sm">
                      <div className="w-24 font-medium flex items-center gap-2">
                        <input 
                          type="checkbox" 
                          checked={daySchedule.isOpen}
                          onChange={(e) => updateSchedule(idx, 'isOpen', e.target.checked)}
                          className="w-4 h-4 text-brand-500 rounded focus:ring-brand-500 cursor-pointer"
                        />
                        <span className={!daySchedule.isOpen ? 'text-gray-400' : 'text-gray-900'}>{dayName}</span>
                      </div>
                      
                      {daySchedule.isOpen ? (
                        <div className="flex items-center gap-2 flex-1 flex-wrap">
                          <input 
                            type="time" 
                            value={daySchedule.start}
                            onChange={(e) => updateSchedule(idx, 'start', e.target.value)}
                            className="p-1 border rounded"
                          />
                          <span className="text-gray-400">até</span>
                          <input 
                            type="time" 
                            value={daySchedule.end}
                            onChange={(e) => updateSchedule(idx, 'end', e.target.value)}
                            className="p-1 border rounded"
                          />
                          <span className="mx-2 text-gray-300 hidden sm:inline">|</span>
                          <span className="text-xs text-gray-500">Almoço:</span>
                          <input 
                            type="time" 
                            value={daySchedule.lunchStart || '12:00'}
                            onChange={(e) => updateSchedule(idx, 'lunchStart', e.target.value)}
                            className="p-1 border rounded w-20 text-xs"
                          />
                          <span className="text-xs text-gray-400">-</span>
                          <input 
                            type="time" 
                            value={daySchedule.lunchEnd || '13:00'}
                            onChange={(e) => updateSchedule(idx, 'lunchEnd', e.target.value)}
                            className="p-1 border rounded w-20 text-xs"
                          />
                        </div>
                      ) : (
                        <span className="text-gray-400 italic text-xs">Fechado</span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="mt-6 flex justify-end gap-3 pt-4 border-t">
            <button 
              onClick={() => setEditingPro(null)}
              className="px-4 py-2 text-gray-600 font-medium hover:bg-gray-100 rounded-lg transition"
            >
              Cancelar
            </button>
            <button 
              onClick={handleSavePro}
              className="px-6 py-2 bg-brand-900 text-white font-bold rounded-lg hover:bg-brand-800 transition flex items-center gap-2"
            >
              <Save size={18} /> Salvar Profissional
            </button>
          </div>
        </div>
      );
    }

    return (
      <div className="space-y-6 animate-fadeIn">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          <h2 className="text-xl font-bold text-gray-800">Equipe & Agenda</h2>
          <button 
            onClick={initNewPro}
            className="bg-brand-500 text-brand-900 px-4 py-2 rounded-lg font-bold flex items-center gap-2 hover:bg-brand-400 transition"
          >
            <Plus size={20} /> Novo Profissional
          </button>
        </div>

        {/* Filters */}
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col md:flex-row gap-4 items-center">
            <div className="flex-1 w-full relative">
                <Search className="absolute left-3 top-3 text-gray-400" size={18} />
                <input 
                    type="text" 
                    placeholder="Buscar por nome ou cargo..."
                    value={filterText}
                    onChange={(e) => setFilterText(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border rounded-lg focus:border-brand-500 outline-none"
                />
            </div>
            <div className="w-full md:w-64 relative">
                <Filter className="absolute left-3 top-3 text-gray-400" size={18} />
                <select 
                    value={filterUnitId}
                    onChange={(e) => setFilterUnitId(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border rounded-lg focus:border-brand-500 outline-none bg-white appearance-none"
                >
                    <option value="all">Todas as Unidades</option>
                    {units.map(u => (
                        <option key={u.id} value={u.id}>{u.name}</option>
                    ))}
                </select>
            </div>
        </div>

        {/* List */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredProfessionals.length > 0 ? (
            filteredProfessionals.map(pro => (
            <div key={pro.id} className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex items-start gap-4">
              <img src={pro.photoUrl} alt={pro.name} className="w-16 h-16 rounded-full object-cover border-2 border-brand-500" />
              <div className="flex-1">
                <h3 className="font-bold text-gray-900">{pro.name}</h3>
                <p className="text-sm text-brand-900/70 font-medium">{pro.role}</p>
                <p className="text-xs text-gray-400 mb-2 truncate">{pro.unitName || units.find(u => u.id === pro.unitId)?.name}</p>
                
                <div className="text-xs text-gray-500 space-y-1">
                  {pro.schedule?.filter(d => d.isOpen).length 
                    ? <p className="flex items-center gap-1"><CheckCircle size={10} className="text-green-500"/> Ativo {pro.schedule.filter(d => d.isOpen).length} dias/semana</p>
                    : <p className="text-red-400">Sem agenda definida</p>
                  }
                </div>
                <div className="mt-3 flex gap-2">
                  <button 
                    onClick={() => { setEditingPro(pro); setIsNewPro(false); }}
                    className="text-sm border border-gray-300 px-3 py-1 rounded hover:bg-gray-50 font-medium"
                  >
                    Editar
                  </button>
                </div>
              </div>
            </div>
          ))) : (
            <div className="col-span-full py-10 text-center text-gray-500 bg-gray-50 rounded-xl border border-dashed border-gray-300">
                Nenhum profissional encontrado com os filtros atuais.
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderSettings = () => (
    <div className="max-w-2xl mx-auto bg-white rounded-xl shadow-sm overflow-hidden animate-fadeIn">
      <div className="bg-gray-50 border-b p-4">
        <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
          <LinkIcon size={20} /> Conexões & Integrações
        </h2>
        <p className="text-sm text-gray-500">Selecione a unidade para configurar as chaves de API.</p>
      </div>

      <div className="p-4 border-b bg-white">
          <label className="block text-sm font-medium text-gray-600 mb-1">Configurar Unidade:</label>
          <select 
            value={settings.unitId}
            onChange={async (e) => {
                const newId = e.target.value;
                setSettings(prev => ({...prev, unitId: newId}));
                setLoading(true);
                const fetched = await fetchUnitSettings(newId);
                if (fetched) setSettings(fetched);
                else setSettings({
                    unitId: newId,
                    webhookUrl: '',
                    googleCalendarApiKey: '',
                    calendarId: '',
                    notificationEmail: '',
                    autoConfirm: false
                });
                setLoading(false);
            }}
            className="w-full p-2 border rounded-lg focus:border-brand-500 outline-none"
          >
              {units.map(u => (
                  <option key={u.id} value={u.id}>{u.name}</option>
              ))}
          </select>
      </div>

      <form onSubmit={handleSaveSettings} className="p-6 space-y-6">
        
        {/* Google Calendar */}
        <div className="space-y-4">
          <h3 className="font-bold text-gray-700 flex items-center gap-2">
            <Calendar size={18} className="text-brand-900" /> Google Calendar
          </h3>
          <div className="grid grid-cols-1 gap-4">
             <div>
               <label className="block text-sm font-medium text-gray-600 mb-1">API Key</label>
               <input 
                 type="password"
                 placeholder="AIzaSy..."
                 value={settings.googleCalendarApiKey}
                 onChange={e => setSettings({...settings, googleCalendarApiKey: e.target.value})}
                 className="w-full p-2 border rounded-lg focus:border-brand-500 outline-none font-mono text-sm" 
               />
               <p className="text-xs text-gray-400 mt-1">Chave da API do Google Cloud Console com permissão de Calendar.</p>
             </div>
             <div>
               <label className="block text-sm font-medium text-gray-600 mb-1">Calendar ID</label>
               <input 
                 type="text"
                 placeholder="barbearia@gmail.com"
                 value={settings.calendarId}
                 onChange={e => setSettings({...settings, calendarId: e.target.value})}
                 className="w-full p-2 border rounded-lg focus:border-brand-500 outline-none" 
               />
               <p className="text-xs text-gray-400 mt-1">ID do calendário onde os eventos serão criados.</p>
             </div>
          </div>
        </div>

        <div className="border-t pt-6 space-y-4">
          <h3 className="font-bold text-gray-700 flex items-center gap-2">
            <LinkIcon size={18} className="text-brand-900" /> Webhooks & Notificações
          </h3>
          <div>
             <label className="block text-sm font-medium text-gray-600 mb-1">Webhook URL</label>
             <input 
               type="url"
               placeholder="https://meusistema.com/api/webhook"
               value={settings.webhookUrl}
               onChange={e => setSettings({...settings, webhookUrl: e.target.value})}
               className="w-full p-2 border rounded-lg focus:border-brand-500 outline-none" 
             />
             <p className="text-xs text-gray-400 mt-1">Enviaremos um POST para esta URL quando um novo agendamento for criado.</p>
          </div>
          <div>
             <label className="block text-sm font-medium text-gray-600 mb-1">Email para Notificação</label>
             <input 
               type="email"
               placeholder="gerente@barbearia.com"
               value={settings.notificationEmail}
               onChange={e => setSettings({...settings, notificationEmail: e.target.value})}
               className="w-full p-2 border rounded-lg focus:border-brand-500 outline-none" 
             />
          </div>
          <div className="flex items-center gap-3 bg-gray-50 p-3 rounded-lg">
             <input 
               type="checkbox" 
               id="autoConfirm"
               checked={settings.autoConfirm}
               onChange={e => setSettings({...settings, autoConfirm: e.target.checked})}
               className="w-5 h-5 text-brand-500 rounded"
             />
             <label htmlFor="autoConfirm" className="text-sm font-bold text-gray-700 cursor-pointer">
               Confirmar agendamentos automaticamente
             </label>
          </div>
        </div>

        <div className="pt-4">
          <button 
            type="submit"
            className="w-full bg-brand-900 text-white font-bold py-3 rounded-xl hover:bg-brand-800 transition shadow-lg flex justify-center items-center gap-2"
          >
            <Save size={20} /> Salvar Configurações
          </button>
        </div>

      </form>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col md:flex-row">
      
      {/* Sidebar Navigation */}
      <aside className="w-full md:w-64 bg-brand-900 text-white flex-shrink-0">
        <div className="p-6 border-b border-gray-800">
           <h1 className="text-2xl font-bold">Admin</h1>
           <p className="text-brand-500 text-sm">Gerenciamento</p>
        </div>
        <nav className="p-4 space-y-2">
           <button 
             onClick={() => setActiveTab('DASHBOARD')}
             className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition ${activeTab === 'DASHBOARD' ? 'bg-brand-500 text-brand-900 font-bold' : 'text-gray-400 hover:bg-gray-800'}`}
           >
             <LayoutDashboard size={20} /> Dashboard
           </button>
           <button 
             onClick={() => setActiveTab('PROFESSIONALS')}
             className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition ${activeTab === 'PROFESSIONALS' ? 'bg-brand-500 text-brand-900 font-bold' : 'text-gray-400 hover:bg-gray-800'}`}
           >
             <Users size={20} /> Profissionais
           </button>
           <button 
             onClick={() => setActiveTab('SETTINGS')}
             className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition ${activeTab === 'SETTINGS' ? 'bg-brand-500 text-brand-900 font-bold' : 'text-gray-400 hover:bg-gray-800'}`}
           >
             <SettingsIcon size={20} /> Integrações
           </button>
        </nav>
        <div className="p-4 mt-auto">
          <button onClick={onBack} className="w-full border border-gray-600 text-gray-400 py-2 rounded-lg hover:bg-gray-800 transition text-sm">
            Sair do Painel
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-6 md:p-8 overflow-y-auto">
        {toast && (
          <div className="fixed top-4 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-xl z-50 animate-bounce font-bold flex items-center gap-2">
            <CheckCircle size={20} /> {toast}
          </div>
        )}

        <header className="mb-8">
           <h1 className="text-3xl font-bold text-gray-800">
             {activeTab === 'DASHBOARD' && 'Visão Geral'}
             {activeTab === 'PROFESSIONALS' && 'Gestão de Profissionais'}
             {activeTab === 'SETTINGS' && 'Configurações'}
           </h1>
           <p className="text-gray-500">Administração Geral</p>
        </header>

        {loading && !allProfessionals.length ? (
          <div className="flex justify-center py-20">
             <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-900"></div>
          </div>
        ) : (
          <>
            {activeTab === 'DASHBOARD' && renderDashboard()}
            {activeTab === 'PROFESSIONALS' && renderProfessionals()}
            {activeTab === 'SETTINGS' && renderSettings()}
          </>
        )}
      </main>
    </div>
  );
};