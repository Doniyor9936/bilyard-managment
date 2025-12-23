import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TableEntity } from './table.entity';
import { TableType } from 'src/common/enums/table-type.enum';

@Injectable()
export class TablesService {
  constructor(
    @InjectRepository(TableEntity)
    private readonly tableRepo: Repository<TableEntity>,
  ) { }

  // ===============================
  // ➕ STOL YARATISH (ADMIN)
  // ===============================
  async createTable(params: {
    name: string;
    number: number;
    type: TableType;
    capacity?: number;
    floor?: number;
    section?: string;
  }): Promise<TableEntity> {
    const mavjud = await this.tableRepo.findOne({
      where: { number: params.number },
    });

    if (mavjud) {
      throw new BadRequestException('Bu raqamdagi stol allaqachon mavjud');
    }

    const table = this.tableRepo.create({
      name: params.name,
      number: params.number,
      type: params.type,
      capacity: params.capacity ?? 4,
      floor: params.floor,
      section: params.section,
      isActive: true,
      isOccupied: false,
    });

    return this.tableRepo.save(table);
  }

  // ===============================
  // 📄 BARCHA STOLLAR
  // ===============================
  async getAllTables(): Promise<TableEntity[]> {
    return this.tableRepo.find({
      order: { number: 'ASC' },
    });
  }

  // ===============================
  // 🔍 BITTA STOL
  // ===============================
  async getById(id: string): Promise<TableEntity> {
    const table = await this.tableRepo.findOne({ where: { id } });
    if (!table) {
      throw new NotFoundException('Stol topilmadi');
    }
    return table;
  }

  // ===============================
  // ✏️ STOLNI YANGILASH
  // ===============================
  async updateTable(
    id: string,
    data: Partial<Omit<TableEntity, 'id' | 'createdAt' | 'updatedAt'>>,
  ): Promise<TableEntity> {
    const table = await this.getById(id);

    Object.assign(table, data);

    return this.tableRepo.save(table);
  }

  // ===============================
  // 🚫 STOLNI FAOLSIZLANTIRISH
  // ===============================
  async deactivateTable(id: string) {
    const table = await this.getById(id);

    if (table.isOccupied) {
      throw new BadRequestException('Band stolni o‘chirib bo‘lmaydi');
    }

    table.isActive = false;
    return this.tableRepo.save(table);
  }

  // ===============================
  // 🔒 SESSIYA OCHILGANDA
  // ===============================
  async markAsOccupied(id: string) {
    const table = await this.tableRepo.findOneBy({ id });
    if (!table) {
      throw new NotFoundException('Stol topilmadi');
    }

    if (table.isOccupied) return; // 🔒 qayta update qilmaymiz

    table.isOccupied = true; // 🔥 MANA SHU MUHIM
    await this.tableRepo.save(table);
  }

  // ===============================
  // 🔓 SESSIYA YOPILGANDA
  // ===============================
  async markAsFree(id: string) {
    const table = await this.tableRepo.findOneBy({ id });
    if (!table) {
      throw new NotFoundException('Stol topilmadi');
    }

    if (!table.isOccupied) return;

    table.isOccupied = false;
    await this.tableRepo.save(table);
  }

}
