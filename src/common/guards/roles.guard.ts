import { CanActivate, ExecutionContext, Injectable, SetMetadata } from "@nestjs/common";
import { Reflector } from "@nestjs/core";

// roles.guard.ts
@Injectable()
export class RolesGuard implements CanActivate {
    constructor(private reflector: Reflector) {}
    
    canActivate(context: ExecutionContext): boolean {
        const requiredRoles = this.reflector.get<string[]>('roles', context.getHandler());
        const { user } = context.switchToHttp().getRequest();
        return requiredRoles.includes(user.role);
    }
}