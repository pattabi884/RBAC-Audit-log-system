
import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  UseGuards,
  Query,
} from '@nestjs/common';


import { PermissionsService } from './permissions.service';


import { JwtAuthGuard } from '@modules/auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '@modules/auth/guards/permissions.guard';
import { RequirePermissions } from '@modules/auth/decorators/require-permissions.decorator';
import { CreatePermissionDto } from './create-permission.dto';
import { UpdatePermissionDto } from './update-permission.dto';

@Controller('permissions')

@UseGuards(JwtAuthGuard, PermissionsGuard)
export class PermissionsController {
  
  constructor(private readonly permissionsService: PermissionsService) {}

  // POST /permissions
  @Post()
  @RequirePermissions('roles:create')
  create(@Body() dto: CreatePermissionDto) {
    return this.permissionsService.create(dto);
  }

  // GET /permissions
  @Get()
  @RequirePermissions('roles:read')
  findAll() {
    return this.permissionsService.findAll();
  }

  // GET /permissions/by-resource?resource=users
  // Note: this route must come BEFORE @Get(':id')
  // otherwise NestJS treats 'by-resource' as an :id param
  @Get('by-resource')
  @RequirePermissions('roles:read')
  findByResource(@Query('resource') resource: string) {
    return this.permissionsService.findByResource(resource);
  }

  // GET /permissions/:id
  @Get(':id')
  @RequirePermissions('roles:read')
  findOne(@Param('id') id: string) {
    return this.permissionsService.findOne(id);
  }

  // PATCH /permissions/:id
  @Patch(':id')
  @RequirePermissions('roles:update')
  update(@Param('id') id: string, @Body() dto: UpdatePermissionDto) {
    return this.permissionsService.update(id, dto);
  }

  // DELETE /permissions/:id
  @Delete(':id')
  @RequirePermissions('roles:delete')
  deactivate(@Param('id') id: string) {
    return this.permissionsService.deactivate(id);
  }

  // POST /permissions/seed
  @Post('seed')
  @RequirePermissions('roles:create')
  seed() {
    
    return this.permissionsService.seedPermissions();
  }
}