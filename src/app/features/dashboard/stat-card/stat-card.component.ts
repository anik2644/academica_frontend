import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-stat-card',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './stat-card.component.html',
  styleUrl: './stat-card.component.css',
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
