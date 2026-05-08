import { Component, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ApplicationService } from '../../services/application.service';
import { I18nService } from '../../services/i18n.service';
import { I18nPipe } from '../../pipes/i18n.pipe';

@Component({
  selector: 'app-salary-box-plot',
  standalone: true,
  imports: [CommonModule, I18nPipe],
  templateUrl: './salary-box-plot.component.html',
  styleUrl: './salary-box-plot.component.css'
})
export class SalaryBoxPlotComponent {
  private appService = inject(ApplicationService);
  private i18n = inject(I18nService);
  
  salaryStats = computed(() => this.appService.getSalaryStats());
  hasData = computed(() => this.salaryStats() !== null);
  
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
    const width = ((stats.q3 - stats.q1) / range) * 100;
    return Math.max(width, 1);
  }
  
  formatSalary(value: number): string {
    if (value >= 1000) {
      return `$${(value / 1000).toFixed(0)}k`;
    }
    return `$${value}`;
  }
  
  getPlural(): string {
    const n = this.salaryStats()?.salaries.length || 0;
    return n === 1 ? '' : this.i18n.currentLanguage === 'es' ? 'es' : 's';
  }
}
