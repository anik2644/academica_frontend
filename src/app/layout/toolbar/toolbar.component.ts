import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BreadcrumbComponent } from '../../shared/components/breadcrumb/breadcrumb.component';

@Component({
  selector: 'app-toolbar',
  standalone: true,
  imports: [CommonModule, BreadcrumbComponent],
  template: `
    <header class="sticky top-0 z-50 border-b border-gray-200 bg-white">
      <div class="flex h-16 items-center gap-4 px-6">
        <!-- App Name -->
        <div class="flex items-center gap-2">
          <svg class="h-8 w-8 text-primary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
          </svg>
          <h1 class="text-xl font-bold text-gray-900">KIT ERP</h1>
        </div>

        <!-- Spacer -->
        <div class="flex-1"></div>

        <!-- Breadcrumb -->
        <div class="hidden md:flex">
          <app-breadcrumb></app-breadcrumb>
        </div>

        <!-- Spacer -->
        <div class="flex-1"></div>

        <!-- Notification Bell -->
        <button class="relative rounded-full p-2 text-gray-600 hover:bg-gray-100 hover:text-gray-900">
          <svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
          </svg>
          <span class="absolute right-2 top-1 inline-flex h-3 w-3 rounded-full bg-red-600"></span>
        </button>

        <!-- User Menu -->
        <button class="rounded-full bg-gradient-to-br from-primary-600 to-accent-600 p-2 text-white hover:from-primary-700 hover:to-accent-700">
          <svg class="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
            <path fill-rule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clip-rule="evenodd" />
          </svg>
        </button>
      </div>
    </header>
  `,
  styles: [],
})
export class ToolbarComponent {}
