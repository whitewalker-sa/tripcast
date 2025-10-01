import {
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { Observable } from 'rxjs';
import { map, catchError, retry, timeout } from 'rxjs/operators';
import { firstValueFrom } from 'rxjs';
import {
  OpenMeteoCityDto,
  OpenMeteoGeocodingResponse,
  OpenMeteoWeatherResponse,
} from './dto/open-meteo.dto';

@Injectable()
export class OpenMeteoService {
  private readonly logger = new Logger(OpenMeteoService.name);
  private readonly geocodingUrl: string;
  private readonly forecastUrl: string;
  private readonly requestTimeout = 10000; // 10 seconds
  private readonly maxRetries = 2;

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {
    this.geocodingUrl = this.configService.get<string>(
      'OPEN_METEO_GEOCODING_URL',
    )!;
    this.forecastUrl = this.configService.get<string>('OPEN_METEO_BASE_URL')!;
  }

  /**
   * Search for cities using Open-Meteo Geocoding API
   */
  searchCities(
    query: string,
    limit = 10,
    countryCode?: string,
  ): Observable<OpenMeteoCityDto[]> {
    const url = `${this.geocodingUrl}/v1/search`;
    const params: any = {
      name: query,
      count: limit,
      language: 'en',
      format: 'json',
    };

    if (countryCode) {
      params.country_code = countryCode;
    }

    this.logger.debug(`Searching cities for query: ${query}`, { params });

    return this.httpService
      .get<OpenMeteoGeocodingResponse>(url, { params })
      .pipe(
        timeout(this.requestTimeout),
        retry(this.maxRetries),
        map((response) => {
          this.logger.debug(`Geocoding API success for query: ${query}`, {
            resultsCount: response.data.results?.length || 0,
          });
          return response.data.results || [];
        }),
        catchError((error) => {
          this.logger.error(`Geocoding API error for query: ${query}`, {
            error: error.message,
            status: error.response?.status,
            data: error.response?.data,
          });

          if (error.response?.status === 400) {
            throw new InternalServerErrorException(
              `Invalid geocoding request: ${error.response.data?.reason || error.message}`,
            );
          }

          throw new InternalServerErrorException(
            `Geocoding service unavailable: ${error.message}`,
          );
        }),
      );
  }

  /**
   * Get weather forecast using Open-Meteo Weather API
   */
  getWeatherForecast(
    latitude: number,
    longitude: number,
    days = 7,
    timezone = 'auto',
  ): Observable<OpenMeteoWeatherResponse> {
    const url = `${this.forecastUrl}/v1/forecast`;
    const params = {
      latitude: latitude.toString(),
      longitude: longitude.toString(),
      daily: [
        'temperature_2m_max',
        'temperature_2m_min',
        'weathercode',
        'precipitation_sum',
        'rain_sum',
        'showers_sum',
        'snowfall_sum',
        'windspeed_10m_max',
        'winddirection_10m_dominant',
        'windgusts_10m_max',
        'uv_index_max',
        'sunrise',
        'sunset',
        'sunshine_duration',
      ].join(','),
      timezone,
      forecast_days: days.toString(),
    };

    this.logger.debug(`Getting weather forecast`, {
      latitude,
      longitude,
      days,
      timezone,
    });

    return this.httpService.get<OpenMeteoWeatherResponse>(url, { params }).pipe(
      timeout(this.requestTimeout),
      retry(this.maxRetries),
      map((response) => {
        this.logger.debug(`Weather API success`, {
          latitude,
          longitude,
          dailyCount: response.data.daily?.time?.length || 0,
        });
        return response.data;
      }),
      catchError((error) => {
        this.logger.error(`Weather API error`, {
          latitude,
          longitude,
          error: error.message,
          status: error.response?.status,
          data: error.response?.data,
        });

        if (error.response?.status === 400) {
          throw new InternalServerErrorException(
            `Invalid weather request: ${error.response.data?.reason || error.message}`,
          );
        }

        throw new InternalServerErrorException(
          `Weather service unavailable: ${error.message}`,
        );
      }),
    );
  }

  /**
   * Helper method to convert Observable to Promise for easier consumption
   */
  async searchCitiesAsync(
    query: string,
    limit = 10,
    countryCode?: string,
  ): Promise<OpenMeteoCityDto[]> {
    return firstValueFrom(this.searchCities(query, limit, countryCode));
  }

  /**
   * Helper method to convert Observable to Promise for easier consumption
   */
  async getWeatherForecastAsync(
    latitude: number,
    longitude: number,
    days = 7,
    timezone = 'auto',
  ): Promise<OpenMeteoWeatherResponse> {
    return firstValueFrom(
      this.getWeatherForecast(latitude, longitude, days, timezone),
    );
  }
}
