# 🚀 ATHENEA - Guía de Inicio Rápido

## ✅ Estado Actual
**Todas las funcionalidades solicitadas están implementadas y funcionando.**

El servidor de desarrollo está corriendo en: **http://localhost:3000/**

---

## 📱 Módulos Disponibles

### 1️⃣ Dashboard (🏠)
**Ruta:** `/dashboard`

**Características:**
- 8 tarjetas de estadísticas con datos en tiempo real
- Proyectos recientes con progreso
- 5 botones de acciones rápidas
- Sección de alertas (stock bajo, tareas vencidas)

**Cómo Usar:**
- Es la página principal después del login
- Ver resumen completo de toda la aplicación
- Click en cualquier acción rápida para ir al módulo

---

### 2️⃣ Projects (📋)
**Ruta:** `/projects`

**Características:**
- Lista de todos los proyectos
- Crear nuevos proyectos
- Ver detalles de cada proyecto
- Editar planos de planta
- Gestionar puntos de cableado

**Datos de Ejemplo:**
- Varios proyectos pre-cargados
- Con diferentes estados (pending, in-progress, completed)

---

### 3️⃣ Users (👥) - **NUEVO**
**Ruta:** `/users`

**Características:**
- Tabla de todos los usuarios
- 4 roles con colores: Admin, Supervisor, Lead Technician, Technician
- Agregar, editar y eliminar usuarios
- Estado activo/inactivo

**Prueba Esto:**
1. Click en "+ Add User"
2. Llena el formulario:
   - Nombre: "Test User"
   - Email: "test@example.com"
   - Rol: Selecciona cualquiera
3. Click en "Add User"
4. El usuario aparece en la tabla
5. Prueba editar o eliminar

**Usuarios Pre-cargados:**
- admin@ATHENEA.com (Admin)
- sarah.super@ATHENEA.com (Supervisor)
- john.lead@ATHENEA.com (Lead Technician)
- mike.tech@ATHENEA.com (Technician)

---

### 4️⃣ Inventory (📦) - **NUEVO**
**Ruta:** `/inventory`

**Características:**
- Vista dual: Warehouse (almacén) y Project (por proyecto)
- Agregar/editar/eliminar items
- Transferir items de almacén a proyectos
- Alertas de stock bajo (resaltado en rojo)
- 5 categorías: Cable, Connector, Equipment, Tool, Other

**Prueba Esto:**

**Vista Warehouse:**
1. Ve a la vista "Warehouse"
2. Observa los 4 items pre-cargados
3. Items en rojo tienen stock bajo (cantidad ≤ stock mínimo)
4. Click en "+ Add Item" para agregar nuevo
5. Click en "Transfer" para mover stock a un proyecto

**Vista Project:**
1. Cambia a vista "Project"
2. Filtra por proyecto en el dropdown
3. Ve los items asignados a cada proyecto
4. Edita cantidades según necesites

**Items Pre-cargados en Almacén:**
- 50 x Cat6 Cable (1000ft rolls)
- 1000 x RJ45 Connectors
- 5 x Network Switch (24-port)
- 20 x Fiber Optic Cable

---

### 5️⃣ Production Tracking (🔧) - **NUEVO**
**Ruta:** `/production`

**Características:**
- Gestión completa de tareas de producción
- 4 estados: Pending, In Progress, Completed, Blocked
- 3 prioridades: Low, Medium, High
- Actualizar progreso con modal dedicado
- Seguimiento de horas trabajadas vs estimadas
- Detección automática de tareas vencidas
- Filtros por estado, proyecto, usuario
- Ordenar por fecha, prioridad o progreso

**Prueba Esto:**

**Crear Nueva Tarea:**
1. Click en "+ Add Task"
2. Completa el formulario:
   - Task Name: "Test Installation"
   - Selecciona un proyecto
   - Asigna a un usuario
   - Establece fechas
   - Horas estimadas: 8
3. Click en "Add Task"

**Actualizar Progreso:**
1. En la tabla, encuentra una tarea "In Progress"
2. Click en el icono 📊 (botón azul)
3. Actualiza:
   - Horas trabajadas
   - Progreso (%) con el slider
   - Notas de progreso
4. Click en "Update Progress"
5. La barra de progreso se actualiza automáticamente

**Cambiar Estado:**
1. En la columna "Status", hay un dropdown
2. Click y selecciona nuevo estado
3. El color cambia automáticamente
4. Si pones 100% progreso → auto-completa

**Filtrar Tareas:**
1. Usa los dropdowns superiores para filtrar
2. Filtra por estado específico
3. Filtra por proyecto
4. Filtra por usuario asignado
5. Ordena por fecha/prioridad/progreso

**Tareas Pre-cargadas:**
- Cable Installation - Floor 1 (50% en progreso)
- Equipment Installation (pendiente)
- Fiber Optic Installation (100% completado)
- Testing and Certification (60% en progreso)

---

## 🎯 Flujo de Trabajo Sugerido

### Escenario: Nuevo Proyecto de Cableado

1. **Dashboard** → Ver estadísticas generales
2. **Projects** → "+ Create Project" → Completar datos del proyecto
3. **Users** → Asignar equipo al proyecto
4. **Inventory** → Verificar stock en almacén
5. **Inventory** → Transferir materiales necesarios al proyecto
6. **Production** → Crear tareas de instalación
7. **Production** → Asignar tareas a técnicos
8. Durante el trabajo:
   - **Production** → Actualizar progreso de tareas
   - **Inventory** → Ajustar cantidades según uso
9. Al finalizar:
   - **Production** → Marcar tareas como completadas
   - **Projects** → Actualizar estado del proyecto

---

## 📊 Estadísticas en Dashboard

El Dashboard muestra en tiempo real:
- ✅ Total de proyectos
- ✅ Proyectos activos
- ✅ Proyectos completados
- ✅ Total de puntos de cableado
- ✅ **Usuarios activos** (nuevo)
- ✅ **Items en almacén** (nuevo)
- ✅ **Alertas de stock bajo** (nuevo)
- ✅ **Tareas activas** (nuevo)

---

## 🔔 Sistema de Alertas

El Dashboard muestra alertas automáticas cuando:

### Alerta de Stock Bajo:
- Se activa cuando un item de almacén tiene cantidad ≤ stock mínimo
- Aparece en tarjeta amarilla con icono ⚠️
- Click en "View →" para ir directo a Inventory

### Alerta de Tareas Vencidas:
- Se activa cuando hay tareas con fecha vencida y no completadas
- Aparece en tarjeta roja con icono 🚨
- Click en "View →" para ir directo a Production

---

## 🎨 Características de UX

### Colores por Rol (Users):
- 🟣 **Admin** - Púrpura (#667eea)
- 🟠 **Supervisor** - Naranja (#ed8936)
- 🔵 **Lead Technician** - Azul (#4299e1)
- 🟢 **Technician** - Verde (#48bb78)

### Colores por Estado (Production):
- ⚪ **Pending** - Gris
- 🔵 **In Progress** - Azul
- 🟢 **Completed** - Verde
- 🔴 **Blocked** - Rojo

### Colores por Prioridad (Production):
- ⚪ **Low** - Gris
- 🟠 **Medium** - Naranja
- 🔴 **High** - Rojo

### Categorías de Inventario:
- 🔵 **Cable** - Azul
- 🟢 **Connector** - Verde
- 🟠 **Equipment** - Naranja
- 🟣 **Tool** - Púrpura
- ⚪ **Other** - Gris

---

## 💾 Persistencia de Datos

**Todos los datos se guardan automáticamente en localStorage:**
- No se pierden al recargar la página
- Incluye: proyectos, usuarios, inventario, tareas
- Se mantienen entre sesiones

**Para resetear datos:**
1. Abre DevTools (F12)
2. Application → Storage → Local Storage
3. Elimina "persist:root"
4. Recarga la página

---

## ✅ Checklist de Prueba

### Users Module:
- [ ] Crear nuevo usuario
- [ ] Editar usuario existente
- [ ] Eliminar usuario
- [ ] Verificar badges de colores por rol
- [ ] Ver que persiste al recargar

### Inventory Module:
- [ ] Agregar item al almacén
- [ ] Transferir item a proyecto
- [ ] Ver items por proyecto
- [ ] Verificar alerta de stock bajo (rojo)
- [ ] Editar cantidades
- [ ] Eliminar item

### Production Module:
- [ ] Crear nueva tarea
- [ ] Actualizar progreso (📊)
- [ ] Cambiar estado desde dropdown
- [ ] Verificar auto-complete al 100%
- [ ] Filtrar por estado/proyecto/usuario
- [ ] Ver tareas vencidas en rojo
- [ ] Editar tarea existente
- [ ] Eliminar tarea

### Dashboard:
- [ ] Ver 8 tarjetas de estadísticas
- [ ] Click en acciones rápidas
- [ ] Ver alertas (si hay stock bajo o tareas vencidas)
- [ ] Verificar datos en tiempo real

### Navigation:
- [ ] Navbar muestra todos los links
- [ ] Active state funciona (fondo púrpura claro)
- [ ] Todos los iconos visibles

---

## 🐛 Troubleshooting

### "Cannot read property of undefined"
**Solución:** Asegúrate que todos los slices están en el store:
```javascript
// src/store/index.js debe incluir:
- authReducer
- projectsReducer
- pointsReducer
- usersReducer
- inventoryReducer
- productionReducer
```

### Modal no se ve
**Solución:** Ya corregido. Z-index alto (9999/10000) aplicado.

### Datos no persisten
**Solución:** Verificar que redux-persist esté configurado con whitelist completo.

---

## 📱 Responsive Design

Todos los módulos son responsive:
- **Desktop:** Grid layouts con múltiples columnas
- **Tablet:** 2 columnas en stats, tablas con scroll horizontal
- **Mobile:** 1 columna, modales fullscreen

---

## 🎓 Credenciales de Login

Para probar la aplicación, usa cualquiera de estos usuarios:

**Admin:**
- Email: admin@ATHENEA.com
- Password: (cualquiera, el login es demo)

**Supervisor:**
- Email: sarah.super@ATHENEA.com
- Password: (cualquiera)

**Lead Technician:**
- Email: john.lead@ATHENEA.com
- Password: (cualquiera)

**Technician:**
- Email: mike.tech@ATHENEA.com
- Password: (cualquiera)

---

## 🚀 Comandos

```bash
# Iniciar desarrollo
npm run dev

# Build para producción
npm run build

# Preview de producción
npm run preview
```

---

## 📝 Próximos Pasos Sugeridos

Ahora que todos los módulos están completos, podrías:

1. **Añadir autenticación real** (actualmente es demo)
2. **Conectar a backend** (API REST o GraphQL)
3. **Reportes y exportación** (PDF, Excel)
4. **Notificaciones push** para alertas
5. **Gráficas avanzadas** (charts con Chart.js o Recharts)
6. **Búsqueda global** entre todos los módulos
7. **Modo oscuro** (dark mode)
8. **Internacionalización** (i18n para múltiples idiomas)

---

**¡Disfruta tu aplicación ATHENEA completamente funcional! 🎉**

*Si encuentras algún problema o necesitas más funcionalidades, no dudes en solicitarlo.*
