import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-shimmer-block',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div
      class="relative overflow-hidden rounded-2xl"
      [ngClass]="variant === 'dark' ? 'bg-slate-200/70' : 'bg-gradient-to-br from-slate-100 to-slate-50'"
      [style.height.px]="height"
      [style.width]="width"
      [style.border-radius.px]="radius"
      [style.animation-delay]="delay + 'ms'"
      style="animation: pulse-soft 2s ease-in-out infinite"
    >
      <div
        class="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/80 to-transparent"
        style="animation: shimmer 2s ease-in-out infinite"
        [style.animation-delay]="delay + 'ms'"
      ></div>
    </div>
  `,
})
export class ShimmerBlockComponent {
  @Input() height = 80;
  @Input() width = '100%';
  @Input() radius = 16;
  @Input() delay = 0;
  @Input() variant: 'light' | 'dark' = 'light';
}
