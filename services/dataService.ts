import { supabase } from '../lib/supabase';
import { BarberUnit, Professional, UnitSettings } from '../types';
import { MOCK_UNITS } from '../constants';

export const fetchUnits = async (): Promise<BarberUnit[]> => {
  try {
    const { data, error } = await supabase
      .from('units')
      .select(`
        *,
        services (*),
        professionals (*),
        subscriptions (*),
        reviews (*)
      `);

    if (error) {
      if (error.code === '42P01' || error.message?.includes('Could not find the table')) {
        console.warn('⚠️ Tabelas não encontradas no Supabase.');
        return [];
      }
      console.error('Supabase Data Fetch Error:', error.message, error.details);
      return [];
    }

    if (!data || data.length === 0) return [];

    return data.map((unit: any) => ({
      id: unit.id,
      name: unit.name,
      address: unit.address,
      rating: unit.rating,
      imageUrl: unit.image_url,
      coordinates: { lat: unit.lat || 0, lng: unit.lng || 0 },
      description: unit.description,
      phone: unit.phone,
      openingHours: unit.opening_hours,
      services: (unit.services || []).map((s: any) => ({
        id: s.id,
        name: s.name,
        price: s.price,
        durationMin: s.duration_min,
        description: s.description
      })),
      professionals: (unit.professionals || []).map((p: any) => ({
        id: p.id,
        unitId: unit.id, // Mapeia o ID da unidade
        unitName: unit.name, // Mapeia nome da unidade para facilitar filtro
        name: p.name,
        role: p.role,
        photoUrl: p.photo_url,
        // Handle both JSONB (object) and Text (string) responses
        schedule: typeof p.schedule === 'string' ? JSON.parse(p.schedule) : (p.schedule || [])
      })),
      subscriptions: (unit.subscriptions || []).map((s: any) => ({
        id: s.id,
        name: s.name,
        price: s.price,
        benefits: Array.isArray(s.benefits) ? s.benefits : (typeof s.benefits === 'string' ? JSON.parse(s.benefits || '[]') : [])
      })),
      reviews: (unit.reviews || []).map((r: any) => ({
        id: r.id,
        author: r.author,
        rating: r.rating,
        comment: r.comment,
        date: r.date
      }))
    }));
  } catch (error) {
    console.error('Unexpected error in fetchUnits:', error);
    return [];
  }
};

// --- Admin Methods ---

export const fetchUnitSettings = async (unitId: string): Promise<UnitSettings | null> => {
  try {
    // maybeSingle returns null instead of error if no rows found
    const { data, error } = await supabase
      .from('unit_settings')
      .select('*')
      .eq('unit_id', unitId)
      .maybeSingle();

    if (error) {
      // Check for missing table (Postgres 42P01 or PostgREST schema cache error)
      if (error.code === '42P01' || error.message?.includes('Could not find the table')) {
        console.warn("⚠️ Tabela 'unit_settings' não encontrada no banco. Usando configurações padrão.");
        return null;
      }
      console.error('Error fetching settings:', error.message);
      return null;
    }

    if (!data) return null;

    return {
      unitId: data.unit_id,
      webhookUrl: data.webhook_url || '',
      googleCalendarApiKey: data.google_calendar_api_key || '',
      calendarId: data.calendar_id || '',
      notificationEmail: data.notification_email || '',
      autoConfirm: data.auto_confirm || false
    };
  } catch (err) {
    console.error('Unexpected error fetching settings:', err);
    return null;
  }
};

export const saveUnitSettings = async (settings: UnitSettings): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('unit_settings')
      .upsert({
        unit_id: settings.unitId,
        webhook_url: settings.webhookUrl,
        google_calendar_api_key: settings.googleCalendarApiKey,
        calendar_id: settings.calendarId,
        notification_email: settings.notificationEmail,
        auto_confirm: settings.autoConfirm
      });

    if (error) {
      if (error.code === '42P01' || error.message?.includes('Could not find the table')) {
        console.error("Erro crítico: Tabela 'unit_settings' não existe.");
        alert("Erro de banco de dados: Tabela 'unit_settings' não existe. Execute o SQL fornecido no chat.");
        return false;
      }
      console.error('Error saving settings:', error.message, error.details);
      return false;
    }
    return true;
  } catch (err) {
    console.error('Unexpected error saving settings:', err);
    return false;
  }
};

export const createProfessional = async (unitId: string, pro: Omit<Professional, 'id'>): Promise<Professional | null> => {
  const { data, error } = await supabase
    .from('professionals')
    .insert({
      unit_id: unitId,
      name: pro.name,
      role: pro.role,
      photo_url: pro.photoUrl,
      schedule: pro.schedule || [] // Pass object directly for JSONB
    })
    .select()
    .single();

  if (error || !data) {
    console.error('Error creating professional:', error?.message, error?.details);
    return null;
  }

  return {
    id: data.id,
    unitId: unitId,
    name: data.name,
    role: data.role,
    photoUrl: data.photo_url,
    schedule: typeof data.schedule === 'string' ? JSON.parse(data.schedule) : data.schedule
  };
};

export const updateProfessional = async (pro: Professional): Promise<boolean> => {
  const updatePayload: any = {
    name: pro.name,
    role: pro.role,
    photo_url: pro.photoUrl,
    schedule: pro.schedule || []
  };

  // Se houver unitId, permitimos mudar o profissional de unidade
  if (pro.unitId) {
    updatePayload.unit_id = pro.unitId;
  }

  const { error } = await supabase
    .from('professionals')
    .update(updatePayload)
    .eq('id', pro.id);

  if (error) {
    console.error('Error updating professional:', error.message, error.details);
    return false;
  }
  return true;
};
