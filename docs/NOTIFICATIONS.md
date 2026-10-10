# Convención de feedback de BarberFlow

BarberFlow utiliza exclusivamente el `Toaster` global de Sileo configurado en
`src/app/providers.tsx`. El resto de la aplicación debe consumir la API tipada
de `src/shared/lib/notifications.ts`; no debe importar `sileo` directamente.

## Qué mecanismo usar

- Éxito, advertencia o información breve: `notifications.success`,
  `notifications.warning` o `notifications.info`.
- Error recuperable de una operación: `notifications.error`, con un mensaje
  comprensible y sin detalles internos de Supabase, SQL, tokens o excepciones.
- Operación corta que necesita progreso global: `notifications.loading` y
  luego `notifications.update`. Evitar cargas persistentes para páginas.
- Validación de campos: mensaje inline asociado al campo, visible para lectores
  de pantalla. No usar un toast como único feedback de validación.
- Acción destructiva o irreversible: `ConfirmDialog`. Un toast nunca confirma
  automáticamente una acción.
- Error que impide usar una pantalla: estado visible en la página, con una
  acción de reintento cuando sea posible. Un toast puede complementar, pero no
  sustituir ese estado.
- Carga de página: skeleton o indicador local.

## API compartida

```ts
notifications.success(title, options);
notifications.error(title, options);
notifications.warning(title, options);
notifications.info(title, options);

const id = notifications.loading('Guardando…');
notifications.update(id, 'success', 'Cambios guardados');

notifications.close(id);
notifications.clear();
```

Cada evento debe tener un único propietario. No se debe notificar el mismo
resultado tanto en un repositorio/hook como en la pantalla que lo invoca.
Bloquear envíos repetidos mientras una operación está pendiente y evitar toasts
en efectos de sesión o navegación que puedan ejecutarse más de una vez.

## Accesibilidad y contenido

- Mantener títulos breves y descripciones accionables.
- No mostrar `error.message` sin traducir ni concatenar respuestas del backend.
- Conservar errores de formulario hasta que el usuario corrija el campo.
- `ConfirmDialog` enfoca primero la opción segura, soporta Escape y bloquea sus
  controles mientras la acción confirmada está pendiente.
- Los estilos globales respetan `prefers-reduced-motion` y el ancho móvil.

## Comprobación automática

`npm run lint` ejecuta primero `scripts/check-feedback.mjs`. La comprobación
rechaza `alert()`, `confirm()`, `prompt()`, bibliotecas de toast alternativas e
importaciones directas de Sileo fuera del proveedor global y la API compartida.
