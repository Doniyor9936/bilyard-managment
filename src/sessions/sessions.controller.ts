import {
  Body,
  Controller,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { SessionsService } from './sessions.service';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { RolesGuard } from 'src/common/guards/roles.guard';
import { Roles } from 'src/common/decorators/roles.decorator';
import { UserRole } from 'src/common/enums/user-role.enum';
import { PaymentMethod } from 'src/common/enums/payment-method.enum';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import { User } from 'src/user/user.entity';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

@ApiTags('Sessions')
@ApiBearerAuth('access-token')
@Controller('sessions')
@UseGuards(JwtAuthGuard, RolesGuard)
export class SessionsController {
  constructor(private readonly sessionsService: SessionsService) { }

  // ===============================
  // ▶️ SESSIYA OCHISH
  // ===============================
  @Post('open')
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  async open(
    @Body() body: { tableId: string; customerId: string },
    @CurrentUser() user: User,
  ) {
    return this.sessionsService.openSession({
      tableId: body.tableId,
      customerId: body.customerId,
      openedBy: user,
    });
  }

  // ===============================
  // ⏸ PAUZA
  // ===============================
  @Patch(':id/pause')
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  pause(@Param('id') id: string) {
    return this.sessionsService.pauseSession(id);
  }

  // ===============================
  // ▶️ RESUME
  // ===============================
  @Patch(':id/resume')
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  resume(@Param('id') id: string) {
    return this.sessionsService.resumeSession(id);
  }

  // ===============================
  // ⏹ YOPISH
  // ===============================
  @Post(':id/close')
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  close(
    @Param('id') id: string,
    @Body() body: { paymentMethod: PaymentMethod },
    @CurrentUser() user: User,
  ) {
    return this.sessionsService.closeSession(
      id,
      body.paymentMethod,
      user,
    );
  }

  // ===============================
  // 🚨 FORCE CLOSE (ADMIN)
  // ===============================
  @Post(':id/force-close')
  @Roles(UserRole.ADMIN)
  forceClose(
    @Param('id') id: string,
    @CurrentUser() user: User,
  ) {
    return this.sessionsService.forceClose(id, user);
  }
}
