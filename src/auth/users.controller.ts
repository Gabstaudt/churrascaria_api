import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './jwt-auth.guard';
import { PermissionsGuard } from './permissions.guard';
import { Permissions } from './permissions.decorator';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

@Controller('users')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class UsersController {
  constructor(private readonly authService: AuthService) {}

  @Get()
  @Permissions('admin', 'view')
  findAll() {
    return this.authService.listUsers();
  }

  @Get(':id')
  @Permissions('admin', 'view')
  findOne(@Param('id') id: string) {
    return this.authService.getUserById(id);
  }

  @Post()
  @Permissions('admin', 'create')
  create(@Body() dto: CreateUserDto) {
    return this.authService.createUser(dto);
  }

  @Patch(':id')
  @Permissions('admin', 'edit')
  update(@Param('id') id: string, @Body() dto: UpdateUserDto) {
    return this.authService.updateUser(id, dto);
  }

  @Delete(':id')
  @Permissions('admin', 'delete')
  remove(@Param('id') id: string) {
    this.authService.deleteUser(id);
    return { success: true };
  }
}
