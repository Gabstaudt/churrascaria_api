import { BadRequestException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { randomUUID } from 'crypto';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { Permission, PermissionAction, User, UserRole } from './auth.types';

type UserRecord = User & { password: string };

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  private readonly users: UserRecord[] = [
    {
      id: '1',
      name: 'Administrador',
      username: 'admin',
      email: 'admin@churrascaria.com',
      password: '$2b$10$IE56Oa/KqcZCtDGcnw2huu.2zmQ5nVoVHWUYnMmw6yMNMA5X8yqLy', // 'admin123'
      role: 'admin',
      active: true,
      shortCode: '001',
      permissions: this.getDefaultPermissions('admin'),
      createdAt: new Date(),
    },
    {
      id: '2',
      name: 'Maria Caixa',
      username: 'caixa',
      email: 'caixa@churrascaria.com',
      password: '$2b$10$u1ux.ccHo6XGC9jvSqqj5.l6uORXPlurSscX9E7qobsnw55Gbt.bC', // 'caixa123'
      role: 'caixa',
      active: true,
      shortCode: '002',
      permissions: this.getDefaultPermissions('caixa'),
      createdAt: new Date(),
    },
  ];

  constructor(private readonly jwtService: JwtService) {}

  private stripPassword(user: UserRecord): User {
    const { password, ...rest } = user;
    return rest;
  }

  private assertUniqueFields(dto: { username?: string; email?: string; shortCode?: string }, ignoreId?: string) {
    if (dto.username && this.users.some(u => u.username === dto.username && u.id !== ignoreId)) {
      throw new BadRequestException('Username ja esta em uso');
    }
    if (dto.email && this.users.some(u => u.email === dto.email && u.id !== ignoreId)) {
      throw new BadRequestException('Email ja esta em uso');
    }
    if (dto.shortCode && this.users.some(u => u.shortCode === dto.shortCode && u.id !== ignoreId)) {
      throw new BadRequestException('Codigo curto ja esta em uso');
    }
  }

  private getDefaultPermissions(role: UserRole): Permission[] {
    const full: Permission[] = [
      { module: 'dashboard', actions: ['view', 'create', 'edit', 'delete', 'approve'] },
      { module: 'comandas', actions: ['view', 'create', 'edit', 'delete', 'approve'] },
      { module: 'buffet', actions: ['view', 'create', 'edit', 'delete', 'approve'] },
      { module: 'garcom', actions: ['view', 'create', 'edit', 'delete', 'approve'] },
      { module: 'caixa', actions: ['view', 'create', 'edit', 'delete', 'approve'] },
      { module: 'porteiro', actions: ['view', 'create', 'edit', 'delete', 'approve'] },
      { module: 'estoque', actions: ['view', 'create', 'edit', 'delete', 'approve'] },
      { module: 'relatorios', actions: ['view', 'create', 'edit', 'delete', 'approve'] },
      { module: 'cancelamentos', actions: ['view', 'create', 'edit', 'delete', 'approve'] },
      { module: 'admin', actions: ['view', 'create', 'edit', 'delete', 'approve'] },
    ];

    if (role === 'admin') return full;
    if (role === 'caixa')
      return [
        { module: 'dashboard', actions: ['view'] },
        { module: 'comandas', actions: ['view'] },
        { module: 'caixa', actions: ['view', 'create', 'edit'] },
        { module: 'relatorios', actions: ['view'] },
      ];
    if (role === 'garcom')
      return [
        { module: 'dashboard', actions: ['view'] },
        { module: 'comandas', actions: ['view', 'create'] },
        { module: 'garcom', actions: ['view', 'create'] },
      ];
    return [
      { module: 'dashboard', actions: ['view'] },
      { module: 'buffet', actions: ['view', 'create'] },
      { module: 'porteiro', actions: ['view'] },
      { module: 'estoque', actions: ['view', 'create'] },
    ];
  }

  listUsers(): User[] {
    return this.users.map(this.stripPassword);
  }

  getUserById(id: string): User {
    const user = this.users.find(u => u.id === id);
    if (!user) {
      throw new NotFoundException('Usuario nao encontrado');
    }
    return this.stripPassword(user);
  }

  async createUser(dto: CreateUserDto): Promise<User> {
    this.assertUniqueFields(dto);
    const password = await bcrypt.hash(dto.password, 10);
    const now = new Date();
    const user: UserRecord = {
      id: randomUUID(),
      name: dto.name,
      username: dto.username,
      email: dto.email,
      password,
      role: dto.role,
      active: dto.active ?? true,
      shortCode: dto.shortCode,
      permissions: this.getDefaultPermissions(dto.role),
      createdAt: now,
    };
    this.users.push(user);
    return this.stripPassword(user);
  }

  async updateUser(id: string, dto: UpdateUserDto): Promise<User> {
    const user = this.users.find(u => u.id === id);
    if (!user) {
      throw new NotFoundException('Usuario nao encontrado');
    }

    this.assertUniqueFields(
      { username: dto.username, email: dto.email, shortCode: dto.shortCode },
      user.id,
    );

    if (dto.name !== undefined) user.name = dto.name;
    if (dto.username !== undefined) user.username = dto.username;
    if (dto.email !== undefined) user.email = dto.email;
    if (dto.active !== undefined) user.active = dto.active;
    if (dto.shortCode !== undefined) user.shortCode = dto.shortCode;
    if (dto.role && dto.role !== user.role) {
      user.role = dto.role;
      user.permissions = this.getDefaultPermissions(dto.role);
    }
    if (dto.password) {
      user.password = await bcrypt.hash(dto.password, 10);
    }

    return this.stripPassword(user);
  }

  deleteUser(id: string): void {
    const idx = this.users.findIndex(u => u.id === id);
    if (idx === -1) {
      throw new NotFoundException('Usuario nao encontrado');
    }
    this.users.splice(idx, 1);
  }

  findById(id: string): User | undefined {
    const user = this.users.find(u => u.id === id && u.active);
    return user ? this.stripPassword(user) : undefined;
  }

  async validateUser(username: string, password: string): Promise<User | null> {
    const user = this.users.find(u => u.username === username && u.active);
    if (user && (await bcrypt.compare(password, user.password))) {
      return this.stripPassword(user);
    }
    return null;
  }

  async validateUserByCode(code: string): Promise<User | null> {
    const user = this.users.find(u => u.shortCode === code && u.active);
    return user ? this.stripPassword(user) : null;
  }

  async login(user: User) {
    this.logger.log(`Usuario ${user.username} logou (role=${user.role})`);
    const payload = {
      username: user.username,
      sub: user.id,
      role: user.role,
      permissions: user.permissions,
    };

    return {
      access_token: this.jwtService.sign(payload),
      user,
    };
  }

  hasPermission(user: User, module: string, action?: PermissionAction): boolean {
    const perm = user.permissions.find(p => p.module === module);
    if (!perm) return false;
    if (!action) return true;
    return perm.actions.includes(action);
  }
}
