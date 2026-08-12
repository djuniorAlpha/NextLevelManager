export type AdminRole = "owner" | "attendant";

export interface AdminUser {
  id: string;
  name: string;
  username: string;
  role: AdminRole;
}

export interface LoginResponse {
  accessToken: string;
  admin: AdminUser;
}

export interface Session {
  token: string;
  admin: AdminUser;
}
