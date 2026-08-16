import { Body, Controller, Get, Patch, UseGuards } from '@nestjs/common';
import { AdminJwtGuard } from '../../common/guards/admin-jwt.guard';
import { UpdateAppSettingDto } from './dto/update-app-setting.dto';
import { SettingsService } from './settings.service';

@Controller('settings')
export class SettingsController {
  constructor(private readonly settingsService: SettingsService) {}

  @UseGuards(AdminJwtGuard)
  @Get()
  get() {
    return this.settingsService.get();
  }

  @UseGuards(AdminJwtGuard)
  @Patch()
  update(@Body() dto: UpdateAppSettingDto) {
    return this.settingsService.update(dto);
  }
}
