import { useState, useRef, useEffect } from 'react';
import { useTenantSettings } from '../../shared/hooks/useTenantSettings';
import imageCompression from 'browser-image-compression';
import { Image as ImageIcon, Upload, Save, Loader2, Palette, CheckCircle2, Store, Bell, Mail, MessageCircle, Star, Share2 } from 'lucide-react';
import { toast } from 'sonner';

const PREDEFINED_PALETTES = [
  { id: 'gold', name: 'Premium Gold', hex: '#D4AF37', className: 'bg-[#D4AF37]' },
  { id: 'emerald', name: 'Emerald Success', hex: '#10B981', className: 'bg-emerald-500' },
  { id: 'indigo', name: 'Deep Indigo', hex: '#6366F1', className: 'bg-indigo-500' },
  { id: 'rose', name: 'Rose Beauty', hex: '#F43F5E', className: 'bg-rose-500' },
  { id: 'slate', name: 'Slate Modern', hex: '#64748B', className: 'bg-slate-500' },
];

type TabType = 'branding' | 'notifications';

export function SettingsAdminPage() {
  const { tenant, isLoading, updateTenant, uploadLogo, isUpdating, isUploading } = useTenantSettings();
  
  const [activeTab, setActiveTab] = useState<TabType>('branding');
  
  const [selectedColor, setSelectedColor] = useState<string>('gold');
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [fileToUpload, setFileToUpload] = useState<File | null>(null);
  const [tenantName, setTenantName] = useState<string>('');
  const [tenantDomain, setTenantDomain] = useState<string>('');
  const [whatsappNumber, setWhatsappNumber] = useState<string>('');
  const [emailActive, setEmailActive] = useState<boolean>(true);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (tenant) {
      if (tenant.theme_color) setSelectedColor(tenant.theme_color);
      if (tenant.logo_url) setLogoPreview(tenant.logo_url);
      setTenantName(tenant.name || '');
      setTenantDomain(tenant.domain || '');
      setWhatsappNumber(tenant.whatsapp_number || '');
      if (tenant.email_notifications_active !== undefined) {
        setEmailActive(tenant.email_notifications_active);
      }
    }
  }, [tenant]);

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const options = {
        maxSizeMB: 0.5,
        maxWidthOrHeight: 800,
        useWebWorker: true,
      };
      const compressedFile = await imageCompression(file, options);
      setFileToUpload(compressedFile);
      setLogoPreview(URL.createObjectURL(compressedFile));
    } catch (err) {
      toast.error('Error al procesar la imagen.');
    }
  };

  const handleSave = async () => {
    if (!tenant) return;
    try {
      let finalLogoUrl = tenant.logo_url;
      if (fileToUpload) {
        finalLogoUrl = await uploadLogo(fileToUpload);
      }
      
      await updateTenant({
        id: tenant.id,
        updates: {
          name: tenantName.trim(),
          domain: tenantDomain.trim(),
          theme_color: selectedColor,
          logo_url: finalLogoUrl,
          whatsapp_number: whatsappNumber.trim(),
          email_notifications_active: emailActive
        }
      });
    } catch (err) {
      console.error(err);
      toast.error('Error al guardar configuración');
    }
  };

  const handleShare = async () => {
    if (!tenantDomain) return;
    
    const url = `${window.location.origin}/booking/${tenantDomain}`;
    const text = `🔥 ¡Reserva tu cita en ${tenantName || 'nuestra barbería'}! ✂️\n\nAgenda tu próximo corte rápida y fácilmente haciendo clic en nuestro enlace oficial:\n👉 ${url}\n\n¡Te esperamos!`;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Reservar cita en ${tenantName || 'nuestra barbería'}`,
          text: text,
        });
      } catch (err) {
        console.log('Error compartiendo', err);
      }
    } else {
      // Fallback a WhatsApp Web/App si no soporta navigator.share
      const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(text)}`;
      window.open(whatsappUrl, '_blank');
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-[50vh] items-center justify-center animate-pulse">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* Header and Save Button */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">Ajustes Generales</h1>
          <p className="text-muted-foreground mt-1">Personaliza tu marca y centro de notificaciones.</p>
        </div>
        <button 
          onClick={handleSave}
          disabled={isUpdating || isUploading}
          className="flex items-center gap-2 bg-primary text-primary-foreground px-6 h-12 rounded-xl font-bold hover:bg-primary/90 transition-all active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed shadow-md shadow-primary/20"
        >
          {isUpdating || isUploading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
          Guardar Cambios
        </button>
      </div>

      {/* Pill Tabs */}
      <div className="flex justify-center sm:justify-start">
        <div className="bg-slate-100 p-1.5 rounded-2xl flex space-x-1 shadow-inner border border-slate-200/60">
          <button
            onClick={() => setActiveTab('branding')}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-semibold transition-all duration-300 ${
              activeTab === 'branding' 
                ? 'bg-white text-slate-900 shadow-sm' 
                : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'
            }`}
          >
            <Palette className="w-4 h-4" />
            Marca Blanca
          </button>
          <button
            onClick={() => setActiveTab('notifications')}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-semibold transition-all duration-300 ${
              activeTab === 'notifications' 
                ? 'bg-white text-slate-900 shadow-sm' 
                : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'
            }`}
          >
            <Bell className="w-4 h-4" />
            Notificaciones
          </button>
        </div>
      </div>

      {/* Branding Section */}
      {activeTab === 'branding' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
          {/* General Data Section */}
          <div className="md:col-span-2 bg-card border border-border/50 rounded-3xl p-8 shadow-sm space-y-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                <Store className="w-5 h-5" />
              </div>
              <h2 className="text-xl font-bold">Datos del Negocio</h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-1.5">
                <label className="block text-sm font-semibold">Nombre de la Barbería</label>
                <input 
                  type="text" 
                  required
                  value={tenantName}
                  onChange={e => setTenantName(e.target.value)}
                  className="w-full px-4 py-3 bg-background border rounded-xl focus:ring-2 focus:ring-primary outline-none transition-shadow shadow-sm"
                />
              </div>
              <div className="space-y-1.5">
                <label className="block text-sm font-semibold flex items-center justify-between">
                  Dominio (URL)
                  <button 
                    onClick={handleShare}
                    type="button"
                    className="text-xs text-primary font-bold hover:underline flex items-center gap-1 bg-primary/10 px-2 py-1 rounded-md transition-colors hover:bg-primary/20"
                    title="Compartir enlace público"
                  >
                    <Share2 className="w-3.5 h-3.5" /> Compartir Link
                  </button>
                </label>
                <div className="relative">
                  <input 
                    type="text" 
                    value={tenantDomain}
                    onChange={e => setTenantDomain(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                    className="w-full pl-4 pr-16 py-3 bg-background border rounded-xl focus:ring-2 focus:ring-primary outline-none transition-shadow shadow-sm"
                    placeholder="mi-barberia"
                  />
                  <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none text-muted-foreground text-sm font-medium">
                    .app
                  </div>
                </div>
              </div>
              <div className="space-y-1.5 md:col-span-2">
                <label className="block text-sm font-semibold flex items-center gap-2">
                  <MessageCircle className="w-4 h-4 text-[#25D366]" />
                  Número de WhatsApp
                </label>
                <input 
                  type="text" 
                  value={whatsappNumber}
                  onChange={e => setWhatsappNumber(e.target.value.replace(/[^0-9+]/g, ''))}
                  className="w-full px-4 py-3 bg-background border rounded-xl focus:ring-2 focus:ring-primary outline-none transition-shadow shadow-sm"
                  placeholder="+51999888777"
                />
                <p className="text-xs text-muted-foreground">Este número se usará en el botón público de confirmar reserva.</p>
              </div>
            </div>
          </div>

          {/* Logo Upload Section */}
          <div className="bg-card border border-border/50 rounded-3xl p-8 shadow-sm space-y-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                <ImageIcon className="w-5 h-5" />
              </div>
              <h2 className="text-xl font-bold">Logo de la Barbería</h2>
            </div>
            <p className="text-sm text-muted-foreground">Sube el logotipo oficial. Se redimensionará y comprimirá automáticamente para cargar súper rápido.</p>
            
            <div className="flex flex-col items-center justify-center border-2 border-dashed border-border/60 rounded-2xl p-8 bg-muted/20 hover:bg-muted/50 transition-colors">
              {logoPreview ? (
                <div className="relative group w-32 h-32 rounded-full overflow-hidden border-4 border-background shadow-lg mb-4">
                  <img src={logoPreview} alt="Logo Preview" className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                    <Upload className="w-6 h-6 text-white" />
                  </div>
                </div>
              ) : (
                <button onClick={() => fileInputRef.current?.click()} className="w-24 h-24 rounded-full bg-muted flex items-center justify-center text-muted-foreground hover:bg-primary/10 hover:text-primary transition-colors mb-4">
                  <Upload className="w-8 h-8" />
                </button>
              )}
              <input 
                type="file" 
                ref={fileInputRef} 
                className="hidden" 
                accept="image/*"
                onChange={handleImageChange}
              />
              <p className="text-sm font-semibold text-foreground">Click para subir imagen</p>
              <p className="text-xs text-muted-foreground mt-1">PNG, JPG, WEBP (Max 5MB)</p>
            </div>
          </div>

          {/* Color Palette Section */}
          <div className="bg-card border border-border/50 rounded-3xl p-8 shadow-sm space-y-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                <Palette className="w-5 h-5" />
              </div>
              <h2 className="text-xl font-bold">Paleta de Colores</h2>
            </div>
            <p className="text-sm text-muted-foreground">Elige el color de acento principal. La App Pública se adaptará automáticamente a este color.</p>
            
            <div className="space-y-4 pt-4">
              {PREDEFINED_PALETTES.map(palette => (
                <button
                  key={palette.id}
                  onClick={() => setSelectedColor(palette.id)}
                  className={`w-full flex items-center justify-between p-4 rounded-2xl border-2 transition-all duration-300 ${
                    selectedColor === palette.id 
                      ? 'border-primary bg-primary/5 shadow-md shadow-primary/10' 
                      : 'border-transparent bg-muted/50 hover:bg-muted'
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-8 h-8 rounded-full shadow-sm ${palette.className}`} />
                    <span className="font-semibold text-foreground">{palette.name}</span>
                  </div>
                  {selectedColor === palette.id && (
                    <CheckCircle2 className="w-6 h-6 text-primary" />
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Notifications Section */}
      {activeTab === 'notifications' && (
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
          
          {/* Controls Column */}
          <div className="md:col-span-5 space-y-6">
            
            {/* Email Notifications */}
            <div className="bg-card border border-border/50 rounded-3xl p-6 sm:p-8 shadow-sm flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary shrink-0">
                    <Mail className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold leading-tight">Correos Transaccionales</h2>
                    <p className="text-xs text-muted-foreground mt-0.5">Confirmaciones de Reserva</p>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground mb-6">
                  Envía automáticamente correos electrónicos HTML profesionales a tus clientes cuando agenden una cita.
                </p>
              </div>
              
              <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-slate-100 dark:border-slate-800">
                <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                  Estado del Servicio
                </span>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input 
                    type="checkbox" 
                    className="sr-only peer" 
                    checked={emailActive}
                    onChange={() => setEmailActive(!emailActive)}
                  />
                  <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-primary shadow-inner"></div>
                </label>
              </div>
            </div>

            {/* WhatsApp Notifications (Upsell) */}
            <div className="bg-card/50 border border-border/30 rounded-3xl p-6 sm:p-8 shadow-sm relative overflow-hidden">
              <div className="absolute -right-12 -top-12 w-40 h-40 bg-gradient-to-br from-amber-200 to-amber-500 rounded-full blur-3xl opacity-20 pointer-events-none"></div>
              
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-[#25D366]/10 flex items-center justify-center text-[#25D366] shrink-0">
                    <MessageCircle className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold leading-tight">WhatsApp API</h2>
                    <p className="text-xs text-muted-foreground mt-0.5">Recordatorios Automáticos</p>
                  </div>
                </div>
                <div className="bg-gradient-to-r from-amber-400 to-amber-600 text-white text-[10px] font-extrabold uppercase px-3 py-1 rounded-full flex items-center gap-1 shadow-md shadow-amber-500/20">
                  <Star className="w-3 h-3 fill-current" />
                  Plan Pro
                </div>
              </div>
              
              <p className="text-sm text-muted-foreground mb-6">
                Reduce el ausentismo enviando mensajes por WhatsApp 24 horas antes de la cita.
              </p>
              
              <div className="flex items-center justify-between p-4 bg-slate-50/50 dark:bg-slate-900/30 rounded-2xl border border-slate-100 dark:border-slate-800 opacity-60 pointer-events-none grayscale">
                <span className="text-sm font-semibold text-slate-500">
                  Estado del Servicio
                </span>
                <label className="relative inline-flex items-center">
                  <input type="checkbox" className="sr-only peer" disabled />
                  <div className="w-11 h-6 bg-slate-200 rounded-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5"></div>
                </label>
              </div>
            </div>
            
          </div>

          {/* Email Visualizer Column */}
          <div className="md:col-span-7">
            <div className="bg-slate-50 dark:bg-slate-900/50 border border-slate-200/60 dark:border-slate-800 rounded-3xl p-6 shadow-inner h-full">
              <div className="flex items-center gap-2 mb-4 px-2">
                <div className="flex gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-red-400/80"></div>
                  <div className="w-3 h-3 rounded-full bg-amber-400/80"></div>
                  <div className="w-3 h-3 rounded-full bg-emerald-400/80"></div>
                </div>
                <span className="text-xs font-semibold text-slate-400 ml-2">Vista Previa del Correo</span>
              </div>
              
              <div className="bg-white dark:bg-slate-950 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 overflow-hidden text-slate-900 dark:text-slate-100">
                {/* Email Header */}
                <div className="border-b border-slate-100 dark:border-slate-800 p-4">
                  <p className="text-xs text-slate-500 mb-1">De: <span className="font-semibold text-slate-700 dark:text-slate-300">reservas@{tenantDomain || 'mibarberia'}.app</span></p>
                  <p className="text-xs text-slate-500 mb-2">Para: <span className="text-primary">cliente@ejemplo.com</span></p>
                  <p className="font-bold text-sm">¡Tu cita en {tenantName || 'Nuestra Barbería'} está confirmada!</p>
                </div>
                
                {/* Email Body */}
                <div className="p-8 flex flex-col items-center text-center space-y-6">
                  {logoPreview ? (
                    <img src={logoPreview} alt="Logo" className="h-16 w-16 object-cover rounded-full border border-slate-100 shadow-sm" />
                  ) : (
                    <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xl">
                      {(tenantName || 'B').charAt(0).toUpperCase()}
                    </div>
                  )}
                  
                  <div>
                    <h3 className="text-xl font-extrabold mb-2">Hola, Carlos</h3>
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                      Tu reserva ha sido confirmada exitosamente. Aquí tienes los detalles:
                    </p>
                  </div>
                  
                  <div className="bg-slate-50 dark:bg-slate-900/50 w-full rounded-2xl p-5 space-y-4 border border-slate-100 dark:border-slate-800 text-left">
                    <div className="flex justify-between items-center border-b border-slate-200 dark:border-slate-700/50 pb-3">
                      <span className="text-sm text-slate-500 font-medium">Servicio</span>
                      <span className="font-bold text-sm">Corte Clásico + Barba</span>
                    </div>
                    <div className="flex justify-between items-center border-b border-slate-200 dark:border-slate-700/50 pb-3">
                      <span className="text-sm text-slate-500 font-medium">Profesional</span>
                      <span className="font-bold text-sm">David Fade</span>
                    </div>
                    <div className="flex justify-between items-center pb-1">
                      <span className="text-sm text-slate-500 font-medium">Fecha y Hora</span>
                      <span className="font-bold text-sm text-primary">15 de Agosto, 10:00 AM</span>
                    </div>
                  </div>
                  
                  <button className="bg-slate-900 dark:bg-white text-white dark:text-slate-900 px-8 py-3 rounded-xl font-bold text-sm w-full sm:w-auto shadow-md">
                    Gestionar Reserva
                  </button>
                  
                  <p className="text-[10px] text-slate-400 max-w-xs mx-auto pt-4">
                    Este es un correo generado automáticamente por {tenantName || 'Barbershop'}. Por favor, no respondas a esta dirección.
                  </p>
                </div>
              </div>
            </div>
          </div>
          
        </div>
      )}
    </div>
  );
}
