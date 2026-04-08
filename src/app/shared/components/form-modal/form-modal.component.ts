import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
  selector: 'app-form-modal',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './form-modal.component.html',
  styleUrl: './form-modal.component.css',
})
export class FormModalComponent {
  @Input() open = false;
  @Input() title = '';
  @Input() subtitle = '';
  @Input() confirmText = 'Save';
  @Input() loadingText = 'Saving...';
  @Input() loading = false;
  @Input() confirmDisabled = false;
  @Input() danger = false;
  @Input() wide = false;
  @Output() close = new EventEmitter<void>();
  @Output() confirm = new EventEmitter<void>();
}
