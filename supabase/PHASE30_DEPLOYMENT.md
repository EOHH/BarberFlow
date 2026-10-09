# BarberFlow Phase 30 — Procedimiento de despliegue y reversión

## Alcance

Este procedimiento despliega la confirmación automática/manual por tenant
(Phase 30B) y la corrección para reservas públicas autenticadas (Phase 30D).
Phase 27, 28 y 29 ya deben estar aplicadas.

No volver a ejecutar Phase 27, 28 ni 29. No combinar los archivos SQL ni
alterar su orden.

## Advertencia crítica sobre recuperación

**No existe un respaldo independiente y recuperable confirmado para este
despliegue.** Los scripts de rollback son rollbacks funcionales del código y
del esquema de Phase 30, pero **no sustituyen un backup**, no proporcionan
recuperación punto en el tiempo y no pueden reconstruir datos que se pierdan o
sean modificados por una operación ajena al alcance previsto.

Antes de comenzar, el responsable del despliegue debe aceptar expresamente
este riesgo. Si se habilita una opción de snapshot o backup recuperable antes
de la ventana, debe utilizarse y verificarse primero. Si no se dispone de ella,
el despliegue debe tratarse como una operación sin red de recuperación de
datos: ventana de bajo tráfico, un único operador, sin cambios paralelos y con
criterios de parada estrictos.

## Artefactos definitivos

Frontend compatible:

- `src/features/booking/components/BookingSuccess.tsx`
- `src/features/dashboard/SettingsAdminPage.tsx`
- `src/infrastructure/supabase/repositories/booking.repository.ts`
- `src/infrastructure/supabase/repositories/tenant.repository.ts`
- `src/shared/hooks/useTenantSettings.ts`
- `src/types/index.ts`

Migraciones, en orden obligatorio:

1. `supabase/migrations/phase30_booking_confirmation_mode.sql`
2. `supabase/migrations/phase30d_authenticated_public_booking_tenant.sql`

Verificaciones de solo lectura:

1. `supabase/reconciliation/phase30_booking_confirmation_verification.sql`
2. `supabase/reconciliation/phase30d_authenticated_public_booking_verification.sql`

Rollbacks, en orden inverso obligatorio:

1. `supabase/rollback/phase30d_authenticated_public_booking_tenant.rollback.sql`
2. `supabase/rollback/phase30_booking_confirmation_mode.rollback.sql`

## Estado esperado antes de empezar

- Phase 27, 28 y 29 aplicadas y operativas.
- Frontend Phase 30 construido y validado desde el mismo commit/artefacto que
  se desplegará.
- El ejecutor de las migraciones es `postgres` y dispone de `CREATEROLE`.
- `barberflow_booking_writer` no existe.
- RLS está habilitado en `public.appointments`.
- Están presentes los triggers requeridos de tenant, snapshots y protección de
  snapshots.
- No existen policies restrictivas `TO PUBLIC` sobre appointments.
- No hay otra migración, cambio administrativo o despliegue simultáneo.

Si cualquiera de estas precondiciones deja de ser cierta, no iniciar SQL.

## Preparación de la ventana

1. Elegir una ventana de bajo tráfico y anunciar que la configuración de
   confirmación no debe editarse durante el cambio.
2. Identificar de antemano al operador, la versión frontend, el proyecto
   Supabase correcto y el responsable de decidir una reversión.
3. Conservar copias inmutables de los cuatro SQL de migración/rollback y de los
   dos scripts de reconciliación usados en la ventana.
4. Registrar hora de inicio y los resultados previos conocidos de cron.
5. Confirmar que no hay consultas o ediciones abiertas en otro operador.
6. No utilizar `db reset`, `db push` global, ni ejecutar el directorio completo
   de migraciones. Ejecutar exclusivamente los archivos indicados, uno por uno.

## Orden de despliegue

### 1. Desplegar primero el frontend compatible

Desplegar el artefacto frontend Phase 30 antes de cambiar la base de datos.
Este frontend sigue siendo compatible con el comportamiento anterior: acepta
reservas `pending`, usa `automatic` como fallback visual y no determina el
estado de la cita desde el navegador.

Después del despliegue y antes de ejecutar SQL, verificar sin guardar cambios:

- carga del catálogo público;
- carga de la pantalla de reservas;
- acceso autenticado al panel y a Configuración;
- ausencia de errores globales de carga.

Durante este intervalo no utilizar el control nuevo de modalidad: el RPC
administrativo todavía no existe hasta aplicar Phase 30B.

Si el frontend no carga correctamente, revertir solamente el frontend y no
iniciar las migraciones.

### 2. Aplicar Phase 30B

Ejecutar completo y sin modificaciones:

`supabase/migrations/phase30_booking_confirmation_mode.sql`

El archivo contiene su propio `BEGIN` y `COMMIT`. No envolverlo en otra
transacción y no continuar si devuelve cualquier error. Phase 30B:

- añade `tenants.booking_confirmation_mode` con default `automatic`;
- migra los tenants existentes a `automatic` sin cambiar citas existentes;
- crea el RPC administrativo;
- reemplaza el RPC moderno `create_booking` conservando disponibilidad,
  concurrencia y snapshots.

Al terminar, ejecutar completo el script de solo lectura:

`supabase/reconciliation/phase30_booking_confirmation_verification.sql`

Comprobar como mínimo:

- columna `booking_confirmation_mode` no nula y CHECK `automatic/manual`;
- todos los tenants en un valor permitido;
- `update_booking_confirmation_mode(text)` propiedad de `postgres`, SECURITY
  DEFINER y con `search_path` fijado;
- EXECUTE administrativo disponible solo para `authenticated`;
- `anon` y `service_role` sin EXECUTE sobre el RPC administrativo;
- definición y grants esperados del `create_booking` moderno.

Si esta verificación falla, no aplicar Phase 30D. Evaluar la reversión de 30B.

### 3. Aplicar Phase 30D

Ejecutar completo y sin modificaciones:

`supabase/migrations/phase30d_authenticated_public_booking_tenant.sql`

El archivo contiene su propio `BEGIN` y `COMMIT` y precondiciones que deben
fallar de forma cerrada. No envolverlo en otra transacción. Phase 30D:

- crea el rol NOLOGIN/NOBYPASSRLS `barberflow_booking_writer`;
- concede únicamente USAGE del schema e INSERT sobre appointments;
- no concede SELECT y no utiliza `INSERT ... RETURNING`;
- crea el helper privado y la policy INSERT específica;
- sustituye únicamente el trigger de tenant de appointments;
- conserva los triggers originales de services y availability;
- conserva el tenant resuelto por slug dentro del RPC público.

Al terminar, ejecutar completo el script de solo lectura:

`supabase/reconciliation/phase30d_authenticated_public_booking_verification.sql`

Comprobar como mínimo:

- writer NOLOGIN, NOINHERIT y NOBYPASSRLS;
- writer con INSERT y sin SELECT de tabla ni de `appointments.id`;
- ninguna membresía del writer en `anon`, `authenticated`, `service_role` ni
  `postgres` después de la instalación;
- helper SECURITY DEFINER propiedad del writer y ejecutable solo por
  `postgres`;
- trigger de appointments conectado a
  `set_appointment_tenant_id_trigger()`;
- services y availability todavía conectados a `set_tenant_id_trigger()`;
- policy `phase30d_booking_writer_insert` presente;
- permisos públicos del `create_booking` moderno sin ampliaciones;
- `anon` continúa sin INSERT directo sobre appointments.

Ante cualquier diferencia, detener las pruebas funcionales y decidir rollback.

## Pruebas funcionales controladas

Realizar las pruebas de forma secuencial, con tenants conocidos y horarios
futuros controlados. Registrar los UUID creados para poder identificarlos. No
editar citas históricas.

1. Desde un tenant en `automatic`, crear una reserva pública anónima:
   - debe devolver `confirmed`;
   - debe aparecer inmediatamente en agenda;
   - debe conservar nombre, precio y duración snapshot;
   - debe bloquear el horario.
2. Cambiar un tenant controlado a `manual` desde una sesión admin:
   - el cambio debe persistir;
   - una reserva pública nueva debe devolver `pending`;
   - una cita anterior no debe cambiar de estado.
3. Intentar cambiar la modalidad como staff:
   - debe ser rechazado;
   - el valor del tenant no debe cambiar.
4. Probar reserva pública estando autenticado en el mismo tenant:
   - debe crear la cita en el tenant del slug.
5. Probar reserva pública estando autenticado en otro tenant:
   - debe crear la cita en el tenant del slug;
   - no debe reasignarla al tenant administrativo del usuario.
6. Verificar que un INSERT directo como `anon` continúa rechazado.
7. Verificar cancelación pública de una cita de prueba mediante el RPC vigente,
   respetando el corte de 60 minutos. No borrar directamente filas.
8. Confirmar que los cron de transiciones y recordatorios siguen activos y que
   sus últimas ejecuciones posteriores al despliegue terminan correctamente.

Si no puede reservarse un horario controlado sin afectar clientes, omitir la
prueba destructiva y no sustituirla por operaciones directas sobre tablas.

## Criterios de éxito

El despliegue se considera exitoso solamente si:

- ambas migraciones finalizaron con COMMIT;
- ambas reconciliaciones coinciden con los invariantes indicados;
- automatic produce exclusivamente nuevas citas `confirmed`;
- manual produce exclusivamente nuevas citas `pending`;
- admin puede cambiar su propio tenant y staff no puede hacerlo;
- reservas anónimas y autenticadas conservan el tenant del slug;
- snapshots, disponibilidad y aislamiento multi-tenant siguen funcionando;
- anon no recupera acceso directo a appointments;
- cron y agenda continúan operativos;
- el frontend muestra correctamente `pending` y `confirmed`.

## Criterios de reversión

Iniciar rollback si se confirma cualquiera de estos casos:

- error parcial o resultado inesperado en una reconciliación;
- imposibilidad general de crear reservas públicas;
- tenant incorrecto en una cita;
- acceso cross-tenant administrativo;
- writer con LOGIN, BYPASSRLS, SELECT o membresías inesperadas;
- anon con acceso directo INSERT/SELECT/UPDATE/DELETE a appointments;
- snapshots nulos o distintos del servicio validado al reservar;
- duplicación del mismo horario bajo concurrencia;
- trigger de services o availability reemplazado accidentalmente;
- fallo sostenido de cron causado por Phase 30;
- errores frontend generalizados que impidan operar reservas o configuración.

Un problema aislado atribuible a datos previos debe investigarse antes de
revertir; no ejecutar rollbacks repetidamente ni fuera de orden.

## Procedimiento de rollback

### 1. Revertir Phase 30D

Ejecutar primero y completo:

`supabase/rollback/phase30d_authenticated_public_booking_tenant.rollback.sql`

Este rollback restaura el `create_booking` de Phase 30B y el trigger de tenant
original de appointments; después elimina helper, policy y writer. Contiene su
propia transacción.

Verificar después:

- `barberflow_booking_writer` ya no existe;
- helper y trigger function 30D ya no existen;
- appointments vuelve a usar `set_tenant_id_trigger()`;
- `create_booking` sigue resolviendo `booking_confirmation_mode` porque Phase
  30B aún permanece aplicada.

Si este rollback falla, no intentar el rollback 30B: conservar el error exacto
y escalar la recuperación manual.

### 2. Revertir Phase 30B

Solo después de completar y verificar el rollback 30D, ejecutar:

`supabase/rollback/phase30_booking_confirmation_mode.rollback.sql`

Este rollback restaura el comportamiento Phase 29, elimina el RPC de
configuración y elimina la columna de modalidad. Contiene su propia
transacción.

Verificar después:

- `booking_confirmation_mode` y su CHECK ya no existen;
- `update_booking_confirmation_mode(text)` ya no existe;
- el `create_booking` moderno corresponde a Phase 29 y crea `pending`;
- reservas públicas, agenda, snapshots y cron siguen operativos.

### 3. Revertir el frontend

Tras restaurar la base a Phase 29, desplegar la versión frontend anterior a
Phase 30 para retirar el control administrativo que ya no tendrá RPC/columna.
Mientras ocurre este último paso, evitar que administradores usen la pantalla
de configuración.

## Limitaciones del rollback

- No modifica retroactivamente citas creadas como `confirmed` o `pending`
  durante Phase 30.
- No restaura datos eliminados o modificados fuera de estos scripts.
- No equivale a recuperación punto en el tiempo.
- No compensa cambios manuales paralelos en roles, policies, funciones o
  triggers.
- Sin un backup recuperable, un incidente de datos puede requerir
  reconstrucción manual y puede ser irreversible.

## Cierre de la ventana

1. Guardar resultados de reconciliación, horas y UUID de las citas de prueba.
2. Confirmar nuevamente las últimas ejecuciones exitosas de ambos cron.
3. Confirmar que el tenant usado en pruebas quedó en la modalidad deseada.
4. Comunicar el resultado final: exitoso, revertido completamente o escalado.
5. No marcar Phase 30 como estable si queda una reconciliación o rollback a
   medias.
