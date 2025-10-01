import { InputType, Field, Int } from '@nestjs/graphql';
import { IsInt, IsOptional, Min, Max } from 'class-validator';

@InputType()
export class WeatherForecastInput {
  @Field(() => Int)
  @IsInt()
  cityId: number;

  @Field(() => Int, { defaultValue: 7 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(16)
  days?: number;
}
