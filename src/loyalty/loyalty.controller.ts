import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';

import { LoyaltyService } from './loyalty.service';
import { BallHarakatiTuri } from './point-transaction.entity';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { RolesGuard } from 'src/common/guards/roles.guard';
import { Roles } from 'src/common/decorators/roles.decorator';
import { UserRole } from 'src/common/enums/user-role.enum';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import { User } from 'src/user/user.entity';
import { Session } from 'src/sessions/session.entity';

@Controller('loyalty')
@UseGuards(JwtAuthGuard)
export class LoyaltyController {
  constructor(private readonly loyaltyService: LoyaltyService) { }

  // =====================================================
  // 1️⃣ MIJOZ HOZIRGI BALL BALANSI
  // =====================================================
  @Get('customer/:customerId/balance')
  async getCustomerBalance(@Param('customerId') customerId: string) {
    const balance = await this.loyaltyService.mijozBallBalansi(customerId);

    return {
      customerId,
      balance,
    };
  }

  // =====================================================
  // 2️⃣ MIJOZ BALL TARIXI
  // =====================================================
  @Get('customer/:customerId/history')
  async getCustomerHistory(@Param('customerId') customerId: string) {
    return this.loyaltyService.mijozBallTarixi(customerId);
  }

  // =====================================================
  // 3️⃣ ADMIN → BALL QO‘SHISH / AYIRISH
  // =====================================================
  @Post('admin/change')
  @Roles(UserRole.ADMIN)
  async adminChangePoints(
    @Body()
    body: {
      customerId: string;
      ball: number;
      turi: BallHarakatiTuri;
      izoh?: string;
    },
    @CurrentUser() user: User,
  ) {
    await this.loyaltyService.adminBallOzgartirish({
      customerId: body.customerId,
      ball: body.ball,
      turi: body.turi,
      user,
      izoh: body.izoh,
    });

    const balance = await this.loyaltyService.mijozBallBalansi(
      body.customerId,
    );

    return {
      success: true,
      customerId: body.customerId,
      currentBalance: balance,
    };
  }

  // =====================================================
  // 4️⃣ (OPTIONAL) SESSIYA BO‘YICHA BALL HISOBI
  // (ADMIN / DEBUG UCHUN)
  // =====================================================
  @Post('admin/calculate-session-points')
  @Roles(UserRole.ADMIN)
  async calculateSessionPoints(
    @Body() body: { session: Session },
  ) {
    const points =
      await this.loyaltyService.calculateFinalSessionPoints(body.session);

    return {
      calculatedPoints: points,
    };
  }
}
