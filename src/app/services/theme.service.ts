import { Injectable, signal } from '@angular/core';

export type Theme = 'dark' | 'light';

@Injectable({
  providedIn: 'root'
})
export class ThemeService {
  private currentTheme = signal<Theme>('dark');
  private storageKey = 'jobquest_theme';

  constructor() {
    const saved = localStorage.getItem(this.storageKey) as Theme;
    if (saved && (saved === 'dark' || saved === 'light')) {
      this.currentTheme.set(saved);
    }
    this.applyTheme(this.currentTheme());
  }

  getTheme(): Theme {
    return this.currentTheme();
  }

  toggleTheme() {
    this.currentTheme.update(t => t === 'dark' ? 'light' : 'dark');
    this.applyTheme(this.currentTheme());
    localStorage.setItem(this.storageKey, this.currentTheme());
  }

  private applyTheme(theme: Theme) {
    document.documentElement.setAttribute('data-theme', theme);
  }
}