# Arquitectura del Sistema

## Visión General

Crown Xpress Transport - 20 Point Inspection es un sistema de inspección de 20 puntos para tractores y remolques. Permite a los guardias realizar inspecciones físicas en el patio, sincroniza movimientos desde el sistema NBCW (SQL Server on-premise), y genera reportes PDF profesionales.

## Diagrama de Arquitectura

```
┌─────────────────────────────────────────────────────────────┐
│                        VERCEL (Cloud)                        │
│                                                              │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐     │
│  │ React SPA    │    │ API Routes   │    │ Vercel Blob  │     │
│  │ (PWA)        │───▶│ /api/*       │───▶│ (PDFs)       │     │
│  │              │    │              │    │              │     │
│  │ IndexedDB    │    │ node-postgres│    └──────────────┘     │
│  │ (offline)    │    │ (pg Pool)    │                         │
│  └──────────────┘    └──────┬───────┘                         │
│                             │                                 │
└─────────────────────────────┼─────────────────────────────────┘
                              │ TCP/TLS :443
                              │
┌─────────────────────────────┼─────────────────────────────────┐
│                    IONOS VPS (74.208.37.187)                   │
│                             │                                 │
│  ┌──────────────┐          │          ┌──────────────┐        │
│  │ Caddy v2.11  │◀─────────┘          │ CRM Stack    │        │
│  │ + layer4     │                     │ (existente)  │        │
│  │              │                     │ NO TOCAR     │        │
│  │ :443 HTTP    │    ┌──────────────┐ └──────────────┘        │
│  │ :443 PG/TLS  │───▶│ PostgreSQL   │                         │
│  └──────────────┘    │ 16-alpine    │                         │
│                      │ crown-postgres│                        │
│                      │ :5433 (local)│                         │
│                      └──────────────┘                         │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
                              ▲
                              │ TCP :443 (TLS)
                              │
┌─────────────────────────────┴─────────────────────────────────┐
│                   PC ON-PREMISE (192.168.5.x)                  │
│                                                                │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐      │
│  │ SQL Server    │    │ Sync Script  │    │ Task         │      │
│  │ NBCW         │◀───│ sync-nbcw.js │───▶│ Scheduler    │      │
│  │ GPSActivity  │    │ (Node.js)    │    │ (cada 1 min) │      │
│  │ :1433        │    │              │    └──────────────┘      │
│  └──────────────┘    └──────────────┘                          │
│                                                                │
└────────────────────────────────────────────────────────────────┘
```

## Componentes

### 1. Frontend (Vercel)

- **React 18 + Vite 5** — SPA con routing personalizado
- **PWA** — Service Worker precachea el app shell
- **IndexedDB** — Almacena TPR, inspecciones pendientes y caché
- **TailwindCSS 3** — Estilos responsive
- **Context API** — AuthContext, InspectionContext, LanguageContext

### 2. Backend (Vercel Serverless)

- **API Routes** — Functions bajo `/api/`
- **node-postgres (pg)** — Pool de conexiones TCP a PostgreSQL
- **Vercel Blob** — Almacenamiento de PDFs

### 3. Base de Datos App (IONOS PostgreSQL 16)

- **Docker** — Contenedor `crown-postgres`
- **TLS** — Cifrado de conexión
- **Caddy layer4** — Proxy TCP/TLS en puerto 443
- **Tablas** — inspections, inspection_points, employees, yards, yard_assignments, tpr, audit_log, operators, locations
- **Vistas** — v_inspection_chains, v_inspections_list

### 4. Base de Datos TPR (SQL Server on-premise)

- **NBCW GPSActivity** — SQL Server en red local (192.168.5.13)
- **Tabla tpr** — Movimientos de tractores/contenedores
- **No se migra** — Permanece on-premise

### 5. Sync NBCW (PC on-premise)

- **Script Node.js** — `sync-nbcw.js`
- **Task Scheduler** — Ejecuta cada 1 minuto
- **Flujo** — Lee SQL Server → Escribe PostgreSQL IONOS
- **sql_id** — Hash MD5 estable por movimiento (wono|truckid|fecha|fromd|tod|timearrv)

### 6. Caddy (IONOS VPS)

- **Binario custom** — Compilado con xcaddy + layer4
- **Puerto 443** — HTTP + PostgreSQL comparten puerto (SNI routing)
- **Certificados** — Let's Encrypt automáticos
- **Rutas HTTP** — api.crown-xpress-transport.app, auth.crown-xpress-transport.app, db.crown-xpress-transport.app, evenchess.jmbj2457.com
- **Ruta TCP** — db.crown-xpress-transport.app:443 → PostgreSQL (postgres_tls + TLS termination)

## Flujo de Datos

### Inspecciones

```
Guardia completa inspección → POST /api/inspections
  → PostgreSQL (inspections + inspection_points)
  → Genera PDF → Vercel Blob
  → Guarda pdf_url en PostgreSQL
```

### Movimientos TPR (Pendientes)

```
SQL Server NBCW (tpr)
  ↓ (sync script cada 1 min)
PostgreSQL IONOS (tpr con sql_id)
  ↓ (API /api/tpr)
Frontend muestra pendientes
  ↓ (cruza con inspections)
Filtra los ya inspeccionados (match exacto por sql_id)
```

### Modo Offline

```
Con internet:
  TPR API → IndexedDB → Guardo inspecciona → API → PostgreSQL

Sin internet:
  IndexedDB (TPR guardado) → Guardo inspecciona → IndexedDB (cola)

Vuelve internet:
  IndexedDB (cola) → API → PostgreSQL → borra de cola
```

## Reglas de Negocio

- Los admins ven todas las inspecciones y métricas
- Los supervisores y guardias solo ven sus yardas asignadas
- Los conteos de pendientes NBCW incluyen solo movimientos válidos de Crown
- Un camión, rabón, contenedor, trailer o plataforma puede inspeccionarse múltiples veces por día
- Un movimiento se identifica por su `sql_id` único
- Completar un movimiento suprime solo ese movimiento exacto
- Un movimiento posterior con diferente `sql_id` debe aparecer de nuevo
- Los movimientos pueden ser cargados, vacíos o bobtail
- Un movimiento puede entrar y salir con la misma work order
- Las work orders pueden reutilizarse en el mismo o diferente día
