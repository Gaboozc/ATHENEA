export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface LLMResponse {
  content: string;
  model: string;
  provider: string;
}

export interface LLMConfig {
  provider: 'ollama' | 'openai' | 'groq';
  baseUrl: string;
  model: string;
  apiKey: string;
}

export function getLLMConfigSync(): LLMConfig {
  const provider = (localStorage.getItem('athenea.llm.provider') || 'ollama') as LLMConfig['provider'];

  const defaults = {
    ollama: {
      baseUrl: 'http://localhost:11434',
      model: 'llama3.2:3b',
    },
    openai: {
      baseUrl: 'https://api.openai.com/v1',
      model: 'gpt-4o-mini',
    },
    groq: {
      baseUrl: 'https://api.groq.com/openai/v1',
      model: 'llama-3.1-8b-instant',
    },
  };

  const fallback = defaults[provider] || defaults.ollama;

  return {
    provider,
    baseUrl: localStorage.getItem('athenea.llm.base_url') || fallback.baseUrl,
    model: localStorage.getItem('athenea.llm.model') || fallback.model,
    apiKey: localStorage.getItem('athenea.neural.key') || '',
  };
}

class LLMClient {
  private extractContentFromRawStreamPayload(rawPayload: string): string {
    const trimmed = rawPayload.trim();
    if (!trimmed) return '';

    // Some providers may return a non-SSE JSON payload even when stream=true.
    try {
      const parsed = JSON.parse(trimmed);
      return String(
        parsed?.choices?.[0]?.message?.content ??
        parsed?.choices?.[0]?.delta?.content ??
        parsed?.message?.content ??
        ''
      );
    } catch {
      // If payload is mixed/chunked, attempt line-by-line data extraction.
      const lines = trimmed.split('\n');
      for (const line of lines) {
        const candidate = line.trim().startsWith('data: ')
          ? line.trim().slice(6)
          : line.trim();

        if (!candidate || candidate === '[DONE]') continue;

        try {
          const parsed = JSON.parse(candidate);
          const content = String(
            parsed?.choices?.[0]?.message?.content ??
            parsed?.choices?.[0]?.delta?.content ??
            parsed?.message?.content ??
            ''
          );
          if (content) return content;
        } catch {
          // keep scanning lines
        }
      }
      return '';
    }
  }

  async chat(
    messages: ChatMessage[],
    options: {
      maxTokens?: number;
      temperature?: number;
      signal?: AbortSignal;
      onToken?: (chunk: string) => void;
    } = {}
  ): Promise<LLMResponse> {
    const config = getLLMConfigSync();

    const url = config.provider === 'ollama'
      ? `${config.baseUrl}/v1/chat/completions`
      : `${config.baseUrl}/chat/completions`;

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (config.provider !== 'ollama' && config.apiKey) {
      headers['Authorization'] = `Bearer ${config.apiKey}`;
    }

    const useStreaming = typeof options.onToken === 'function';

    const response = await fetch(url, {
      method: 'POST',
      headers,
      signal: options.signal,
      body: JSON.stringify({
        model: config.model,
        messages,
        max_tokens: options.maxTokens || 1000,
        temperature: options.temperature || 0.7,
        stream: useStreaming,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`LLM error ${response.status}: ${error}`);
    }

    if (useStreaming) {
      if (!response.body) {
        throw new Error('Streaming response body unavailable');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let fullText = '';
      let rawPayload = '';

      try {
        outer: while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const raw = decoder.decode(value, { stream: true });
          rawPayload += raw;
          for (const line of raw.split('\n')) {
            const trimmed = line.trim();
            if (!trimmed.startsWith('data: ')) continue;

            const data = trimmed.slice(6);
            if (data === '[DONE]') break outer;

            try {
              const json = JSON.parse(data);
              const token = String(json?.choices?.[0]?.delta?.content ?? '');
              if (token) {
                fullText += token;
                options.onToken?.(token);
              }
            } catch {
              // ignore malformed chunk
            }
          }
        }
      } finally {
        reader.releaseLock();
      }

      if (!fullText.trim()) {
        fullText = this.extractContentFromRawStreamPayload(rawPayload);
      }

      return {
        content: fullText,
        model: config.model,
        provider: config.provider,
      };
    }

    const data = await response.json();
    return {
      content: data.choices?.[0]?.message?.content || '',
      model: data.model || config.model,
      provider: config.provider,
    };
  }

  async testConnection(): Promise<boolean> {
    try {
      const config = getLLMConfigSync();

      if (config.provider === 'ollama') {
        const res = await fetch(`${config.baseUrl}/api/tags`, {
          signal: AbortSignal.timeout(3000),
        });
        return res.ok;
      }

      return !!config.apiKey;
    } catch {
      return false;
    }
  }
}

export const llmClient = new LLMClient();
