import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Setting } from './setting.entity';
import { TableType } from 'src/common/enums/table-type.enum';
import { SettingKey } from 'src/common/enums/setting.key.enum';

@Injectable()
export class SettingsService {
  constructor(
    @InjectRepository(Setting)
    private readonly settingRepo: Repository<Setting>,
  ) {}

  // ===============================
  // 🔍 Bitta sozlamani olish
  // ===============================
  async getValue(key: SettingKey): Promise<string> {
    const setting = await this.settingRepo.findOne({
      where: { key },
    });

    if (!setting) {
      throw new NotFoundException(`Sozlama topilmadi: ${key}`);
    }

    return setting.value;
  }

  // ===============================
  // ✏️ Sozlama yaratish / yangilash
  // ===============================
  async setValue(key: SettingKey, value: string): Promise<Setting> {
    let setting = await this.settingRepo.findOne({
      where: { key },
    });

    if (!setting) {
      setting = this.settingRepo.create({ key, value });
    } else {
      setting.value = value;
    }

    return this.settingRepo.save(setting);
  }

  // ===============================
  // 📄 Barcha sozlamalar
  // ===============================
  async getAll(): Promise<Setting[]> {
    return this.settingRepo.find({
      order: { key: 'ASC' },
    });
  }

  // ===============================
  // 💰 Stol soat narxini olish
  // (SessionsService ishlatadi)
  // ===============================
  async getSoatNarxi(tableType: TableType): Promise<number> {
    const key = tableType === TableType.VIP ? SettingKey.VIP_STOL_SOAT_NARXI : SettingKey.STANDART_STOL_SOAT_NARXI;

    const value = Number(await this.getValue(key));

    if (isNaN(value)) {
      throw new BadRequestException('Stol soat narxi noto‘g‘ri sozlangan');
    }

    return value;
  }

  // ===============================
  // ⭐ Loyalty: 1 soat uchun ball
  // ===============================
  async getBirSoatUchunBall(): Promise<number> {
    const value = Number(await this.getValue(SettingKey.BIR_SOAT_UCHUN_BALL));

    if (isNaN(value)) {
      throw new BadRequestException('Ball sozlamasi noto‘g‘ri');
    }

    return value;
  }

  // ===============================
  // 🎁 Bepul soat uchun ball
  // ===============================
  async getBepulSoatUchunBall(): Promise<number> {
    const value = Number(await this.getValue(SettingKey.BEPUL_SOAT_UCHUN_BALL));

    if (isNaN(value)) {
      throw new BadRequestException('Bepul soat balli noto‘g‘ri');
    }

    return value;
  }

  // ===============================
  // 💳 Maksimal qarz summasi
  // ===============================
  async getMaksimalQarzSummasi(): Promise<number> {
    const value = Number(await this.getValue(SettingKey.MAKSIMAL_QARZ_SUMMASI));

    if (isNaN(value)) {
      throw new BadRequestException('Qarz limiti noto‘g‘ri');
    }

    return value;
  }
}
