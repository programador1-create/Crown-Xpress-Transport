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
| Base de datos app | PostgreSQL (Neon → migrando a IONOS Docker) |
| Base de datos TPR | SQL Server on-premise (NBCW GPSActivity) |
| PDFs | Vercel Blob Storage |
| Sync NBCW | Node.js script (cada 1 min en PC on-premise) |

## Arquitectura

```
Vercel (frontend + API serverless)
  ├── React SPA (PWA)
  ├── /api/inspections    → PostgreSQL (inspecciones)
  ├── /api/tpr            → PostgreSQL (cache TPR sincronizada)
  ├── /api/auth           → PostgreSQL (login)
  ├── /api/employees      → PostgreSQL (usuarios)
  ├── /api/yard-management → PostgreSQL (yardas)
  ├── /api/metrics        → PostgreSQL (métricas)
  └── Vercel Blob         → PDFs

PC on-premise (Task Scheduler cada 1 min)
  └── scripts/sync-nbcw-to-neon.js
       SQL Server GPSActivity → PostgreSQL (tabla tpr)
```

## Estructura del proyecto

```
├── api/                        # Endpoints serverless (Vercel)
│   ├── _lib/
│   │   ├── db.js               # Conexión PostgreSQL (Neon)
│   │   ├── blob.js             # Vercel Blob Storage
│   │   ├── handlers.js         # Lógica de endpoints
│   │   └── pdfGenerator.js     # Generador de PDF (backend)
│   ├── inspections/
│   │   ├── index.js            # POST/GET inspecciones
│   │   ├── [id].js             # GET/PUT inspección por ID
│   │   └── [id]/
│   │       └── pdf.js          # Download/upload PDF
│   ├── auth.js                 # Login
│   ├── employees.js            # CRUD usuarios
│   ├── yard-management.js     # CRUD yardas
│   ├── tpr.js                  # Movimientos TPR (lee PostgreSQL)
│   └── metrics.js              # Métricas
├── db/
│   ├── schema.sql              # Schema PostgreSQL completo (v2.0)
│   ├── schema-sqlserver.sql    # Schema SQL Server equivalente
│   ├── schema-nbcw.sql         # Schema NBCW (tabla tpr standalone)
│   ├── seeds.sql               # Datos iniciales
│   └── create_users.sql        # Script para crear usuarios
├── scripts/
│   ├── sync-nbcw-to-neon.js    # Sync principal (SQL Server → PostgreSQL)
│   ├── sync-nbcw-to-neon.ps1   # Versión PowerShell
│   ├── run-sync.bat            # Launcher Windows
│   ├── sync-standalone/        # Versión standalone (PC on-premise)
│   ├── extract-schema.mjs      # Utilidad: extraer schema de Neon
│   └── fix-pdf-url.mjs         # Utilidad: corregir pdf_url
├── src/
│   ├── components/             # Componentes React
│   ├── context/                # AuthContext, InspectionContext, LanguageContext
│   ├── data/                   # Puntos de inspección + errores
│   ├── hooks/                  # usePagination
│   ├── i18n/                   # Traducciones es/en
│   ├── utils/                  # api.js, pdfGenerator.js, offlineDB.js, syncManager.js
│   ├── App.jsx
│   └── main.jsx
├── public/                     # Assets estáticos (favicon, logos)
├── server.js                   # Express server local (mirror de Vercel)
├── vite.config.js
├── vercel.json
└── package.json
```

## Instalación local

```bash
npm install
npm run dev
```

Frontend: http://localhost:5173
API local: http://localhost:3001 (requiere `server.js`)

## Variables de entorno

```env
DATABASE_URL=postgresql://user:password@host/dbname?sslmode=require
BLOB_READ_WRITE_TOKEN=<vercel_blob_token>
BLOB_STORE_ID=<vercel_blob_store_id>
API_PORT=3001
```

## Build de producción

```bash
npm run build
npm run preview
```

## Despliegue en Vercel

El proyecto se despliega automáticamente al hacer push a `main`.

---

© 2025 Crown Xpress Transport - Logistics Transport
