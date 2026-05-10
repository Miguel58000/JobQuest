import { Component, inject, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { I18nPipe } from '../../pipes/i18n.pipe';
import { I18nService } from '../../services/i18n.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, RouterLink, I18nPipe],
  templateUrl: './register.component.html',
  styleUrl: './register.component.css'
})
export class RegisterComponent implements OnDestroy {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private router = inject(Router);
  public i18n = inject(I18nService);
  private cdr = inject(ChangeDetectorRef);

  private fullNameValidator(control: AbstractControl): ValidationErrors | null {
    const value = control.value;
    if (!value) return null;

    const regex = /^[a-zA-ZÀ-ÿ\s]+$/;
    const spaces = (value.match(/\s/g) || []).length;

    if (!regex.test(value)) {
      return { invalidCharacters: true };
    }

    if (spaces > 3) {
      return { tooManySpaces: true };
    }

    return null;
  }

  form = this.fb.group({
    name: ['', [Validators.required, this.fullNameValidator.bind(this)]],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]]
  });

  errorKey: string | null = null;
  isSubmitting = false;
  submitted = false;
  private errorTimeoutId: any = null;

  private clearErrorTimer(): void {
    if (this.errorTimeoutId) {
      clearTimeout(this.errorTimeoutId);
      this.errorTimeoutId = null;
    }
  }

  async onSubmit(): Promise<void> {
    this.submitted = true;
    if (this.form.invalid || this.isSubmitting) return;

    this.clearErrorTimer();
    this.isSubmitting = true;
    this.errorKey = null;

    const formValue = this.form.getRawValue() as { name?: string; email: string; password: string };
    const { name, email, password } = formValue;

    try {
      await this.authService.register(email, password, name);
      this.router.navigate(['/']);
    } catch (error) {
      console.error('Register error:', error);
      this.errorKey = 'emailAlreadyExists';
      this.errorTimeoutId = setTimeout(() => {
        this.errorKey = null;
        this.errorTimeoutId = null;
        this.cdr.detectChanges();
      }, 5000);
      this.isSubmitting = false;
      this.cdr.detectChanges();
    }
  }

  ngOnDestroy(): void {
    this.clearErrorTimer();
  }
}