import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { LoyaltyService } from './loyalty.service';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { RolesGuard } from 'src/common/guards/roles.guard';
import { Roles } from 'src/common/decorators/roles.decorator';
import { UserRole } from 'src/common/enums/user-role.enum';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import { User } from 'src/user/user.entity';
import { BallHarakatiTuri } from './point-transaction.entity';

@Controller('loyalty')
@UseGuards(JwtAuthGuard, RolesGuard)
export class LoyaltyController {
  constructor(private readonly loyaltyService: LoyaltyService) {}

  /**
   * Admin ball qo‘shishi yoki ayirishi
   */
  @Post('admin/ball')
  @Roles(UserRole.ADMIN)
  adminBallOzgartirish(
    @Body()
    body: {
      customerId: string;
      ball: number;
      turi: BallHarakatiTuri;
      izoh?: string;
    },
    @CurrentUser() user: User,
  ) {
    return this.loyaltyService.adminBallOzgartirish({
      customerId: body.customerId,
      ball: body.ball,
      turi: body.turi,
      user,
      izoh: body.izoh,
    });
  }
}
