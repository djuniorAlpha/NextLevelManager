import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { UpdateAppSettingDto } from './dto/update-app-setting.dto';

const APP_SETTING_ID = 'singleton';

@Injectable()
export class SettingsService {
  constructor(private readonly prisma: PrismaService) {}

  async get() {
    const existing = await this.prisma.appSetting.findUnique({
      where: { id: APP_SETTING_ID },
    });
    if (existing) {
      return existing;
    }
    return this.prisma.appSetting.create({ data: { id: APP_SETTING_ID } });
  }

  async update(dto: UpdateAppSettingDto) {
    return this.prisma.appSetting.upsert({
      where: { id: APP_SETTING_ID },
      create: { id: APP_SETTING_ID, ...dto },
      update: dto,
    });
  }
}
