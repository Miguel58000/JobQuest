import { Component, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DragDropModule, CdkDragDrop } from '@angular/cdk/drag-drop';
import { ApplicationService } from '../../services/application.service';
import { I18nService } from '../../services/i18n.service';
import { Application, ApplicationStatus } from '../../models/application.model';
import { I18nPipe } from '../../pipes/i18n.pipe';

@Component({
  selector: 'app-kanban-board',
  standalone: true,
  imports: [CommonModule, DragDropModule, I18nPipe],
  templateUrl: './kanban-board.component.html',
  styleUrl: './kanban-board.component.css'
})
export class KanbanBoardComponent {
  public appService = inject(ApplicationService);
  private i18n = inject(I18nService);

  wishlist = computed(() => this.appService.allApplications().filter(a => a.status === 'wishlist'));
  applied = computed(() => this.appService.allApplications().filter(a => a.status === 'applied'));
  interview = computed(() => this.appService.allApplications().filter(a => a.status === 'interview'));
  offer = computed(() => this.appService.allApplications().filter(a => a.status === 'offer'));

  columns = [
    { id: 'wishlist', title: 'wishlist', data: this.wishlist },
    { id: 'applied', title: 'applied', data: this.applied },
    { id: 'interview', title: 'interview', data: this.interview },
    { id: 'offer', title: 'offer', data: this.offer }
  ];

  drop(event: CdkDragDrop<Application[]>) {
    if (event.previousContainer === event.container) {
      // Reordering within same column not implemented
    } else {
      const app = event.previousContainer.data[event.previousIndex];
      const newStatus = event.container.id as ApplicationStatus;
      this.appService.updateStatus(app.id, newStatus);
    }
  }

  deleteApp(id: string) {
    if (confirm(this.i18n.translate('confirmDelete'))) {
      this.appService.deleteApplication(id);
    }
  }

  exportData() {
    this.appService.exportToCSV();
  }

  importData() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = (e: any) => {
      const file = e.target.files[0];
      if (!file) return;
      
      const reader = new FileReader();
      reader.onload = (event: any) => {
        const success = this.appService.importFromJSON(event.target.result);
        if (!success) {
          alert('Failed to import JSON. Please check the file format.');
        }
      };
      reader.readAsText(file);
    };
    input.click();
  }

  clearAll() {
    if (confirm(this.i18n.translate('confirmClearAll'))) {
      this.appService.clearAll();
    }
  }
}
