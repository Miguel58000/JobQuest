import { Injectable, signal, computed, inject, effect } from '@angular/core';
import { 
  getFirestore, 
  collection, 
  query, 
  where, 
  getDocs, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc,
  serverTimestamp,
  onSnapshot,
  Timestamp
} from 'firebase/firestore';
import { Application, ApplicationStatus } from '../models/application.model';
import { AuthService } from './auth.service';
import { I18nService } from './i18n.service';

@Injectable({
  providedIn: 'root'
})
export class ApplicationService {
  private db = getFirestore();
  private authService = inject(AuthService);
  private i18nService = inject(I18nService);

  private applicationsSignal = signal<Application[]>([]);
  private editingAppSignal = signal<Application | null>(null);

  constructor() {
    effect(() => {
      const user = this.authService.getCurrentUser();
      if (user) {
        this.subscribeToUserApplications(user.id);
      }
    });
  }

  private subscribeToUserApplications(userId: string) {
    const q = query(collection(this.db, 'applications'), where('userId', '==', userId));
    onSnapshot(q, (snapshot) => {
      const apps: Application[] = snapshot.docs.map(docSnap => {
        const data = docSnap.data() as any;
        return {
          ...data,
          id: docSnap.id,
          dateApplied: data.dateApplied?.toDate?.() || new Date(data.dateApplied)
        } as Application;
      });
      this.applicationsSignal.set(apps);
    });
  }

  readonly allApplications = computed(() => this.applicationsSignal());

  readonly userApplications = computed(() => {
    const user = this.authService.getCurrentUser();
    return user ? this.applicationsSignal().filter(app => app.userId === user.id) : [];
  });

  readonly stats = computed(() => {
    const apps = this.userApplications();
    return {
      total: apps.length,
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
      areas.forEach((area: string) => {
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
    window.dispatchEvent(new CustomEvent('openModal'));
  }

  requestCreate() {
    this.editingAppSignal.set(null);
    window.dispatchEvent(new CustomEvent('openModal'));
  }

  clearEditState() {
    this.editingAppSignal.set(null);
  }

  async addApplication(app: Omit<Application, 'id' | 'userId'> & { dateApplied?: Date | string }) {
    const user = this.authService.getCurrentUser();
    if (!user) return;
    await addDoc(collection(this.db, 'applications'), {
      ...app,
      userId: user.id,
      dateApplied: app.dateApplied ? new Date(app.dateApplied) : new Date(),
      createdAt: serverTimestamp()
    });
  }

  async updateStatus(id: string, status: ApplicationStatus) {
    await updateDoc(doc(this.db, 'applications', id), { status });
  }

  async deleteApplication(id: string) {
    await deleteDoc(doc(this.db, 'applications', id));
  }

  async updateApplication(id: string, updates: Partial<Application>) {
    await updateDoc(doc(this.db, 'applications', id), updates);
  }

  async clearAll() {
    const apps = this.applicationsSignal();
    for (const app of apps) {
      await this.deleteApplication(app.id);
    }
  }

  getApplicationById(id: string): Application | undefined {
    const user = this.authService.getCurrentUser();
    return this.applicationsSignal().find(app => app.id === id && app.userId === user?.id);
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

  exportToCSV(): void {
    const data = this.userApplications();
    if (data.length === 0) return;

    const lang = this.i18nService.currentLanguage;
    const t = (key: string) => this.i18nService.translate(key);

    const headers = [
      t('company'), t('position'), t('status'), t('areas'),
      t('salary'), t('dateApplied'), t('notes'), t('link')
    ];

    const areaKeyMap: Record<string, string> = {
      'Frontend': 'areaFrontend', 'Backend': 'areaBackend', 'Full Stack': 'areaFullStack',
      'Mobile': 'areaMobile', 'Data Science': 'areaDataScience', 'DevOps': 'areaDevOps',
      'Cloud': 'areaCloud', 'AI/ML': 'areaAIML', 'Cybersecurity': 'areaCybersecurity',
      'QA/Testing': 'areaQATesting', 'UI/UX': 'areaUIUX', 'Product Management': 'areaProductManagement',
      'IT Support': 'areaITSupport', 'Database': 'areaDatabase', 'API Development': 'areaAPIDevelopment'
    };

    const rows = data.map(app => [
      `"${app.company}"`, `"${app.position}"`, t(app.status as ApplicationStatus),
      `"${app.areas.map((area: string) => t(areaKeyMap[area] || area)).join(', ')}"`,
      `"${app.salary || ''}"`, new Date(app.dateApplied).toLocaleDateString(lang === 'es' ? 'es-ES' : 'en-US'),
      `"${app.notes || ''}"`, `"${app.link || ''}"`
    ]);

    const csvContent = headers.join(',') + '\n' + rows.map(r => r.join(',')).join('\n');
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

      // Note: This will be handled by the effect that watches applicationsSignal
      // For immediate import, you'd need to add directly to Firestore
      imported.forEach(async (app) => {
        await addDoc(collection(this.db, 'applications'), {
          ...app,
          userId: user.id,
          id: undefined, // Let Firestore generate ID
          dateApplied: app.dateApplied ? new Date(app.dateApplied) : new Date(),
          createdAt: serverTimestamp()
        });
      });
      return true;
    } catch {
      return false;
    }
  }
}