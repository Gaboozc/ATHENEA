# 🎯 ATHENEA Autonomous Execution - Quick Test Examples

## Comandos para Probar el Sistema Autónomo

### ✅ **Auto-Ejecutan Inmediatamente (Confianza ≥ 90%)**

#### Work Hub - Tareas

```
✓ "create task 'Fix login bug' due tomorrow 3 hours"
✓ "add urgent task review pull request"
✓ "add task 'Update documentation' to Project Alpha"
✓ "new task implement feature X high priority"
```

#### Personal Hub - Recordatorios

```
✓ "set reminder to buy milk at 5pm tomorrow"
✓ "create reminder call mom tonight at 8pm"
✓ "add reminder dentist appointment next Monday 2pm"
✓ "set reminder to take medicine at 9am"
```

#### Personal Hub - Notas

```
✓ "create note titled 'Meeting Notes' with content 'Important points'"
✓ "add note 'Ideas for Q2' tagged productivity"
✓ "new note 'Shopping List' with content 'Milk, Eggs, Bread'"
```

#### Finance Hub - Transacciones

```
✓ "spent $45.50 on coffee at Starbucks"
✓ "paid $20 for uber to airport"
✓ "bought shirt for $30.99 with card"
✓ "record $100 income from freelance work"
```

---

### ⚠️ **Requieren Confirmación (Confianza 60-89%)**

```
⚠️ "add task fix bug"                    → Falta: descripción detallada
⚠️ "create reminder"                     → Falta: título
⚠️ "pay debt"                            → Ejecuta si encuentra payment ID
⚠️ "spent money on food"                 → Falta: monto específico
```

---

### ❌ **Muestran Canvas / Opciones (Confianza < 60%)**

```
❌ "do something"
❌ "help me"
❌ "what can you do"
❌ "remind me"
```

---

## 🗣️ **Comandos de Voz Recomendados**

### Activar Voz
- Presiona el botón **"Mic"** en el Omnibar
- O abre Omnibar con **Ctrl+K** y presiona **Mic**

### Comandos que Funcionan Perfecto por Voz

```
🎤 "Set a reminder to buy milk at five PM tomorrow"
   → Auto-ejecuta, muestra toast, cierra en 1.5s

🎤 "Create task fix production bug urgent"
   → Auto-ejecuta con priority: critical

🎤 "Add note titled meeting notes"
   → Auto-ejecuta, genera note ID

🎤 "Spent forty five dollars on coffee"
   → Auto-ejecuta, category: food automática

🎤 "Schedule meeting with team next Monday at two PM"
   → Auto-ejecuta con fecha calculada
```

### Comandos de Voz con Fallback Inteligente

```
🎤 "Create reminder"
   → TTS: "I need more information: reminder title"
   → Toast: "ℹ️ Please provide: reminder title"
   → Canvas se abre para completar

🎤 "Add task"
   → TTS: "What's the task title?"
   → Canvas con campo title vacío
```

---

## 🎯 **Testing Step by Step**

### Test 1: Auto-ejecución con Texto
1. Abre Omnibar: **Ctrl+K**
2. Escribe: `create task 'Test autonomous flow' due tomorrow`
3. Presiona **Enter**
4. **Esperado**:
   - ✅ Sonido de éxito (ding suave)
   - ✅ Toast verde: "✅ Add Task completed: Test autonomous flow"
   - ✅ Omnibar se cierra en 0.8 segundos
   - ✅ Tarea aparece en WorkHub

### Test 2: Auto-ejecución con Voz
1. Abre Omnibar: **Ctrl+K**
2. Presiona **Mic**
3. Di: "set reminder to test voice at three PM"
4. **Esperado**:
   - ✅ Sonido de éxito
   - ✅ Toast: "✅ Add Reminder: test voice for 3:00 PM"
   - ✅ Omnibar se cierra en 1.5 segundos
   - ✅ Recordatorio creado en PersonalHub

### Test 3: Fallback con Voz
1. Abre Omnibar: **Ctrl+K**
2. Presiona **Mic**
3. Di: "create reminder"
4. **Esperado**:
   - 🗣️ Escuchas: "I need more information: reminder title"
   - ℹ️ Toast azul: "Please provide: reminder title"
   - 📋 Canvas abierto con campo title vacío
   - ✏️ Completas info manualmente

### Test 4: Smart Parameter Resolution
1. Abre Omnibar: **Ctrl+K**
2. Escribe: `liquidar deuda` (si tienes finanzas pendientes)
3. Presiona **Enter**
4. **Esperado**:
   - ✅ Encuentra automáticamente el payment más reciente sin pagar
   - ✅ Lo marca como pagado
   - ✅ Toast: "✅ Mark Payment Complete"

### Test 5: Inferencia de Categorías
1. Abre Omnibar: **Ctrl+K**
2. Escribe: `spent $25 on uber`
3. **Esperado**:
   - ✅ category: "transport" (inferido automáticamente)
   - ✅ amount: 25 (extraído)
   - ✅ Auto-ejecuta si confianza ≥ 90%

---

## 🎨 **Observar Comportamiento del Sistema**

### Ver Confianza en Tiempo Real

Cuando el comando NO auto-ejecuta y muestra Canvas:
- Busca el badge de confianza en la esquina superior
- Verde (≥80%): Alta confianza
- Amarillo (60-79%): Confianza media
- Rojo (<60%): Baja confianza

### Ver Parámetros Extraídos

Abre la consola del navegador y observa:
```
[Intelligence] Auto-executing with 95% confidence
```

Si NO auto-ejecuta:
```
Matched intent "add_task" to skill "Add Task" (78% confidence) - Missing: task title
```

---

## 🔧 **Troubleshooting**

### No escucho sonidos
1. Verifica que tu navegador permita audio
2. Comprueba volumen del sistema
3. Abre consola, busca warnings de Audio API

### Voz no funciona
1. Solo Chrome/Edge soportan Web Speech API
2. Da permisos de micrófono
3. Prueba con conexión HTTPS (localhost funciona)

### Auto-ejecuta cuando no debería
- Ajusta `AUTO_EXECUTE_THRESHOLD` en `useIntelligence.ts`
- Valor por defecto: 90
- Aumenta a 95 para ser más conservador

### No auto-ejecuta cuando debería
- Verifica que los parámetros requeridos estén presentes
- Usa comillas para títulos: `"My Task Title"`
- Sé más específico: "due tomorrow" en lugar de "soon"

---

## 📊 **Debugging con Consola**

### Ver Flujo Completo

```javascript
// Abrir consola (F12) y ejecutar:
localStorage.setItem('debug_intelligence', 'true');

// Ahora verás logs detallados:
// - Parámetros extraídos
// - Confianza calculada
// - Decisión de auto-ejecución
// - Estado de parámetros requeridos
```

### Deshabilitar Audio Temporalmente

```javascript
// En consola:
import { setAudioEnabled } from '@/modules/intelligence';
setAudioEnabled(false);
```

---

## 🎯 **Métricas de Éxito**

### Un sistema autónomo exitoso debe:

✅ **80%+ de comandos claros auto-ejecutan**
- "create task X due Y" → Ejecuta sin preguntar

✅ **Fallback solo cuando necesario**
- "create task" → Pide título (correcto)

✅ **Audio feedback consistente**
- Siempre suena después de auto-ejecución

✅ **Toasts informativos**
- Confirman qué se hizo sin interrumpir

✅ **Smart resolution funciona**
- "tomorrow" → Fecha correcta
- "liquidar deuda" → Encuentra payment ID

---

## 🚀 **Casos de Uso Avanzados**

### Workflow Completo por Voz

```
1. Ctrl+K → Mic
   "create project alpha"
   
2. Auto-ejecuta proyecto

3. Ctrl+K → Mic
   "add task implement backend to project alpha"
   
4. Auto-ejecuta, encuentra project ID automáticamente

5. Ctrl+K → Mic
   "add task create frontend high priority"
   
6. Auto-ejecuta con priority: high inferida
```

### Gestión Financiera Rápida

```
1. "spent $45 on groceries"
   → category: food (automática)
   
2. "paid $1200 rent"
   → category: bills (automática)
   
3. "bought $80 game on steam"
   → category: entertainment (automática)
   
4. "liquidar deuda"
   → Encuentra último pago pendiente y marca como pagado
```

---

## 🎓 **Best Practices**

### Para Máxima Auto-Ejecución

1. **Usa keywords claras al inicio**
   - ✅ "create task X"
   - ❌ "I need to create a task X"

2. **Incluye detalles en el comando**
   - ✅ "create task 'Fix bug' due tomorrow 3 hours"
   - ❌ "create task"

3. **Usa comillas para títulos largos**
   - ✅ "add note 'Meeting with John Smith'"
   - ⚠️ "add note Meeting with John Smith"

4. **Especifica tiempos claramente**
   - ✅ "at 5pm tomorrow"
   - ❌ "sometime later"

5. **Con voz, habla naturalmente**
   - ✅ "Set reminder to call mom at three PM"
   - ✅ Pausa breve entre palabras
   - ❌ Hablar muy rápido

---

**¡Prueba los comandos y experimenta con el sistema autónomo! 🚀**
