import { supabase } from '../client';
import type { Client } from '../../../types';

export class ClientsRepository {
  async getAllClients(): Promise<Client[]> {
    // 1. Obtener clientes registrados
    const { data: clientsData, error: clientsError } = await supabase
      .from('clients')
      .select('*')
      .order('created_at', { ascending: false });

    if (clientsError) throw new Error(`Error al obtener clientes: ${clientsError.message}`);

    // 2. Obtener todas las citas
    const { data: appointmentsData, error: appointmentsError } = await supabase
      .from('appointments')
      .select('client_id, client_name, phone, status, created_at, service:services(price)');

    if (appointmentsError) throw new Error(`Error al obtener citas: ${appointmentsError.message}`);

    // Mapa de clientes registrados por ID para acceso rápido
    const registeredClientsMap = new Map<string, Client>();
    (clientsData as Client[]).forEach(c => registeredClientsMap.set(c.id, c));

    // Mapa de todos los clientes (registrados + descubiertos) usando el teléfono o ID como clave única
    const allClientsMap = new Map<string, Client>();

    // Inicializamos con los registrados
    (clientsData as Client[]).forEach(c => {
      allClientsMap.set(c.phone || c.id, { ...c, total_visits: 0, ltv: 0 });
    });

    // 3. Procesar las citas para calcular estadísticas y descubrir nuevos clientes
    appointmentsData?.forEach(appt => {
      // Clave de agrupación principal: el teléfono, o el client_id
      const uniqueKey = appt.phone || appt.client_id;
      if (!uniqueKey) return;

      // Si el cliente no existe en nuestro mapa, lo creamos "on-the-fly" desde la cita
      if (!allClientsMap.has(uniqueKey)) {
        allClientsMap.set(uniqueKey, {
          id: appt.client_id || `temp-${uniqueKey}`,
          name: appt.client_name,
          phone: appt.phone,
          created_at: appt.created_at || new Date().toISOString(),
          total_visits: 0,
          ltv: 0,
        });
      }

      // Sumar estadísticas si la cita fue completada
      if (appt.status === 'completed' || appt.status === 'confirmed') {
        const currentClient = allClientsMap.get(uniqueKey)!;
        const serviceObj = Array.isArray(appt.service) ? appt.service[0] : appt.service;
        const price = (serviceObj as any)?.price || 0;
        
        currentClient.total_visits = (currentClient.total_visits || 0) + 1;
        currentClient.ltv = (currentClient.ltv || 0) + price;
      }
    });

    // Convertir a array y ordenar por LTV o total de visitas descendente
    return Array.from(allClientsMap.values()).sort((a, b) => {
      // Priorizar LTV, luego visitas
      if ((b.ltv || 0) !== (a.ltv || 0)) {
         return (b.ltv || 0) - (a.ltv || 0);
      }
      return (b.total_visits || 0) - (a.total_visits || 0);
    });
  }

  async updateClientNotes(clientId: string, privateNotes: string): Promise<void> {
    const { error } = await supabase
      .from('clients')
      .update({ private_notes: privateNotes })
      .eq('id', clientId);

    if (error) throw new Error(`Error al actualizar notas: ${error.message}`);
  }
}

export const clientsRepository = new ClientsRepository();
