import { Component, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ApplicationService } from '../../services/application.service';
import { I18nService } from '../../services/i18n.service';
import { StatsCardComponent } from '../../components/stats-card/stats-card.component';
import { I18nPipe } from '../../pipes/i18n.pipe';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, StatsCardComponent, I18nPipe],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css'
})
export class DashboardComponent {
  private appService = inject(ApplicationService);
  private i18n = inject(I18nService);

  stats = this.appService.stats;
  currentLang = computed(() => this.i18n.currentLanguage);

  statusBreakdown = computed(() => {
    const s = this.stats();
    return [
      { type: 'applied', label: 'applied', percentage: Math.round((s.applied / (s.total || 1)) * 100), color: '#6366f1' },
      { type: 'interview', label: 'interview', percentage: Math.round((s.interviews / (s.total || 1)) * 100), color: '#0ea5e9' },
      { type: 'offer', label: 'offer', percentage: Math.round((s.offers / (s.total || 1)) * 100), color: '#10b981' },
      { type: 'rejected', label: 'rejected', percentage: Math.round((s.rejected / (s.total || 1)) * 100), color: '#f43f5e' },
      { type: 'wishlist', label: 'wishlist', percentage: Math.round((s.wishlist / (s.total || 1)) * 100), color: '#f59e0b' },
    ];
  });

  areaBreakdown = computed(() => {
    const areaStats = this.appService.areaStats();
    const totalAreas = areaStats.reduce((sum, a) => sum + a.count, 0);

    if (totalAreas === 0) return [];

    const colors = ['#6366f1', '#0ea5e9', '#10b981', '#f59e0b', '#f43f5e', '#8b5cf6', '#06b6d4', '#84cc16', '#f97316', '#ec4899'];

    // Normalize percentages to always sum to 100%
    let accumulated = 0;
    const result = areaStats.slice(0, 8).map((area, index, arr) => {
      const rawPercentage = (area.count / totalAreas) * 100;
      const isLast = index === arr.length - 1 || index === 7; // Last item or last of top 8

      if (isLast) {
        // Ensure last item gets remaining percentage to sum exactly 100%
        const percentage = 100 - accumulated;
        accumulated = 100;
        return {
          area: area.area,
          label: this.getTranslatedAreaLabel(area.area),
          count: area.count,
          percentage,
          color: colors[index % colors.length]
        };
      } else {
        const percentage = Math.round(rawPercentage);
        accumulated += percentage;
        return {
          area: area.area,
          label: this.getTranslatedAreaLabel(area.area),
          count: area.count,
          percentage,
          color: colors[index % colors.length]
        };
      }
    });

    return result;
  });

  salaryStats = computed(() => this.appService.getSalaryStats());
  
  private getPos(value: number, min: number, max: number): number {
    if (max === min) return 50;
    return ((value - min) / (max - min)) * 100;
  }
  
  getQ1Position(): number {
    const stats = this.salaryStats();
    if (!stats) return 0;
    return this.getPos(stats.q1, stats.min, stats.max);
  }
  
  getMedianPosition(): number {
    const stats = this.salaryStats();
    if (!stats) return 0;
    return this.getPos(stats.median, stats.min, stats.max);
  }
  
  getQ3Position(): number {
    const stats = this.salaryStats();
    if (!stats) return 0;
    return this.getPos(stats.q3, stats.min, stats.max);
  }
  
  getBoxWidth(): number {
    const stats = this.salaryStats();
    if (!stats) return 0;
    const range = stats.max - stats.min;
    if (range === 0) return 2;

    const q1Pos = this.getPos(stats.q1, stats.min, stats.max);
    const q3Pos = this.getPos(stats.q3, stats.min, stats.max);
    const width = Math.max(q3Pos - q1Pos, 2); // Minimum width of 2%

    return width;
  }
  
  formatSalary(value: number): string {
    if (value >= 1000) {
      return `$${(value / 1000).toFixed(0)}k`;
    }
    return `$${value}`;
  }

  getSalaryText(): string {
    const stats = this.salaryStats();
    if (!stats) return '';

    const count = stats.salaries.length;
    if (this.currentLang() === 'es') {
      return `Basado en ${count} salario${count === 1 ? '' : 's'}`;
    } else {
      return `Based on ${count} ${count === 1 ? 'salary' : 'salaries'}`;
    }
  }

  getTranslatedAreaLabel(area: string): string {
    // Create a mapping from area values to translation keys
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

    const key = areaKeyMap[area] || area;
    return this.i18n.translate(key);
  }
}