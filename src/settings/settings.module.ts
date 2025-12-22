import { Module } from '@nestjs/common';
import { SettingsService } from './settings.service';
import { SettingsController } from './settings.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Setting } from './setting.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Setting])],
  controllers: [SettingsController],
  providers: [SettingsService],
    exports: [
    SettingsService,   // 👈 SHART
    TypeOrmModule,     // 👈 agar boshqa joyda repo ishlatilsa
  ],
})
export class SettingsModule { }
