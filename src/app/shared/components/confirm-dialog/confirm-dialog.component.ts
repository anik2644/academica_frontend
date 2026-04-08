import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface ConfirmDialogData {
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  isDangerous?: boolean;
}

@Component({
  selector: 'app-confirm-dialog',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './confirm-dialog.component.html',
  styleUrl: './confirm-dialog.component.css',
})
export class ConfirmDialogComponent {
  title = 'Confirm Action';
  message = 'Are you sure?';
  confirmText = 'Confirm';
  cancelText = 'Cancel';
  isDangerous = false;

  onConfirm(): void {
    // This will be handled by a service that manages the dialog
  }

  onCancel(): void {
    // This will be handled by a service that manages the dialog
  }
}
