export interface User {
  id: string;
  email: string;
  password: string; // In production, this should be hashed
  name?: string;
  createdAt: Date;
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
}