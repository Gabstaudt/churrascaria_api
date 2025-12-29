import { CanActivate, ExecutionContext, ForbiddenException, Injectable, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthService, PermissionAction, User } from './auth.service';
import { PERMISSIONS_KEY, PermissionMetadata } from './permissions.decorator';

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(private readonly reflector: Reflector, private readonly authService: AuthService) {}

  canActivate(context: ExecutionContext): boolean {
    const metadataOrFactory =
      this.reflector.getAllAndOverride<PermissionMetadata | ((ctx: ExecutionContext) => PermissionMetadata | undefined)>(
        PERMISSIONS_KEY,
        [context.getHandler(), context.getClass()],
      );

    if (!metadataOrFactory) return true;

    const metadata = typeof metadataOrFactory === 'function' ? metadataOrFactory(context) : metadataOrFactory;
    if (!metadata) return true;

    const request = context.switchToHttp().getRequest();
    const user: User | undefined = request.user;
    if (!user) {
      throw new UnauthorizedException('Token invalido ou ausente');
    }

    const { module, action } = metadata;
    const allowed = this.authService.hasPermission(user, module, action as PermissionAction | undefined);
    if (!allowed) {
      throw new ForbiddenException('Permissao negada');
    }

    return true;
  }
}
