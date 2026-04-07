import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

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
      [ngClass]="{
        'fixed left-0 top-16 z-40 h-[calc(100vh-64px)] bg-white border-r border-gray-200 transition-all duration-300': true,
        'w-64': !isCollapsed(),
        'w-16': isCollapsed(),
      }"
    >
      <nav class="space-y-6 px-4 py-6">
        <div *ngFor="let group of navGroups" class="space-y-2">
          <h3
            *ngIf="!isCollapsed()"
            class="text-xs font-semibold uppercase tracking-wider text-gray-500"
          >
            {{ group.title }}
          </h3>
          <div
            *ngFor="let item of group.items"
            class="space-y-1"
            [title]="isCollapsed() ? item.label : ''"
          >
            <a
              [routerLink]="item.route"
              routerLinkActive="bg-primary-50 text-primary-600 border-l-2 border-primary-600"
              [routerLinkActiveOptions]="{ exact: false }"
              class="group flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 hover:text-gray-900"
            >
              <svg class="h-5 w-5 flex-shrink-0">
                <use [attr.xlink:href]="'#' + item.icon"></use>
              </svg>
              <span *ngIf="!isCollapsed()" class="truncate">{{ item.label }}</span>
            </a>
          </div>
        </div>
      </nav>
    </aside>

    <!-- SVG Icons (hidden) -->
    <svg style="display: none">
      <defs>
        <!-- Dashboard icon -->
        <symbol id="dashboard" viewBox="0 0 24 24" fill="currentColor">
          <path d="M3 13h2v8H3zm4-8h2v16H7zm4-2h2v18h-2zm4 4h2v14h-2zm4-2h2v16h-2z"/>
        </symbol>
        <!-- School icon -->
        <symbol id="school" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 3L1 9v2h1v9a1 1 0 001 1h18a1 1 0 001-1v-9h1V9L12 3zm0 2.18l8 4.59v12.23H4V9.77l8-4.59z"/>
        </symbol>
        <!-- Person icon -->
        <symbol id="person" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
        </symbol>
        <!-- People icon -->
        <symbol id="people" viewBox="0 0 24 24" fill="currentColor">
          <path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z"/>
        </symbol>
        <!-- Class icon -->
        <symbol id="class" viewBox="0 0 24 24" fill="currentColor">
          <path d="M16 2H4c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8l-6-6zm4 18H4V4h9v5h7v11z"/>
        </symbol>
        <!-- Quiz icon -->
        <symbol id="quiz" viewBox="0 0 24 24" fill="currentColor">
          <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-5 9.5c0 .83-.67 1.5-1.5 1.5S11 13.33 11 12.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5zm5-2c0 .83-.67 1.5-1.5 1.5s-1.5-.67-1.5-1.5.67-1.5 1.5-1.5 1.5.67 1.5 1.5zm-2.5 5.5c0 .83-.67 1.5-1.5 1.5s-1.5-.67-1.5-1.5.67-1.5 1.5-1.5 1.5.67 1.5 1.5zm5-2c0 .83-.67 1.5-1.5 1.5s-1.5-.67-1.5-1.5.67-1.5 1.5-1.5 1.5.67 1.5 1.5z"/>
        </symbol>
        <!-- Event icon -->
        <symbol id="event" viewBox="0 0 24 24" fill="currentColor">
          <path d="M19 3h-1V1h-2v2H8V1H6v2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V8h14v11z"/>
        </symbol>
        <!-- Assignment icon -->
        <symbol id="assignment" viewBox="0 0 24 24" fill="currentColor">
          <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-5 9.5c0 .83-.67 1.5-1.5 1.5s-1.5-.67-1.5-1.5.67-1.5 1.5-1.5 1.5.67 1.5 1.5zM6 6h12v1.5H6z"/>
        </symbol>
      </defs>
    </svg>
  `,
  styles: [],
})
export class SidebarComponent {
  isCollapsed = signal(false);

  navGroups: NavGroup[] = [
    {
      title: 'Overview',
      icon: 'dashboard',
      items: [{ label: 'Dashboard', route: '/dashboard', icon: 'dashboard' }],
    },
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
      items: [
        { label: 'Applications', route: '/admissions', icon: 'assignment' },
      ],
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

  toggleCollapse(): void {
    this.isCollapsed.update((value) => !value);
  }
}
