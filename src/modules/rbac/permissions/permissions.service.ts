import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Permission, PermissionDocument } from 'src/infrastructure/database/schemas/permission.schema';
import { CreatePermissionDto } from './create-permission.dto';
import { UpdatePermissionDto } from './update-permission.dto';

@Injectable()
export class PermissionsService {
    constructor(
        @InjectModel(Permission.name)
        private permissionModel: Model<PermissionDocument>,
    ){}

    //creare a new permissiion

    async create(dto: CreatePermissionDto): Promise<PermissionDocument>{
        //check if permission already exists 
        const existing = await this.permissionModel.findOne({ name: dto.name});
        if(existing){
            throw new ConflictException(`Permission ${dto.name} already exists`);

        }
        const permission = new this.permissionModel(dto);
        return permission.save();
    }
    //get all permissions
    async findAll(): Promise<PermissionDocument[]>{
        return this.permissionModel.find().sort({ resource: 1, action: 1 });

    }
    //get one permission by ID 
    async findOne(id: string):Promise<PermissionDocument>{
        const permission = await this.permissionModel.findById(id);
        if(!permission){
            throw new NotFoundException(`Permission ${id} not found`);
        }
        return permission;
    }
    //get all permisison for a specific resource 
    async update(id: string, dto: UpdatePermissionDto): Promise<PermissionDocument>{
        const permission = await this.permissionModel.findByIdAndUpdate(
            id, 
            { $set: dto},
            { new: true },//return updated document not original 
        );
        if(!permission){
            throw new NotFoundException(`Permission ${id} not found`);
        }
        return permission;
    }
    //validate that a list of permission names all exist 
    // used by roles.service when adding permissions to a role 
    async validatePermissions(names: string[]): Promise<boolean>{
        const found = await this.permissionModel.countDocuments({
            name: { $in: names },
            isActive: true,
        });
        return found === names.length
    }
    //seed the inital permissions caled once on app start up 
    async seedPermissions(): Promise<void> {
    const defaultPermissions = [
      // Users
      { name: 'users:create', resource: 'users', action: 'create', description: 'Create new users' },
      { name: 'users:read', resource: 'users', action: 'read', description: 'Read user data' },
      { name: 'users:update', resource: 'users', action: 'update', description: 'Update user data' },
      { name: 'users:delete', resource: 'users', action: 'delete', description: 'Delete users' },
      // Roles
      { name: 'roles:create', resource: 'roles', action: 'create', description: 'Create new roles' },
      { name: 'roles:read', resource: 'roles', action: 'read', description: 'Read role data' },
      { name: 'roles:update', resource: 'roles', action: 'update', description: 'Update roles' },
      { name: 'roles:delete', resource: 'roles', action: 'delete', description: 'Delete roles' },
      { name: 'roles:assign', resource: 'roles', action: 'assign', description: 'Assign roles to users' },
      // Reports
      { name: 'reports:read', resource: 'reports', action: 'read', description: 'Read reports' },
      { name: 'reports:export', resource: 'reports', action: 'export', description: 'Export reports' },
      // Invoices
      { name: 'invoices:approve', resource: 'invoices', action: 'approve', description: 'Approve invoices' },
    ];

    for (const perm of defaultPermissions) {
      await this.permissionModel.findOneAndUpdate(
        { name: perm.name },
        { $setOnInsert: perm },
        { upsert: true, new: true },
      );
    }
  }
}