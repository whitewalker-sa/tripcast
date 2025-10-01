import { InputType, Field, Int } from '@nestjs/graphql';
import { IsInt, IsDateString } from 'class-validator';

@InputType()
export class ActivityRecommendationsInput {
  @Field(() => Int)
  @IsInt()
  cityId: number;

  @Field()
  @IsDateString()
  date: string;
}
