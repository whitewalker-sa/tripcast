import { ObjectType, Field, ID, Float, Int } from '@nestjs/graphql';
import { City } from '../../cities/entities/city.entity';

@ObjectType()
export class WeatherForecast {
  @Field(() => ID)
  id: number;

  @Field(() => Int)
  cityId: number;

  @Field()
  date: Date;

  @Field(() => Float)
  maxTemp: number;

  @Field(() => Float)
  minTemp: number;

  @Field(() => Int)
  weatherCode: number;

  @Field(() => Float)
  precipitation: number;

  @Field(() => Float, { nullable: true })
  rainSum?: number;

  @Field(() => Float, { nullable: true })
  showersSum?: number;

  @Field(() => Float, { nullable: true })
  snowfallSum?: number;

  @Field(() => Float)
  windSpeed: number;

  @Field(() => Float, { nullable: true })
  windDirection?: number;

  @Field(() => Float, { nullable: true })
  windGusts?: number;

  @Field(() => Float, { nullable: true })
  uvIndex?: number;

  @Field({ nullable: true })
  sunriseSunset?: string;

  @Field(() => Int, { nullable: true })
  sunshineDuration?: number;

  @Field()
  createdAt: Date;

  @Field()
  updatedAt: Date;

  // Relations
  @Field(() => City)
  city: City;
}
