import { Injectable, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';

export type UserRole = 'admin' | 'caixa' | 'garcom' | 'funcionario';
export type PermissionAction = 'view' | 'create' | 'edit' | 'delete' | 'approve';

export interface Permission {
  module: string;
  actions: PermissionAction[];
}

export interface User {
  id: string;
  name: string;
  username: string;
  role: UserRole;
  active: boolean;
  shortCode?: string;
  permissions: Permission[];
  createdAt: Date;
  lastLogin?: Date;
}

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  private readonly users: (User & { password: string })[] = [
    {
      id: '1',
      name: 'Administrador',
      username: 'admin',
      password: '$2b$10$sx0SJ2q6CDoUnQNe2j7Jq.LzYZc/2D69Dwn4fk4RnoJ54QJTstmDi', // 'admin123'
      role: 'admin',
      active: true,
      shortCode: '001',
      permissions: [
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
      ],
      createdAt: new Date(),
    },
    {
      id: '2',
      name: 'Maria Caixa',
      username: 'caixa',
      password: '$2b$10$RK97bZASpKNmA3rcXQDKYOrdYV/E3KTTF0U/AdjfK9gYmnzJrW7p2', // 'caixa123'
      role: 'caixa',
      active: true,
      shortCode: '002',
      permissions: [
        { module: 'dashboard', actions: ['view'] },
        { module: 'comandas', actions: ['view'] },
        { module: 'caixa', actions: ['view', 'create', 'edit'] },
      ],
      createdAt: new Date(),
    },
  ];

  constructor(private readonly jwtService: JwtService) {}

  private stripPassword(user: User & { password: string }): User {
    const { password, ...rest } = user;
    return rest;
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
