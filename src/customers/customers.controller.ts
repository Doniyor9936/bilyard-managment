import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Delete,
  UseGuards,
} from '@nestjs/common';
import { CustomersService } from './customers.service';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { RolesGuard } from 'src/common/guards/roles.guard';
import { Roles } from 'src/common/decorators/roles.decorator';
import { UserRole } from 'src/common/enums/user-role.enum';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

@ApiTags('Customers')
@ApiBearerAuth('access-token')
@Controller('customers')
@UseGuards(JwtAuthGuard, RolesGuard)
export class CustomersController {
  constructor(private readonly customersService: CustomersService) { }

  // ===============================
  // ➕ MIJOZ YARATISH
  // ===============================
  @Post()
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  create(@Body() dto: CreateCustomerDto) {
    return this.customersService.create(dto);
  }

  // ===============================
  // 📄 BARCHA MIJOZLAR
  // ===============================
  @Get()
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  findAll() {
    return this.customersService.findAll();
  }

  // ===============================
  // 🔍 BITTA MIJOZ
  // ===============================
  @Get(':id')
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  findOne(@Param('id') id: string) {
    return this.customersService.findOne(id);
  }

  // ===============================
  // ✏️ MIJOZNI YANGILASH
  // ===============================
  @Patch(':id')
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  update(
    @Param('id') id: string,
    @Body() dto: UpdateCustomerDto,
  ) {
    return this.customersService.update(id, dto);
  }

  // ===============================
  // ❌ MIJOZ O‘CHIRISH
  // ===============================
  @Delete(':id')
  @Roles(UserRole.ADMIN)
  remove(@Param('id') id: string) {
    return this.customersService.remove(id);
  }

  // ===============================
  // ⭐ MIJOZ + BALL BALANSI
  // ===============================
  @Get(':id/ball')
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  findWithBall(@Param('id') id: string) {
    return this.customersService.findWithBall(id);
  }

  // ===============================
  // 📊 MIJOZ BALL TARIXI
  // ===============================
  @Get(':id/ball-history')
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  ballTarixi(@Param('id') id: string) {
    return this.customersService.ballTarixi(id);
  }
}
