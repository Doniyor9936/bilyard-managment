import { IsOptional, IsUUID } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class OpenSessionDto {
  @ApiProperty({
    example: '7c9e6679-7425-40de-944b-e07fc1f90ae7',
    description: 'Sessiya ochiladigan stol ID',
  })
  @IsUUID()
  tableId: string;

  @ApiPropertyOptional({
    example: '1f3d2c4b-9a88-4e12-b6c7-9c5d2a1e0f99',
    description: 'Sessiyaga biriktiriladigan mijoz ID (ixtiyoriy)',
  })
  @IsOptional()
  @IsUUID()
  customerId?: string;
}
