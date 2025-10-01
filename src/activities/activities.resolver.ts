import { Resolver, Query, Args } from '@nestjs/graphql';
import { Logger } from '@nestjs/common';
import { ActivitiesService } from './activities.service';
import { ActivityRecommendationsInput } from './dto/activity-recommendations.input';
import { ActivityRecommendations } from './entities/activity-ranking.entity';

@Resolver(() => ActivityRecommendations)
export class ActivitiesResolver {
  private readonly logger = new Logger(ActivitiesResolver.name);

  constructor(private readonly activitiesService: ActivitiesService) {}

  /**
   * Get activity recommendations for a city and date
   */
  @Query(() => ActivityRecommendations, {
    name: 'activityRecommendations',
    description:
      'Get activity recommendations based on weather conditions for a specific city and date',
  })
  async getActivityRecommendations(
    @Args('input') input: ActivityRecommendationsInput,
  ): Promise<ActivityRecommendations> {
    this.logger.debug(`GraphQL activityRecommendations called`, { input });
    return this.activitiesService.getActivityRecommendations(input);
  }
}
