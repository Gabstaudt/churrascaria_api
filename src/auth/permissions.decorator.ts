import { SetMetadata } from '@nestjs/common';
import { PermissionAction } from './auth.types';

export const PERMISSIONS_KEY = 'permissions';

export interface PermissionMetadata {
  module: string;
  action?: PermissionAction;
}

export const Permissions = (module: string, action?: PermissionAction) =>
  SetMetadata(PERMISSIONS_KEY, { module, action } as PermissionMetadata);
