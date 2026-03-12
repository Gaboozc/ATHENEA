/**
 * FASE 2.5: External Data Service
 * 
 * Bridge between ATHENEA and external data sources (weather, financial markets).
 * 
 * Manages:
 * - Weather API integration (OpenWeather)
 * - Cryptocurrency/Stock price monitoring
 * - Caching and rate limiting
 * - Error handling with graceful fallback
 */

export interface WeatherData {
  temperature: number; // Celsius
  condition: 'clear' | 'cloudy' | 'rainy' | 'stormy' | 'snow';
  humidity: number; // 0-100
  windSpeed: number; // m/s
  feelsLike: number;
  uvIndex: number;
  visibility: number; // km
  precipitationChance: number; // 0-100
  forecastHourly: Array<{
    hour: number;
    temp: number;
    condition: string;
    precipitation: number;
  }>;
}

export interface AssetPrice {
  assetId: string;
  currentPrice: number;
  previousPrice: number;
  changePercent: number;
  lastUpdate: number; // timestamp
  source: 'crypto' | 'stock';
}

export interface ExternalDataCache {
  weather: {
    data: WeatherData | null;
    timestamp: number;
    ttl: number; // seconds
  };
  assets: Map<string, AssetPrice>;
}

class ExternalDataService {
  private static instance: ExternalDataService;
  private cache: ExternalDataCache = {
    weather: { data: null, timestamp: 0, ttl: 600 }, // 10 min cache
    assets: new Map(),
  };

  private weatherApiKey = '';
  private weatherProvider: 'device-auto' | 'openweather' | 'weatherapi' = 'device-auto';

  private constructor() {}

  static getInstance(): ExternalDataService {
    if (!ExternalDataService.instance) {
      ExternalDataService.instance = new ExternalDataService();
    }
    return ExternalDataService.instance;
  }

  /**
   * Initialize the service with API keys
   */
  configure(config: {
    weatherApiKey: string;
    weatherProvider?: 'device-auto' | 'openweather' | 'weatherapi';
  }): void {
    this.weatherApiKey = config.weatherApiKey;
    if (config.weatherProvider) {
      this.weatherProvider = config.weatherProvider;
    }
  }

  /**
   * Fetch weather data for given coordinates
   * Uses cache to avoid excessive API calls
   */
  async getWeather(latitude: number, longitude: number, forceRefresh = false): Promise<WeatherData | null> {
    const now = Date.now();
    const isCacheValid = this.cache.weather.data && 
      (now - this.cache.weather.timestamp) < (this.cache.weather.ttl * 1000) &&
      !forceRefresh;

    if (isCacheValid) {
      return this.cache.weather.data;
    }

    try {
      let weather: WeatherData | null = null;

      if (this.weatherProvider === 'device-auto') {
        weather = await this.fetchOpenMeteoWeather(latitude, longitude);
      } else if (this.weatherProvider === 'openweather') {
        weather = await this.fetchOpenWeather(latitude, longitude);
      } else if (this.weatherProvider === 'weatherapi') {
        weather = await this.fetchWeatherApi(latitude, longitude);
      }

      if (weather) {
        this.cache.weather.data = weather;
        this.cache.weather.timestamp = now;
      }

      return weather;
    } catch (error) {
      console.warn('[ExternalDataService] Weather fetch failed:', error);
      return this.cache.weather.data || null;
    }
  }

  /**
   * OpenWeather API integration
   */
  private async fetchOpenWeather(latitude: number, longitude: number): Promise<WeatherData | null> {
    if (!this.weatherApiKey) {
      console.warn('[ExternalDataService] OpenWeather API key not configured');
      return null;
    }

    const url = `https://api.openweathermap.org/data/2.5/forecast?lat=${latitude}&lon=${longitude}&appid=${this.weatherApiKey}&units=metric`;

    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`OpenWeather API error: ${response.status}`);
    }

    const data = await response.json();
    const current = data.list[0]; // First item is current
    const next3Hours = data.list.slice(0, 3);

    return {
      temperature: Math.round(current.main.temp),
      condition: this.mapWeatherCondition(current.weather[0].main),
      humidity: current.main.humidity,
      windSpeed: current.wind.speed,
      feelsLike: Math.round(current.main.feels_like),
      uvIndex: 0, // OpenWeather free tier doesn't include UV
      visibility: current.visibility / 1000, // Convert to km
      precipitationChance: (current.pop || 0) * 100,
      forecastHourly: next3Hours.map((item: any, index: number) => ({
        hour: 3 * (index + 1),
        temp: Math.round(item.main.temp),
        condition: item.weather[0].main,
        precipitation: (item.pop || 0) * 100,
      })),
    };
  }

  /**
   * WeatherAPI.com integration
   */
  private async fetchWeatherApi(latitude: number, longitude: number): Promise<WeatherData | null> {
    if (!this.weatherApiKey) {
      console.warn('[ExternalDataService] WeatherAPI key not configured');
      return null;
    }

    const url = `https://api.weatherapi.com/v1/forecast.json?key=${this.weatherApiKey}&q=${latitude},${longitude}&aqi=no&alerts=no`;

    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`WeatherAPI error: ${response.status}`);
    }

    const data = await response.json();
    const current = data.current;
    const forecastHours = data.forecast.forecastday[0].hour.slice(0, 3);

    return {
      temperature: Math.round(current.temp_c),
      condition: this.mapWeatherCondition(current.condition.text),
      humidity: current.humidity,
      windSpeed: current.wind_mps,
      feelsLike: Math.round(current.feelslike_c),
      uvIndex: current.uv,
      visibility: current.vis_km,
      precipitationChance: current.chance_of_rain,
      forecastHourly: forecastHours.map((hour: any) => ({
        hour: new Date(hour.time).getHours(),
        temp: Math.round(hour.temp_c),
        condition: hour.condition.text,
        precipitation: hour.chance_of_rain,
      })),
    };
  }

  /**
   * Open-Meteo integration for automatic device weather (no API key required)
   */
  private async fetchOpenMeteoWeather(latitude: number, longitude: number): Promise<WeatherData | null> {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,relative_humidity_2m,apparent_temperature,wind_speed_10m,weather_code&hourly=temperature_2m,precipitation_probability,weather_code,wind_speed_10m&timezone=auto&forecast_days=1`;

    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Open-Meteo API error: ${response.status}`);
    }

    const data = await response.json();
    const current = data?.current || {};
    const hourly = data?.hourly || {};
    const nowHour = new Date().getHours();

    const forecastHourly = [1, 2, 3].map((delta) => {
      const idx = Math.min((nowHour + delta) % 24, (hourly?.temperature_2m || []).length - 1);
      return {
        hour: delta,
        temp: Math.round(Number(hourly?.temperature_2m?.[idx] ?? current?.temperature_2m ?? 0)),
        condition: String(hourly?.weather_code?.[idx] ?? current?.weather_code ?? ''),
        precipitation: Number(hourly?.precipitation_probability?.[idx] ?? 0),
      };
    });

    return {
      temperature: Math.round(Number(current?.temperature_2m ?? 0)),
      condition: this.mapWeatherCodeToCondition(Number(current?.weather_code ?? 3)),
      humidity: Number(current?.relative_humidity_2m ?? 0),
      windSpeed: Number(current?.wind_speed_10m ?? 0),
      feelsLike: Math.round(Number(current?.apparent_temperature ?? current?.temperature_2m ?? 0)),
      uvIndex: 0,
      visibility: 10,
      precipitationChance: Number(hourly?.precipitation_probability?.[nowHour] ?? 0),
      forecastHourly,
    };
  }

  private mapWeatherCodeToCondition(code: number): 'clear' | 'cloudy' | 'rainy' | 'stormy' | 'snow' {
    if ([0].includes(code)) return 'clear';
    if ([1, 2, 3, 45, 48].includes(code)) return 'cloudy';
    if ([61, 63, 65, 80, 81, 82, 51, 53, 55].includes(code)) return 'rainy';
    if ([95, 96, 99].includes(code)) return 'stormy';
    if ([71, 73, 75, 77, 85, 86].includes(code)) return 'snow';
    return 'cloudy';
  }

  /**
   * Normalize weather condition names
   */
  private mapWeatherCondition(rawCondition: string): 'clear' | 'cloudy' | 'rainy' | 'stormy' | 'snow' {
    const lower = rawCondition.toLowerCase();
    if (lower.includes('clear') || lower.includes('sunny')) return 'clear';
    if (lower.includes('cloud')) return 'cloudy';
    if (lower.includes('rain') || lower.includes('drizzle')) return 'rainy';
    if (lower.includes('thunder') || lower.includes('storm')) return 'stormy';
    if (lower.includes('snow') || lower.includes('sleet')) return 'snow';
    return 'cloudy'; // default
  }

  /**
   * Fetch cryptocurrency prices from CoinGecko (free, no API key needed)
   */
  async getCryptoPrice(cryptoId: string): Promise<AssetPrice | null> {
    const cacheKey = `crypto-${cryptoId}`;
    const cached = this.cache.assets.get(cacheKey);

    // Return cache if valid (1 min TTL)
    if (cached && (Date.now() - cached.lastUpdate) < 60000) {
      return cached;
    }

    try {
      const url = `https://api.coingecko.com/api/v3/simple/price?ids=${cryptoId.toLowerCase()}&vs_currencies=usd&include_24hr_change=true`;
      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`CoinGecko API error: ${response.status}`);
      }

      const data = await response.json();
      const cryptoData = data[cryptoId.toLowerCase()];

      if (!cryptoData || cryptoData.usd === undefined) {
        return null;
      }

      const previousPrice = cryptoData.usd / (1 + (cryptoData.usd_24h_change || 0) / 100);
      const assetPrice: AssetPrice = {
        assetId: cryptoId,
        currentPrice: cryptoData.usd,
        previousPrice,
        changePercent: cryptoData.usd_24h_change || 0,
        lastUpdate: Date.now(),
        source: 'crypto',
      };

      this.cache.assets.set(cacheKey, assetPrice);
      return assetPrice;
    } catch (error) {
      console.warn(`[ExternalDataService] Failed to fetch ${cryptoId} price:`, error);
      return cached || null;
    }
  }

  /**
   * Fetch stock prices from Alpha Vantage or similar (requires API key)
   * For MVP, using a mock implementation
   */
  async getStockPrice(symbol: string): Promise<AssetPrice | null> {
    const cacheKey = `stock-${symbol}`;
    const cached = this.cache.assets.get(cacheKey);

    // Return cache if valid (5 min TTL for stocks)
    if (cached && (Date.now() - cached.lastUpdate) < 300000) {
      return cached;
    }

    try {
      // NOTE: For a real implementation, integrate with Alpha Vantage, Finnhub, or similar
      // This is a mock implementation that returns cached data or null
      console.warn(`[ExternalDataService] Stock price fetch not implemented for ${symbol}`);
      return cached || null;
    } catch (error) {
      console.warn(`[ExternalDataService] Failed to fetch ${symbol} price:`, error);
      return cached || null;
    }
  }

  /**
   * Get all cached asset prices
   */
  getAssetSnapshot(): AssetPrice[] {
    return Array.from(this.cache.assets.values());
  }

  /**
   * Check if any asset has exceeded alert threshold
   */
  getAssetAlerts(watchedAssets: Array<{ id: string; type: string; alertThreshold: number }>): AssetPrice[] {
    const result: AssetPrice[] = [];

    for (const watched of watchedAssets) {
      const cacheKey = `${watched.type}-${watched.id}`;
      const cached = this.cache.assets.get(cacheKey);
      if (!cached) continue;
      if (Math.abs(cached.changePercent) >= watched.alertThreshold) {
        result.push(cached);
      }
    }

    return result;
  }

  /**
   * Clear cache
   */
  clearCache(): void {
    this.cache.weather.data = null;
    this.cache.weather.timestamp = 0;
    this.cache.assets.clear();
  }
}

// Export singleton
export const externalDataService = ExternalDataService.getInstance();
