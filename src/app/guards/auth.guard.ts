import { Injectable } from '@angular/core';
import { CanActivate, Router, UrlTree } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { computed } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate {
  constructor(private authService: AuthService, private router: Router) {}

  async canActivate(): Promise<boolean | UrlTree> {
    await this.authService.waitForAuth();
    const isAuth = this.authService.isAuthenticated();
    return isAuth ? true : this.router.createUrlTree(['/login']);
  }
}