import { UserRole } from 'src/common/enums/user-role.enum';

export interface JwtPayload {
  sub: string; // user id
  phoneNumber: string;
  role: UserRole;
  fullName: string;
}

export interface JwtPayloadWithRefresh extends JwtPayload {
  refreshToken: string;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  user: {
    id: string;
    fullName: string;
    phoneNumber: string;
    role: UserRole;
    mustChangePassword: boolean;
  };
}