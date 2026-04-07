import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-loading-spinner',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div
      *ngIf="isLoading"
      class="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50"
    >
      <div class="flex flex-col items-center">
        <div
          class="h-16 w-16 animate-spin rounded-full border-4 border-gray-300 border-t-primary-600"
        ></div>
        <p class="mt-4 text-white">{{ message }}</p>
      </div>
    </div>
  `,
  styles: [],
})
export class LoadingSpinnerComponent {
  @Input() isLoading = false;
  @Input() message = 'Loading...';
}
