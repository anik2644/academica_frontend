import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-shimmer-block',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div
      class="relative overflow-hidden rounded-2xl bg-slate-100"
      [style.height.px]="height"
    >
      <div class="absolute inset-0 -translate-x-full animate-[shimmer_1.8s_infinite] bg-gradient-to-r from-transparent via-white/70 to-transparent"></div>
    </div>
  `,
})
export class ShimmerBlockComponent {
  @Input() height = 80;
}
