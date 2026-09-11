# Crown Xpress Transport - 20 Point Inspection

Sistema profesional de inspección de 20 puntos para tractores y remolques de Crown Xpress Transport.

## Características

- Bilingüe (Español / Inglés)
- 20 puntos de inspección estandarizados (CTPAT / OEA)
- Captura de fotos en vivo (solo cámara, sin galería)
- Firma digital de guardia (obligatoria), operador y supervisor
- Generación de PDF profesional
- PWA con soporte offline (IndexedDB + Service Worker)
- Paginación 15/25/50 en todas las vistas
- Diseño responsive (tablets y móviles)
- Roles: guardia, supervisor, admin
- Integración con NBCW (SQL Server) via sync automático
- Almacenamiento de PDFs en Vercel Blob

## Stack Tecnológico

| Capa | Tecnología |
|---|---|
| Frontend | React 18 + Vite 5 |
| Estilos | TailwindCSS 3 |
| Iconos | Lucide React |
| PDF | jsPDF + jspdf-autotable + html2canvas |
| Firmas | react-signature-canvas |
| PWA | vite-plugin-pwa |
| Backend | Vercel Serverless Functions (Node.js) |
| Base de datos app | PostgreSQL 16 (IONOS Docker) |
| Base de datos TPR | SQL Server on-premise (NBCW GPSActivity) |
| PDFs | Vercel Blob Storage |
| Proxy TLS | Caddy + layer4 (IONOS) |
| Sync NBCW | Node.js script (cada 1 min en PC on-premise) |

## Documentación

Toda la documentación está en [`docs/`](docs/):

| Documento | Descripción |
|---|---|
| [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) | Arquitectura completa del sistema, diagrama y flujo de datos |
| [docs/MIGRATION-IONOS.md](docs/MIGRATION-IONOS.md) | Migración de Neon a IONOS PostgreSQL, infraestructura y rollback |
| [docs/SYNC-NBCW.md](docs/SYNC-NBCW.md) | Sincronización NBCW → PostgreSQL, sql_id, Task Scheduler |
| [docs/CADDY-LAYER4.md](docs/CADDY-LAYER4.md) | Configuración de Caddy con layer4 para proxy TCP/TLS |
| [docs/OFFLINE-PWA.md](docs/OFFLINE-PWA.md) | Modo offline, IndexedDB, Service Worker, sync manager |
| [docs/ENV-VARIABLES.md](docs/ENV-VARIABLES.md) | Variables de entorno de Vercel, PC on-premise y VPS |
| [docs/SETUP.md](docs/SETUP.md) | Guía de instalación local y despliegue |
| [docs/MANUAL_USUARIO.md](docs/MANUAL_USUARIO.md) | Manual de usuario final |
| [docs/REPORTE_DESARROLLO.md](docs/REPORTE_DESARROLLO.md) | Reporte de desarrollo del proyecto |

## Arquitectura

```
Vercel (frontend + API serverless)
  ├── React SPA (PWA)
  ├── /api/* → PostgreSQL IONOS (via Caddy TLS)
  └── Vercel Blob → PDFs

IONOS VPS (74.208.37.187)
  ├── Caddy + layer4 (:443 HTTP + PostgreSQL TLS)
  ├── PostgreSQL 16 Docker (:5433 local)
  └── CRM existente (sin cambios)

PC on-premise (Task Scheduler cada 1 min)
  └── sync-nbcw.js
       SQL Server NBCW → PostgreSQL IONOS (tabla tpr)
```

Ver diagrama completo en [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md).

## Instalación local

```bash
npm install
npm run dev
```

- Frontend: http://localhost:5173
- API local: http://localhost:3001 (`node server.js`)

Ver guía completa en [docs/SETUP.md](docs/SETUP.md).

## Build de producción

```bash
npm run build
npm run preview
```

## Despliegue en Vercel

El proyecto se despliega automáticamente al hacer push a `main`.

Variables de entorno necesarias: ver [docs/ENV-VARIABLES.md](docs/ENV-VARIABLES.md).

---

© 2025 Crown Xpress Transport - Logistics Transport
