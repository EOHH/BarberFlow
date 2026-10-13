import { supabase } from '../client';
import type { Client } from '../../../types';

export interface SaveClientNotesInput {
  clientId: string | null;
  phone: string;
  privateNotes: string;
}

export interface SaveClientNotesResult {
  clientId: string;
  privateNotes: string;
}

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

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
      .select('client_id, client_name, phone, status, created_at, price_snapshot');

    if (appointmentsError) throw new Error(`Error al obtener citas: ${appointmentsError.message}`);

    // Mapa de todos los clientes (registrados + descubiertos) usando el teléfono o ID como clave única
    const allClientsMap = new Map<string, Client>();

    // Inicializamos con los registrados
    (clientsData as Omit<Client, 'persisted_id' | 'is_virtual'>[]).forEach(c => {
      allClientsMap.set(c.phone || c.id, {
        ...c,
        persisted_id: c.id,
        is_virtual: false,
        total_visits: 0,
        ltv: 0,
      });
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
          persisted_id: appt.client_id ?? null,
          is_virtual: appt.client_id == null,
          name: appt.client_name,
          phone: appt.phone,
          created_at: appt.created_at || new Date().toISOString(),
          total_visits: 0,
          ltv: 0,
        });
      }

      // Sumar estadísticas si la cita fue completada
      if (appt.status === 'completed') {
        const currentClient = allClientsMap.get(uniqueKey)!;
        currentClient.total_visits = (currentClient.total_visits || 0) + 1;
        currentClient.ltv = (currentClient.ltv || 0) + Number(appt.price_snapshot);
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

  async saveClientNotes(input: SaveClientNotesInput): Promise<SaveClientNotesResult> {
    const { data, error } = await supabase.rpc('save_client_private_notes', {
      p_client_id: input.clientId,
      p_phone: input.phone,
      p_private_notes: input.privateNotes,
    });

    if (error) throw new Error(`Error al actualizar notas: ${error.message}`);

    if (
      !data
      || typeof data !== 'object'
      || Array.isArray(data)
      || typeof data.client_id !== 'string'
      || !UUID_PATTERN.test(data.client_id)
      || typeof data.private_notes !== 'string'
    ) {
      throw new Error('La respuesta al guardar notas no es válida.');
    }

    return {
      clientId: data.client_id,
      privateNotes: data.private_notes,
    };
  }
}

export const clientsRepository = new ClientsRepository();
