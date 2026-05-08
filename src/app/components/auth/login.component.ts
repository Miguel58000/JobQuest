import { Component, inject, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { I18nPipe } from '../../pipes/i18n.pipe';
import { I18nService } from '../../services/i18n.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, RouterLink, I18nPipe],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css'
})
export class LoginComponent implements OnDestroy {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private router = inject(Router);
  public i18n = inject(I18nService);

  form = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', Validators.required]
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

  onSubmit(): void {
    this.submitted = true;
    if (this.isSubmitting) return;

    this.clearErrorTimer();
    this.isSubmitting = true;
    this.errorKey = null;

    const formValue = this.form.getRawValue() as { email: string; password: string };
    const { email, password } = formValue;

    this.authService.login(email, password).subscribe({
      next: () => {
        this.router.navigate(['/']);
      },
      error: (error) => {
        console.error('Login error:', error);
        this.errorKey = 'invalidCredentials';
        this.errorTimeoutId = setTimeout(() => {
          this.errorKey = null;
          this.errorTimeoutId = null;
        }, 5000);
        this.isSubmitting = false;
      }
    });
  }

  ngOnDestroy(): void {
    this.clearErrorTimer();
  }
}
