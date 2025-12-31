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
  email: string;
  role: UserRole;
  active: boolean;
  shortCode?: string;
  permissions: Permission[];
  createdAt: Date;
  lastLogin?: Date;
}
