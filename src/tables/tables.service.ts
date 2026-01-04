import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TableEntity } from './table.entity';
import { TableType } from 'src/common/enums/table-type.enum';
import { UpdateTableDto } from './dto/update-table.dto';

@Injectable()
export class TablesService {
  constructor(
    @InjectRepository(TableEntity)
    private readonly tableRepo: Repository<TableEntity>,
  ) { }

  // ===============================
  // ➕ STOL YARATISH (ADMIN)
  // ===============================
  async createTable(body: {
    name: string;
    number: number;
    type: TableType;
    capacity?: number;
    floor?: number;
    section?: string;
  }): Promise<TableEntity> {
    const mavjud = await this.tableRepo.findOne({
      where: { number: body.number },
    });

    if (mavjud) {
      throw new BadRequestException('Bu raqamdagi stol allaqachon mavjud');
    }

    const table = this.tableRepo.create({
      name: body.name,
      number: body.number,
      type: body.type,
      capacity: body.capacity ?? 4,
      floor: body.floor,
      section: body.section,
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
    dto: UpdateTableDto,
  ): Promise<TableEntity> {
    const table = await this.getById(id);

    // ❌ band stolni o‘zgartirish mumkin emas
    if (table.isOccupied) {
      throw new BadRequestException(
        'Band bo‘lgan stolni tahrirlab bo‘lmaydi',
      );
    }

    // 🔁 number o‘zgaryaptimi — duplicate check
    if (dto.number && dto.number !== table.number) {
      const exists = await this.tableRepo.findOne({
        where: { number: dto.number },
      });

      if (exists) {
        throw new BadRequestException(
          'Bu raqamdagi stol allaqachon mavjud',
        );
      }
    }

    Object.assign(table, dto);

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
