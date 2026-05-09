import { Component, inject, ViewChild, OnInit, computed } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { ApplicationService } from './services/application.service';
import { ThemeService } from './services/theme.service';
import { I18nService, Language } from './services/i18n.service';
import { AuthService } from './services/auth.service';
import { ApplicationFormComponent } from './components/application-form/application-form.component';
import { I18nPipe } from './pipes/i18n.pipe';

@Component({
  selector: 'app-root',
  imports: [RouterModule, CommonModule, ApplicationFormComponent, I18nPipe],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App implements OnInit {
  @ViewChild(ApplicationFormComponent) formComponent!: ApplicationFormComponent;
  private appService = inject(ApplicationService);
  private themeService = inject(ThemeService);
  private i18nService = inject(I18nService);
  public authService = inject(AuthService);
  private router = inject(Router);

  get language(): Language {
    return this.i18nService.currentLanguage;
  }

  get isDark(): boolean {
    return this.themeService.getTheme() === 'dark';
  }

  readonly isAuthenticated = computed(() => this.authService.isAuthenticated());
  readonly userName = computed(() => this.authService.getCurrentUser()?.name || '');

  isMobileMenuOpen = false;

  toggleMobileMenu() {
    this.isMobileMenuOpen = !this.isMobileMenuOpen;
  }

  closeMobileMenu() {
    this.isMobileMenuOpen = false;
  }

  logout() {
    this.authService.logout();
    this.router.navigate(['/login']);
  }

  ngOnInit() {
    window.addEventListener('openModal', () => {
      if (this.formComponent) {
        this.formComponent.application = this.appService.editingApp;
        this.formComponent.open();
      }
    });
  }

  openAddModal() {
    this.appService.requestCreate();
  }

  toggleTheme() {
    this.themeService.toggleTheme();
  }

  toggleLanguage() {
    this.i18nService.toggleLanguage();
  }
}