import { Injectable, signal, computed } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { catchError, tap } from 'rxjs/operators';
import { throwError } from 'rxjs';
import { User } from '../models/user.model';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private currentUserSignal = signal<User | null>(null);
  private tokenSignal = signal<string | null>(null);

  readonly isAuthenticated = signal(false);
  readonly currentUser = computed(() => this.currentUserSignal());

  constructor(private http: HttpClient) {
    // Load token and user from localStorage on startup
    const token = localStorage.getItem('auth_token');
    const user = localStorage.getItem('current_user');

    if (token) {
      this.tokenSignal.set(token);
    }

    if (user) {
      try {
        const parsedUser = JSON.parse(user);
        this.currentUserSignal.set(parsedUser);
        this.isAuthenticated.set(true);
      } catch (error) {
        console.error('Failed to parse stored user:', error);
        localStorage.removeItem('current_user');
      }
    }
  }

  register(email: string, password: string, name?: string) {
    return this.http.post<{ user: User; token: string }>(`${environment.apiUrl}/auth/register`, {
      email,
      password,
      name
    }).pipe(
      tap(response => {
        this.currentUserSignal.set(response.user);
        this.tokenSignal.set(response.token);
        this.isAuthenticated.set(true);

        // Store in localStorage
        localStorage.setItem('auth_token', response.token);
        localStorage.setItem('current_user', JSON.stringify(response.user));
      }),
      catchError(this.handleError)
    );
  }

  login(email: string, password: string) {
    return this.http.post<{ user: User; token: string }>(`${environment.apiUrl}/auth/login`, {
      email,
      password
    }).pipe(
      tap(response => {
        this.currentUserSignal.set(response.user);
        this.tokenSignal.set(response.token);
        this.isAuthenticated.set(true);

        // Store in localStorage
        localStorage.setItem('auth_token', response.token);
        localStorage.setItem('current_user', JSON.stringify(response.user));
      }),
      catchError(this.handleError)
    );
  }

  logout(): void {
    this.currentUserSignal.set(null);
    this.tokenSignal.set(null);
    this.isAuthenticated.set(false);

    localStorage.removeItem('auth_token');
    localStorage.removeItem('current_user');
  }

  getCurrentUser(): User | null {
    return this.currentUserSignal();
  }

  token(): string | null {
    return this.tokenSignal();
  }

  private generateUUID(): string {
    // RFC4122 version 4 compliant UUID generator
    const hex = () => '0123456789abcdef'.charAt(Math.floor(Math.random() * 16));
    let uuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
      const r = Math.random() * 16 | 0;
      const v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
    return uuid;
  }

  private hashPassword(password: string): string {
    // Simple hash para frontend-only (No usar en producción con backend real)
    // Usa encode + btoa para un encoding básico
    try {
      const encoder = new TextEncoder();
      const data = encoder.encode(password + 'JOBQUEST_SALT_2024');
      const hashArray = Array.from(data);
      return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    } catch {
      // Fallback para navegadores antiguos
      return btoa(password + 'JOBQUEST_SALT_2024');
    }
  }

  private verifyPassword(password: string, hash: string): boolean {
    const hashed = this.hashPassword(password);
    return hashed === hash;
  }

  private handleError(error: HttpErrorResponse) {
    let errorMessage = 'An unknown error occurred';

    if (error.error instanceof ErrorEvent) {
      // Client-side error
      errorMessage = error.error.message;
    } else {
      // Server-side error
      errorMessage = error.error?.error || error.message;
    }

    console.error('Auth error:', errorMessage);
    return throwError(() => new Error(errorMessage));
  }
}