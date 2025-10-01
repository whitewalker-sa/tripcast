import { ObjectType, Field, ID, Float, Int } from '@nestjs/graphql';
import { WeatherForecast } from '../../weather/entities/weather-forecast.entity';
import { ActivityRanking } from '../../activities/entities/activity-ranking.entity';

@ObjectType()
export class City {
  @Field(() => ID)
  id: number;

  @Field(() => Int)
  openMeteoId: number;

  @Field()
  name: string;

  @Field(() => Float)
  latitude: number;

  @Field(() => Float)
  longitude: number;

  @Field(() => Float, { nullable: true })
  elevation?: number;

  @Field()
  timezone: string;

  @Field({ nullable: true })
  featureCode?: string;

  @Field()
  countryCode: string;

  @Field()
  country: string;

  @Field(() => Int, { nullable: true })
  population?: number;

  @Field({ nullable: true })
  admin1?: string;

  @Field({ nullable: true })
  admin2?: string;

  @Field({ nullable: true })
  admin3?: string;

  @Field({ nullable: true })
  admin4?: string;

  @Field(() => [String])
  postcodes: string[];

  @Field()
  createdAt: Date;

  @Field()
  updatedAt: Date;

  // Relations
  @Field(() => [WeatherForecast], { nullable: true })
  weatherForecasts?: WeatherForecast[];

  @Field(() => [ActivityRanking], { nullable: true })
  activityRankings?: ActivityRanking[];
}
