import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { OpenMeteoService } from './open-meteo.service';

@Module({
  imports: [
    HttpModule.register({
      timeout: 10000,
      maxRedirects: 3,
    }),
  ],
  providers: [OpenMeteoService],
  exports: [OpenMeteoService],
})
export class ExternalModule {}
