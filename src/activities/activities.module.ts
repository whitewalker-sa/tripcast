import { Module } from '@nestjs/common';
import { ActivitiesService } from './activities.service';
import { ActivitiesResolver } from './activities.resolver';
import { WeatherModule } from '../weather/weather.module';
import { CitiesModule } from '../cities/cities.module';

@Module({
  imports: [WeatherModule, CitiesModule],
  providers: [ActivitiesService, ActivitiesResolver],
  exports: [ActivitiesService],
})
export class ActivitiesModule {}
