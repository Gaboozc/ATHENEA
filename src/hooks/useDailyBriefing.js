import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { llmClient } from '../services/LLMClient';
import { DailyBriefingService } from '../services/DailyBriefingService';

const STEP = {
  IDLE: 'idle',
  CORTANA_1: 'cortana_1',
  SHODAN: 'shodan',
  JARVIS: 'jarvis',
  CLOSING: 'closing',
  CORTANA_2: 'cortana_2',
  DONE: 'done',
};

const CLOSING_SIGNALS = [
  /^(gracias|thanks|thank you|perfecto|excelente|entendido|ok|okay|listo|genial|bien)/i,
  /gracias\s+(jarvis|cortana|shodan|revan)/i,
  /^(👍|✓|✅)/,
];

export function useDailyBriefing() {
  const dispatch = useDispatch();

  const tasksState = useSelector((state) => state.tasks);
  const walletState = useSelector((state) => state.wallets);
  const debtsState = useSelector((state) => state.debts);
  const checkinsState = useSelector((state) => state.checkins);
  const identity = useSelector((s) => s.userSettings || s.userIdentity || {});

  const agentAliases = identity.agentAliases || {};
  const agentNames = identity.agentNames || {};

  const cortanaCallsMe =
    agentAliases.cortana || identity.preferredName || 'Operador';
  const shodanCallsMe =
    agentAliases.shodan || identity.preferredName || 'Operador';
  const jarvisCallsMe =
    agentAliases.jarvis || identity.preferredName || 'Operador';

  const cortanaName = agentNames.cortana || 'Agent 1';
  const jarvisName = agentNames.jarvis || 'Agent 2';
  const shodanName = agentNames.shodan || 'Agent 3';

  const tasks = useMemo(
    () => tasksState?.tasks || tasksState?.items || [],
    [tasksState]
  );
  const topTask = useMemo(() => {
    const pending = tasks.filter((t) => {
      if (typeof t.completed === 'boolean') return !t.completed;
      return String(t.status || '').toLowerCase() !== 'completado';
    });
    return pending[0] || null;
  }, [tasks]);
  const debts = useMemo(() => debtsState?.debts || [], [debtsState]);
  const checkins = useMemo(() => checkinsState?.checkins || [], [checkinsState]);

  const [step, setStep] = useState(STEP.IDLE);
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const stepRef = useRef(STEP.IDLE);

  useEffect(() => {
    stepRef.current = step;
  }, [step]);

  const detectUserLang = useCallback((userResponse) => {
    return /[áéíóúñ¿¡]|\b(me|siento|estoy|tengo|cansado|bien|mal)\b/i
      .test(String(userResponse || ''))
      ? 'español'
      : 'english';
  }, []);

  const buildContext = useCallback(() => {
    const completedTasks = tasks.filter((t) => {
      if (typeof t.completed === 'boolean') return t.completed;
      return String(t.status || '').toLowerCase() === 'completado';
    }).length;
    const pendingTasks = Math.max(0, tasks.length - completedTasks);

    const walletMXN = Number(walletState?.walletMXN || 0);
    const walletUSD = Number(walletState?.walletUSD || 0);
    const savingsMXN = Number(walletState?.savingsMXN || 0);
    const savingsUSD = Number(walletState?.savingsUSD || 0);

    const activeDebts = debts.filter((d) => d.status !== 'completed').length;
    const totalDebtBalance = debts.reduce(
      (sum, d) => sum + Number(d.balance || 0),
      0
    );

    const latestCheckin = checkins.length ? checkins[checkins.length - 1] : null;

    return {
      pendingTasks,
      completedTasks,
      walletMXN,
      walletUSD,
      savingsMXN,
      savingsUSD,
      activeDebts,
      totalDebtBalance,
      latestMood: latestCheckin?.mood || null,
      latestEnergy: latestCheckin?.energy || null,
      latestSleepHours: latestCheckin?.sleepHours || null,
      latestCheckinDate: latestCheckin?.date || null,
      timeOfDay: DailyBriefingService.getTimeOfDay(),
    };
  }, [checkins, debts, tasks, walletState]);

  const addMessage = useCallback((role, content, agent = null) => {
    const normalizedRole = role === 'agent' ? 'assistant' : role;
    const displayAgent =
      agent === 'jarvis'
        ? jarvisName
        : agent === 'cortana'
          ? cortanaName
          : agent === 'shodan'
            ? shodanName
            : agent;

    setMessages((prev) => [
      ...prev,
      {
        role: normalizedRole,
        agent: normalizedRole === 'assistant' ? displayAgent : null,
        content,
        createdAt: Date.now(),
      },
    ]);
  }, [cortanaName, jarvisName, shodanName]);

  const appendAssistant = useCallback((agent, content) => {
    addMessage('agent', content, agent);
  }, [addMessage]);

  const isClosingSignal = useCallback((text) => {
    const value = String(text || '').trim();
    if (!value) return false;
    return CLOSING_SIGNALS.some((pattern) => pattern.test(value));
  }, []);

  const detectTargetAgent = useCallback((text) => {
    const lower = String(text || '').toLowerCase();
    if (lower.includes(String(jarvisName).toLowerCase()) || lower.includes('jarvis')) {
      return 'jarvis';
    }
    if (lower.includes(String(cortanaName).toLowerCase()) || lower.includes('cortana')) {
      return 'cortana';
    }
    if (lower.includes(String(shodanName).toLowerCase()) || lower.includes('shodan')) {
      return 'shodan';
    }
    return null;
  }, [cortanaName, jarvisName, shodanName]);

  const sleep = useCallback((ms) => new Promise((resolve) => setTimeout(resolve, ms)), []);

  const startBriefing = useCallback(() => {
    if (stepRef.current !== STEP.IDLE) return;

    const context = buildContext();
    const timeOfDay = String(context.timeOfDay || '').toLowerCase();
    const timeGreeting =
      timeOfDay === 'mañana' || timeOfDay === 'morning'
        ? 'Buenos días'
        : timeOfDay === 'tarde' || timeOfDay === 'afternoon'
          ? 'Buenas tardes'
          : 'Buenas noches';

    setMessages([]);
    setStep(STEP.CORTANA_1);
    appendAssistant(
      cortanaName,
      `${timeGreeting}, ${cortanaCallsMe}. ¿Cómo te sientes ahora mismo?`
    );
  }, [appendAssistant, buildContext, cortanaCallsMe, cortanaName]);

  const generateFromShodan = useCallback(
    async (userInput) => {
      const userLang = detectUserLang(userInput);
      try {
        const response = await llmClient.chat([
          {
            role: 'system',
            content: `Eres ${shodanName}, monitor de bienestar de ATHENEA.
      Dirígete al usuario como "${shodanCallsMe}".
      Tu nombre es ${shodanName}.
      El usuario acaba de decir cómo se siente.
      Tu ÚNICA tarea ahora es hacer DOS preguntas específicas:
      1. ¿Cuántas horas dormiste anoche?
      2. ¿Del 1 al 5, cómo está tu nivel de energía?
      Nada más. Sin análisis. Sin diagnósticos.
      Máximo 2 oraciones cortas.
      RESPONDE EN ESPAÑOL OBLIGATORIAMENTE.
      RESPONDE OBLIGATORIAMENTE EN ${userLang.toUpperCase()}.
      IMPORTANTE: El usuario escribió en español.
      DEBES responder en español. NUNCA en inglés.`,
          },
          {
            role: 'user',
            content: `Estado reportado por el usuario: ${userInput}`,
          },
        ]);
        return (
          response?.content ||
          `${shodanCallsMe}, ¿cuántas horas dormiste anoche? ¿Del 1 al 5, cómo está tu nivel de energía?`
        );
      } catch {
        return `${shodanCallsMe}, ¿cuántas horas dormiste anoche? ¿Del 1 al 5, cómo está tu nivel de energía?`;
      }
    },
    [detectUserLang, shodanCallsMe, shodanName]
  );

  const generateFromJarvis = useCallback(
    async (userInput) => {
      const briefingContext = buildContext();
      const sleepHours = briefingContext.latestSleepHours;
      const energy = briefingContext.latestEnergy;

      const now = new Date();
      const upcomingDebt = debts
        .map((debt) => {
          const rawDate = debt?.nextPaymentDate || debt?.dueDate || debt?.paymentDate;
          const date = rawDate ? new Date(rawDate) : null;
          const hasValidDate = Boolean(date && !Number.isNaN(date.getTime()));
          return {
            ...debt,
            _date: hasValidDate ? date : null,
          };
        })
        .filter(
          (debt) => debt?.status !== 'completed' && debt._date && debt._date >= now
        )
        .sort((a, b) => a._date - b._date)[0];

      const context =
        `Saldo MXN: $${briefingContext.walletMXN?.toFixed(2) || '0.00'}.` +
        `Saldo USD: $${briefingContext.walletUSD?.toFixed(2) || '0.00'}.` +
        (sleepHours ? ` Sueño: ${sleepHours} horas.` : '') +
        (energy ? ` Energía del usuario: ${energy}/5.` : '') +
        (upcomingDebt
          ? ` Pago próximo: ${upcomingDebt.name} en ${Math.ceil(
              (new Date(upcomingDebt.nextPaymentDate || upcomingDebt.dueDate || upcomingDebt.paymentDate) -
                new Date()) /
                (1000 * 60 * 60 * 24)
            )} días.`
          : ' Sin pagos urgentes.');

      try {
        const response = await llmClient.chat([
          {
            role: 'system',
            content: `Eres ${jarvisName}, auditor financiero de ATHENEA.
      Es el briefing matutino. Datos disponibles: ${context}
      Da un resumen financiero del día en MÁXIMO 2 oraciones.
      Dirígete al usuario como "${jarvisCallsMe}".
      Tu nombre es ${jarvisName}.
      Si los saldos son cero, dilo sin dramatismo.
      Si hay pago próximo, mencionarlo brevemente.
      Los datos de sueño y energía son del check-in
      del usuario — NO los menciones en tu respuesta
      a menos que sean relevantes para las finanzas.
      Tu enfoque es solo el resumen financiero.
      Sin análisis extendido. Sin recomendaciones de vida.
      Sin hablar en tercera persona.
      Ejemplo correcto:
      "Saldo disponible: $0.00 MXN y $0.00 USD, Señor.
      Sin pagos urgentes esta semana."
      RESPONDE EN ESPAÑOL. MÁXIMO 2 ORACIONES.`,
          },
          {
            role: 'user',
            content: `Datos del usuario: ${userInput}\nContexto financiero: ${JSON.stringify({
              walletMXN: briefingContext.walletMXN,
              walletUSD: briefingContext.walletUSD,
              activeDebts: briefingContext.activeDebts,
              totalDebtBalance: briefingContext.totalDebtBalance,
            })}`,
          },
        ]);
        return (
          response?.content ||
          `Saldo disponible: $${briefingContext.walletMXN.toFixed(2)} MXN y $${briefingContext.walletUSD.toFixed(2)} USD, ${jarvisCallsMe}. ${upcomingDebt ? 'Hay un pago próximo a considerar.' : 'Sin pagos urgentes.'}`
        );
      } catch {
        return `Saldo disponible: $${briefingContext.walletMXN.toFixed(2)} MXN y $${briefingContext.walletUSD.toFixed(2)} USD, ${jarvisCallsMe}. ${upcomingDebt ? 'Hay un pago próximo a considerar.' : 'Sin pagos urgentes.'}`;
      }
    },
    [buildContext, debts, jarvisCallsMe, jarvisName]
  );

  const generateFromCortanaClose = useCallback(
    async (userInput) => {
      try {
        const response = await llmClient.chat([
          {
            role: 'system',
            content: `Eres ${cortanaName}, estratega personal de ATHENEA.
    Estás cerrando el briefing diario de ${cortanaCallsMe}.
    ${topTask
      ? `La prioridad de hoy es: "${topTask.title}".`
      : 'No hay tareas críticas hoy — día libre para avanzar.'
    }
    ATHENEA es un sistema de productividad personal,
    no un sistema de combate. Tu rol es ayudar a
    ${cortanaCallsMe} a ser más productivo y organizado.
    Da un cierre motivador y concreto en 1-2 oraciones.
    Sin saludos. Sin referencias a amenazas o combate.
    Sin comillas en la respuesta.
    Ejemplo: "Tu prioridad de hoy es clara, ${cortanaCallsMe}.
    Ejecuta eso primero y el resto se acomoda."
    RESPONDE EN ESPAÑOL.`,
          },
          {
            role: 'user',
            content: `Confirmación del usuario: ${userInput}`,
          },
        ]);
        return (
          response?.content ||
          `${cortanaCallsMe}, ya tienes claridad. Da el primer paso ahora y protege tu enfoque durante la mañana.`
        );
      } catch {
        return `${cortanaCallsMe}, tienes un plan claro. Una acción deliberada ahora puede definir el tono del resto del día.`;
      }
    },
    [cortanaCallsMe, cortanaName, topTask]
  );

  const handleClosingStep = useCallback(
    async (userAck) => {
      addMessage('user', userAck, null);
      setStep(STEP.CLOSING);
      setIsLoading(true);

      const targetAgent = detectTargetAgent(userAck);
      const defaultOrder = ['jarvis', 'shodan', 'cortana'];
      const orderedAgents = targetAgent
        ? [targetAgent, ...defaultOrder.filter((a) => a !== targetAgent)]
        : defaultOrder;

      const criticalTasks = tasks
        .filter(
          (t) =>
            !t.completed &&
            (String(t.level || '').toLowerCase() === 'critical' ||
              String(t.level || '').toLowerCase() === 'high velocity')
        )
        .sort((a, b) => {
          if (a.dueDate && b.dueDate) {
            return new Date(a.dueDate) - new Date(b.dueDate);
          }
          return 0;
        });
      const topCriticalTask = criticalTasks[0];

      const prompts = {
        jarvis: {
          system: `Eres ${jarvisName}, auditor financiero.
El usuario acaba de agradecer tu resumen.
Responde con una despedida breve y formal.
Maximo 1 oracion. Sin analisis.
Dirigete como "${jarvisCallsMe}".
RESPONDE EN ESPANOL.`,
          fallback: `Con gusto, ${jarvisCallsMe}. Que el dia sea productivo.`,
        },
        shodan: {
          system: `Eres ${shodanName}, monitor de bienestar.
El briefing esta terminando.
Da una despedida clinica y breve.
Maximo 1 oracion. Tono frio pero no hostil.
Dirigete como "${shodanCallsMe}".
RESPONDE EN ESPANOL.`,
          fallback: `Parametros registrados, ${shodanCallsMe}. Monitoreo activo.`,
        },
        cortana: {
          system: `Eres ${cortanaName}, estratega de ATHENEA.
Estas cerrando el briefing de ${cortanaCallsMe}.
${
  topCriticalTask
    ? `La prioridad de hoy es: "${topCriticalTask.title}".`
    : 'No hay tareas criticas hoy.'
}
Da un cierre motivador en 1-2 oraciones.
Sin saludos. Sin disculpas. Sin "soy Cortana".
NUNCA digas "Lo siento".
Dirigete como "${cortanaCallsMe}".
RESPONDE EN ESPANOL.`,
          fallback: topCriticalTask
            ? `Tu prioridad es clara, ${cortanaCallsMe}. "${topCriticalTask.title}" primero.`
            : `El dia es tuyo, ${cortanaCallsMe}. Elige bien.`,
        },
      };

      try {
        for (let i = 0; i < orderedAgents.length; i += 1) {
          const key = orderedAgents[i];
          const config = prompts[key];

          try {
            const result = await llmClient.chat(
              [
                { role: 'system', content: config.system },
                { role: 'user', content: userAck },
              ],
              {
                maxTokens: key === 'cortana' ? 80 : 60,
                temperature: key === 'cortana' ? 0.8 : 0.7,
              }
            );

            addMessage('agent', result?.content || config.fallback, key);
          } catch {
            addMessage('agent', config.fallback, key);
          }

          if (i < orderedAgents.length - 1) {
            await sleep(600);
          }
        }

        DailyBriefingService.markCompletedToday();

        dispatch({
          type: 'checkins/addCheckin',
          payload: {
            id: `briefing-${Date.now()}`,
            date: new Date().toISOString().split('T')[0],
            mood: 3,
            energy: 3,
            sleepHours: 7,
            note: 'Daily Briefing completed',
            createdAt: new Date().toISOString(),
          },
        });

        setStep(STEP.DONE);
      } finally {
        setIsLoading(false);
      }
    },
    [
      addMessage,
      cortanaCallsMe,
      cortanaName,
      detectTargetAgent,
      dispatch,
      jarvisCallsMe,
      jarvisName,
      shodanCallsMe,
      shodanName,
      sleep,
      tasks,
    ]
  );

  const sendUserMessage = useCallback(
    async (text) => {
      const trimmed = String(text || '').trim();
      if (!trimmed || isLoading) return;

      if (step === STEP.JARVIS && isClosingSignal(trimmed)) {
        await handleClosingStep(trimmed);
        return;
      }

      addMessage('user', trimmed, null);

      setIsLoading(true);
      try {
        if (step === STEP.CORTANA_1) {
          const shodanReply = await generateFromShodan(trimmed);
          appendAssistant(shodanName, shodanReply);
          setStep(STEP.SHODAN);
          return;
        }

        if (step === STEP.SHODAN) {
          const jarvisReply = await generateFromJarvis(trimmed);
          appendAssistant(jarvisName, jarvisReply);
          setStep(STEP.JARVIS);
          return;
        }

        if (step === STEP.JARVIS) {
          const cortanaReply = await generateFromCortanaClose(trimmed);
          appendAssistant(cortanaName, cortanaReply);
          setStep(STEP.CORTANA_2);
        }
      } finally {
        setIsLoading(false);
      }
    },
    [
      addMessage,
      appendAssistant,
      generateFromCortanaClose,
      generateFromJarvis,
      generateFromShodan,
      handleClosingStep,
      isClosingSignal,
      isLoading,
      jarvisName,
      shodanName,
      step,
      cortanaName,
      STEP.JARVIS,
    ]
  );

  const completeBriefing = useCallback(() => {
    DailyBriefingService.markCompletedToday();

    dispatch({
      type: 'checkins/addCheckin',
      payload: {
        id: `briefing-${Date.now()}`,
        date: new Date().toISOString().split('T')[0],
        mood: 3,
        energy: 3,
        sleepHours: 7,
        note: 'Daily Briefing completed',
        createdAt: new Date().toISOString(),
      },
    });

    setStep(STEP.DONE);
  }, [dispatch]);

  const resetConversation = useCallback(() => {
    setMessages([]);
    setIsLoading(false);
    setStep(STEP.IDLE);
  }, []);

  return {
    step,
    messages,
    isLoading,
    startBriefing,
    sendUserMessage,
    completeBriefing,
    resetConversation,
    STEP,
  };
}
