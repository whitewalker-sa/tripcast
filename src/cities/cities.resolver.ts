import { Resolver, Query, Args, Int } from '@nestjs/graphql';
import { Logger } from '@nestjs/common';
import { CitiesService } from './cities.service';
import { SearchCitiesInput } from './dto/search-cities.input';
import { City } from './entities/city.entity';

@Resolver(() => City)
export class CitiesResolver {
  private readonly logger = new Logger(CitiesResolver.name);

  constructor(private readonly citiesService: CitiesService) {}

  /**
   * Search for cities based on query string
   */
  @Query(() => [City], {
    name: 'searchCities',
    description: 'Search for cities by name with optional country filtering',
  })
  async searchCities(@Args('input') input: SearchCitiesInput): Promise<City[]> {
    this.logger.debug(`GraphQL searchCities called`, { input });
    return this.citiesService.searchCities(input);
  }

  /**
   * Get a specific city by ID
   */
  @Query(() => City, {
    name: 'city',
    description: 'Get a city by its ID with related weather and activity data',
  })
  async getCity(@Args('id', { type: () => Int }) id: number): Promise<City> {
    this.logger.debug(`GraphQL city called`, { id });
    return this.citiesService.getCityById(id);
  }
}
