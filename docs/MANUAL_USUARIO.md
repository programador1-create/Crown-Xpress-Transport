# Manual de Usuario - Sistema de Inspecciones Crown Xpress Transport

## Índice

1. [Introducción](#1-introducción)
2. [Requisitos del Sistema](#2-requisitos-del-sistema)
3. [Acceso al Sistema](#3-acceso-al-sistema)
4. [Tipos de Inspección](#4-tipos-de-inspección)
5. [Creación de Inspección](#5-creación-de-inspección)
6. [Inspección con Datos NBCW](#6-inspección-con-datos-nbcw)
7. [Inspección Manual](#7-inspección-manual)
8. [Tipos de Remolque](#8-tipos-de-remolque)
9. [Puntos de Inspección](#9-puntos-de-inspección)
10. [Firma del Operador](#10-firma-del-operador)
11. [Generación de PDF](#11-generación-de-pdf)
12. [Vista de Supervisor](#12-vista-de-supervisor)
13. [Firma del Supervisor](#13-firma-del-supervisor)
14. [Gestión de Empleados](#14-gestión-de-empleados)
15. [Gestión de Yardas](#15-gestión-de-yardas)
16. [Historial de Inspecciones](#16-historial-de-inspecciones)
17. [Sincronización de Datos](#17-sincronización-de-datos)
18. [Solución de Problemas](#18-solución-de-problemas)

---

## 1. Introducción

El Sistema de Inspecciones Crown Xpress Transport es una aplicación web diseñada para gestionar el proceso de inspección de vehículos de transporte, incluyendo tractores, remolques, contenedores y camiones rígidos (RABON). El sistema permite:

- Crear inspecciones con datos de NBCW o manualmente
- Seleccionar diferentes tipos de inspección según el estado del vehículo
- Registrar puntos de inspección con evidencia fotográfica
- Generar reportes PDF con diagramas del vehículo
- Firmar digitalmente inspecciones (operador y supervisor)
- Gestionar empleados y asignaciones de yardas
- Sincronizar datos con la base de datos Neon

---

## 2. Requisitos del Sistema

### Requisitos Técnicos
- Navegador web moderno (Chrome, Firefox, Edge, Safari)
- Conexión a internet estable
- Dispositivo con cámara para capturar fotos (opcional pero recomendado)

### Credenciales de Acceso
- Usuario y contraseña proporcionados por el administrador
- Asignación a una yarda específica (configurada por el administrador)

---

## 3. Acceso al Sistema

### Paso 1: Abrir la Aplicación
1. Abra su navegador web
2. Ingrese la URL de la aplicación proporcionada por el administrador
3. Espere a que cargue la página de inicio de sesión

**[CAPTURA: Pantalla de inicio de sesión]**

### Paso 2: Iniciar Sesión
1. Ingrese su nombre de usuario en el campo "Usuario"
2. Ingrese su contraseña en el campo "Contraseña"
3. Haga clic en el botón "Iniciar Sesión"

**[CAPTURA: Formulario de inicio de sesión con datos ingresados]**

### Paso 3: Verificar Acceso
- Si las credenciales son correctas, será redirigido al panel principal
- Si hay un error, verifique sus credenciales e intente nuevamente

**[CAPTURA: Panel principal después del inicio de sesión exitoso]**

---

## 4. Tipos de Inspección

El sistema soporta los siguientes tipos de inspección:

| Tipo | Descripción | Diagrama |
|------|-------------|----------|
| **LOADED** | Contenedor/Remolque cargado | Diagrama de vehículo cargado |
| **EMPTY** | Contenedor/Remolque vacío | Diagrama de vehículo vacío |
| **BOBTAIL** | Solo tractor (sin remolque) | Diagrama de tractor solo |
| **FLATBED** | Plataforma (flatbed) | Diagrama de plataforma |
| **RABON** | Camión rígido (tractor y chasis integrados) | Diagrama de RABON |

**[CAPTURA: Selector de tipos de inspección]**

---

## 5. Creación de Inspección

### Paso 1: Seleccionar Tipo de Inspección
1. En el panel principal, haga clic en "Nueva Inspección"
2. Seleccione el tipo de inspección apropiado para el vehículo a inspeccionar

**[CAPTURA: Botón Nueva Inspección y selector de tipo]**

### Paso 2: Elegir Método de Ingreso de Datos
El sistema ofrece dos métodos para ingresar datos del vehículo:

- **Con datos NBCW**: Importa datos automáticamente del sistema NBCW
- **Manual**: Ingrese los datos del vehículo manualmente

**[CAPTURA: Opciones de método de ingreso de datos]**

---

## 6. Inspección con Datos NBCW

### Paso 1: Seleccionar Movimiento NBCW
1. Seleccione "Con datos NBCW"
2. El sistema mostrará una lista de movimientos disponibles de los últimos 2 días
3. Los movimientos mostrados corresponden a su yarda asignada

**[CAPTURA: Lista de movimientos NBCW]**

### Paso 2: Filtrar Movimientos (Opcional)
- Puede filtrar por fecha para ver movimientos específicos
- El filtro predeterminado muestra movimientos de los últimos 2 días

**[CAPTURA: Filtro de fecha aplicado]**

### Paso 3: Seleccionar Movimiento
1. Haga clic en el movimiento deseado de la lista
2. El sistema importará automáticamente:
   - Número de tractor
   - Número de contenedor/remolque
   - Prefijo del cliente
   - Nombre del operador
   - Tipo de inspección (según el tipo de equipo)
   - Número de orden de trabajo

**[CAPTURA: Movimiento seleccionado con datos importados]**

### Paso 4: Verificar Datos Importados
1. Revise los datos importados
2. Si algún dato es incorrecto, puede editarlo manualmente
3. Haga clic en "Continuar" para proceder con la inspección

**[CAPTURA: Datos importados verificados]**

---

## 7. Inspección Manual

### Paso 1: Seleccionar Inspección Manual
1. Seleccione "Manual" en el método de ingreso
2. Ingrese los datos del vehículo manualmente

**[CAPTURA: Formulario de inspección manual]**

### Paso 2: Ingresar Datos del Tractor
1. Ingrese el número de tractor
2. Haga clic en "Continuar"

**[CAPTURA: Campo de número de tractor]**

### Paso 3: Ingresar Datos del Remolque/Contenedor
1. Seleccione el tipo de remolque (CONTAINER, FLATBED, RABON, etc.)
2. Ingrese el tamaño del remolque (20', 40', 45', etc.)
3. Seleccione el propietario del equipo (CROWN o CUSTOMER)
4. Si es CUSTOMER, ingrese el prefijo del cliente
5. Ingrese el número de contenedor/remolque

**[CAPTURA: Formulario de datos del remolque]**

### Paso 4: Ingresar Datos Adicionales
1. Si aplica, ingrese el número de sello
2. Si aplica, ingrese el número de lock
3. Ingrese el nombre del operador
4. Haga clic en "Continuar"

**[CAPTURA: Datos adicionales ingresados]**

---

## 8. Tipos de Remolque

### CONTAINER
- Para contenedores estándar (20', 40', 45')
- Requiere prefijo del cliente si es CUSTOMER

**[CAPTURA: Selección de tipo CONTAINER]**

### FLATBED
- Para plataformas planas
- No requiere sello ni lock
- Puntos de inspección específicos para plataforma

**[CAPTURA: Selección de tipo FLATBED]**

### RABON
- Para camiones rígidos (tractor y chasis integrados)
- Puntos de inspección específicos para RABON
- Diagrama especial de camión rígido

**[CAPTURA: Selección de tipo RABON]**

### BOBTAIL
- Solo tractor sin remolque
- Se detecta automáticamente desde NBCW
- Diagrama de tractor solo

**[CAPTURA: Detección automática de BOBTAIL]**

---

## 9. Puntos de Inspección

### Paso 1: Ver Diagrama del Vehículo
1. El sistema mostrará el diagrama correspondiente al tipo de vehículo
2. Los puntos de inspección aparecerán como marcadores sobre el diagrama

**[CAPTURA: Diagrama con puntos de inspección]**

### Paso 2: Inspeccionar Cada Punto
1. Haga clic en un punto de inspección en el diagrama
2. Revise el área correspondiente del vehículo
3. Registre el estado:
   - **OK**: Sin problemas
   - **REPAIR**: Requiere reparación
   - **REPLACE**: Requiere reemplazo

**[CAPTURA: Selección de estado del punto]**

### Paso 3: Agregar Evidencia Fotográfica (Opcional)
1. Haga clic en el ícono de cámara
2. Tome o seleccione una foto del área inspeccionada
3. La foto se adjuntará al punto de inspección

**[CAPTURA: Captura de foto para punto de inspección]**

### Paso 4: Agregar Notas (Opcional)
1. En el campo de notas, describa cualquier problema encontrado
2. Las notas se incluirán en el reporte PDF

**[CAPTURA: Campo de notas para punto de inspección]**

### Paso 5: Completar Todos los Puntos
1. Repita el proceso para todos los puntos de inspección
2. Los puntos completados se marcarán en verde
3. Los puntos pendientes se mostrarán en gris

**[CAPTURA: Todos los puntos completados]**

---

## 10. Firma del Operador

### Paso 1: Completar Inspección
1. Una vez que todos los puntos estén inspeccionados, haga clic en "Completar Inspección"
2. El sistema le pedirá que firme la inspección

**[CAPTURA: Botón Completar Inspección]**

### Paso 2: Firmar Digitalmente
1. Use su dedo o mouse para firmar en el área de firma
2. Si comete un error, haga clic en "Limpiar" para intentar nuevamente
3. Haga clic en "Confirmar Firma" cuando esté satisfecho

**[CAPTURA: Área de firma del operador]**

### Paso 3: Confirmar Firma
1. Revise su firma
2. Haga clic en "Confirmar" para finalizar
3. La inspección se guardará como completada

**[CAPTURA: Confirmación de firma exitosa]**

---

## 11. Generación de PDF

### Paso 1: Generar Reporte
1. Después de confirmar la firma, el sistema generará automáticamente el reporte PDF
2. El PDF incluirá:
   - Datos del vehículo
   - Diagrama del vehículo con puntos inspeccionados
   - Evidencia fotográfica
   - Firma del operador
   - Notas y observaciones

**[CAPTURA: PDF generado con todos los datos]**

### Paso 2: Descargar PDF
1. El PDF se descargará automáticamente a su dispositivo
2. También puede ver el PDF en el historial de inspecciones

**[CAPTURA: PDF descargado]**

---

## 12. Vista de Supervisor

### Paso 1: Acceder a Vista de Supervisor
1. Los usuarios con rol de supervisor pueden acceder a la vista de supervisor
2. Haga clic en "Vista de Supervisor" en el menú principal

**[CAPTURA: Botón Vista de Supervisor]**

### Paso 2: Ver Inspecciones Pendientes
1. La vista de supervisor muestra todas las inspecciones de su yarda asignada
2. Las inspecciones se agrupan por estado:
   - **Pendientes de firma**: Inspecciones que requieren firma del supervisor
   - **Completadas**: Inspecciones ya firmadas

**[CAPTURA: Lista de inspecciones en vista de supervisor]**

### Paso 3: Filtrar Inspecciones
- Puede filtrar por fecha, tipo de inspección, o estado
- Use los filtros en la parte superior de la lista

**[CAPTURA: Filtros aplicados en vista de supervisor]**

---

## 13. Firma del Supervisor

### Paso 1: Seleccionar Inspección
1. Haga clic en una inspección pendiente de firma
2. Revise los detalles de la inspección
3. Haga clic en "Ver PDF" para revisar el reporte

**[CAPTURA: Inspección seleccionada en vista de supervisor]**

### Paso 2: Revisar Inspección
1. Revise todos los puntos de inspección
2. Verifique que la evidencia fotográfica sea adecuada
3. Revise las notas y observaciones

**[CAPTURA: Revisión de inspección]**

### Paso 3: Firmar Inspección
1. Si está satisfecho con la inspección, haga clic en "Firmar"
2. Use su dedo o mouse para firmar en el área de firma
3. Haga clic en "Confirmar Firma"

**[CAPTURA: Firma del supervisor]**

### Paso 4: Confirmar y Regenerar PDF
1. El sistema regenerará el PDF con su firma
2. La inspección se marcará como completada
3. El PDF actualizado estará disponible en el historial

**[CAPTURA: PDF regenerado con firma del supervisor]**

---

## 14. Gestión de Empleados

**Nota: Esta función está disponible solo para administradores.**

### Paso 1: Acceder a Gestión de Empleados
1. Haga clic en "Gestión de Empleados" en el menú
2. Verá la lista de todos los empleados

**[CAPTURA: Lista de empleados]**

### Paso 2: Agregar Nuevo Empleado
1. Haga clic en "Agregar Empleado"
2. Ingrese los datos del empleado:
   - Nombre completo
   - Usuario
   - Contraseña
   - Rol (Operador, Supervisor, Administrador)
   - Yarda asignada
3. Haga clic en "Guardar"

**[CAPTURA: Formulario de nuevo empleado]**

### Paso 3: Editar Empleado
1. Haga clic en el empleado que desea editar
2. Modifique los datos necesarios
3. Haga clic en "Guardar"

**[CAPTURA: Edición de empleado]**

### Paso 4: Eliminar Empleado
1. Haga clic en el empleado que desea eliminar
2. Haga clic en "Eliminar"
3. Confirme la eliminación

**[CAPTURA: Confirmación de eliminación de empleado]**

---

## 15. Gestión de Yardas

**Nota: Esta función está disponible solo para administradores.**

### Paso 1: Acceder a Gestión de Yardas
1. Haga clic en "Gestión de Yardas" en el menú
2. Verá la lista de todas las yardas

**[CAPTURA: Lista de yardas]**

### Paso 2: Agregar Nueva Yarda
1. Haga clic en "Agregar Yarda"
2. Ingrese el nombre de la yarda
3. Ingrese el código de la yarda
4. Haga clic en "Guardar"

**[CAPTURA: Formulario de nueva yarda]**

### Paso 3: Asignar Supervisor a Yarda
1. Seleccione la yarda
2. Haga clic en "Asignar Supervisor"
3. Seleccione el supervisor de la lista
4. Haga clic en "Guardar"

**[CAPTURA: Asignación de supervisor a yarda]**

---

## 16. Historial de Inspecciones

### Paso 1: Acceder al Historial
1. Haga clic en "Historial" en el menú principal
2. Verá todas sus inspecciones realizadas

**[CAPTURA: Historial de inspecciones]**

### Paso 2: Filtrar Historial
- Puede filtrar por fecha, tipo de inspección, o estado
- Use los filtros en la parte superior

**[CAPTURA: Historial con filtros aplicados]**

### Paso 3: Ver Detalles de Inspección
1. Haga clic en una inspección del historial
2. Verá todos los detalles de la inspección
3. Puede descargar el PDF nuevamente si es necesario

**[CAPTURA: Detalles de inspección en historial]**

---

## 17. Sincronización de Datos

### Información General
El sistema sincroniza automáticamente los datos de NBCW con la base de datos Neon cada 5 minutos mediante:

1. **Script PowerShell**: Extrae datos de SQL Server NBCW
2. **Script Node.js**: Inserta datos en Neon PostgreSQL
3. **Task Scheduler**: Ejecuta la sincronización automáticamente

### Verificar Sincronización
1. Los datos NBCW en la aplicación se actualizan automáticamente
2. Si no ve datos recientes, verifique que el Task Scheduler esté funcionando
3. Contacte al administrador si hay problemas de sincronización

**[CAPTURA: Verificación de sincronización]**

---

## 18. Solución de Problemas

### Problema: No puedo iniciar sesión
**Solución:**
- Verifique que su usuario y contraseña sean correctos
- Asegúrese de tener conexión a internet
- Contacte al administrador si el problema persiste

### Problema: No aparecen movimientos NBCW
**Solución:**
- Verifique que esté asignado a una yarda
- Asegúrese que la sincronización esté funcionando
- Ajuste el filtro de fecha para incluir más días

### Problema: El diagrama no muestra el tipo correcto de vehículo
**Solución:**
- Verifique que seleccionó el tipo de remolque correcto
- Para BOBTAIL, asegúrese que el movimiento NBCW sea de tipo botada
- Para RABON, seleccione explícitamente el tipo RABON

### Problema: No puedo firmar la inspección
**Solución:**
- Asegúrese que todos los puntos de inspección estén completados
- Verifique que haya ingresado todos los datos requeridos
- Intente recargar la página

### Problema: El PDF no se genera
**Solución:**
- Verifique su conexión a internet
- Asegúrese que todos los datos estén completos
- Contacte al administrador si el problema persiste

### Problema: No puedo ver inspecciones en Vista de Supervisor
**Solución:**
- Verifique que tenga rol de supervisor
- Asegúrese que esté asignado a una yarda
- Contacte al administrador para verificar sus permisos

---

## Contacto de Soporte

Para problemas técnicos o preguntas adicionales, contacte:

- **Soporte Técnico**: [Email de soporte]
- **Administrador del Sistema**: [Email del administrador]
- **Teléfono**: [Número de teléfono]

---

## Versión del Documento

- **Versión**: 1.0
- **Fecha**: Junio 2026
- **Sistema**: Crown Xpress Transport - Sistema de Inspecciones

---

## Notas Finales

Este manual está diseñado para guiar a los usuarios a través de todas las funcionalidades del sistema. Para sugerencias o mejoras al manual, contacte al administrador del sistema.

**[CAPTURA: Logo de Crown Xpress Transport]**
