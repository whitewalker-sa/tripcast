import { Module } from '@nestjs/common';
import { CitiesService } from './cities.service';
import { CitiesResolver } from './cities.resolver';
import { ExternalModule } from '../external/external.module';

@Module({
  imports: [ExternalModule],
  providers: [CitiesService, CitiesResolver],
  exports: [CitiesService],
})
export class CitiesModule {}
