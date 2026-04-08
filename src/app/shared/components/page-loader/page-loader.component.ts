import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { ShimmerBlockComponent } from '../shimmer-block/shimmer-block.component';

@Component({
  selector: 'app-page-loader',
  standalone: true,
  imports: [CommonModule, ShimmerBlockComponent],
  templateUrl: './page-loader.component.html',
  styleUrl: './page-loader.component.css',
})
export class PageLoaderComponent {
  @Input() title = 'Loading data';
  @Input() message = 'Fetching live records from the backend.';
  @Input() blockHeights: number[] = [72, 72, 72];
}
