import { Component, input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-stats-card',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './stats-card.component.html',
  styleUrl: './stats-card.component.css'
})
export class StatsCardComponent {
  label = input<string>('');
  value = input<number>(0);
  type = input<'applied' | 'interview' | 'offer' | 'rejected' | 'wishlist'>('applied');

  getInitial(): string {
    const lbl = this.label();
    return lbl ? lbl.charAt(0).toUpperCase() : '?';
  }
}
