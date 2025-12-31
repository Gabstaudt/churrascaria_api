import { UserRole } from '../auth.types';

export class CreateUserDto {
  name: string;
  username: string;
  email: string;
  password: string;
  role: UserRole;
  shortCode?: string;
  active?: boolean;
}
