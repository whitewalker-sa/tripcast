import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { WeatherService } from '../weather/weather.service';
import { CitiesService } from '../cities/cities.service';
import { ActivityRecommendationsInput } from './dto/activity-recommendations.input';
import {
  ActivityRecommendations,
  ActivityRecommendation,
} from './entities/activity-ranking.entity';
import { WeatherCode } from '../external/dto/open-meteo.dto';

interface ActivityScore {
  skiing: number;
  surfing: number;
  indoor: number;
  outdoor: number;
}

interface ActivityReasoning {
  skiing: string;
  surfing: string;
  indoor: string;
  outdoor: string;
}

@Injectable()
export class ActivitiesService {
  private readonly logger = new Logger(ActivitiesService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly weatherService: WeatherService,
    private readonly citiesService: CitiesService,
  ) {}

  /**
   * Get activity recommendations for a city and date
   */
  async getActivityRecommendations(
    input: ActivityRecommendationsInput,
  ): Promise<ActivityRecommendations> {
    const { cityId, date } = input;
    const dateObj = new Date(date);

    this.logger.debug(`Getting activity recommendations`, { cityId, date });

    // Get city and weather data
    const city = await this.citiesService.getCityById(cityId);
    const weatherForecast = await this.weatherService.getWeatherForDate(
      cityId,
      dateObj,
    );

    if (!weatherForecast) {
      // If no weather data, fetch it first
      await this.weatherService.getWeatherForecast({ cityId, days: 7 });
      const newWeatherForecast = await this.weatherService.getWeatherForDate(
        cityId,
        dateObj,
      );

      if (!newWeatherForecast) {
        throw new Error(
          `No weather forecast available for ${city.name} on ${date}`,
        );
      }

      return this.calculateActivityRecommendations(
        city,
        newWeatherForecast,
        dateObj,
      );
    }

    return this.calculateActivityRecommendations(
      city,
      weatherForecast,
      dateObj,
    );
  }

  /**
   * Calculate activity recommendations based on weather conditions
   */
  private calculateActivityRecommendations(
    city: any,
    weather: any,
    date: Date,
  ): ActivityRecommendations {
    const scores = this.calculateActivityScores(weather, city);
    const reasoning = this.generateReasoning(weather, city, scores);

    const activities: ActivityRecommendation[] = [
      {
        activity: 'Skiing',
        score: scores.skiing,
        recommendation: this.getRecommendationLevel(scores.skiing),
        reasoning: reasoning.skiing,
      },
      {
        activity: 'Surfing',
        score: scores.surfing,
        recommendation: this.getRecommendationLevel(scores.surfing),
        reasoning: reasoning.surfing,
      },
      {
        activity: 'Indoor Sightseeing',
        score: scores.indoor,
        recommendation: this.getRecommendationLevel(scores.indoor),
        reasoning: reasoning.indoor,
      },
      {
        activity: 'Outdoor Sightseeing',
        score: scores.outdoor,
        recommendation: this.getRecommendationLevel(scores.outdoor),
        reasoning: reasoning.outdoor,
      },
    ].sort((a, b) => b.score - a.score); // Sort by score descending

    return {
      city,
      date,
      activities,
    };
  }

  /**
   * Calculate activity scores based on weather conditions
   */
  private calculateActivityScores(weather: any, city: any): ActivityScore {
    const {
      maxTemp,
      minTemp,
      weatherCode,
      precipitation,
      snowfallSum,
      windSpeed,
      uvIndex,
    } = weather;

    const avgTemp = (maxTemp + minTemp) / 2;
    const isCoastal = this.isCoastalCity(city);
    const isMountainous = this.isMountainousCity(city);

    // Base scores
    let skiing = 0;
    let surfing = 0;
    let indoor = 50; // Base indoor score
    let outdoor = 50; // Base outdoor score

    // Skiing score calculation
    if (isMountainous && avgTemp < 5) {
      skiing += 30;
      if (snowfallSum > 0) skiing += 40;
      if (avgTemp < 0) skiing += 20;
      if (
        weatherCode === WeatherCode.SLIGHT_SNOWFALL ||
        weatherCode === WeatherCode.MODERATE_SNOWFALL ||
        weatherCode === WeatherCode.HEAVY_SNOWFALL
      ) {
        skiing += 10;
      }
    }
    skiing = Math.max(0, Math.min(100, skiing));

    // Surfing score calculation
    if (isCoastal) {
      surfing += 30;
      if (avgTemp > 15) surfing += 20;
      if (avgTemp > 20) surfing += 20;
      if (windSpeed > 10 && windSpeed < 25) surfing += 15; // Good wind conditions
      if (
        weatherCode === WeatherCode.CLEAR_SKY ||
        weatherCode === WeatherCode.MAINLY_CLEAR
      ) {
        surfing += 15;
      }
      if (precipitation > 5) surfing -= 20; // Heavy rain reduces surfing appeal
    }
    surfing = Math.max(0, Math.min(100, surfing));

    // Outdoor sightseeing score
    if (weatherCode === WeatherCode.CLEAR_SKY) outdoor += 30;
    else if (weatherCode === WeatherCode.MAINLY_CLEAR) outdoor += 20;
    else if (weatherCode === WeatherCode.PARTLY_CLOUDY) outdoor += 10;

    if (avgTemp >= 15 && avgTemp <= 25)
      outdoor += 20; // Comfortable temperature
    else if (avgTemp > 25 && avgTemp <= 30)
      outdoor += 10; // Warm but ok
    else if (avgTemp < 5)
      outdoor -= 20; // Too cold
    else if (avgTemp > 35) outdoor -= 20; // Too hot

    if (precipitation > 2) outdoor -= Math.min(30, precipitation * 3); // Rain penalty
    if (windSpeed > 30) outdoor -= 15; // Strong wind penalty
    if (uvIndex && uvIndex > 7) outdoor -= 10; // High UV penalty

    outdoor = Math.max(0, Math.min(100, outdoor));

    // Indoor sightseeing score (inverse of outdoor conditions)
    if (precipitation > 2) indoor += Math.min(30, precipitation * 2);
    if (avgTemp < 5 || avgTemp > 35) indoor += 20; // Extreme temperatures favor indoor
    if (weatherCode >= WeatherCode.FOG) indoor += 15; // Poor weather conditions
    if (windSpeed > 30) indoor += 10;

    indoor = Math.max(0, Math.min(100, indoor));

    return { skiing, surfing, indoor, outdoor };
  }

  /**
   * Generate reasoning for activity scores
   */
  private generateReasoning(
    weather: any,
    city: any,
    scores: ActivityScore,
  ): ActivityReasoning {
    const {
      maxTemp,
      minTemp,
      weatherCode,
      precipitation,
      snowfallSum,
      windSpeed,
    } = weather;
    const avgTemp = (maxTemp + minTemp) / 2;
    const isCoastal = this.isCoastalCity(city);
    const isMountainous = this.isMountainousCity(city);

    const skiing = isMountainous
      ? `${city.name} is mountainous. Temperature: ${avgTemp.toFixed(1)}°C${snowfallSum > 0 ? `, snowfall: ${snowfallSum}cm` : ''}.`
      : `${city.name} is not suitable for skiing (no mountains).`;

    const surfing = isCoastal
      ? `${city.name} is coastal. Temperature: ${avgTemp.toFixed(1)}°C, wind: ${windSpeed} km/h${precipitation > 0 ? `, precipitation: ${precipitation}mm` : ''}.`
      : `${city.name} is not coastal, no surfing opportunities.`;

    const weatherCondition = this.getWeatherDescription(weatherCode);

    const indoor = `${weatherCondition} weather${avgTemp < 5 || avgTemp > 35 ? ', extreme temperature' : ''}${precipitation > 2 ? ', rainy conditions' : ''} make indoor activities appealing.`;

    const outdoor = `${weatherCondition} weather, ${avgTemp.toFixed(1)}°C${precipitation > 0 ? `, ${precipitation}mm precipitation` : ''}. ${windSpeed > 20 ? 'Windy conditions. ' : ''}Good for outdoor exploration.`;

    return { skiing, surfing, indoor, outdoor };
  }

  /**
   * Get recommendation level based on score
   */
  private getRecommendationLevel(score: number): string {
    if (score >= 80) return 'Excellent';
    if (score >= 60) return 'Good';
    if (score >= 40) return 'Fair';
    if (score >= 20) return 'Poor';
    return 'Not Recommended';
  }

  /**
   * Check if city is coastal (simplified heuristic)
   */
  private isCoastalCity(city: any): boolean {
    // Simple heuristic: cities with elevation < 100m are likely coastal
    // In a real app, you'd have proper geographic data
    return (city.elevation || 0) < 100;
  }

  /**
   * Check if city is mountainous (simplified heuristic)
   */
  private isMountainousCity(city: any): boolean {
    // Simple heuristic: cities with elevation > 500m are mountainous
    // In a real app, you'd have proper geographic data
    return (city.elevation || 0) > 500;
  }

  /**
   * Get weather description from weather code
   */
  private getWeatherDescription(weatherCode: number): string {
    switch (weatherCode) {
      case WeatherCode.CLEAR_SKY:
        return 'Clear sky';
      case WeatherCode.MAINLY_CLEAR:
        return 'Mainly clear';
      case WeatherCode.PARTLY_CLOUDY:
        return 'Partly cloudy';
      case WeatherCode.OVERCAST:
        return 'Overcast';
      case WeatherCode.FOG:
      case WeatherCode.DEPOSITING_RIME_FOG:
        return 'Foggy';
      case WeatherCode.LIGHT_DRIZZLE:
      case WeatherCode.MODERATE_DRIZZLE:
      case WeatherCode.DENSE_DRIZZLE:
        return 'Drizzle';
      case WeatherCode.SLIGHT_RAIN:
      case WeatherCode.MODERATE_RAIN:
      case WeatherCode.HEAVY_RAIN:
        return 'Rainy';
      case WeatherCode.SLIGHT_SNOWFALL:
      case WeatherCode.MODERATE_SNOWFALL:
      case WeatherCode.HEAVY_SNOWFALL:
        return 'Snowy';
      case WeatherCode.THUNDERSTORM:
      case WeatherCode.THUNDERSTORM_SLIGHT_HAIL:
      case WeatherCode.THUNDERSTORM_HEAVY_HAIL:
        return 'Thunderstorm';
      default:
        return 'Mixed';
    }
  }
}
