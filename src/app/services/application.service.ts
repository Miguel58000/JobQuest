import { Injectable, signal, computed, inject, effect } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { catchError, map, tap } from 'rxjs/operators';
import { throwError } from 'rxjs';
import { Application, ApplicationStatus } from '../models/application.model';
import { AuthService } from './auth.service';
import { I18nService } from './i18n.service';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ApplicationService {
  private readonly STORAGE_KEY = 'jobquest_applications';
  private i18nService = inject(I18nService);

  private applicationsSignal = signal<Application[]>([]);
  private editingAppSignal = signal<Application | null>(null);
  private authService = inject(AuthService);

  constructor(private http: HttpClient) {
    this.loadApplications();
    this.saveToStorage();
  }

  private getHeaders() {
    const token = this.authService.token();
    return new HttpHeaders().set('Authorization', `Bearer ${token}`);
  }

  private loadApplications() {
    if (this.authService.isAuthenticated()) {
      this.fetchApplications().subscribe({
        next: (apps) => this.applicationsSignal.set(apps),
        error: (error) => {
          console.error('Failed to load applications from server, using local storage:', error);
          const localApps = this.loadFromStorage();
          this.applicationsSignal.set(localApps);
        }
      });
    } else {
      const localApps = this.loadFromStorage();
      this.applicationsSignal.set(localApps);
    }
  }

  private fetchApplications() {
    return this.http.get<any[]>(`${environment.apiUrl}/applications`, {
      headers: this.getHeaders()
    }).pipe(
      map(apps => apps.map(app => ({
        ...app,
        dateApplied: this.parseDate(app.dateApplied)
      }))),
      catchError(this.handleError)
    );
  }

  private parseDate(dateStr: string): Date {
    if (!dateStr) return new Date();
    // Handle YYYY-MM-DD format from backend
    const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateStr);
    if (match) {
      const year = parseInt(match[1], 10);
      const month = parseInt(match[2], 10) - 1;
      const day = parseInt(match[3], 10);
      return new Date(year, month, day);
    }
    // Fallback to Date constructor
    const d = new Date(dateStr);
    return isNaN(d.getTime()) ? new Date() : d;
  }

  readonly allApplications = computed(() => this.applicationsSignal());

  readonly userApplications = computed(() => {
    const user = this.authService.getCurrentUser();
    if (!user) return this.applicationsSignal();
    return this.applicationsSignal().filter(app => app.userId === user.id);
  });

  readonly stats = computed(() => {
    const apps = this.userApplications();
    const total = apps.length;
    return {
      total,
      applied: apps.filter(a => a.status === 'applied').length,
      interviews: apps.filter(a => a.status === 'interview').length,
      offers: apps.filter(a => a.status === 'offer').length,
      rejected: apps.filter(a => a.status === 'rejected').length,
      wishlist: apps.filter(a => a.status === 'wishlist').length,
    };
  });

  readonly areaStats = computed(() => {
    const apps = this.userApplications() || [];
    const areaCounts: Record<string, number> = {};

    apps.forEach(app => {
      const areas = app.areas || [];
      areas.forEach(area => {
        areaCounts[area] = (areaCounts[area] || 0) + 1;
      });
    });

    return Object.entries(areaCounts)
      .map(([area, count]) => ({ area, count }))
      .sort((a, b) => b.count - a.count);
  });

  get editingApp(): Application | null {
    return this.editingAppSignal();
  }

  requestEdit(app: Application) {
    this.editingAppSignal.set(app);
    const event = new CustomEvent('openModal');
    window.dispatchEvent(event);
  }

  requestCreate() {
    this.editingAppSignal.set(null);
    const event = new CustomEvent('openModal');
    window.dispatchEvent(event);
  }

  clearEditState() {
    this.editingAppSignal.set(null);
  }

  private saveToStorage() {
    effect(() => {
      const apps = this.applicationsSignal();
      const appData = JSON.stringify(apps);
      try {
        localStorage.setItem(this.STORAGE_KEY, appData);
      } catch (error) {
        if (error instanceof Error && error.name === 'QuotaExceededError') {
          console.warn('localStorage quota exceeded for applications. Clearing old data.');
          this.clearOldApplications();
          try {
            const cleanedData = JSON.stringify(this.applicationsSignal());
            localStorage.setItem(this.STORAGE_KEY, cleanedData);
            console.log('Successfully saved applications after cleanup.');
          } catch (retryError) {
            console.error('Failed to save applications after clearing data:', retryError);
            this.showStorageWarning();
          }
        }
      }
    });

    effect(() => {
      const user = this.authService.getCurrentUser();
      if (user) {
        const apps = this.applicationsSignal();
        const orphaned = apps.filter(app => !app.userId);
        const userHasApps = apps.some(app => app.userId === user.id);

        if (orphaned.length > 0 && !userHasApps) {
          this.applicationsSignal.update(all =>
            all.map(app => (!app.userId || app.userId === 'default-system')
              ? { ...app, userId: user.id }
              : app
            )
          );
        }
      }
    });
  }

  addApplication(app: Omit<Application, 'id' | 'dateApplied' | 'userId'>) {
    this.http.post<Application>(`${environment.apiUrl}/applications`, app, {
      headers: this.getHeaders()
    }).pipe(
      tap(newApp => {
        this.applicationsSignal.update(apps => [...apps, newApp]);
      }),
      catchError(this.handleError)
    ).subscribe({
      next: () => console.log('Application created successfully'),
      error: (error) => console.error('Failed to create application:', error)
    });
  }

  updateStatus(id: string, status: ApplicationStatus) {
    this.updateApplication(id, { status });
  }

  deleteApplication(id: string) {
    this.http.delete(`${environment.apiUrl}/applications/${id}`, {
      headers: this.getHeaders()
    }).pipe(
      tap(() => {
        this.applicationsSignal.update(apps =>
          apps.filter(app => app.id !== id)
        );
      }),
      catchError(this.handleError)
    ).subscribe({
      next: () => console.log('Application deleted successfully'),
      error: (error) => console.error('Failed to delete application:', error)
    });
  }

  updateApplication(id: string, updates: Partial<Omit<Application, 'id' | 'dateApplied' | 'userId'>>) {
    this.http.put<Application>(`${environment.apiUrl}/applications/${id}`, updates, {
      headers: this.getHeaders()
    }).pipe(
      tap(updatedApp => {
        this.applicationsSignal.update(apps =>
          apps.map(app => app.id === id ? updatedApp : app)
        );
      }),
      catchError(this.handleError)
    ).subscribe({
      next: () => console.log('Application updated successfully'),
      error: (error) => console.error('Failed to update application:', error)
    });
  }

  getApplicationById(id: string): Application | undefined {
    const user = this.authService.getCurrentUser();
    if (!user) return undefined;
    return this.applicationsSignal().find(app => app.id === id && app.userId === user.id);
  }

  clearAll() {
    const apps = this.applicationsSignal();
    apps.forEach(app => {
      this.deleteApplication(app.id);
    });
  }

  exportToCSV(): void {
    const data = this.userApplications();
    if (data.length === 0) return;

    const lang = this.i18nService.currentLanguage;
    const t = (key: string) => this.i18nService.translate(key);

    // Translate headers based on current language
    const headers = [
      t('company'),
      t('position'),
      t('status'),
      t('areas'),
      t('salary'),
      t('dateApplied'),
      t('notes'),
      t('link')
    ];

    // Map area names to translation keys
    const areaKeyMap: Record<string, string> = {
      'Frontend': 'areaFrontend',
      'Backend': 'areaBackend',
      'Full Stack': 'areaFullStack',
      'Mobile': 'areaMobile',
      'Data Science': 'areaDataScience',
      'DevOps': 'areaDevOps',
      'Cloud': 'areaCloud',
      'AI/ML': 'areaAIML',
      'Cybersecurity': 'areaCybersecurity',
      'QA/Testing': 'areaQATesting',
      'UI/UX': 'areaUIUX',
      'Product Management': 'areaProductManagement',
      'IT Support': 'areaITSupport',
      'Database': 'areaDatabase',
      'API Development': 'areaAPIDevelopment'
    };

    const rows = data.map(app => [
      `"${app.company}"`,
      `"${app.position}"`,
      t(app.status as ApplicationStatus),
      `"${app.areas.map(area => t(areaKeyMap[area] || area)).join(', ')}"`,
      `"${app.salary || ''}"`,
      new Date(app.dateApplied).toLocaleDateString(lang === 'es' ? 'es-ES' : 'en-US'),
      `"${app.notes || ''}"`,
      `"${app.link || ''}"`
    ]);

    let csvContent = headers.join(',') + '\n';
    rows.forEach(row => {
      csvContent += row.join(',') + '\n';
    });

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `jobquest-export-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  }

  importFromJSON(json: string): boolean {
    try {
      const imported = JSON.parse(json) as Partial<Application>[];
      const user = this.authService.getCurrentUser();
      if (!user) return false;

      const validApps = imported.map(app => ({
        ...app,
        userId: user.id,
        id: app.id || crypto.randomUUID(),
        dateApplied: app.dateApplied ? new Date(app.dateApplied) : new Date(),
        status: app.status || 'applied' as ApplicationStatus,
        areas: Array.isArray(app.areas) ? app.areas : []
      })) as Application[];

      this.applicationsSignal.update(apps => [...apps, ...validApps]);
      return true;
    } catch {
      return false;
    }
  }

  getSalaryStats(): { min: number; q1: number; median: number; q3: number; max: number; salaries: number[] } | null {
    const apps = this.userApplications().filter(a => a.salary);
    if (apps.length === 0) return null;

    const salaries = apps
      .map(a => this.parseSalary(a.salary!))
      .filter((s): s is number => s !== null)
      .sort((a, b) => a - b);

    if (salaries.length === 0) return null;

    const min = salaries[0];
    const max = salaries[salaries.length - 1];
    const median = this.getMedian(salaries);
    const q1 = this.getPercentile(salaries, 25);
    const q3 = this.getPercentile(salaries, 75);

    return { min, q1, median, q3, max, salaries };
  }

  private parseSalary(salaryStr: string): number | null {
    const cleaned = salaryStr.replace(/[^0-9]/g, '');
    const value = parseInt(cleaned, 10);
    return isNaN(value) ? null : value;
  }

  private getMedian(arr: number[]): number {
    const mid = Math.floor(arr.length / 2);
    return arr.length % 2 !== 0 ? arr[mid] : (arr[mid - 1] + arr[mid]) / 2;
  }

  private getPercentile(arr: number[], percentile: number): number {
    const index = (percentile / 100) * (arr.length - 1);
    const lower = Math.floor(index);
    const upper = Math.ceil(index);
    const weight = index % 1;
    return arr[lower] * (1 - weight) + arr[upper] * weight;
  }

  private loadFromStorage(): Application[] {
    const data = localStorage.getItem(this.STORAGE_KEY);
    if (!data) return this.getInitialData();
    try {
      const parsed = JSON.parse(data);
      return parsed.map((app: any) => ({
        ...app,
        dateApplied: new Date(app.dateApplied)
      }));
    } catch {
      return this.getInitialData();
    }
  }

  private getInitialData(): Application[] {
    const defaultUserId = 'default-system';
    return [
      {
        id: '1',
        userId: defaultUserId,
        company: 'Google',
        position: 'Frontend Developer',
        status: 'applied',
        areas: ['Frontend', 'Web Development'],
        dateApplied: new Date(),
        salary: '$120k'
      },
      {
        id: '2',
        userId: defaultUserId,
        company: 'Meta',
        position: 'Software Engineer',
        status: 'interview',
        areas: ['Full Stack', 'Backend'],
        dateApplied: new Date(),
        salary: '$140k'
      },
      {
        id: '3',
        userId: defaultUserId,
        company: 'Amazon',
        position: 'Full Stack Developer',
        status: 'offer',
        areas: ['Full Stack', 'Frontend', 'Backend'],
        dateApplied: new Date(),
        salary: '$130k'
      },
      {
        id: '4',
        userId: defaultUserId,
        company: 'Apple',
        position: 'iOS Developer',
        status: 'rejected',
        areas: ['Mobile', 'iOS'],
        dateApplied: new Date(),
        salary: '$150k'
      },
      {
        id: '5',
        userId: defaultUserId,
        company: 'Microsoft',
        position: 'Backend Developer',
        status: 'wishlist',
        areas: ['Backend', 'Cloud'],
        dateApplied: new Date(),
        salary: '$125k'
      }
    ];
  }

  private clearOldApplications() {
    const apps = this.applicationsSignal();
    if (apps.length > 10) {
      const sorted = apps.sort((a, b) =>
        new Date(b.dateApplied).getTime() - new Date(a.dateApplied).getTime()
      );
      this.applicationsSignal.set(sorted.slice(0, 10));
    }
  }

  private showStorageWarning() {
    console.warn('Storage space is limited. Some data may not be saved.');
  }

  private handleError(error: any) {
    console.error('Application service error:', error);
    return throwError(() => error);
  }
}