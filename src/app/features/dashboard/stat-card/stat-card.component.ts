import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-stat-card',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="card p-6">
      <div class="flex items-center justify-between">
        <div>
          <p class="text-sm font-medium text-gray-600">{{ title }}</p>
          <p class="mt-2 text-3xl font-bold text-gray-900">{{ value }}</p>
          <div *ngIf="change !== undefined" class="mt-2 flex items-center gap-1">
            <svg
              *ngIf="change >= 0"
              class="h-4 w-4 text-green-600"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
            </svg>
            <svg
              *ngIf="change < 0"
              class="h-4 w-4 text-red-600"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 17H7m6 0v8m0 0l-8-8-4 4-6-6" />
            </svg>
            <span [class]="change >= 0 ? 'text-green-600' : 'text-red-600'" class="text-sm font-medium">
              {{ change >= 0 ? '+' : '' }}{{ change }}%
            </span>
            <span class="text-xs text-gray-600">vs last month</span>
          </div>
        </div>
        <div [class]="'flex h-12 w-12 items-center justify-center rounded-lg ' + getColorClasses()">
          <svg class="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
            <!-- People icon -->
            <path
              *ngIf="icon === 'people'"
              d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z"
            />
            <!-- Person icon -->
            <path
              *ngIf="icon === 'person'"
              d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"
            />
            <!-- Calendar icon -->
            <path
              *ngIf="icon === 'calendar'"
              d="M19 3h-1V1h-2v2H8V1H6v2H5c-1.11 0-1.99.9-1.99 2L3 19c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V8h14v11z"
            />
            <!-- Assignment icon -->
            <path
              *ngIf="icon === 'assignment'"
              d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-5 9.5c0 .83-.67 1.5-1.5 1.5s-1.5-.67-1.5-1.5.67-1.5 1.5-1.5 1.5.67 1.5 1.5zM6 6h12v1.5H6z"
            />
            <!-- Event icon -->
            <path
              *ngIf="icon === 'event'"
              d="M19 3h-1V1h-2v2H8V1H6v2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V8h14v11z"
            />
            <!-- Quiz icon -->
            <path
              *ngIf="icon === 'quiz'"
              d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-5 9.5c0 .83-.67 1.5-1.5 1.5s-1.5-.67-1.5-1.5.67-1.5 1.5-1.5 1.5.67 1.5 1.5z"
            />
          </svg>
        </div>
      </div>
    </div>
  `,
  styles: [],
})
export class StatCardComponent {
  @Input() title = '';
  @Input() value: string | number = 0;
  @Input() change?: number;
  @Input() icon = 'people';
  @Input() color = 'primary';

  getColorClasses(): string {
    const colorMap: Record<string, string> = {
      primary: 'bg-primary-100 text-primary-600',
      accent: 'bg-accent-100 text-accent-600',
      success: 'bg-green-100 text-green-600',
      warning: 'bg-amber-100 text-amber-600',
      info: 'bg-blue-100 text-blue-600',
      danger: 'bg-red-100 text-red-600',
    };

    return colorMap[this.color] || colorMap['primary'];
  }
}
