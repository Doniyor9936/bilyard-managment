import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Customer } from './customer.entity';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';
import { LoyaltyService } from 'src/loyalty/loyalty.service';

@Injectable()
export class CustomersService {
  constructor(
    @InjectRepository(Customer)
    private readonly customerRepository: Repository<Customer>,
    private readonly loyaltyService: LoyaltyService,
  ) { }

  // ➕ Mijoz yaratish
  async create(dto: CreateCustomerDto): Promise<Customer> {
    const customer = this.customerRepository.create({
      fullName: dto.fullName,
      phoneNumber: dto.phoneNumber,
    });

    return this.customerRepository.save(customer);
  }

  // 📄 Barcha mijozlar
  async findAll(): Promise<Customer[]> {
    return this.customerRepository.find({
      order: { createdAt: 'DESC' },
    });
  }

  // 🔍 Bitta mijoz
  async findOne(id: string) {
    const customer = await this.customerRepository.findOne({
      where: { id },
    });

    if (!customer) {
      throw new NotFoundException('Mijoz topilmadi');
    }

    return {
      id: customer.id, fullName: customer.fullName, phoneNumber: customer.phoneNumber, createdAt: customer.createdAt ?? null,

    };
  }

  // ✏️ Mijozni yangilash
  async update(id: string, dto: UpdateCustomerDto): Promise<Customer> {
    const customer = await this.findOne(id);

    Object.assign(customer, dto);

    return this.customerRepository.save(customer);
  }

  // ❌ Mijoz o‘chirish (agar kerak bo‘lsa)
  async remove(id: string): Promise<{ message: string }> {
    const customer = await this.customerRepository.delete({ id });

    if (customer.affected === 0) {
      throw new NotFoundException("mijoz topilmadi");

    }

    return { message: 'Mijoz o‘chirildi' };
  }

  // ⭐ Mijoz + umumiy ball balansi
  async findWithBall(id: string) {
    const customer = await this.findOne(id);

    const ballBalansi = await this.loyaltyService.mijozBallBalansi(id);

    return {
      ...customer,
      ballBalansi,
    };
  }

  // 📊 Mijoz ball tarixi
  async ballTarixi(id: string) {
    await this.findOne(id); // mavjudligini tekshiramiz
    return this.loyaltyService.mijozBallTarixi(id);
  }
}
