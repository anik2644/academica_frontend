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
  templateUrl: './sidebar.component.html',
  styleUrl: './sidebar.component.css',
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
