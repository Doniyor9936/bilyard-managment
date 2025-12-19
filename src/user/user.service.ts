import { Injectable, NotFoundException } from '@nestjs/common';
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

    async getUserById(accountId: string): Promise<User | null> {
        const findUser = await this.userRepository.findOne({ where: { accountId } });
        if (!findUser) {
            throw new NotFoundException("foydalanuvchi topilmadi");
        }
        return findUser;
    }
    async updateUser(id: string, dto: Partial<User>): Promise<User> {
        await this.userRepository.update(id, dto);
        return this.getUserById(id) as Promise<User>;
    }

    async findByPhone(phoneNumber: string) {
        const findUser = this.userRepository.findOne({ where: { phoneNumber } })
        if (!findUser) {
            throw new NotFoundException("foydalanuvchi topilmadi");
        }
        return findUser;
    }

    async changePassword(id: string, dto: ChangePasswordDto): Promise<void> {
        const user = await this.userRepository.findOne({ where: { id } })
        if (!user) throw new NotFoundException('Foydalanuvchi topilmadi');

        const isOldMatch = await bcrypt.compare(dto.oldPassword, user.password);
        if (!isOldMatch) {
            throw new Error('Eski parol noto‘g‘ri');
        }

        const hashedNewPassword = await bcrypt.hash(dto.newPassword, 10);
        await this.userRepository.update(id, { password: hashedNewPassword, mustChangePassword: false });
    }
}
