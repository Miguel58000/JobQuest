import { Component, inject, effect, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormGroup, FormBuilder, Validators } from '@angular/forms';
import { ApplicationService } from '../../services/application.service';
import { I18nService } from '../../services/i18n.service';
import { Application, ApplicationStatus } from '../../models/application.model';
import { I18nPipe } from '../../pipes/i18n.pipe';

@Component({
  selector: 'app-application-form',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, I18nPipe],
  templateUrl: './application-form.component.html',
  styleUrl: './application-form.component.css'
})
export class ApplicationFormComponent {
  application: Application | null = null;
  isOpen = computed(() => this.isOpenSignal());

  private fb = inject(FormBuilder);
  private appService = inject(ApplicationService);
  i18n = inject(I18nService);
  
  private isOpenSignal = signal(false);
  form: FormGroup;
  isSubmitting = signal(false);
  submitted = false;
  
  constructor() {
    this.form = this.fb.group({
      company: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(100)]],
      position: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(100)]],
      status: ['applied' as ApplicationStatus, Validators.required],
      areas: [[] as string[]],
      salary: ['', Validators.pattern(/^\$(\d{1,3}(,\d{3})*|\d+)(\.\d+)?([kK])?$/)],
      link: ['', Validators.pattern(/^https?:\/\/\S+$/)],
      notes: [''],
      dateApplied: ['', Validators.required]
    });
    
    effect(() => {
      if (this.isOpenSignal() && this.application) {
        const formValue = {
          ...this.application,
          dateApplied: this.application.dateApplied ? this.formatDateForInput(this.application.dateApplied) : ''
        };
        this.form.patchValue(formValue);
      } else if (this.isOpenSignal()) {
        const today = new Date().toISOString().split('T')[0];
        this.form.reset({ status: 'applied', areas: [], dateApplied: today });
      }
    });
  }

  private formatDateForInput(date: Date): string {
    return date.toISOString().split('T')[0];
  }
  
  open() {
    this.isOpenSignal.set(true);
  }
  
  closeModal() {
    this.isOpenSignal.set(false);
    this.form.reset({ status: 'applied', areas: [] });
    this.appService.clearEditState();
  }
  
  onSubmit() {
    this.submitted = true;
    if (this.isSubmitting()) return;

    // Solo validar si el formulario es válido antes de enviar
    if (this.form.invalid) {
      console.warn('Form is invalid, cannot submit');
      return;
    }

    this.isSubmitting.set(true);
    
    const values = this.form.getRawValue();
    
    if (this.application) {
      this.appService.updateApplication(this.application.id, values);
    } else {
      this.appService.addApplication(values);
    }
    
    this.isSubmitting.set(false);
    this.closeModal();
  }
  
  get statuses(): ApplicationStatus[] {
    return ['wishlist', 'applied', 'interview', 'offer', 'rejected'];
  }

  get availableAreas(): { key: string; label: string }[] {
    return [
      { key: 'areaFrontend', label: this.i18n.translate('areaFrontend') },
      { key: 'areaBackend', label: this.i18n.translate('areaBackend') },
      { key: 'areaFullStack', label: this.i18n.translate('areaFullStack') },
      { key: 'areaMobile', label: this.i18n.translate('areaMobile') },
      { key: 'areaDataScience', label: this.i18n.translate('areaDataScience') },
      { key: 'areaDevOps', label: this.i18n.translate('areaDevOps') },
      { key: 'areaCloud', label: this.i18n.translate('areaCloud') },
      { key: 'areaAIML', label: this.i18n.translate('areaAIML') },
      { key: 'areaCybersecurity', label: this.i18n.translate('areaCybersecurity') },
      { key: 'areaQATesting', label: this.i18n.translate('areaQATesting') },
      { key: 'areaUIUX', label: this.i18n.translate('areaUIUX') },
      { key: 'areaProductManagement', label: this.i18n.translate('areaProductManagement') },
      { key: 'areaITSupport', label: this.i18n.translate('areaITSupport') },
      { key: 'areaDatabase', label: this.i18n.translate('areaDatabase') },
      { key: 'areaAPIDevelopment', label: this.i18n.translate('areaAPIDevelopment') }
    ];
  }

  get submitLabel(): string {
    return this.application ? 'update' : 'create';
  }

  onAreaChange(event: Event, area: string) {
    const checkbox = event.target as HTMLInputElement;
    const currentAreas = this.form.get('areas')?.value || [];
    let newAreas: string[];

    if (checkbox.checked) {
      newAreas = [...currentAreas, area];
    } else {
      newAreas = currentAreas.filter((a: string) => a !== area);
    }

    this.form.get('areas')?.setValue(newAreas);
  }

  isAreaSelected(area: string): boolean {
    const currentAreas = this.form.get('areas')?.value || [];
    return currentAreas.includes(area);
  }
}
