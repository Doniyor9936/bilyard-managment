import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from "@nestjs/common";
import { TablesService } from "./tables.service";
import { TableType } from "src/common/enums/table-type.enum";
import { JwtAuthGuard } from "src/common/guards/jwt-auth.guard";
import { RolesGuard } from "src/common/guards/roles.guard";
import { Roles } from "src/common/decorators/roles.decorator";
import { UserRole } from "src/common/enums/user-role.enum";
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from "@nestjs/swagger";
import { CreateTableDto } from "./dto/create-table.dto";
import { UpdateTableDto } from "./dto/update-table.dto";

@ApiTags("Tables")
@ApiBearerAuth("access-token")
@Controller("tables")
@UseGuards(JwtAuthGuard, RolesGuard)
export class TablesController {
  constructor(private readonly tablesService: TablesService) { }

  // ===============================
  // ➕ STOL YARATISH (ADMIN)
  // ===============================

  @Post()
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: "Yangi stol yaratish" })
  @ApiResponse({ status: 201, description: "Stol muvaffaqiyatli yaratildi." })
  async createTable(@Body() dto: CreateTableDto) {
    return this.tablesService.createTable(dto);
  }

  // ===============================
  // 📄 BARCHA STOLLAR (ADMIN + XODIM)
  // ===============================
  @Get()
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  async getAll() {
    return this.tablesService.getAllTables();
  }

  // ===============================
  // 🔍 BITTA STOL (ADMIN + XODIM)
  // ===============================
  @Get(":id")
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  async getOne(@Param("id") id: string) {
    return this.tablesService.getById(id);
  }

  // ===============================
  // ✏️ STOLNI YANGILASH (ADMIN)
  // ===============================
  @Patch(":id")
  @Roles(UserRole.ADMIN)
  async updateTable(@Param("id") id: string, @Body() dto: UpdateTableDto) {
    return this.tablesService.updateTable(id, dto);
  }

  // ===============================
  // 🚫 STOLNI FAOLSIZLANTIRISH (ADMIN)
  // ===============================
  @Patch(":id/deactivate")
  @Roles(UserRole.ADMIN)
  async deactivate(@Param("id") id: string) {
    return this.tablesService.deactivateTable(id);
  }
}
