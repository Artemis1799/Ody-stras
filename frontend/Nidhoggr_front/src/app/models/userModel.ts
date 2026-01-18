export interface User {
  uuid: string;
  name: string;
  password?: string;
}

export interface LoginRequest {
  name: string;
  password?: string;
}

export interface LoginResponse {
  message: string;
  token: string;
}
