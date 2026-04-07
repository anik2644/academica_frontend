import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { RouterModule } from '@angular/router';
import { BreadcrumbComponent } from '../../shared/components/breadcrumb/breadcrumb.component';
import { SidebarStateService } from '../sidebar/sidebar-state.service';

@Component({
  selector: 'app-toolbar',
  standalone: true,
  imports: [CommonModule, RouterModule, BreadcrumbComponent],
  template: `
    <header class="sticky top-0 z-50 border-b border-slate-200 bg-white/90 backdrop-blur">
      <div class="flex h-16 items-center gap-4 px-4 sm:px-6">
        <button
          type="button"
          (click)="toggleSidebar()"
          class="hidden rounded-2xl border border-slate-200 bg-slate-50 p-2.5 text-slate-600 transition hover:border-primary-200 hover:bg-primary-50 hover:text-primary-700 md:inline-flex"
          [attr.aria-label]="isCollapsed() ? 'Expand sidebar' : 'Collapse sidebar'"
        >
          <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M4 6h16M4 12h16M4 18h10"
            />
          </svg>
        </button>

        <a
          routerLink="/dashboard"
          class="flex items-center gap-3 rounded-2xl px-1 py-1 transition hover:bg-slate-100"
        >
          <div class="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-primary-600 to-accent-600 text-white shadow-[0_12px_30px_-18px_rgba(21,101,192,0.9)]">
            <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4"
              />
            </svg>
          </div>
          <div>
            <h1 class="text-base font-semibold tracking-tight text-slate-900 sm:text-lg">
              KIT ERP
            </h1>
            <p class="text-xs text-slate-500">School operations workspace</p>
          </div>
        </a>

        <div class="hidden flex-1 justify-center xl:flex">
          <app-breadcrumb></app-breadcrumb>
        </div>

        <div class="ml-auto flex items-center gap-2 sm:gap-3">
          <button
            type="button"
            class="relative rounded-2xl border border-slate-200 bg-white p-2.5 text-slate-600 transition hover:border-primary-200 hover:bg-primary-50 hover:text-primary-700"
          >
            <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
              />
            </svg>
            <span class="absolute right-2 top-2 inline-flex h-2.5 w-2.5 rounded-full bg-rose-500"></span>
          </button>

          <button
            type="button"
            class="inline-flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-3 py-2 text-left transition hover:border-primary-200 hover:bg-primary-50"
          >
            <span class="hidden sm:block">
              <span class="block text-sm font-medium text-slate-900">Admin User</span>
              <span class="block text-xs text-slate-500">System administrator</span>
            </span>
            <span class="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-primary-600 to-accent-600 text-white">
              <svg class="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fill-rule="evenodd"
                  d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z"
                  clip-rule="evenodd"
                />
              </svg>
            </span>
          </button>
        </div>
      </div>
    </header>
  `,
})
export class ToolbarComponent {
  private readonly sidebarState = inject(SidebarStateService);

  readonly isCollapsed = this.sidebarState.isCollapsed;

  toggleSidebar(): void {
    this.sidebarState.toggleSidebar();
  }
}
