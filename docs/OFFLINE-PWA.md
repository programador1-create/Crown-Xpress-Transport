# Modo Offline / PWA

## Resumen

La aplicación funciona como PWA (Progressive Web App) con soporte offline completo. El guardia puede realizar inspecciones sin conexión a internet, y los datos se sincronizan automáticamente cuando se recupera la conexión.

## Componentes

### 1. Service Worker (PWA)

- **Archivo:** `vite-plugin-pwa` genera `dist/sw.js`
- **Estrategia:** Precache del app shell (HTML, JS, CSS, imágenes)
- **Resultado:** La app abre sin internet después de la primera visita

### 2. IndexedDB (Almacenamiento Local)

- **Archivo:** `src/utils/offlineDB.js`
- **Base de datos:** `crown-xpress-offline` (versión 1)

| Store | Propósito |
|---|---|
| `tpr_movements` | Movimientos TPR precargados (para inspeccionar sin internet) |
| `pending_inspections` | Inspecciones creadas offline (cola de sincronización) |
| `inspection_cache` | Caché de inspecciones ya sincronizadas |

### 3. Sync Manager (Sincronización)

- **Archivo:** `src/utils/syncManager.js`
- **Detecta:** `window.addEventListener('online')`
- **Sube:** Inspecciones pendientes una por una
- **PDFs:** Si una inspección tiene PDF, se sube después de crear la inspección
- **Errores:** Si una inspección falla, se marca como fallida y continúa con la siguiente

### 4. Indicador Visual

- **Archivo:** `src/components/OfflineIndicator.jsx`
- **Muestra:** Estado online/offline y conteo de pendientes
- **Botón:** "Sincronizar" para forzar sync manual

## Flujo de Trabajo

### Con Internet

```
1. App carga TPR desde API → guarda en IndexedDB
2. Guardo completa inspección → POST /api/inspections → PostgreSQL
3. PDF se genera y sube a Vercel Blob
4. Todo en tiempo real
```

### Sin Internet

```
1. App abre desde caché del Service Worker
2. TPR ya guardado en IndexedDB está disponible
3. Guardo completa inspección → guarda en IndexedDB (cola)
4. Indicador muestra "Sin conexión - X pendientes"
```

### Al Recuperar Internet

```
1. Sync Manager detecta evento 'online'
2. Lee inspecciones pendientes de IndexedDB
3. Sube cada una a /api/inspections
4. Sube PDFs asociados
5. Borra las exitosas de la cola
6. Las fallidas se marcan y permanecen en cola
```

## Importante

- El guardia debe **cargar TPR mientras tiene internet** antes de ir offline
- Las inspecciones offline se guardan con `localId` auto-incremental
- El `serverId` se asigna cuando la inspección se sincroniza
- Si el PDF falla al subir, la inspección ya quedó guardada (no se revierte)
