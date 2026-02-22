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
//import { CreateRoleDto, UpdateRoleDto, AddPermissionDto } from './dto';
import { JwtAuthGuard } from '@modules/auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '@modules/auth/guards/permissions.guard';
import { RequirePermissions } from '@modules/auth/decorators/require-permissions.decorator';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';
import { AddPermissionDto } from './dto/add-permission.dto';

@Controller('roles')
@UseGuards(JwtAuthGuard, PermissionsGuard)

export class RolesController {
  constructor(private readonly rolesService: RolesService) {}

  // POST /roles
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