import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PageHeaderComponent } from '../page-header/page-header.component';

@Component({
  selector: 'app-placeholder-page',
  standalone: true,
  imports: [CommonModule, PageHeaderComponent],
  template: `
    <div style="animation: fade-in-up 0.4s ease-out both">
      <app-page-header [title]="title" [subtitle]="subtitle"></app-page-header>

      <div class="relative overflow-hidden rounded-[24px] border border-slate-200 bg-gradient-to-br from-white via-white to-primary-50/30 px-8 py-16 text-center shadow-sm sm:px-12">

        <!-- Decorative background elements -->
        <div class="pointer-events-none absolute -right-16 -top-16 h-64 w-64 rounded-full bg-primary-100/30 blur-3xl"></div>
        <div class="pointer-events-none absolute -bottom-20 -left-20 h-56 w-56 rounded-full bg-accent-100/20 blur-3xl"></div>

        <!-- Animated icon -->
        <div class="relative mx-auto flex h-20 w-20 items-center justify-center"
             style="animation: float 3s ease-in-out infinite">
          <div class="absolute inset-0 rounded-[22px] bg-gradient-to-br from-primary-100 to-primary-50"></div>
          <div class="absolute inset-0 rounded-[22px] border border-primary-200/50"></div>
          <svg class="relative h-9 w-9 text-primary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
            <path stroke-linecap="round" stroke-linejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z" />
          </svg>
        </div>

        <h3 class="mt-6 text-xl font-semibold text-slate-900">Coming Soon</h3>
        <p class="mx-auto mt-3 max-w-md text-sm leading-relaxed text-slate-500">
          We're building something great here. This feature is under active development and will be available soon.
        </p>

        <!-- Feature hints -->
        <div class="mx-auto mt-8 flex max-w-sm flex-wrap justify-center gap-2">
          <span *ngFor="let tag of tags"
                class="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-medium text-slate-500 shadow-sm">
            {{ tag }}
          </span>
        </div>

        <div class="mt-8">
          <button class="btn btn-primary inline-flex items-center gap-2 rounded-xl px-6 py-2.5 shadow-md shadow-primary-600/20 transition-all hover:shadow-lg hover:shadow-primary-600/30" (click)="goBack()">
            <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
            </svg>
            Go Back
          </button>
        </div>
      </div>
    </div>
  `,
})
export class PlaceholderPageComponent {
  @Input() title = 'Feature Coming Soon';
  @Input() subtitle = 'This page is under development';

  tags = ['In Progress', 'Full CRUD', 'Responsive', 'Real-time Data'];

  goBack(): void {
    window.history.back();
  }
}
