import { IsOptional, IsUUID } from 'class-validator';

export class OpenSessionDto {
  @IsUUID()
  tableId: string;

  @IsOptional()
  @IsUUID()
  customerId?: string;
}
