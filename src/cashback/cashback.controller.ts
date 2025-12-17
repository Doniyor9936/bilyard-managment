import { Controller } from '@nestjs/common';
import { CashbackService } from './cashback.service';

@Controller('cashback')
export class CashbackController {
  constructor(private readonly cashbackService: CashbackService) {}
}
