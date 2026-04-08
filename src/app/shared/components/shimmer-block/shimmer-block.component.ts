import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-shimmer-block',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './shimmer-block.component.html',
  styleUrl: './shimmer-block.component.css',
})
export class ShimmerBlockComponent {
  @Input() height = 80;
  @Input() width = '100%';
  @Input() radius = 16;
  @Input() delay = 0;
  @Input() variant: 'light' | 'dark' = 'light';
}
