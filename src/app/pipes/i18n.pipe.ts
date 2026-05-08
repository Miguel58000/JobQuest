import { Pipe, PipeTransform, inject } from '@angular/core';
import { I18nService } from '../services/i18n.service';

@Pipe({
  name: 'i18n',
  standalone: true,
  pure: false
})
export class I18nPipe implements PipeTransform {
  private i18n = inject(I18nService);

  transform(key: string, params?: Record<string, any>): string {
    let translation = this.i18n.translate(key);
    if (params) {
      Object.keys(params).forEach(paramKey => {
        translation = translation.replace(`{{${paramKey}}}`, String(params[paramKey]));
      });
    }
    return translation;
  }
}