export type RoleString = 'ADMIN' | 'SUPERVISOR' | 'SELLER';

export interface CreateUserDTO {
  userCode?: number;
  name?: string;
  firstName: string;
  lastNamePaterno: string;
  lastNameMaterno: string;
  email: string;
  password?: string;
  countryCode: string;
  country: string;
  phone: string;
  role: RoleString;
  branchId?: number;
}
