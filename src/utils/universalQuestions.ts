export type QuestionValue = 1 | 2 | 3 | 4 | 5 | 6 | 7;

export type QuestionText = {
  en: string;
  es: string;
};

export type UniversalQuestion = {
  id: string;
  value: QuestionValue;
  text: string;
  localized: QuestionText;
};

export const QUESTION_VALUES: QuestionValue[] = [1, 2, 3, 4, 5, 6, 7];

const buildQuestions = (value: QuestionValue, texts: QuestionText[]) =>
  texts.map((text, index) => ({
    id: `u-v${value}-${index + 1}`,
    value,
    text: text.en,
    localized: text
  }));

const UNIVERSAL_TEXTS: Record<QuestionValue, QuestionText[]> = {
  1: [
    { en: "Is this a minor improvement with low impact?", es: "Es una mejora menor con bajo impacto?" },
    { en: "Would delaying this have minimal consequences?", es: "Retrasarlo tendria consecuencias minimas?" },
    { en: "Is this a low-urgency enhancement?", es: "Es una mejora de baja urgencia?" },
    { en: "Is this a small scope adjustment?", es: "Es un ajuste de alcance pequeno?" },
    { en: "Is this a light effort task?", es: "Es una tarea de esfuerzo ligero?" },
    { en: "Is the risk of not doing this low?", es: "El riesgo de no hacerlo es bajo?" },
    { en: "Is this mostly cosmetic or optional?", es: "Es mayormente cosmetico u opcional?" },
    { en: "Would this change affect few people?", es: "Este cambio afecta a pocas personas?" },
    { en: "Is this a minor time savings?", es: "Es un ahorro de tiempo menor?" },
    { en: "Is this a low complexity request?", es: "Es una solicitud de baja complejidad?" }
  ],
  2: [
    { en: "Does this reduce a small recurring friction?", es: "Reduce una friccion recurrente pequena?" },
    { en: "Is this a modest efficiency gain?", es: "Es una ganancia modesta de eficiencia?" },
    { en: "Would this slightly reduce risk exposure?", es: "Reduciria ligeramente la exposicion al riesgo?" },
    { en: "Is this helpful but not time critical?", es: "Es util pero no critico en tiempo?" },
    { en: "Does this save a small amount of resources?", es: "Ahorra una pequena cantidad de recursos?" },
    { en: "Is this a small scope improvement?", es: "Es una mejora pequena de alcance?" },
    { en: "Would this improve clarity for a few teams?", es: "Mejora la claridad para pocos equipos?" },
    { en: "Is the safety impact limited?", es: "El impacto de seguridad es limitado?" },
    { en: "Does this reduce minor delays?", es: "Reduce demoras menores?" },
    { en: "Is this a low risk change with some value?", es: "Es un cambio de bajo riesgo con algo de valor?" }
  ],
  3: [
    { en: "Does this improve cross-team coordination?", es: "Mejora la coordinacion entre equipos?" },
    { en: "Will this reduce moderate rework?", es: "Reducira retrabajo moderado?" },
    { en: "Is this a moderate scope effort?", es: "Es un esfuerzo de alcance moderado?" },
    { en: "Does this address a recurring risk?", es: "Atiende un riesgo recurrente?" },
    { en: "Will this improve reliability for key workflows?", es: "Mejorara la confiabilidad en flujos clave?" },
    { en: "Is there a meaningful time savings?", es: "Hay un ahorro de tiempo significativo?" },
    { en: "Does this improve resource utilization?", es: "Mejora el uso de recursos?" },
    { en: "Is this a moderate complexity task?", es: "Es una tarea de complejidad moderada?" },
    { en: "Does this improve safety for routine work?", es: "Mejora la seguridad para trabajo rutinario?" },
    { en: "Would this reduce delays across teams?", es: "Reduciria demoras entre equipos?" }
  ],
  4: [
    { en: "Does this unlock progress for multiple teams?", es: "Desbloquea progreso para multiples equipos?" },
    { en: "Is this required to keep commitments on track?", es: "Es requerido para mantener compromisos al dia?" },
    { en: "Will this materially reduce risk exposure?", es: "Reducira de forma material la exposicion al riesgo?" },
    { en: "Is this a significant time or resource saver?", es: "Es un ahorro significativo de tiempo o recursos?" },
    { en: "Does this resolve a critical dependency?", es: "Resuelve una dependencia critica?" },
    { en: "Will this improve safety for key operations?", es: "Mejorara la seguridad en operaciones clave?" },
    { en: "Is this a high complexity effort with clear value?", es: "Es un esfuerzo de alta complejidad con valor claro?" },
    { en: "Does this expand scope in a strategic way?", es: "Expande el alcance de forma estrategica?" },
    { en: "Will this prevent repeated incidents?", es: "Prevendra incidentes repetidos?" },
    { en: "Is this required for a planned release?", es: "Es requerido para un release planificado?" }
  ],
  5: [
    { en: "Is this tied to a high-impact outcome?", es: "Esta ligado a un resultado de alto impacto?" },
    { en: "Would delay cause costly rework?", es: "Retrasarlo causaria retrabajo costoso?" },
    { en: "Does this reduce critical operational risk?", es: "Reduce riesgo operativo critico?" },
    { en: "Is this a key dependency for delivery?", es: "Es una dependencia clave para la entrega?" },
    { en: "Will this protect a major commitment?", es: "Protege un compromiso mayor?" },
    { en: "Does this materially improve reliability?", es: "Mejora de forma material la confiabilidad?" },
    { en: "Is this required to maintain compliance or safety?", es: "Es requerido para mantener compliance o seguridad?" },
    { en: "Will this unlock major capacity gains?", es: "Desbloquea ganancias mayores de capacidad?" },
    { en: "Is this critical to avoid escalation?", es: "Es critico para evitar escalacion?" },
    { en: "Does this prevent high-severity incidents?", es: "Previene incidentes de alta severidad?" }
  ],
  6: [
    { en: "Is there a hard deadline within 48 hours?", es: "Hay un deadline duro dentro de 48 horas?" },
    { en: "Is this blocking delivery of a committed outcome?", es: "Esta bloqueando la entrega de un resultado comprometido?" },
    { en: "Would delay create significant operational exposure?", es: "Retrasarlo crearia exposicion operativa significativa?" },
    { en: "Is this required to unblock a critical milestone?", es: "Es requerido para desbloquear un hito critico?" },
    { en: "Will this mitigate an active incident?", es: "Mitiga un incidente activo?" },
    { en: "Is this a top priority for leadership?", es: "Es una prioridad maxima para liderazgo?" },
    { en: "Does this prevent a high-cost escalation?", es: "Previene una escalacion de alto costo?" },
    { en: "Is this essential to avoid outage risk?", es: "Es esencial para evitar riesgo de outage?" },
    { en: "Will this unblock multiple dependent teams?", es: "Desbloquea multiples equipos dependientes?" },
    { en: "Is this tied to a critical compliance deadline?", es: "Esta ligado a un deadline critico de compliance?" }
  ],
  7: [
    { en: "Is this an emergency blocking core operations?", es: "Es una emergencia que bloquea operaciones centrales?" },
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

export const UNIVERSAL_QUESTIONS: Record<QuestionValue, UniversalQuestion[]> =
  QUESTION_VALUES.reduce((acc, value) => {
    acc[value] = buildQuestions(value, UNIVERSAL_TEXTS[value]);
    return acc;
  }, {} as Record<QuestionValue, UniversalQuestion[]>);

export const pickRandomQuestion = (questions: UniversalQuestion[]) =>
  questions[Math.floor(Math.random() * questions.length)];

export const shuffleQuestions = <T>(items: T[]) => {
  const next = [...items];
  for (let i = next.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [next[i], next[j]] = [next[j], next[i]];
  }
  return next;
};

export const getUniversalQuestionSet = () =>
  shuffleQuestions(
    QUESTION_VALUES.map((value) => pickRandomQuestion(UNIVERSAL_QUESTIONS[value]))
  );
