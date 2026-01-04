import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { User } from './user.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { ChangePasswordDto } from './dto/change-password.dto';

@Injectable()
export class UserService {
  constructor(@InjectRepository(User) private readonly userRepository: Repository<User>) { }

  async createUser(dto: Partial<User>): Promise<User> {
    const user = this.userRepository.create(dto);
    return this.userRepository.save(user);
  }

  async getUserById(id: string): Promise<User> {
    const findUser = await this.userRepository.findOne({
      where: { id },
    });
    if (!findUser) {
      throw new NotFoundException('Foydalanuvchi topilmadi');
    }
    return findUser;
  }
  async getAllUser(): Promise<User[]> {
    const findUser = await this.userRepository.find();
    if (findUser) {
      throw new NotFoundException('Foydalanuvchi topilmadi');
    }
    return this.userRepository.find();
  }

  async getUserByIdOrFail(id: string): Promise<User> {
    const findUser = await this.userRepository.findOne({ where: { id } });
    if (!findUser) {
      throw new NotFoundException('Foydalanuvchi topilmadi');
    }
    return findUser;
  }

  async updateUser(id: string, dto: Partial<User>): Promise<User> {
    const user = await this.getUserByIdOrFail(id);

    await this.userRepository.update(id, dto);

    return this.getUserByIdOrFail(id);
  }

  async findByPhone(phoneNumber: string): Promise<User | null> {
    const findUser = await this.userRepository.findOne({
      where: { phoneNumber },
    });
    return findUser;
  }

  async changePassword(id: string, dto: ChangePasswordDto): Promise<{ message: string }> {
    const user = await this.getUserByIdOrFail(id);

    const isOldMatch = await bcrypt.compare(dto.oldPassword, user.password);

    if (!isOldMatch) {
      throw new BadRequestException("Eski parol noto'g'ri");
    }

    const hashedNewPassword = await bcrypt.hash(dto.newPassword, 10);

    await this.userRepository.update(id, {
      password: hashedNewPassword,
      mustChangePassword: false,
    });

    return { message: "Parol muvaffaqiyatli o'zgartirildi" };
  }
}
