// src/modules/rbac/roles/roles.controller.ts
import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  UseGuards,
} from '@nestjs/common';

import { RolesService } from './roles.service';
import { JwtAuthGuard } from '@modules/auth/guards/jwt-auth.guard';
// PermissionsGuard removed from import — it's now a global APP_GUARD in AppModule
// and runs automatically on every route. Listing it here caused NestJS to try
// to instantiate it inside RolesModule, where its dependencies don't exist.
import { RequirePermissions } from '@modules/auth/decorators/require-permissions.decorator';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';
import { AddPermissionDto } from './dto/add-permission.dto';
import { Public } from '@modules/auth/decorators/public.decorator';

@Controller('roles')
@UseGuards(JwtAuthGuard)  // PermissionsGuard removed — it runs globally via APP_GUARD
export class RolesController {
  constructor(private readonly rolesService: RolesService) {}

  // POST /roles
  //@Public()
  @Post()
  @RequirePermissions('roles:create')
  create(@Body() createRoleDto: CreateRoleDto) {
    return this.rolesService.create(createRoleDto);
  }

  // GET /roles
  @Get()
  @RequirePermissions('roles:read')
  findAll() {
    return this.rolesService.findAll();
  }

  // GET /roles/:id
  @Get(':id')
  @RequirePermissions('roles:read')
  findOne(@Param('id') id: string) {
    return this.rolesService.findOne(id);
  }

  // PATCH /roles/:id
  @Patch(':id')
  @RequirePermissions('roles:update')
  update(@Param('id') id: string, @Body() updateRoleDto: UpdateRoleDto) {
    return this.rolesService.update(id, updateRoleDto);
  }

  // POST /roles/:id/permissions
  @Post(':id/permissions')
  @RequirePermissions('roles:update')
  addPermission(@Param('id') id: string, @Body() dto: AddPermissionDto) {
    return this.rolesService.addPermission(id, dto.permission);
  }

  // DELETE /roles/:id/permissions/:permission
  @Delete(':id/permissions/:permission')
  @RequirePermissions('roles:update')
  removePermission(
    @Param('id') id: string,
    @Param('permission') permission: string,
  ) {
    return this.rolesService.removePermission(id, permission);
  }

  // DELETE /roles/:id
  @Delete(':id')
  @RequirePermissions('roles:delete')
  remove(@Param('id') id: string) {
    return this.rolesService.remove(id);
  }
}