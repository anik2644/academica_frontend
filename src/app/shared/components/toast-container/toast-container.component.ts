import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { NotificationService } from '../../../core/services/notification.service';

@Component({
  selector: 'app-toast-container',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './toast-container.component.html',
  styleUrl: './toast-container.component.css',
})
export class ToastContainerComponent {
  readonly notificationService = inject(NotificationService);

  toastClass(type: string): string {
    const classes: Record<string, string> = {
      success: 'border-emerald-200 bg-emerald-50/95 text-emerald-800',
      error: 'border-rose-200 bg-rose-50/95 text-rose-800',
      info: 'border-blue-200 bg-blue-50/95 text-blue-800',
      warning: 'border-amber-200 bg-amber-50/95 text-amber-800',
    };
    return classes[type] || classes['info'];
  }
}
