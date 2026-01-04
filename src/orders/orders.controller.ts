import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { OrdersService } from './orders.service';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { RolesGuard } from 'src/common/guards/roles.guard';
import { Roles } from 'src/common/decorators/roles.decorator';
import { UserRole } from 'src/common/enums/user-role.enum';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

@ApiTags('Orders')
@ApiBearerAuth('access-token')
@Controller('orders')
@UseGuards(JwtAuthGuard, RolesGuard)
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) { }

  // ===============================
  // ➕ ORDER QO‘SHISH
  // ADMIN + XODIM
  // ===============================
  @Post()
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  async createOrder(
    @Body()
    body: {
      sessionId: string;
      title: string;
      quantity: number;
      price: number;
    },
  ) {
    return this.ordersService.createOrder(body);
  }

  // ===============================
  // ❌ ORDER BEKOR QILISH
  // ADMIN + XODIM
  // ===============================
  @Patch(':id/cancel')
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  async cancelOrder(@Param('id') orderId: string) {
    return this.ordersService.cancelOrder(orderId);
  }

  // ===============================
  // 📄 SESSIYA BUYURTMALARI
  // ADMIN + XODIM
  // ===============================
  @Get('session/:sessionId')
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  async getSessionOrders(@Param('sessionId') sessionId: string) {
    return this.ordersService.getSessionOrders(sessionId);
  }
}
