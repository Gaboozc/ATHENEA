export type UserRole =
  | "super-admin"
  | "pm"
  | "supervisor"
  | "lead-technician"
  | "technician"
  | "developer"
  | "manager";

export type WorkstreamCategory = "dev" | "design" | "cs";

export type QuestionValue = 1 | 2 | 3 | 4 | 5 | 6 | 7;

export type QuestionText = {
  en: string;
  es: string;
};

export type ValueQuestion = {
  id: string;
  value: QuestionValue;
  text: string;
  localized: QuestionText;
  roles: UserRole[];
};

const ALL_ROLES: UserRole[] = [
  "super-admin",
  "pm",
  "supervisor",
  "lead-technician",
  "technician",
  "developer",
  "manager"
];

const QUESTION_VALUES: QuestionValue[] = [1, 2, 3, 4, 5, 6, 7];

const isWorkstreamCategory = (item: string): item is WorkstreamCategory =>
  item === "dev" || item === "design" || item === "cs";

const buildValueQuestions = (
  category: WorkstreamCategory,
  value: QuestionValue,
  texts: QuestionText[]
) =>
  texts.map((text, index) => ({
    id: `${category}-v${value}-${index + 1}`,
    value,
    text: text.en,
    localized: text,
    roles: ALL_ROLES
  }));

const buildPool = (
  category: WorkstreamCategory,
  textsByValue: Record<QuestionValue, QuestionText[]>
) =>
  QUESTION_VALUES.reduce((acc, value) => {
    acc[value] = buildValueQuestions(category, value, textsByValue[value]);
    return acc;
  }, {} as Record<QuestionValue, ValueQuestion[]>);

const DEV_TEXTS: Record<QuestionValue, QuestionText[]> = {
  1: [
    { en: "Is this a minor code cleanup?", es: "Es una limpieza menor de codigo?" },
    { en: "Is this a cosmetic refactor with low impact?", es: "Es un refactor cosmetico de bajo impacto?" },
    { en: "Is this a low-urgency improvement to tooling?", es: "Es una mejora de baja urgencia en tooling?" },
    { en: "Is this a small readability enhancement?", es: "Es una mejora pequena de legibilidad?" },
    { en: "Is this optional for current sprint goals?", es: "Es opcional para las metas del sprint actual?" },
    { en: "Would delaying this have negligible tech impact?", es: "Retrasarlo tendria impacto tecnico despreciable?" },
    { en: "Is this a low-visibility internal tweak?", es: "Es un ajuste interno de baja visibilidad?" },
    { en: "Is this a minimal change with no dependencies?", es: "Es un cambio minimo sin dependencias?" },
    { en: "Is this a minor documentation adjustment?", es: "Es un ajuste menor de documentacion?" },
    { en: "Is this a low-priority code style update?", es: "Es una actualizacion de estilo de codigo de baja prioridad?" }
  ],
  2: [
    { en: "Does this remove a small dev friction point?", es: "Elimina un pequeno punto de friccion en dev?" },
    { en: "Is this a modest build or lint improvement?", es: "Es una mejora modesta de build o lint?" },
    { en: "Will this reduce minor rework for devs?", es: "Reduce retrabajo menor para devs?" },
    { en: "Is this helpful but not time critical?", es: "Es util pero no critico en tiempo?" },
    { en: "Does this improve local dev setup slightly?", es: "Mejora ligeramente el setup local?" },
    { en: "Is this a small quality-of-life dev change?", es: "Es un cambio pequeno de calidad de vida para dev?" },
    { en: "Would this reduce minor build warnings?", es: "Reduciria advertencias menores del build?" },
    { en: "Is this beneficial without blocking anything?", es: "Es beneficioso sin bloquear nada?" },
    { en: "Does this prevent small runtime annoyances?", es: "Previene molestias menores en runtime?" },
    { en: "Is this a low-priority optimization?", es: "Es una optimizacion de baja prioridad?" }
  ],
  3: [
    { en: "Does this reduce context switching for engineers?", es: "Reduce el cambio de contexto para ingenieros?" },
    { en: "Will this improve handoffs between dev roles?", es: "Mejora los handoffs entre roles de dev?" },
    { en: "Is this part of next sprint dev scope?", es: "Es parte del alcance dev del proximo sprint?" },
    { en: "Does this prevent recurring low-level bugs?", es: "Previene bugs recurrentes de bajo nivel?" },
    { en: "Will this increase developer confidence?", es: "Aumenta la confianza del desarrollador?" },
    { en: "Is this a standardization win for codebase?", es: "Es una mejora de estandarizacion del codebase?" },
    { en: "Does this improve debugging visibility?", es: "Mejora la visibilidad de debugging?" },
    { en: "Will this reduce rework across modules?", es: "Reduce retrabajo entre modulos?" },
    { en: "Is this a moderate efficiency gain in dev flow?", es: "Es una ganancia moderada de eficiencia en dev?" },
    { en: "Is this a moderate improvement to DX?", es: "Es una mejora moderada de DX?" }
  ],
  4: [
    { en: "Does this unlock progress for multiple dev tasks?", es: "Desbloquea progreso para multiples tareas dev?" },
    { en: "Will this remove a recurring technical blocker?", es: "Elimina un bloqueador tecnico recurrente?" },
    { en: "Is this required for a committed dev delivery?", es: "Es requerido para una entrega dev comprometida?" },
    { en: "Will this materially improve dev throughput?", es: "Mejora de forma material el throughput dev?" },
    { en: "Does this improve system reliability?", es: "Mejora la confiabilidad del sistema?" },
    { en: "Is this needed to avoid known escalations?", es: "Se necesita para evitar escalaciones conocidas?" },
    { en: "Is this aligned with current tech objectives?", es: "Esta alineado con objetivos tecnicos actuales?" },
    { en: "Will this reduce response time for incidents?", es: "Reducira el tiempo de respuesta a incidentes?" },
    { en: "Does this increase quality for key systems?", es: "Aumenta la calidad en sistemas clave?" },
    { en: "Is this necessary for a public milestone?", es: "Es necesario para un hito publico?" }
  ],
  5: [
    { en: "Is this tied to a high-impact dev outcome?", es: "Esta ligado a un resultado dev de alto impacto?" },
    { en: "Will delay cause costly technical rework?", es: "Retrasarlo causara retrabajo tecnico costoso?" },
    { en: "Does this reduce critical technical risk?", es: "Reduce riesgo tecnico critico?" },
    { en: "Is this a key dependency for delivery?", es: "Es una dependencia clave para entrega?" },
    { en: "Does this stabilize a sensitive subsystem?", es: "Estabiliza un subsistema sensible?" },
    { en: "Will this protect a major commitment?", es: "Protege un compromiso mayor?" },
    { en: "Does this prevent high-severity incidents?", es: "Previene incidentes de alta severidad?" },
    { en: "Is this required to maintain compliance?", es: "Es requerido para mantener compliance?" },
    { en: "Will this unlock major productivity gains?", es: "Desbloquea ganancias mayores de productividad?" },
    { en: "Is this critical to service quality?", es: "Es critico para la calidad del servicio?" }
  ],
  6: [
    { en: "Is there a hard deadline within 48 hours?", es: "Hay un deadline duro dentro de 48 horas?" },
    { en: "Is this blocking delivery of a committed outcome?", es: "Esta bloqueando la entrega de un resultado comprometido?" },
    { en: "Would delay create significant operational exposure?", es: "Retrasarlo crearia exposicion operativa significativa?" },
    { en: "Is this required to unblock a critical milestone?", es: "Es requerido para desbloquear un hito critico?" },
    { en: "Will this mitigate an active incident?", es: "Mitiga un incidente activo?" },
    { en: "Is this a top-level executive priority?", es: "Es una prioridad ejecutiva de alto nivel?" },
    { en: "Does this prevent a high-cost escalation?", es: "Previene una escalacion de alto costo?" },
    { en: "Is this essential to avoid outage risk?", es: "Es esencial para evitar riesgo de outage?" },
    { en: "Will this unblock multiple dependent teams?", es: "Desbloquea multiples equipos dependientes?" },
    { en: "Is this tied to a critical compliance deadline?", es: "Esta ligado a un deadline critico de compliance?" }
  ],
  7: [
    { en: "Is this an emergency blocking core operation?", es: "Es una emergencia que bloquea la operacion central?" },
    { en: "Is the business at immediate risk if delayed?", es: "El negocio esta en riesgo inmediato si se retrasa?" },
    { en: "Is this required to restore mission-critical service?", es: "Es requerido para restaurar servicio critico?" },
    { en: "Would delay cause major contractual breach?", es: "Retrasarlo causaria un incumplimiento contractual mayor?" },
    { en: "Is this the top system stability priority?", es: "Es la prioridad maxima de estabilidad del sistema?" },
    { en: "Is there immediate safety or compliance exposure?", es: "Hay exposicion inmediata de seguridad o compliance?" },
    { en: "Is this a mission-critical customer demand?", es: "Es una demanda critica del cliente?" },
    { en: "Is this blocking all downstream work right now?", es: "Esta bloqueando todo el trabajo downstream ahora?" },
    { en: "Would delay cause significant financial loss?", es: "Retrasarlo causaria perdida financiera significativa?" },
    { en: "Is this required to prevent system outage?", es: "Es requerido para prevenir un outage del sistema?" }
  ]
};

const DESIGN_TEXTS: Record<QuestionValue, QuestionText[]> = {
  1: [
    { en: "Is this a minor visual polish change?", es: "Es un pulido visual menor?" },
    { en: "Is this a cosmetic alignment tweak?", es: "Es un ajuste cosmetico de alineacion?" },
    { en: "Is this a low-urgency UI refinement?", es: "Es un refinamiento UI de baja urgencia?" },
    { en: "Is this optional for the current layout?", es: "Es opcional para el layout actual?" },
    { en: "Would delaying this have negligible UX impact?", es: "Retrasarlo tendria impacto UX despreciable?" },
    { en: "Is this a low-visibility style adjustment?", es: "Es un ajuste de estilo de baja visibilidad?" },
    { en: "Is this a small typography tweak?", es: "Es un ajuste pequeno de tipografia?" },
    { en: "Is this a minor spacing cleanup?", es: "Es una limpieza menor de espaciado?" },
    { en: "Is this a tiny icon adjustment?", es: "Es un ajuste pequeno de icono?" },
    { en: "Is this a low-priority color refinement?", es: "Es un refinamiento de color de baja prioridad?" }
  ],
  2: [
    { en: "Does this remove a small UX friction point?", es: "Elimina un pequeno punto de friccion UX?" },
    { en: "Is this a modest clarity improvement?", es: "Es una mejora modesta de claridad?" },
    { en: "Will this reduce minor user confusion?", es: "Reduce confusion menor de usuarios?" },
    { en: "Is this helpful but not time critical?", es: "Es util pero no critico en tiempo?" },
    { en: "Does this improve readability slightly?", es: "Mejora ligeramente la legibilidad?" },
    { en: "Is this a small accessibility enhancement?", es: "Es una mejora pequena de accesibilidad?" },
    { en: "Would this reduce minor navigation issues?", es: "Reduciria problemas menores de navegacion?" },
    { en: "Is this beneficial without blocking anything?", es: "Es beneficioso sin bloquear nada?" },
    { en: "Does this prevent small UI errors?", es: "Previene pequenos errores UI?" },
    { en: "Is this a low-priority UX improvement?", es: "Es una mejora UX de baja prioridad?" }
  ],
  3: [
    { en: "Does this reduce cognitive load for users?", es: "Reduce la carga cognitiva del usuario?" },
    { en: "Will this improve handoffs between screens?", es: "Mejora los handoffs entre pantallas?" },
    { en: "Is this part of next sprint UX scope?", es: "Es parte del alcance UX del proximo sprint?" },
    { en: "Does this prevent recurring usability issues?", es: "Previene issues de usabilidad recurrentes?" },
    { en: "Will this increase user confidence?", es: "Aumenta la confianza del usuario?" },
    { en: "Is this a standardization win for UI?", es: "Es una mejora de estandarizacion UI?" },
    { en: "Does this improve task status visibility?", es: "Mejora la visibilidad del estado de tareas?" },
    { en: "Will this reduce rework in design?", es: "Reduce retrabajo en diseno?" },
    { en: "Is this a moderate UX efficiency gain?", es: "Es una ganancia moderada de eficiencia UX?" },
    { en: "Is this a moderate visual hierarchy fix?", es: "Es una correccion moderada de jerarquia visual?" }
  ],
  4: [
    { en: "Does this unlock progress for multiple UX tasks?", es: "Desbloquea progreso para multiples tareas UX?" },
    { en: "Will this remove a recurring UX blocker?", es: "Elimina un bloqueador UX recurrente?" },
    { en: "Is this required for a committed UX delivery?", es: "Es requerido para una entrega UX comprometida?" },
    { en: "Will this materially improve user flow?", es: "Mejora de forma material el flujo del usuario?" },
    { en: "Does this improve system usability?", es: "Mejora la usabilidad del sistema?" },
    { en: "Is this needed to avoid escalations?", es: "Se necesita para evitar escalaciones?" },
    { en: "Is this aligned with current UX objectives?", es: "Esta alineado con objetivos UX actuales?" },
    { en: "Will this reduce response time for users?", es: "Reducira el tiempo de respuesta para usuarios?" },
    { en: "Does this increase quality for key workflows?", es: "Aumenta la calidad en workflows clave?" },
    { en: "Is this necessary for a public release?", es: "Es necesario para un release publico?" }
  ],
  5: [
    { en: "Is this tied to a high-impact UX outcome?", es: "Esta ligado a un resultado UX de alto impacto?" },
    { en: "Will delay cause costly UX rework?", es: "Retrasarlo causara retrabajo UX costoso?" },
    { en: "Does this reduce critical UX risk?", es: "Reduce riesgo UX critico?" },
    { en: "Is this a key dependency for release?", es: "Es una dependencia clave para el release?" },
    { en: "Does this stabilize a sensitive workflow?", es: "Estabiliza un workflow sensible?" },
    { en: "Will this protect a major commitment?", es: "Protege un compromiso mayor?" },
    { en: "Does this prevent high-severity UX incidents?", es: "Previene incidentes UX de alta severidad?" },
    { en: "Is this required to maintain accessibility?", es: "Es requerido para mantener accesibilidad?" },
    { en: "Will this unlock major UX gains?", es: "Desbloquea ganancias UX mayores?" },
    { en: "Is this critical to maintain usability?", es: "Es critico para mantener usabilidad?" }
  ],
  6: [
    { en: "Is there a UX deadline within 48 hours?", es: "Hay un deadline UX dentro de 48 horas?" },
    { en: "Is this blocking a committed UX outcome?", es: "Esta bloqueando un resultado UX comprometido?" },
    { en: "Would delay create significant UX exposure?", es: "Retrasarlo crearia exposicion UX significativa?" },
    { en: "Is this required to unblock a critical milestone?", es: "Es requerido para desbloquear un hito critico?" },
    { en: "Will this mitigate an active UX incident?", es: "Mitiga un incidente UX activo?" },
    { en: "Is this a top-level UX priority?", es: "Es una prioridad UX de alto nivel?" },
    { en: "Does this prevent a high-cost UX escalation?", es: "Previene una escalacion UX de alto costo?" },
    { en: "Is this essential to avoid UX outage risk?", es: "Es esencial para evitar riesgo UX?" },
    { en: "Will this unblock multiple dependent teams?", es: "Desbloquea multiples equipos dependientes?" },
    { en: "Is this tied to a critical accessibility deadline?", es: "Esta ligado a un deadline critico de accesibilidad?" }
  ],
  7: [
    { en: "Is this an emergency blocking the user journey?", es: "Es una emergencia que bloquea el journey del usuario?" },
    { en: "Is the business at immediate UX risk if delayed?", es: "El negocio esta en riesgo UX inmediato si se retrasa?" },
    { en: "Is this required to restore critical UX flow?", es: "Es requerido para restaurar un flujo UX critico?" },
    { en: "Would delay cause major release breach?", es: "Retrasarlo causaria un incumplimiento mayor del release?" },
    { en: "Is this the top usability priority?", es: "Es la prioridad maxima de usabilidad?" },
    { en: "Is there immediate accessibility exposure?", es: "Hay exposicion inmediata de accesibilidad?" },
    { en: "Is this a mission-critical UX demand?", es: "Es una demanda UX critica?" },
    { en: "Is this blocking all downstream UX work?", es: "Esta bloqueando todo el trabajo UX downstream?" },
    { en: "Would delay cause significant customer loss?", es: "Retrasarlo causaria perdida significativa de clientes?" },
    { en: "Is this required to prevent UX outage?", es: "Es requerido para prevenir un outage UX?" }
  ]
};

const CS_TEXTS: Record<QuestionValue, QuestionText[]> = {
  1: [
    { en: "Is this a small customer-facing tweak?", es: "Es un ajuste pequeno de cara al cliente?" },
    { en: "Is this a low-urgency support improvement?", es: "Es una mejora de soporte de baja urgencia?" },
    { en: "Is this a cosmetic update for CS workflows?", es: "Es una actualizacion cosmetica para CS?" },
    { en: "Is this optional for current CS cycle?", es: "Es opcional para el ciclo CS actual?" },
    { en: "Would delay have minimal customer impact?", es: "Retrasarlo tendria impacto minimo en clientes?" },
    { en: "Is this a low-visibility customer change?", es: "Es un cambio de baja visibilidad para el cliente?" },
    { en: "Is this a small FAQ or script update?", es: "Es una pequena actualizacion de FAQ o script?" },
    { en: "Is this a minor process cleanup?", es: "Es una limpieza menor de proceso?" },
    { en: "Is this a small documentation refresh?", es: "Es un refresh pequeno de documentacion?" },
    { en: "Is this a low-priority CS improvement?", es: "Es una mejora CS de baja prioridad?" }
  ],
  2: [
    { en: "Does this remove a small CS friction point?", es: "Elimina un pequeno punto de friccion CS?" },
    { en: "Is this a modest customer clarity gain?", es: "Es una ganancia modesta de claridad para el cliente?" },
    { en: "Will this reduce minor ticket churn?", es: "Reduce churn menor de tickets?" },
    { en: "Is this helpful but not time critical?", es: "Es util pero no critico en tiempo?" },
    { en: "Does this improve response workflow slightly?", es: "Mejora ligeramente el flujo de respuesta?" },
    { en: "Is this a small SLA improvement?", es: "Es una mejora pequena de SLA?" },
    { en: "Would this reduce minor escalations?", es: "Reduciria escalaciones menores?" },
    { en: "Is this beneficial without blocking anything?", es: "Es beneficioso sin bloquear nada?" },
    { en: "Does this prevent small customer errors?", es: "Previene pequenos errores de cliente?" },
    { en: "Is this a low-priority CS enhancement?", es: "Es una mejora CS de baja prioridad?" }
  ],
  3: [
    { en: "Does this reduce context switching for CS?", es: "Reduce el cambio de contexto para CS?" },
    { en: "Will this improve handoffs between CS roles?", es: "Mejora los handoffs entre roles CS?" },
    { en: "Is this part of next sprint CS scope?", es: "Es parte del alcance CS del proximo sprint?" },
    { en: "Does this prevent recurring customer issues?", es: "Previene issues recurrentes de clientes?" },
    { en: "Will this increase customer confidence?", es: "Aumenta la confianza del cliente?" },
    { en: "Is this a standardization win for CS?", es: "Es una mejora de estandarizacion para CS?" },
    { en: "Does this improve ticket status visibility?", es: "Mejora la visibilidad del estado de tickets?" },
    { en: "Will this reduce rework across CS teams?", es: "Reduce retrabajo entre equipos CS?" },
    { en: "Is this a moderate efficiency gain for CS?", es: "Es una ganancia moderada de eficiencia para CS?" },
    { en: "Is this a moderate customer experience lift?", es: "Es una mejora moderada de experiencia del cliente?" }
  ],
  4: [
    { en: "Does this unlock progress for multiple CS tasks?", es: "Desbloquea progreso para multiples tareas CS?" },
    { en: "Will this remove a recurring CS blocker?", es: "Elimina un bloqueador CS recurrente?" },
    { en: "Is this required for a committed CS delivery?", es: "Es requerido para una entrega CS comprometida?" },
    { en: "Will this materially improve CS throughput?", es: "Mejora de forma material el throughput CS?" },
    { en: "Does this improve customer reliability?", es: "Mejora la confiabilidad para el cliente?" },
    { en: "Is this needed to avoid escalations?", es: "Se necesita para evitar escalaciones?" },
    { en: "Is this aligned with current CS objectives?", es: "Esta alineado con objetivos CS actuales?" },
    { en: "Will this reduce response time for customers?", es: "Reducira el tiempo de respuesta a clientes?" },
    { en: "Does this increase quality for key journeys?", es: "Aumenta la calidad en journeys clave?" },
    { en: "Is this necessary for a public milestone?", es: "Es necesario para un hito publico?" }
  ],
  5: [
    { en: "Is this tied to a high-impact CS outcome?", es: "Esta ligado a un resultado CS de alto impacto?" },
    { en: "Will delay cause costly customer rework?", es: "Retrasarlo causara retrabajo costoso con clientes?" },
    { en: "Does this reduce critical customer risk?", es: "Reduce riesgo critico para clientes?" },
    { en: "Is this a key dependency for customer delivery?", es: "Es una dependencia clave para entrega al cliente?" },
    { en: "Does this stabilize a sensitive customer workflow?", es: "Estabiliza un workflow sensible para clientes?" },
    { en: "Will this protect a major customer commitment?", es: "Protege un compromiso mayor con clientes?" },
    { en: "Does this prevent high-severity customer incidents?", es: "Previene incidentes de alta severidad para clientes?" },
    { en: "Is this required to maintain compliance?", es: "Es requerido para mantener compliance?" },
    { en: "Will this unlock major customer gains?", es: "Desbloquea ganancias mayores para clientes?" },
    { en: "Is this critical to customer satisfaction?", es: "Es critico para la satisfaccion del cliente?" }
  ],
  6: [
    { en: "Is there a customer deadline within 48 hours?", es: "Hay un deadline de cliente dentro de 48 horas?" },
    { en: "Is this blocking a committed customer outcome?", es: "Esta bloqueando un resultado comprometido con cliente?" },
    { en: "Would delay create significant customer exposure?", es: "Retrasarlo crearia exposicion significativa con clientes?" },
    { en: "Is this required to unblock a critical milestone?", es: "Es requerido para desbloquear un hito critico?" },
    { en: "Will this mitigate an active customer incident?", es: "Mitiga un incidente activo con clientes?" },
    { en: "Is this a top-level customer priority?", es: "Es una prioridad de cliente de alto nivel?" },
    { en: "Does this prevent a high-cost escalation?", es: "Previene una escalacion de alto costo?" },
    { en: "Is this essential to avoid churn risk?", es: "Es esencial para evitar riesgo de churn?" },
    { en: "Will this unblock multiple dependent teams?", es: "Desbloquea multiples equipos dependientes?" },
    { en: "Is this tied to a critical compliance deadline?", es: "Esta ligado a un deadline critico de compliance?" }
  ],
  7: [
    { en: "Is this an emergency blocking customer operations?", es: "Es una emergencia que bloquea operaciones del cliente?" },
    { en: "Is the business at immediate customer risk if delayed?", es: "El negocio esta en riesgo inmediato con clientes si se retrasa?" },
    { en: "Is this required to restore critical customer service?", es: "Es requerido para restaurar servicio critico al cliente?" },
    { en: "Would delay cause major contractual breach?", es: "Retrasarlo causaria un incumplimiento contractual mayor?" },
    { en: "Is this the top customer stability priority?", es: "Es la prioridad maxima de estabilidad para clientes?" },
    { en: "Is there immediate compliance exposure?", es: "Hay exposicion inmediata de compliance?" },
    { en: "Is this a mission-critical customer demand?", es: "Es una demanda critica del cliente?" },
    { en: "Is this blocking all downstream customer work?", es: "Esta bloqueando todo el trabajo downstream con clientes?" },
    { en: "Would delay cause significant financial loss?", es: "Retrasarlo causaria perdida financiera significativa?" },
    { en: "Is this required to prevent a service outage?", es: "Es requerido para prevenir un outage de servicio?" }
  ]
};

export const WORKSTREAM_QUESTION_POOLS: Record<
  WorkstreamCategory,
  Record<QuestionValue, ValueQuestion[]>
> = {
  dev: buildPool("dev", DEV_TEXTS),
  design: buildPool("design", DESIGN_TEXTS),
  cs: buildPool("cs", CS_TEXTS)
};

export const getQuestionsForRole = (role: UserRole, workstreams: string[]) => {
  const categories = workstreams.filter(isWorkstreamCategory);
  const defaultCategories: WorkstreamCategory[] = ["dev", "design", "cs"];
  const activeCategories: WorkstreamCategory[] =
    categories.length ? categories : defaultCategories;

  return QUESTION_VALUES.reduce((acc, value) => {
    const combined = activeCategories.flatMap(
      (category) => WORKSTREAM_QUESTION_POOLS[category][value]
    );
    const filtered = combined.filter((q) => q.roles.includes(role));
    acc[value] = filtered.length ? filtered : combined;
    return acc;
  }, {} as Record<QuestionValue, ValueQuestion[]>);
};

export const pickRandomQuestion = (questions: ValueQuestion[]) => {
  const index = Math.floor(Math.random() * questions.length);
  return questions[index];
};

export const shuffleQuestions = <T,>(items: T[]) => {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
};
