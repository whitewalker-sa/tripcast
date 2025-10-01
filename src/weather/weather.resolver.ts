import { Resolver, Query, Args, Int } from '@nestjs/graphql';
import { Logger } from '@nestjs/common';
import { WeatherService } from './weather.service';
import { WeatherForecastInput } from './dto/weather-forecast.input';
import { WeatherForecast } from './entities/weather-forecast.entity';

@Resolver(() => WeatherForecast)
export class WeatherResolver {
  private readonly logger = new Logger(WeatherResolver.name);

  constructor(private readonly weatherService: WeatherService) {}

  /**
   * Get weather forecast for a city
   */
  @Query(() => [WeatherForecast], {
    name: 'weatherForecast',
    description:
      'Get weather forecast for a city with specified number of days',
  })
  async getWeatherForecast(
    @Args('input') input: WeatherForecastInput,
  ): Promise<WeatherForecast[]> {
    this.logger.debug(`GraphQL weatherForecast called`, { input });
    return this.weatherService.getWeatherForecast(input);
  }

  /**
   * Get weather for a specific city and date
   */
  @Query(() => WeatherForecast, {
    name: 'weatherForDate',
    description: 'Get weather forecast for a specific city and date',
    nullable: true,
  })
  async getWeatherForDate(
    @Args('cityId', { type: () => Int }) cityId: number,
    @Args('date') date: Date,
  ): Promise<WeatherForecast | null> {
    this.logger.debug(`GraphQL weatherForDate called`, { cityId, date });
    return this.weatherService.getWeatherForDate(cityId, date);
  }
}
