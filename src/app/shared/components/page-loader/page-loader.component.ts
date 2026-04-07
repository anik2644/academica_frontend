import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { ShimmerBlockComponent } from '../shimmer-block/shimmer-block.component';

@Component({
  selector: 'app-page-loader',
  standalone: true,
  imports: [CommonModule, ShimmerBlockComponent],
  template: `
    <div class="rounded-[24px] border border-slate-200 bg-white/90 p-5 shadow-sm">
      <div class="flex items-center gap-3">
        <div class="relative flex h-11 w-11 items-center justify-center rounded-2xl bg-primary-50 text-primary-700">
          <div class="absolute inset-0 rounded-2xl border-2 border-primary-200"></div>
          <div class="h-5 w-5 animate-spin rounded-full border-2 border-primary-300 border-t-primary-700"></div>
        </div>
        <div>
          <div class="text-sm font-semibold text-slate-900">{{ title }}</div>
          <div class="mt-1 text-sm text-slate-500">{{ message }}</div>
        </div>
      </div>

      <div class="mt-5 space-y-3">
        <app-shimmer-block *ngFor="let block of blockHeights" [height]="block"></app-shimmer-block>
      </div>
    </div>
  `,
})
export class PageLoaderComponent {
  @Input() title = 'Loading data';
  @Input() message = 'Fetching live records from the backend.';
  @Input() blockHeights: number[] = [72, 72, 72];
}
