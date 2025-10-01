import { Module } from '@nestjs/common';
import { WeatherService } from './weather.service';
import { WeatherResolver } from './weather.resolver';
import { ExternalModule } from '../external/external.module';
import { CitiesModule } from '../cities/cities.module';

@Module({
  imports: [ExternalModule, CitiesModule],
  providers: [WeatherService, WeatherResolver],
  exports: [WeatherService],
})
export class WeatherModule {}
