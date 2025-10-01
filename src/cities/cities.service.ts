import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { OpenMeteoService } from '../external/open-meteo.service';
import { SearchCitiesInput } from './dto/search-cities.input';
import { City } from './entities/city.entity';
import { OpenMeteoCityDto } from '../external/dto/open-meteo.dto';

@Injectable()
export class CitiesService {
  private readonly logger = new Logger(CitiesService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly openMeteoService: OpenMeteoService,
  ) {}

  /**
   * Search for cities with caching logic
   */
  async searchCities(input: SearchCitiesInput): Promise<City[]> {
    const { query, limit = 10, countryCode } = input;

    this.logger.debug(`Searching cities`, { query, limit, countryCode });

    // First, try to find cached cities that match the query
    const cachedCities = await this.findCachedCities(query, countryCode, limit);

    // If we have enough cached results, return them
    if (cachedCities.length >= Math.min(limit, 5)) {
      this.logger.debug(`Returning cached cities`, { count: cachedCities.length });
      return cachedCities;
    }

    try {
      // Fetch from Open-Meteo API
      const apiCities = await this.openMeteoService.searchCitiesAsync(
        query,
        limit,
        countryCode,
      );

      // Cache and return the new cities
      const cities = await this.cacheAndConvertCities(apiCities);

      this.logger.debug(`Cached and returning new cities`, { count: cities.length });
      return cities;
    } catch (error) {
      this.logger.error(`Failed to fetch cities from API`, { error: error.message });

      // Fallback to cached results if API fails
      if (cachedCities.length > 0) {
        this.logger.warn(`Falling back to cached results`, {
          count: cachedCities.length,
        });
        return cachedCities;
      }

      throw error;
    }
  }

  /**
   * Get city by ID
   */
  async getCityById(id: number): Promise<City> {
    const city = await this.prisma.city.findUnique({
      where: { id },
      include: {
        weatherForecasts: {
          orderBy: { date: 'desc' },
          take: 7,
        },
        activityRankings: {
          orderBy: { date: 'desc' },
          take: 7,
        },
      },
    });

    if (!city) {
      throw new NotFoundException(`City with ID ${id} not found`);
    }

    return city as City;
  }

  /**
   * Get city by Open-Meteo ID
   */
  async getCityByOpenMeteoId(openMeteoId: number): Promise<City | null> {
    const city = await this.prisma.city.findUnique({
      where: { openMeteoId },
    });

    return city as City | null;
  }

  /**
   * Find cached cities matching the search criteria
   */
  private async findCachedCities(
    query: string,
    countryCode?: string,
    limit = 10,
  ): Promise<City[]> {
    const whereCondition: any = {
      name: {
        contains: query,
        mode: 'insensitive',
      },
    };

    if (countryCode) {
      whereCondition.countryCode = countryCode;
    }

    const cities = await this.prisma.city.findMany({
      where: whereCondition,
      take: limit,
      orderBy: [
        { population: 'desc' }, // Prefer larger cities
        { name: 'asc' }, // Then alphabetical
      ],
    });

    return cities as City[];
  }

  /**
   * Cache cities from API response and convert to our entity format
   */
  private async cacheAndConvertCities(apiCities: OpenMeteoCityDto[]): Promise<City[]> {
    const cities: City[] = [];

    for (const apiCity of apiCities) {
      try {
        const city = await this.prisma.city.upsert({
          where: { openMeteoId: apiCity.id },
          create: {
            openMeteoId: apiCity.id,
            name: apiCity.name,
            latitude: apiCity.latitude,
            longitude: apiCity.longitude,
            elevation: apiCity.elevation,
            timezone: apiCity.timezone,
            featureCode: apiCity.feature_code,
            countryCode: apiCity.country_code,
            country: apiCity.country,
            population: apiCity.population,
            admin1: apiCity.admin1,
            admin2: apiCity.admin2,
            admin3: apiCity.admin3,
            admin4: apiCity.admin4,
            postcodes: apiCity.postcodes || [],
          },
          update: {
            name: apiCity.name,
            latitude: apiCity.latitude,
            longitude: apiCity.longitude,
            elevation: apiCity.elevation,
            timezone: apiCity.timezone,
            featureCode: apiCity.feature_code,
            countryCode: apiCity.country_code,
            country: apiCity.country,
            population: apiCity.population,
            admin1: apiCity.admin1,
            admin2: apiCity.admin2,
            admin3: apiCity.admin3,
            admin4: apiCity.admin4,
            postcodes: apiCity.postcodes || [],
          },
        });

        cities.push(city as City);
      } catch (error) {
        this.logger.error(`Failed to cache city`, {
          cityId: apiCity.id,
          cityName: apiCity.name,
          error: error.message,
        });
      }
    }

    return cities;
  }
}