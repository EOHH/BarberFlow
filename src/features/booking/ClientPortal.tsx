import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { supabase } from '../../infrastructure/supabase/client';
import { Calendar, Clock, User, Scissors, CheckCircle2, XCircle, AlertCircle, ArrowLeft } from 'lucide-react';
import { toZonedTime, formatInTimeZone } from 'date-fns-tz';
import { EXPIRED_STATUS_BADGE_CLASS } from '../../shared/utils/appointmentStatusStyles';

const TIME_ZONE = 'America/Lima';

export function ClientPortal() {
  const { slug, id } = useParams<{ slug: string; id: string }>();
  const navigate = useNavigate();
  const [appointment, setAppointment] = useState<any>(null);
  const [service, setService] = useState<any>(null);
  const [barber, setBarber] = useState<any>(null);
  const [tenant, setTenant] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        // Load Tenant
        const { data: tData } = await supabase
          .from('tenants')
          .select('id, name, theme_color, logo_url')
          .eq('domain', slug)
          .single();
          
        if (tData) setTenant(tData);

        // Load Appointment via RPC
        const { data: aData, error: aError } = await supabase.rpc('get_appointment_by_id', {
          p_slug: slug,
          p_appointment_id: id
        });

        if (aError || !aData || aData.length === 0) throw new Error('No se encontró la cita.');
        
        const app = aData[0];
        setAppointment(app);

        // Set mock service & barber to match UI requirements
        setService({
          name: app.service_name,
          duration_minutes: app.service_duration,
          price: app.service_price
        });

        if (app.barber_name) {
          setBarber({ name: app.barber_name });
        }
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    
    if (slug && id) loadData();
  }, [slug, id]);

  const handleCancel = async () => {
    if (!window.confirm('¿Estás seguro que deseas cancelar tu cita? Esta acción no se puede deshacer.')) return;
    
    setCancelling(true);
    try {
      const { error } = await supabase.rpc('cancel_public_appointment', {
        p_slug: slug,
        p_appointment_id: id,
      });
        
      if (error) throw error;
      setAppointment({ ...appointment, status: 'cancelled' });
    } catch (err: any) {
      alert('Error al cancelar: ' + err.message);
    } finally {
      setCancelling(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center text-white">
        <div className="w-8 h-8 border-4 border-white border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (error || !appointment) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center p-6 text-center text-white">
        <div>
          <AlertCircle className="w-16 h-16 text-rose-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2">Cita no encontrada</h2>
          <p className="text-zinc-400 mb-6">El enlace no es válido o la cita ya no existe.</p>
          <Link to={`/booking/${slug}`} className="bg-white text-black px-6 py-3 rounded-xl font-bold">
            Volver a inicio
          </Link>
        </div>
      </div>
    );
  }

  const isCancellable = appointment.status === 'pending' || appointment.status === 'confirmed';
  
  // Seguridad Anti-Troll: No cancelar si faltan menos de X minutos
  const now = toZonedTime(new Date(), TIME_ZONE);
  const apptTime = toZonedTime(new Date(`${appointment.date}T${appointment.time}`), TIME_ZONE);
  
  // Calculate minutes difference
  const diffMs = apptTime.getTime() - now.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const tooLateToCancel = isCancellable && diffMins <= 60 && diffMins > 0; // Una hora o menos
  const isPast = diffMins <= 0;

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white p-6 sm:p-12 flex flex-col items-center">
      <div className="w-full max-w-md">
        
        <button onClick={() => navigate(`/booking/${slug}?tab=citas`)} className="flex items-center gap-2 text-zinc-400 hover:text-white transition-colors mb-8">
          <ArrowLeft className="w-5 h-5" /> Volver atrás
        </button>

        {tenant?.logo_url && (
          <img src={tenant.logo_url} alt="Logo" className="w-24 h-24 rounded-full object-cover mx-auto mb-6 border border-zinc-800" />
        )}
        
        <h1 className="text-3xl font-extrabold text-center mb-2">Gestión de Cita</h1>
        <p className="text-zinc-400 text-center mb-8">Hola {appointment.client_name}, aquí están los detalles de tu cita.</p>

        <div className="bg-[#141414] border border-zinc-800 rounded-3xl p-6 shadow-xl relative overflow-hidden mb-8">
          
          {/* Status Badge */}
          <div className="absolute top-6 right-6">
            {appointment.status === 'completed' && <span className="bg-indigo-500/10 text-indigo-500 px-3 py-1 rounded-full text-xs font-bold uppercase border border-indigo-500/20 flex items-center gap-1"><CheckCircle2 className="w-3 h-3"/> Completado</span>}
            {appointment.status === 'in_progress' && <span className="bg-amber-500/10 text-amber-500 px-3 py-1 rounded-full text-xs font-bold uppercase border border-amber-500/20 animate-pulse flex items-center gap-1"><Clock className="w-3 h-3"/> En Atención</span>}
            {appointment.status === 'cancelled' && <span className="bg-rose-500/10 text-rose-500 px-3 py-1 rounded-full text-xs font-bold uppercase border border-rose-500/20 flex items-center gap-1"><XCircle className="w-3 h-3"/> Cancelado</span>}
            {appointment.status === 'expired' && <span className={`${EXPIRED_STATUS_BADGE_CLASS} px-3 py-1 rounded-full text-xs font-bold uppercase flex items-center gap-1`}><Clock className="w-3 h-3"/> Expirada</span>}
            {appointment.status === 'pending' && <span className="bg-yellow-500/10 text-yellow-500 px-3 py-1 rounded-full text-xs font-bold uppercase border border-yellow-500/20 flex items-center gap-1"><Clock className="w-3 h-3"/> Pendiente de confirmación</span>}
            {appointment.status === 'confirmed' && <span className="bg-emerald-500/10 text-emerald-500 px-3 py-1 rounded-full text-xs font-bold uppercase border border-emerald-500/20 flex items-center gap-1"><CheckCircle2 className="w-3 h-3"/> Confirmada</span>}
          </div>

          <div className="space-y-6 mt-8">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center shrink-0 text-white">
                <Scissors className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs text-zinc-500 font-bold uppercase tracking-wider">Servicio</p>
                <p className="font-bold text-lg">{service?.name}</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center shrink-0 text-white">
                <Calendar className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs text-zinc-500 font-bold uppercase tracking-wider">Fecha y Hora</p>
                <p className="font-bold text-[15px]">
                  {formatInTimeZone(apptTime, TIME_ZONE, 'dd/MM/yyyy')} a las {formatInTimeZone(apptTime, TIME_ZONE, 'hh:mm a')}
                </p>
              </div>
            </div>
            {barber && (
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center shrink-0 text-white">
                  <User className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs text-zinc-500 font-bold uppercase tracking-wider">Barbero</p>
                  <p className="font-bold text-[15px]">{barber.name}</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Cancel Section */}
        {isCancellable && (
          <div className="space-y-4">
            {!isPast && (
              <div className="bg-rose-500/10 border border-rose-500/20 rounded-2xl p-5 text-center">
                {tooLateToCancel ? (
                  <p className="text-rose-400 text-sm font-medium">Ya no puedes cancelar esta cita online porque falta 1 hora o menos.</p>
                ) : (
                  <>
                    <p className="text-zinc-300 text-sm mb-4">Si no podrás asistir, por favor cancela tu cita para liberar el espacio a otro cliente.</p>
                    <button
                      disabled={cancelling}
                      onClick={handleCancel}
                      className="w-full bg-rose-600 hover:bg-rose-700 text-white font-bold py-4 rounded-xl transition-all active:scale-95 disabled:opacity-50"
                    >
                      {cancelling ? 'Cancelando...' : 'Cancelar mi Cita'}
                    </button>
                  </>
                )}
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
}
