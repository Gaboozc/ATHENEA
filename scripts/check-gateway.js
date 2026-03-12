#!/usr/bin/env node

import process from 'node:process';

const gatewayUrl = process.env.VITE_OPENCLAW_GATEWAY_URL;
const apiKey = process.env.VITE_OPENCLAW_API_KEY;

if (!gatewayUrl) {
  console.error('[Gateway Check] Missing VITE_OPENCLAW_GATEWAY_URL');
  process.exit(1);
}

let normalizedUrl;
try {
  normalizedUrl = new URL(gatewayUrl);
} catch (error) {
  console.error(`[Gateway Check] Invalid URL: ${gatewayUrl}`);
  process.exit(1);
}

const requestBody = {
  message: 'health check from athenea',
  context: {
    hub: 'WorkHub',
    availableSkills: [
      {
        id: 'search',
        name: 'Search',
        description: 'Search across all data'
      }
    ]
  }
};

const controller = new AbortController();
const timeout = setTimeout(() => controller.abort(), 6000);

try {
  const response = await fetch(new URL('/agent', normalizedUrl), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(apiKey ? { Authorization: `Bearer ${apiKey}` } : {})
    },
    body: JSON.stringify(requestBody),
    signal: controller.signal
  });

  const rawBody = await response.text();
  let payload = null;

  try {
    payload = rawBody ? JSON.parse(rawBody) : null;
  } catch {
    payload = null;
  }

  if (!response.ok) {
    console.error(`[Gateway Check] HTTP ${response.status} ${response.statusText}`);
    if (rawBody) {
      console.error(`[Gateway Check] Body: ${rawBody.slice(0, 400)}`);
    }
    process.exit(1);
  }

  const hasContract = Boolean(
    payload &&
    typeof payload.skillId === 'string' &&
    typeof payload.confidence === 'number'
  );

  if (!hasContract) {
    console.error('[Gateway Check] Response does not match contract { skillId: string, confidence: number }');
    console.error(`[Gateway Check] Payload: ${rawBody.slice(0, 400)}`);
    process.exit(1);
  }

  console.log('[Gateway Check] OK');
  console.log(`[Gateway Check] Endpoint: ${normalizedUrl.toString()}`);
  console.log(`[Gateway Check] skillId=${payload.skillId} confidence=${payload.confidence}`);
  process.exit(0);
} catch (error) {
  if (error?.name === 'AbortError') {
    console.error('[Gateway Check] Request timed out after 6000ms');
  } else {
    console.error(`[Gateway Check] Request failed: ${error?.message || String(error)}`);
  }
  process.exit(1);
} finally {
  clearTimeout(timeout);
}
