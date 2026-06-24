# Reporte Semanal - Crown Xpress Transport
**Semana del 17 al 24 de Junio, 2026**

## Resumen de Avances

### 1. Gestión de Usuarios - Arreglo de Yardas Asignadas
**Problema:** Los checkboxes de yardas no se marcaban correctamente al editar un usuario.
**Causa:** El campo `yard_id` no se estaba devolviendo correctamente desde el backend.
**Solución:**
- Modificado backend (`api/employees.js`) para usar `yard_code` como método de matching
- Actualizado frontend (`src/components/UserManagement.jsx`) para usar `yard_code` para encontrar IDs de yardas correspondientes
- Ahora las yardas asignadas se marcan correctamente en el formulario de edición

### 2. Validación de Roles - Constraint de Base de Datos
**Problema:** Error al guardar usuarios con rol 'supervisor': `violates check constraint "employees_role_check"`
**Causa:** La constraint en la base de datos no incluía el rol 'supervisor'.
**Solución:**
- Ejecutado script SQL (`fix_role_constraint.sql`) para actualizar la constraint
- Agregado rol 'operator' al frontend para coincidir con la constraint de la base de datos
- Ahora se pueden guardar usuarios con roles: operator, guard, inspector, supervisor, admin

### 3. Conexión SQL Proxy - Túnel Cloudflare
**Problema:** Error "SQL proxy returned an error" al intentar conectar a datos de NBCW.
**Causa:** La URL del túnel Cloudflare cambió después de reiniciar.
**Solución:**
- Actualizado variable de entorno `SQLPROXY_URL` en Vercel con nueva URL
- Configurado autostart de SQL Proxy y Cloudflare Tunnel
- Verificado que el túnel esté funcionando correctamente

### 4. PDF Download - Vista Supervisor
**Problema:** Errores 404 y 500 al descargar PDFs en la vista de supervisor.
**Causa:** Endpoint de PDF no manejaba correctamente IDs con extensión .pdf y regeneración de PDF causaba errores.
**Solución:**
- Modificado `api/inspections/[id].js` para limpiar IDs (removiendo .pdf extension)
- Deshabilitada regeneración de PDF al firmar como supervisor
- Mensaje de error mejorado para inspecciones sin PDF almacenado

### 5. Investigación en Progreso - Inspectores y Historial
**Problema:** Los inspectores no ven opciones para crear inspecciones ni ver su historial.
**Estado:** En investigación
**Acciones tomadas:**
- Verificado que `canEdit()` incluye rol 'inspector'
- Agregado logs de debug en `AuthContext.jsx` y `GuardHistory.jsx`
- Pendiente: Revisar logs del usuario para identificar la causa raíz

## Archivos Modificados

### Frontend
- `src/components/UserManagement.jsx` - Arreglo de checkboxes de yardas, agregado rol operator
- `src/context/AuthContext.jsx` - Logs de debug para canEdit()
- `src/components/GuardHistory.jsx` - Logs de debug para filtrado de historial
- `src/components/SupervisorView.jsx` - Deshabilitada regeneración de PDF
- `src/utils/api.js` - Actualizado signSupervisor para manejar PDF

### Backend
- `api/employees.js` - Actualizado query de yard_assignments, logs de debug
- `api/inspections/[id].js` - Limpieza de IDs, manejo de errores de PDF

### Configuración
- `vercel.json` - Actualizado rewrite para PDF endpoint
- `fix_role_constraint.sql` - Script para actualizar constraint de roles

## Commits Realizados

1. `c4276b0` - fix: agregar rol operator y actualizar constraint employees_role_check
2. `710b53b` - debug: agregar logs para investigar por qué inspector no ve opciones de inspección/historial

## Pendientes

1. **Investigar problema de inspectores** - Determinar por qué los usuarios con rol 'inspector' no ven las opciones de inspección/historial
2. **Remover logs de debug** - Una vez resuelto el problema de inspectores, limpiar los console.log agregados
3. **Verificar filtrado de inspecciones por yardas** - Confirmar que los supervisores solo ven inspecciones de sus yardas asignadas

## Notas de Despliegue

- URL de producción: https://crown-xpress-transport-ten.vercel.app
- Túnel Cloudflare actual: https://llp-relevant-non-mumbai.trycloudflare.com
- Base de datos: Neon PostgreSQL
- Autostart configurado para SQL Proxy y Cloudflare Tunnel

## Próximos Pasos

1. Completar investigación del problema de inspectores
2. Verificar que todos los roles funcionen correctamente
3. Probar flujo completo de inspección con cada rol
4. Documentar procedimientos de mantenimiento del túnel
