# Crown Xpress Transport - 20 Point Inspection

Sistema profesional de inspección de 20 puntos para tractores y remolques de Crown Xpress Transport.

## Características

- ✅ **Bilingüe** - Español / Inglés
- ✅ **20 puntos de inspección** estandarizados (CTPAT / OEA)
- ✅ **Captura de fotos en vivo** - solo cámara, sin galería
- ✅ **Validación de fotos** - detección básica de fotos inválidas
- ✅ **Lista predefinida de errores** - sin comentarios libres
- ✅ **Firma digital** del guardia (obligatoria) y auditor (opcional)
- ✅ **Generación de PDF** profesional
- ✅ **Diseño responsive** - funciona en tablets y móviles
- ✅ **Branding Crown Xpress** - colores oro y navy

## Stack Tecnológico

- **React 18** + **Vite 5**
- **TailwindCSS 3** - Estilos
- **Lucide React** - Íconos
- **jsPDF** + **jspdf-autotable** - Generación PDF
- **html2canvas** - Captura visual

## Instalación local

```bash
npm install
npm run dev
```

Abrir [http://localhost:5173](http://localhost:5173)

## Build de producción

```bash
npm run build
npm run preview
```

## Despliegue en Vercel

El proyecto está configurado para desplegar automáticamente en Vercel.

```bash
npm run build
# Vercel detectará la carpeta dist automáticamente
```

## Estructura

```
src/
├── components/      # Componentes UI
├── context/         # Estado global (InspectionContext)
├── data/            # Puntos e información estática
├── i18n/            # Traducciones ES/EN
├── utils/           # PDF, validación de fotos
├── App.jsx
└── main.jsx
```

## Próximos pasos

- [ ] Integración con Google Drive para guardar PDFs
- [ ] Validación con IA del contenido de las fotos
- [ ] Login con autenticación
- [ ] Diagrama interactivo del camión con marcado de fallas
- [ ] Sistema de roles (Operador / Guardia / Auditor / Admin)

---

© 2025 Crown Xpress Transport - Logistics Transport
