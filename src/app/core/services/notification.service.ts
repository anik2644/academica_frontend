import { Injectable } from '@angular/core';

export interface Toast {
  id: number;
  message: string;
  type: 'success' | 'error' | 'info' | 'warning';
}

@Injectable({
  providedIn: 'root',
})
export class NotificationService {
  toasts: Toast[] = [];
  private nextId = 0;

  success(message: string): void {
    this.addToast(message, 'success');
  }

  error(message: string): void {
    this.addToast(message, 'error');
  }

  info(message: string): void {
    this.addToast(message, 'info');
  }

  warning(message: string): void {
    this.addToast(message, 'warning');
  }

  removeToast(id: number): void {
    this.toasts = this.toasts.filter((t) => t.id !== id);
  }

  private addToast(message: string, type: Toast['type']): void {
    const id = this.nextId++;
    this.toasts.push({ id, message, type });
    setTimeout(() => this.removeToast(id), 4000);
  }
}
