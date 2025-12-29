import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  UseGuards,
  UnauthorizedException,
  createParamDecorator,
  ExecutionContext,
  SetMetadata,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import type { PermissionAction, User } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { JwtAuthGuard } from './jwt-auth.guard';
import { PermissionsGuard } from './permissions.guard';
import { PERMISSIONS_KEY } from './permissions.decorator';

export const UserFromRequest = createParamDecorator((data: unknown, ctx: ExecutionContext): User => {
  const request = ctx.switchToHttp().getRequest();
  return request.user as User;
});

export const PermissionsFromRequest = () =>
  SetMetadata(PERMISSIONS_KEY, (ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    return {
      module: request.params?.module,
      action: request.query?.action as PermissionAction | undefined,
    };
  });

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  async login(@Body() loginDto: LoginDto) {
    const user = await this.authService.validateUser(loginDto.username, loginDto.password);
    if (!user) {
      throw new UnauthorizedException('Credenciais invalidas');
    }
    return this.authService.login(user);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  me(@UserFromRequest() user: User) {
    return user;
  }

  @Get('check/:module')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @PermissionsFromRequest()
  checkPermission(
    @UserFromRequest() user: User,
    @Param('module') module: string,
  ) {
    // PermissionsGuard ja valida; aqui apenas devolvemos o status
    return { module, allowed: this.authService.hasPermission(user, module) };
  }
}
