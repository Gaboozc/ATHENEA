import type { Store, Unsubscribe } from '@reduxjs/toolkit';
import { setPredictiveBuffer } from '../../store/slices/aiMemorySlice';

type HubName = 'WorkHub' | 'PersonalHub' | 'FinanceHub';
type Priority = 'LOW' | 'MEDIUM' | 'HIGH';

type HourHistogram = Record<string, number>;

interface HubFrequencyDb {
  WorkHub: Record<string, HourHistogram>;
  PersonalHub: Record<string, HourHistogram>;
  FinanceHub: Record<string, HourHistogram>;
}

interface ProductivityCorrelationEntry {
  samples: number;
  completions: number;
}

// FASE 2.6: External Environment Correlation
interface WeatherCorrelationEntry {
  samples: number;
  completions: number;
  tasksCreated: number;
  tasksCancelled: number;
}

interface MarketCorrelationEntry {
  samples: number;
  financeInterceptions: number;
  spendingsLogged: number;
  tasksCompleted: number;
}

interface BlackBoxDatabase {
  version: 1;
  lastUpdatedAt: number;
  hubFrequency: HubFrequencyDb;
  productivityHeatmap: Record<string, HourHistogram>;
  interceptResponseTimesMs: number[];
  productivityCorrelation: {
    byZone: Record<string, ProductivityCorrelationEntry>;
    byBatteryBucket: Record<'low' | 'medium' | 'high', ProductivityCorrelationEntry>;
  };
  routines: {
    homeRest: {
      hits: number;
      opportunities: number;
    };
    financeAfterBankIntercept: {
      hits: number;
      opportunities: number;
    };
  };
  // FASE 2.6: Harmonic Feedback Loop
  weatherCorrelation: {
    clear: WeatherCorrelationEntry;
    cloudy: WeatherCorrelationEntry;
    rainy: WeatherCorrelationEntry;
    stormy: WeatherCorrelationEntry;
    snow: WeatherCorrelationEntry;
  };
  marketCorrelation: {
    bull: MarketCorrelationEntry; // Market up >3%
    neutral: MarketCorrelationEntry; // Market -3% to +3%
    bear: MarketCorrelationEntry; // Market down >3%
  };
  lastWeatherCondition: 'clear' | 'cloudy' | 'rainy' | 'stormy' | 'snow' | null;
  lastMarketState: 'bull' | 'neutral' | 'bear' | null;
  austerityModeActive: boolean;
  austerityActivatedAt: number;
}

const STORAGE_KEY = 'athenea.blackbox.v1';
const DAY_KEYS = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
const BATTERY_BUCKETS: Array<'low' | 'medium' | 'high'> = ['low', 'medium', 'high'];
const MAX_INTERCEPT_SAMPLES = 120;

function emptyHubFrequency(): HubFrequencyDb {
  return {
    WorkHub: {},
    PersonalHub: {},
    FinanceHub: {},
  };
}

function emptyDb(): BlackBoxDatabase {
  return {
    version: 1,
    lastUpdatedAt: Date.now(),
    hubFrequency: emptyHubFrequency(),
    productivityHeatmap: {},
    interceptResponseTimesMs: [],
    productivityCorrelation: {
      byZone: {},
      byBatteryBucket: {
        low: { samples: 0, completions: 0 },
        medium: { samples: 0, completions: 0 },
        high: { samples: 0, completions: 0 },
      },
    },
    routines: {
      homeRest: { hits: 0, opportunities: 0 },
      financeAfterBankIntercept: { hits: 0, opportunities: 0 },
    },
    // FASE 2.6: Harmonic Feedback Loop defaults
    weatherCorrelation: {
      clear: { samples: 0, completions: 0, tasksCreated: 0, tasksCancelled: 0 },
      cloudy: { samples: 0, completions: 0, tasksCreated: 0, tasksCancelled: 0 },
      rainy: { samples: 0, completions: 0, tasksCreated: 0, tasksCancelled: 0 },
      stormy: { samples: 0, completions: 0, tasksCreated: 0, tasksCancelled: 0 },
      snow: { samples: 0, completions: 0, tasksCreated: 0, tasksCancelled: 0 },
    },
    marketCorrelation: {
      bull: { samples: 0, financeInterceptions: 0, spendingsLogged: 0, tasksCompleted: 0 },
      neutral: { samples: 0, financeInterceptions: 0, spendingsLogged: 0, tasksCompleted: 0 },
      bear: { samples: 0, financeInterceptions: 0, spendingsLogged: 0, tasksCompleted: 0 },
    },
    lastWeatherCondition: null,
    lastMarketState: null,
    austerityModeActive: false,
    austerityActivatedAt: 0,
  };
}

function safeParse(json: string | null): BlackBoxDatabase {
  if (!json) return emptyDb();
  try {
    const parsed = JSON.parse(json);
    if (parsed?.version !== 1) return emptyDb();
    return {
      ...emptyDb(),
      ...parsed,
      hubFrequency: {
        ...emptyHubFrequency(),
        ...(parsed?.hubFrequency || {}),
      },
      productivityCorrelation: {
        ...emptyDb().productivityCorrelation,
        ...(parsed?.productivityCorrelation || {}),
        byBatteryBucket: {
          ...emptyDb().productivityCorrelation.byBatteryBucket,
          ...(parsed?.productivityCorrelation?.byBatteryBucket || {}),
        },
      },
      routines: {
        ...emptyDb().routines,
        ...(parsed?.routines || {}),
      },
      // FASE 2.6: Preserve external correlations if present
      weatherCorrelation: {
        ...emptyDb().weatherCorrelation,
        ...(parsed?.weatherCorrelation || {}),
      },
      marketCorrelation: {
        ...emptyDb().marketCorrelation,
        ...(parsed?.marketCorrelation || {}),
      },
    };
  } catch {
    return emptyDb();
  }
}

function incrementHistogram(map: Record<string, HourHistogram>, day: string, hour: number): void {
  if (!map[day]) map[day] = {};
  const hourKey = String(hour);
  map[day][hourKey] = Number(map[day][hourKey] || 0) + 1;
}

function batteryBucket(level?: number | null): 'low' | 'medium' | 'high' {
  const safe = Number(level ?? 100);
  if (safe < 30) return 'low';
  if (safe < 70) return 'medium';
  return 'high';
}

function avg(values: number[]): number {
  if (!values.length) return 0;
  return Math.round(values.reduce((sum, v) => sum + v, 0) / values.length);
}

class BlackBox {
  private store: Store | null = null;
  private unsubscribe: Unsubscribe | null = null;
  private db: BlackBoxDatabase = emptyDb();

  private lastHub: string = 'Unknown';
  private lastCompletedCount = 0;
  private lastInterceptId: string | null = null;
  private lastInterceptDetectedAt = 0;
  private lastFinanceInterceptAt = 0;
  private completedTaskIds = new Set<string>();

  initialize(store: Store): void {
    if (this.unsubscribe) return;
    this.store = store;
    this.db = safeParse(localStorage.getItem(STORAGE_KEY));

    const state: any = store.getState();
    this.lastHub = state.aiMemory?.context?.lastHubVisited || 'Unknown';
    this.lastCompletedCount = state.aiMemory?.userState?.completedCount || 0;
    this.seedCompletedTasks(state.tasks?.tasks || []);

    this.unsubscribe = store.subscribe(() => this.onStateChange());
    this.publishPrediction();
  }

  shutdown(): void {
    if (this.unsubscribe) {
      this.unsubscribe();
      this.unsubscribe = null;
    }
  }

  getSnapshot(): BlackBoxDatabase {
    return JSON.parse(JSON.stringify(this.db));
  }

  private onStateChange(): void {
    if (!this.store) return;
    const state: any = this.store.getState();
    const now = Date.now();
    const date = new Date(now);
    const dayKey = DAY_KEYS[date.getDay()];
    const hour = date.getHours();

    const currentHub = state.aiMemory?.context?.lastHubVisited || 'Unknown';
    if (currentHub !== this.lastHub && (currentHub === 'WorkHub' || currentHub === 'PersonalHub' || currentHub === 'FinanceHub')) {
      incrementHistogram(this.db.hubFrequency[currentHub], dayKey, hour);
      this.lastHub = currentHub;

      if (currentHub === 'FinanceHub' && this.lastFinanceInterceptAt > 0) {
        const delta = now - this.lastFinanceInterceptAt;
        if (delta <= 1000 * 60 * 10) {
          this.db.routines.financeAfterBankIntercept.hits += 1;
        }
      }
    }

    const latestIntercept = state.aiMemory?.interception?.latestActionable;
    const currentInterceptId = latestIntercept?.id || null;
    if (!this.lastInterceptId && currentInterceptId) {
      this.lastInterceptId = currentInterceptId;
      this.lastInterceptDetectedAt = Number(latestIntercept?.detectedAt || now);
      if (latestIntercept?.category === 'finance') {
        this.lastFinanceInterceptAt = now;
        this.db.routines.financeAfterBankIntercept.opportunities += 1;
      }
    }

    if (this.lastInterceptId && !currentInterceptId) {
      const responseMs = Math.max(0, now - this.lastInterceptDetectedAt);
      this.db.interceptResponseTimesMs.unshift(responseMs);
      if (this.db.interceptResponseTimesMs.length > MAX_INTERCEPT_SAMPLES) {
        this.db.interceptResponseTimesMs.length = MAX_INTERCEPT_SAMPLES;
      }
      this.lastInterceptId = null;
      this.lastInterceptDetectedAt = 0;
    }

    const completedCount = Number(state.aiMemory?.userState?.completedCount || 0);
    if (completedCount > this.lastCompletedCount) {
      incrementHistogram(this.db.productivityHeatmap, dayKey, hour);
      const zone = String(state.sensorData?.location?.currentZone || 'UNKNOWN');
      const battery = batteryBucket(state.sensorData?.battery?.level);

      if (!this.db.productivityCorrelation.byZone[zone]) {
        this.db.productivityCorrelation.byZone[zone] = { samples: 0, completions: 0 };
      }
      this.db.productivityCorrelation.byZone[zone].samples += 1;
      this.db.productivityCorrelation.byZone[zone].completions += 1;

      this.db.productivityCorrelation.byBatteryBucket[battery].samples += 1;
      this.db.productivityCorrelation.byBatteryBucket[battery].completions += 1;

      // FASE 2.6: Weather Correlation Tracking
      this.trackWeatherCorrelation(state, 'completion');
      // FASE 2.6: Market Correlation Tracking
      this.trackMarketCorrelation(state, 'completion');
    }
    this.lastCompletedCount = completedCount;

    this.detectHomeRestPattern(state);
    
    // FASE 2.6: Continuous external environment sampling
    this.sampleExternalEnvironment(state);
    
    // FASE 2.6: Check if Austerity Mode should activate/deactivate
    this.evaluateAusterityMode(state);

    this.db.lastUpdatedAt = now;
    this.persist();
    this.publishPrediction();
  }

  private detectHomeRestPattern(state: any): void {
    const zone = String(state.sensorData?.location?.currentZone || '');
    if (zone !== 'HOME') return;

    const tasks = Array.isArray(state.tasks?.tasks) ? state.tasks.tasks : [];
    for (const task of tasks) {
      const id = String(task?.id || '');
      if (!id || this.completedTaskIds.has(id)) continue;

      const status = String(task?.status || '').toLowerCase();
      if (status !== 'completed') continue;

      this.completedTaskIds.add(id);
      this.db.routines.homeRest.opportunities += 1;

      const title = String(task?.title || '').toLowerCase();
      if (title.includes('descanso') || title.includes('rest') || title.includes('break')) {
        this.db.routines.homeRest.hits += 1;
      }
    }
  }

  private seedCompletedTasks(tasks: any[]): void {
    for (const task of tasks) {
      const status = String(task?.status || '').toLowerCase();
      if (status === 'completed') {
        this.completedTaskIds.add(String(task?.id || ''));
      }
    }
  }

  private publishPrediction(): void {
    if (!this.store) return;
    const now = new Date();
    const dayKey = DAY_KEYS[now.getDay()];
    const hour = now.getHours();

    const monMorningWork = this.frequencyRange('WorkHub', 'mon', 6, 11);
    const totalMonMorning =
      monMorningWork +
      this.frequencyRange('PersonalHub', 'mon', 6, 11) +
      this.frequencyRange('FinanceHub', 'mon', 6, 11);

    const financeFollowRatio = this.ratio(
      this.db.routines.financeAfterBankIntercept.hits,
      this.db.routines.financeAfterBankIntercept.opportunities
    );

    const homeRestRatio = this.ratio(this.db.routines.homeRest.hits, this.db.routines.homeRest.opportunities);

    let nextHub: HubName | null = null;
    let priority: Priority = 'LOW';
    let reason = 'Sin patron fuerte aun.';

    if (dayKey === 'mon' && hour <= 11 && totalMonMorning >= 3 && monMorningWork / totalMonMorning >= 0.55) {
      nextHub = 'WorkHub';
      priority = 'HIGH';
      reason = 'Basado en tus ultimos lunes por la mañana, sueles iniciar en WorkHub.';
    } else if (financeFollowRatio >= 0.6 && Date.now() - this.lastFinanceInterceptAt <= 1000 * 60 * 10) {
      nextHub = 'FinanceHub';
      priority = 'HIGH';
      reason = 'Patron detectado: tras alerta bancaria sueles abrir FinanceHub.';
    } else {
      const currentZone = String((this.store.getState() as any).sensorData?.location?.currentZone || '');
      if (currentZone === 'HOME' && homeRestRatio >= 0.5) {
        nextHub = 'PersonalHub';
        priority = 'MEDIUM';
        reason = 'Rutina HOME detectada: sueles completar tareas de descanso en PersonalHub.';
      }
    }

    const averageInterceptResponseMs = avg(this.db.interceptResponseTimesMs.slice(0, 20));
    const state: any = this.store.getState();
    const previous = state?.aiMemory?.predictiveBuffer;

    const samePrediction =
      previous &&
      previous.nextHub === nextHub &&
      previous.priority === priority &&
      previous.reason === reason &&
      Number(previous.averageInterceptResponseMs || 0) === averageInterceptResponseMs;

    // Avoid recursive dispatch loops: only emit when prediction content changes.
    if (samePrediction) {
      return;
    }

    this.store.dispatch(
      setPredictiveBuffer({
        generatedAt: Date.now(),
        nextHub,
        priority,
        reason,
        averageInterceptResponseMs,
      })
    );
  }

  private frequencyRange(hub: HubName, day: string, startHour: number, endHour: number): number {
    const bucket = this.db.hubFrequency[hub]?.[day] || {};
    let total = 0;
    for (let h = startHour; h <= endHour; h += 1) {
      total += Number(bucket[String(h)] || 0);
    }
    return total;
  }

  private ratio(numerator: number, denominator: number): number {
    if (!denominator) return 0;
    return numerator / denominator;
  }

  // FASE 2.6: Weather Correlation Tracking
  private trackWeatherCorrelation(state: any, event: 'completion' | 'creation' | 'cancellation'): void {
    const briefing = state.aiMemory?.preFlightBriefing;
    if (!briefing?.condition) return;

    const condition = briefing.condition;
    const entry = this.db.weatherCorrelation[condition];
    if (!entry) return;

    if (event === 'completion') {
      entry.completions += 1;
    } else if (event === 'creation') {
      entry.tasksCreated += 1;
    } else if (event === 'cancellation') {
      entry.tasksCancelled += 1;
    }

    // Update environment sample
    if (this.db.lastWeatherCondition !== condition) {
      this.db.lastWeatherCondition = condition;
      entry.samples += 1;
    }
  }

  // FASE 2.6: Market Correlation Tracking
  private trackMarketCorrelation(state: any, event: 'completion' | 'finance-intercept' | 'spending'): void {
    const briefing = state.aiMemory?.preFlightBriefing;
    const assetAlerts = briefing?.assetAlerts || [];
    
    // Determine market state from asset alerts
    let marketState: 'bull' | 'neutral' | 'bear' = 'neutral';
    if (assetAlerts.length > 0) {
      const avgChange = assetAlerts.reduce((sum: number, alert: any) => sum + (alert.changePercent || 0), 0) / assetAlerts.length;
      if (avgChange > 3) marketState = 'bull';
      else if (avgChange < -3) marketState = 'bear';
    }

    const entry = this.db.marketCorrelation[marketState];

    if (event === 'completion') {
      entry.tasksCompleted += 1;
    } else if (event === 'finance-intercept') {
      entry.financeInterceptions += 1;
    } else if (event === 'spending') {
      entry.spendingsLogged += 1;
    }

    // Update market state sample
    if (this.db.lastMarketState !== marketState) {
      this.db.lastMarketState = marketState;
      entry.samples += 1;
    }
  }

  // FASE 2.6: Sample external environment periodically
  private sampleExternalEnvironment(state: any): void {
    const briefing = state.aiMemory?.preFlightBriefing;
    if (!briefing) return;

    // Update weather state if changed
    if (briefing.condition && this.db.lastWeatherCondition !== briefing.condition) {
      this.db.lastWeatherCondition = briefing.condition;
      this.db.weatherCorrelation[briefing.condition].samples += 1;
    }

    // Update market state based on asset alerts
    const assetAlerts = briefing.assetAlerts || [];
    if (assetAlerts.length > 0) {
      const avgChange = assetAlerts.reduce((sum: number, alert: any) => sum + (alert.changePercent || 0), 0) / assetAlerts.length;
      let marketState: 'bull' | 'neutral' | 'bear' = 'neutral';
      if (avgChange > 3) marketState = 'bull';
      else if (avgChange < -3) marketState = 'bear';

      if (this.db.lastMarketState !== marketState) {
        this.db.lastMarketState = marketState;
        this.db.marketCorrelation[marketState].samples += 1;
      }
    }
  }

  // FASE 2.6: Evaluate if Austerity Mode should activate
  private evaluateAusterityMode(state: any): void {
    const briefing = state.aiMemory?.preFlightBriefing;
    const assetAlerts = briefing?.assetAlerts || [];
    
    if (assetAlerts.length === 0) {
      // No market data, deactivate austerity if it was active
      if (this.db.austerityModeActive) {
        this.db.austerityModeActive = false;
      }
      return;
    }

    // Calculate average market change
    const avgChange = assetAlerts.reduce((sum: number, alert: any) => sum + (alert.changePercent || 0), 0) / assetAlerts.length;
    
    // Count high-severity negative alerts
    const negativeAlerts = assetAlerts.filter((alert: any) => 
      alert.severity === 'high' && alert.changePercent < 0
    );

    // Activate austerity if:
    // 1. Average market change is < -5% (significant downturn)
    // 2. OR 2+ high-severity negative alerts
    const shouldActivate = avgChange < -5 || negativeAlerts.length >= 2;

    if (shouldActivate && !this.db.austerityModeActive) {
      this.db.austerityModeActive = true;
      this.db.austerityActivatedAt = Date.now();
    } else if (!shouldActivate && this.db.austerityModeActive) {
      // Deactivate if market recovers
      this.db.austerityModeActive = false;
    }
  }

  // FASE 2.6: Public API for external modules
  public getWeatherImpact(): { condition: string; productivity: number; confidence: number } | null {
    if (!this.db.lastWeatherCondition) return null;

    const entry = this.db.weatherCorrelation[this.db.lastWeatherCondition];
    if (entry.samples < 3) return null; // Need minimum samples

    const productivity = this.ratio(entry.completions, entry.samples);
    const confidence = Math.min(entry.samples / 10, 1); // Max confidence at 10+ samples

    return {
      condition: this.db.lastWeatherCondition,
      productivity,
      confidence,
    };
  }

  public getMarketImpact(): { state: string; spending: number; confidence: number } | null {
    if (!this.db.lastMarketState) return null;

    const entry = this.db.marketCorrelation[this.db.lastMarketState];
    if (entry.samples < 3) return null;

    const spending = this.ratio(entry.spendingsLogged + entry.financeInterceptions, entry.samples);
    const confidence = Math.min(entry.samples / 10, 1);

    return {
      state: this.db.lastMarketState,
      spending,
      confidence,
    };
  }

  public isAusterityActive(): boolean {
    return this.db.austerityModeActive;
  }

  public getAusterityActivatedAt(): number {
    return this.db.austerityActivatedAt;
  }

  private persist(): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.db));
    } catch {
      // Ignore storage quota failures and continue runtime logging.
    }
  }
}

let blackBoxInstance: BlackBox | null = null;

export function initializeBlackBox(store: Store): BlackBox {
  if (!blackBoxInstance) {
    blackBoxInstance = new BlackBox();
  }
  blackBoxInstance.initialize(store);
  return blackBoxInstance;
}

export function getBlackBox(): BlackBox | null {
  return blackBoxInstance;
}
