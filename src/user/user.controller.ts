import { Body, Controller, Get, Param, Post, Put, UseGuards } from '@nestjs/common';
import { UserService } from './user.service';
import { UserCreateDto } from './dto/user.create.dto';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { RolesGuard } from 'src/common/guards/roles.guard';
import { Roles } from 'src/common/decorators/roles.decorator';
import { UserRole } from 'src/common/enums/user-role.enum';
import { UserUpdateDto } from './dto/user.update.dto';

@Controller('user')
@UseGuards(JwtAuthGuard, RolesGuard)
export class UserController {
  constructor(private readonly userService: UserService) { }

  @Post()
  @Roles(UserRole.OWNER)
  async createUser(@Body() dto: UserCreateDto) {
    return this.userService.createUser(dto)
  }

  @Get('phone/:phoneNumber')
  @Roles(UserRole.OWNER)
  async findByPhone(@Param('phoneNumber') phoneNumber: string) {
    return this.userService.findByPhone(phoneNumber)
  }

  @Get(':accountId')
  @Roles(UserRole.OWNER)
  async getUserById(@Param('accountId') accountId: string) {
    return this.userService.getUserById(accountId)
  }

  @Put(':id')
  @Roles(UserRole.OWNER)
  async updateUser(@Param('id') id: string, @Body() dto: UserUpdateDto) {
    return this.userService.updateUser(id, dto)
  }
}
