import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { OpenMeteoService } from '../external/open-meteo.service';
import { CitiesService } from '../cities/cities.service';
import { WeatherForecastInput } from './dto/weather-forecast.input';
import { WeatherForecast } from './entities/weather-forecast.entity';
import { OpenMeteoWeatherResponse } from '../external/dto/open-meteo.dto';

@Injectable()
export class WeatherService {
  private readonly logger = new Logger(WeatherService.name);
  private readonly cacheTtlMinutes = 30; // Cache weather data for 30 minutes

  constructor(
    private readonly prisma: PrismaService,
    private readonly openMeteoService: OpenMeteoService,
    private readonly citiesService: CitiesService,
  ) {}

  /**
   * Get weather forecast for a city with caching
   */
  async getWeatherForecast(
    input: WeatherForecastInput,
  ): Promise<WeatherForecast[]> {
    const { cityId, days = 7 } = input;

    this.logger.debug(`Getting weather forecast`, { cityId, days });

    // Get city information
    const city = await this.citiesService.getCityById(cityId);
    if (!city) {
      throw new NotFoundException(`City with ID ${cityId} not found`);
    }

    // Check for cached weather data that's still fresh
    const cachedForecasts = await this.findCachedForecasts(cityId, days);

    if (this.isCacheFresh(cachedForecasts)) {
      this.logger.debug(`Returning cached weather forecasts`, {
        cityId,
        count: cachedForecasts.length,
      });
      return cachedForecasts;
    }

    try {
      // Fetch fresh weather data from API
      const weatherData = await this.openMeteoService.getWeatherForecastAsync(
        city.latitude,
        city.longitude,
        days,
        city.timezone,
      );

      // Cache and return the new forecast data
      const forecasts = await this.cacheWeatherData(cityId, weatherData);

      this.logger.debug(`Cached and returning new weather forecasts`, {
        cityId,
        count: forecasts.length,
      });
      return forecasts;
    } catch (error) {
      this.logger.error(`Failed to fetch weather data from API`, {
        cityId,
        error: error.message,
      });

      // Fallback to cached results even if slightly stale
      if (cachedForecasts.length > 0) {
        this.logger.warn(`Falling back to cached weather results`, {
          cityId,
          count: cachedForecasts.length,
        });
        return cachedForecasts;
      }

      throw error;
    }
  }

  /**
   * Get weather forecast for specific date
   */
  async getWeatherForDate(
    cityId: number,
    date: Date,
  ): Promise<WeatherForecast | null> {
    const forecast = await this.prisma.weatherForecast.findUnique({
      where: {
        cityId_date: {
          cityId,
          date,
        },
      },
      include: {
        city: true,
      },
    });

    return forecast as WeatherForecast | null;
  }

  /**
   * Find cached weather forecasts for a city
   */
  private async findCachedForecasts(
    cityId: number,
    days: number,
  ): Promise<WeatherForecast[]> {
    const startDate = new Date();
    const endDate = new Date();
    endDate.setDate(startDate.getDate() + days);

    const forecasts = await this.prisma.weatherForecast.findMany({
      where: {
        cityId,
        date: {
          gte: startDate,
          lte: endDate,
        },
      },
      include: {
        city: true,
      },
      orderBy: {
        date: 'asc',
      },
    });

    return forecasts as WeatherForecast[];
  }

  /**
   * Check if cached forecasts are still fresh (within TTL)
   */
  private isCacheFresh(forecasts: WeatherForecast[]): boolean {
    if (forecasts.length === 0) {
      return false;
    }

    const now = new Date();
    const oldestAcceptable = new Date(
      now.getTime() - this.cacheTtlMinutes * 60 * 1000,
    );

    return forecasts.every((forecast) => forecast.updatedAt > oldestAcceptable);
  }

  /**
   * Cache weather data from API response
   */
  private async cacheWeatherData(
    cityId: number,
    weatherData: OpenMeteoWeatherResponse,
  ): Promise<WeatherForecast[]> {
    const forecasts: WeatherForecast[] = [];

    if (!weatherData.daily || !weatherData.daily.time) {
      this.logger.warn(`No daily weather data received`, { cityId });
      return forecasts;
    }

    const {
      time,
      temperature_2m_max,
      temperature_2m_min,
      weathercode,
      precipitation_sum,
      rain_sum,
      showers_sum,
      snowfall_sum,
      windspeed_10m_max,
      winddirection_10m_dominant,
      windgusts_10m_max,
      uv_index_max,
      sunrise,
      sunset,
      sunshine_duration,
    } = weatherData.daily;

    for (let i = 0; i < time.length; i++) {
      try {
        const date = new Date(time[i]);

        // Prepare sunrise/sunset JSON if available
        let sunriseSunset: string | null = null;
        if (sunrise && sunset && sunrise[i] && sunset[i]) {
          sunriseSunset = JSON.stringify({
            sunrise: sunrise[i],
            sunset: sunset[i],
          });
        }

        const forecast = await this.prisma.weatherForecast.upsert({
          where: {
            cityId_date: {
              cityId,
              date,
            },
          },
          create: {
            cityId,
            date,
            maxTemp: temperature_2m_max[i],
            minTemp: temperature_2m_min[i],
            weatherCode: weathercode[i],
            precipitation: precipitation_sum[i],
            rainSum: rain_sum?.[i],
            showersSum: showers_sum?.[i],
            snowfallSum: snowfall_sum?.[i],
            windSpeed: windspeed_10m_max[i],
            windDirection: winddirection_10m_dominant?.[i],
            windGusts: windgusts_10m_max?.[i],
            uvIndex: uv_index_max?.[i],
            sunriseSunset,
            sunshineDuration: sunshine_duration?.[i],
          },
          update: {
            maxTemp: temperature_2m_max[i],
            minTemp: temperature_2m_min[i],
            weatherCode: weathercode[i],
            precipitation: precipitation_sum[i],
            rainSum: rain_sum?.[i],
            showersSum: showers_sum?.[i],
            snowfallSum: snowfall_sum?.[i],
            windSpeed: windspeed_10m_max[i],
            windDirection: winddirection_10m_dominant?.[i],
            windGusts: windgusts_10m_max?.[i],
            uvIndex: uv_index_max?.[i],
            sunriseSunset,
            sunshineDuration: sunshine_duration?.[i],
          },
          include: {
            city: true,
          },
        });

        forecasts.push(forecast as WeatherForecast);
      } catch (error) {
        this.logger.error(`Failed to cache weather forecast`, {
          cityId,
          date: time[i],
          error: error.message,
        });
      }
    }

    return forecasts;
  }
}
