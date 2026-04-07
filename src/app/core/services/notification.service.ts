import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class NotificationService {
  success(message: string): void {
    console.log('[SUCCESS]', message);
    // Implementation can be expanded with a toast/snackbar service later
  }

  error(message: string): void {
    console.error('[ERROR]', message);
  }

  info(message: string): void {
    console.info('[INFO]', message);
  }

  warning(message: string): void {
    console.warn('[WARNING]', message);
  }
}
