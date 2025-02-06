import { Module } from '@nestjs/common';
import { InstagramService } from './instagram.service';
import { InstagramController } from './instagram.controller';
import { InstagramCookieHelper } from 'src/Helpers/cookie-helper';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { InstagramCronService } from './instagram-cron.service';
@Module({
  imports: [ConfigModule, ScheduleModule.forRoot()],
  providers: [InstagramService, InstagramCookieHelper, InstagramCronService],
  controllers: [InstagramController],
})
export class InstagramModule {}
