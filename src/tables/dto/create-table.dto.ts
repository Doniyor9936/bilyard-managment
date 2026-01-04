import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsInt, IsOptional, IsString, Min } from 'class-validator';
import { TableType } from 'src/common/enums/table-type.enum';

export class CreateTableDto {
    @ApiProperty({ example: 'VIP-1' })
    @IsString()
    name: string;

    @ApiProperty({ example: 1 })
    @IsInt()
    @Min(1)
    number: number;

    @ApiProperty({ enum: TableType })
    @IsEnum(TableType)
    type: TableType;

    @ApiPropertyOptional({ example: 4 })
    @IsOptional()
    @IsInt()
    capacity?: number;

    @ApiPropertyOptional({ example: 1 })
    @IsOptional()
    @IsInt()
    floor?: number;

    @ApiPropertyOptional({ example: 'A zal' })
    @IsOptional()
    @IsString()
    section?: string;
}
