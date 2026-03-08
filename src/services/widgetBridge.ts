import { registerPlugin } from '@capacitor/core';

interface WidgetBridgePlugin {
  updateWidgetState(options: { payload: string }): Promise<{ ok: boolean }>;
  consumePendingAction(): Promise<{ action?: string | null }>;
}

const WidgetBridge = registerPlugin<WidgetBridgePlugin>('WidgetBridge');

export interface WidgetStatePayload {
  generatedAt: number;
  pulseStatus: string;
  topInsightTitle: string;
  topInsightPrompt: string;
  nextEventTitle: string;
  nextEventAt: string;
  checkTaskId: string;
}

export async function pushWidgetState(payload: WidgetStatePayload): Promise<void> {
  try {
    await WidgetBridge.updateWidgetState({ payload: JSON.stringify(payload) });
  } catch {
    // Ignore failures in web preview where native bridge is unavailable.
  }
}

export async function consumeWidgetPendingAction(): Promise<null | {
  type: string;
  prompt?: string;
  taskId?: string;
}> {
  try {
    const result = await WidgetBridge.consumePendingAction();
    if (!result?.action) return null;
    const parsed = JSON.parse(result.action);
    return parsed && typeof parsed.type === 'string' ? parsed : null;
  } catch {
    return null;
  }
}
