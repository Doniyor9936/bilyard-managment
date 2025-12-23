import { Body, Controller, Param, Post, Patch, UseGuards } from '@nestjs/common';
import { SessionsService } from './sessions.service';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { RolesGuard } from 'src/common/guards/roles.guard';
import { Roles } from 'src/common/decorators/roles.decorator';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import { UserRole } from 'src/common/enums/user-role.enum';
import { PaymentMethod } from 'src/common/enums/payment-method.enum';
import { User } from 'src/user/user.entity';

@Controller('sessions')
@UseGuards(JwtAuthGuard, RolesGuard)
export class SessionsController {
  constructor(private readonly sessionsService: SessionsService) { }

  // ===============================
  // ▶️ SESSIYA OCHISH (ADMIN + XODIM)
  // ===============================
  @Post('open')
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  async openSession(@Body() body: { tableId: string; customerId?: string }, @CurrentUser() user: User) {
    return this.sessionsService.openSession(body.tableId, body.customerId, user);
  }

  // ===============================
  // ⏹ SESSIYANI YOPISH (ADMIN + XODIM)
  // ===============================
  @Post(':id/close')
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  async closeSession(@Param('id') sessionId: string, @Body() body: { paymentMethod: PaymentMethod }, @CurrentUser() user: User) {
    return this.sessionsService.closeSession(sessionId, body.paymentMethod, user);
  }

  // ===============================
  // 🚨 ADMIN FORCE CLOSE
  // ===============================
  @Post(':id/force-close')
  @Roles(UserRole.ADMIN)
  async forceClose(@Param('id') sessionId: string, @CurrentUser() user: User) {
    return this.sessionsService.forceClose(sessionId, user);
  }

  // ===============================
  // ⏸ PAUZA (ADMIN + XODIM)
  // ===============================
  @Patch(':id/pause')
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  async pause(@Param('id') sessionId: string) {
    return this.sessionsService.pauseSession(sessionId);
  }

  // ===============================
  // ▶️ DAVOM ETTIRISH (ADMIN + XODIM)
  // ===============================
  @Patch(':id/resume')
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  async resume(@Param('id') sessionId: string) {
    return this.sessionsService.resumeSession(sessionId);
  }
}
