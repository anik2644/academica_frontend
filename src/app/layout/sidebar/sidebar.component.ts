import { CommonModule } from '@angular/common';
import { Component, computed, inject } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { SidebarStateService } from './sidebar-state.service';

interface NavGroup {
  title: string;
  icon: string;
  items: NavItem[];
}

interface NavItem {
  label: string;
  route: string;
  icon?: string;
}

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <aside
      class="sticky top-16 hidden h-[calc(100vh-64px)] overflow-y-auto border-r border-slate-200 bg-white/90 shadow-[20px_0_80px_-60px_rgba(15,23,42,0.45)] backdrop-blur md:block"
      [class.w-72]="!isCollapsed()"
      [class.w-20]="isCollapsed()"
    >
      <div class="flex min-h-full flex-col">
        <nav class="flex-1 space-y-3 overflow-y-auto px-3 py-4">
          <section
            *ngFor="let group of navGroups"
            class="overflow-hidden rounded-2xl border border-slate-200/80 bg-slate-50/80"
          >
            <button
              type="button"
              (click)="toggleGroup(group.title)"
              class="flex w-full items-center gap-3 px-3 py-3 text-left transition hover:bg-white"
              [class.justify-center]="isCollapsed()"
              [attr.aria-label]="group.title"
            >
              <span
                class="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-white text-slate-600 shadow-sm ring-1 ring-slate-200"
                [class.bg-primary-50]="isGroupActive(group)"
                [class.text-primary-700]="isGroupActive(group)"
              >
                <svg class="h-5 w-5">
                  <use [attr.xlink:href]="'#' + group.icon"></use>
                </svg>
              </span>

              <div *ngIf="!isCollapsed()" class="min-w-0 flex-1">
                <div class="truncate text-sm font-semibold text-slate-900">
                  {{ group.title }}
                </div>
                <div class="truncate text-xs text-slate-500">
                  {{ group.items.length }} page{{ group.items.length === 1 ? '' : 's' }}
                </div>
              </div>

              <svg
                *ngIf="!isCollapsed()"
                class="h-4 w-4 shrink-0 text-slate-400 transition"
                [class.rotate-180]="isGroupOpen(group.title)"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            </button>

            <div
              *ngIf="!isCollapsed() && isGroupOpen(group.title)"
              class="space-y-1 border-t border-slate-200/80 bg-white px-2 py-2"
            >
              <a
                *ngFor="let item of group.items"
                [routerLink]="item.route"
                routerLinkActive="bg-primary-600 text-white shadow-[0_12px_24px_-16px_rgba(21,101,192,0.8)]"
                [routerLinkActiveOptions]="{ exact: false }"
                class="group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-100 hover:text-slate-900"
              >
                <svg class="h-4 w-4 shrink-0 opacity-80">
                  <use [attr.xlink:href]="'#' + item.icon"></use>
                </svg>
                <span class="truncate">{{ item.label }}</span>
              </a>
            </div>
          </section>

          <div *ngIf="isCollapsed()" class="space-y-2">
            <a
              *ngFor="let item of collapsedItems()"
              [routerLink]="item.route"
              routerLinkActive="bg-primary-600 text-white shadow-[0_12px_24px_-16px_rgba(21,101,192,0.8)]"
              [routerLinkActiveOptions]="{ exact: false }"
              class="flex items-center justify-center rounded-2xl border border-slate-200 bg-white p-3 text-slate-600 transition hover:border-primary-200 hover:bg-primary-50 hover:text-primary-700"
              [attr.title]="item.label"
            >
              <svg class="h-5 w-5">
                <use [attr.xlink:href]="'#' + item.icon"></use>
              </svg>
            </a>
          </div>
        </nav>
      </div>
    </aside>

    <svg style="display: none">
      <defs>
        <symbol id="dashboard" viewBox="0 0 24 24" fill="currentColor">
          <path d="M3 13h2v8H3zm4-8h2v16H7zm4-2h2v18h-2zm4 4h2v14h-2zm4-2h2v16h-2z"/>
        </symbol>
        <symbol id="school" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 3L1 9v2h1v9a1 1 0 001 1h18a1 1 0 001-1v-9h1V9L12 3zm0 2.18l8 4.59v12.23H4V9.77l8-4.59z"/>
        </symbol>
        <symbol id="person" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
        </symbol>
        <symbol id="people" viewBox="0 0 24 24" fill="currentColor">
          <path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z"/>
        </symbol>
        <symbol id="class" viewBox="0 0 24 24" fill="currentColor">
          <path d="M16 2H4c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8l-6-6zm4 18H4V4h9v5h7v11z"/>
        </symbol>
        <symbol id="quiz" viewBox="0 0 24 24" fill="currentColor">
          <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-5 9.5c0 .83-.67 1.5-1.5 1.5S11 13.33 11 12.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5zm5-2c0 .83-.67 1.5-1.5 1.5s-1.5-.67-1.5-1.5.67-1.5 1.5-1.5 1.5.67 1.5 1.5zm-2.5 5.5c0 .83-.67 1.5-1.5 1.5s-1.5-.67-1.5-1.5.67-1.5 1.5-1.5 1.5.67 1.5 1.5zm5-2c0 .83-.67 1.5-1.5 1.5s-1.5-.67-1.5-1.5.67-1.5 1.5-1.5 1.5.67 1.5 1.5z"/>
        </symbol>
        <symbol id="event" viewBox="0 0 24 24" fill="currentColor">
          <path d="M19 3h-1V1h-2v2H8V1H6v2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V8h14v11z"/>
        </symbol>
        <symbol id="assignment" viewBox="0 0 24 24" fill="currentColor">
          <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-5 9.5c0 .83-.67 1.5-1.5 1.5s-1.5-.67-1.5-1.5.67-1.5 1.5-1.5 1.5.67 1.5 1.5zM6 6h12v1.5H6z"/>
        </symbol>
      </defs>
    </svg>
  `,
})
export class SidebarComponent {
  private readonly router = inject(Router);
  private readonly sidebarState = inject(SidebarStateService);

  readonly isCollapsed = this.sidebarState.isCollapsed;
  readonly collapsedItems = computed(() => this.navGroups.map((group) => group.items[0]));

  readonly navGroups: NavGroup[] = [
    {
      title: 'Academic Core',
      icon: 'school',
      items: [
        { label: 'Academic Years', route: '/academic-years', icon: 'school' },
        { label: 'Classes', route: '/classes', icon: 'class' },
        { label: 'Sections', route: '/sections', icon: 'class' },
        { label: 'Subjects', route: '/subjects', icon: 'school' },
        { label: 'Class Subjects', route: '/class-subjects', icon: 'school' },
      ],
    },
    {
      title: 'People Management',
      icon: 'person',
      items: [
        { label: 'Teachers', route: '/teachers', icon: 'person' },
        { label: 'Students', route: '/students', icon: 'people' },
        { label: 'Parents', route: '/parents', icon: 'person' },
      ],
    },
    {
      title: 'Admissions',
      icon: 'assignment',
      items: [{ label: 'Applications', route: '/admissions', icon: 'assignment' }],
    },
    {
      title: 'Enrollment',
      icon: 'class',
      items: [
        { label: 'Enrollments', route: '/enrollments', icon: 'class' },
        { label: 'Promotions', route: '/promotions', icon: 'class' },
      ],
    },
    {
      title: 'Attendance',
      icon: 'event',
      items: [
        { label: 'Daily Attendance', route: '/attendance', icon: 'event' },
        { label: 'Leave Requests', route: '/attendance/leave-requests', icon: 'event' },
      ],
    },
    {
      title: 'Exams',
      icon: 'quiz',
      items: [
        { label: 'Exam List', route: '/exams', icon: 'quiz' },
        { label: 'Section Teachers', route: '/section-teachers', icon: 'person' },
      ],
    },
  ];
  toggleGroup(groupTitle: string): void {
    if (this.isCollapsed()) {
      this.sidebarState.setSidebarCollapsed(false);
      this.sidebarState.openGroup(groupTitle);
      return;
    }

    this.sidebarState.toggleGroup(groupTitle);
  }

  isGroupOpen(groupTitle: string): boolean {
    return this.sidebarState.isGroupOpen(groupTitle);
  }

  isGroupActive(group: NavGroup): boolean {
    return group.items.some((item) => this.router.url.startsWith(item.route));
  }
}
