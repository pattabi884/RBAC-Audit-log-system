import { 
  Injectable, 
  CanActivate, 
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';

import { AuditService } from 'src/modules/rbac/audit/audit.service';
import { ContextEvaluatorService } from 'src/modules/rbac/context/context-evaluator.service';
import { PermissionContext } from 'src/modules/rbac/context/permission-context.interface';
import { UserRolesService } from 'src/modules/rbac/user-roles/user-roles.service';

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private userRolesService: UserRolesService,
    private contextEvaluator: ContextEvaluatorService,
    private auditService: AuditService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // Get required permissions from decorator
    const requiredPermissions = this.reflector.get<string[]>(
      'permissions',
      context.getHandler(),
    );

    // If no permissions required, allow access
    if (!requiredPermissions || requiredPermissions.length === 0) {
      return true;
    }

    // Get request and user
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      return false;
    }

    // Build permission context
    const permissionContext = this.buildContext(request, user);

    // Check each required permission
    for (const permission of requiredPermissions) {
      const hasBasicPermission = await this.userRolesService.hasPermission(
        user.userId,
        permission,
      );

      if (!hasBasicPermission) {
        // User doesn't have the permission at all
        await this.auditService.logPermissionCheck({
          userId: user.userId,
          permission,
          granted: false,
          reason: 'Permission not assigned to user',
          context: permissionContext,
        });
        
        throw new ForbiddenException(
          `Missing required permission: ${permission}`,
        );
      }

      // User has permission, now check context/attributes
      const decision = this.contextEvaluator.evaluatePermission(
        permission,
        permissionContext,
      );

      // Log the permission check
      await this.auditService.logPermissionCheck({
        userId: user.userId,
        permission,
        granted: decision.granted,
        reason: decision.reason,
        evaluatedRules: decision.evaluatedRules,
        context: permissionContext,
      });

      if (!decision.granted) {
        throw new ForbiddenException(
          `Permission denied: ${decision.reason}`,
        );
      }
    }

    return true;
  }

  /**
   * Build permission context from request
   */
  private buildContext(request: any, user: any): PermissionContext {
    // Extract resource info from request (if available)
    const resourceId = request.params.id || request.body.resourceId;
    const resourceType = this.extractResourceType(request.route?.path);

    return {
      // User attributes
      userId: user.userId,
      userEmail: user.email,
      userDepartment: user.department,
      userRole: user.role,

      // Resource attributes
      resourceId,
      resourceType,
      resourceDepartment: request.body?.department,
      resourceOwnerId: request.body?.ownerId,

      // Environmental attributes
      ipAddress: this.getClientIP(request),
      userAgent: request.headers['user-agent'] || 'unknown',
      timestamp: new Date(),

      // Security attributes
      hasMFA: user.mfaVerified || false,
      sessionAge: this.calculateSessionAge(user.loginTime),
      deviceTrusted: this.isDeviceTrusted(request),
    };
  }

  /**
   * Extract resource type from route path
   * Example: /api/users/:id -> 'users'
   */
  private extractResourceType(path: string): string {
    if (!path) return 'unknown';
    const match = path.match(/\/api\/([^\/]+)/);
    return match ? match[1] : 'unknown';
  }

  /**
   * Get client IP address
   */
  private getClientIP(request: any): string {
    return (
      request.headers['x-forwarded-for']?.split(',')[0] ||
      request.headers['x-real-ip'] ||
      request.connection.remoteAddress ||
      request.socket.remoteAddress ||
      'unknown'
    );
  }

  /**
   * Calculate session age in minutes
   */
  private calculateSessionAge(loginTime: Date): number {
    if (!loginTime) return 9999; // Very old session
    const now = new Date();
    const diffMs = now.getTime() - new Date(loginTime).getTime();
    return Math.floor(diffMs / 1000 / 60); // Convert to minutes
  }

  /**
   * Check if device is trusted (simple implementation)
   */
  private isDeviceTrusted(request: any): boolean {
    // In production, check against trusted device tokens
    // For now, just return true if deviceId exists
    return !!request.headers['x-device-id'];
  }
}