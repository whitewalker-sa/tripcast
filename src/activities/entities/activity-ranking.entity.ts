import { ObjectType, Field, ID, Float, Int } from '@nestjs/graphql';
import { City } from '../../cities/entities/city.entity';

@ObjectType()
export class ActivityRanking {
  @Field(() => ID)
  id: number;

  @Field(() => Int)
  cityId: number;

  @Field()
  date: Date;

  @Field(() => Float)
  skiingScore: number;

  @Field(() => Float)
  surfingScore: number;

  @Field(() => Float)
  indoorScore: number;

  @Field(() => Float)
  outdoorScore: number;

  @Field()
  reasoning: string; // JSON string for simplicity

  @Field()
  createdAt: Date;

  @Field()
  updatedAt: Date;

  // Relations
  @Field(() => City)
  city: City;
}

@ObjectType()
export class ActivityRecommendation {
  @Field()
  activity: string;

  @Field(() => Float)
  score: number;

  @Field()
  recommendation: string;

  @Field()
  reasoning: string;
}

@ObjectType()
export class ActivityRecommendations {
  @Field(() => City)
  city: City;

  @Field()
  date: Date;

  @Field(() => [ActivityRecommendation])
  activities: ActivityRecommendation[];
}
