import { Body, Controller, Get, Param, Put, UseGuards } from '@nestjs/common';
import { SettingsService } from './settings.service';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { RolesGuard } from 'src/common/guards/roles.guard';
import { Roles } from 'src/common/decorators/roles.decorator';
import { UserRole } from 'src/common/enums/user-role.enum';
import { SettingKey } from 'src/common/enums/setting.key.enum';

@Controller('settings')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
export class SettingsController {
  constructor(private readonly settingsService: SettingsService) {}

  // 📄 Barcha sozlamalar
  @Get()
  getAll() {
    return this.settingsService.getAll();
  }

  // 🔍 Bitta sozlama
  @Get(':key')
  getOne(@Param('key') key: SettingKey) {
    return this.settingsService.getValue(key);
  }

  // ✏️ Sozlamani yangilash
  @Put(':key')
  update(@Param('key') key: SettingKey, @Body() body: { value: string }) {
    return this.settingsService.setValue(key, body.value);
  }
}
