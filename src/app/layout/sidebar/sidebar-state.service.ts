import { Injectable, signal } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class SidebarStateService {
  readonly isCollapsed = signal(false);
  readonly openGroups = signal<Record<string, boolean>>({
    'Academic Core': true,
    'People Management': true,
    Admissions: false,
    Enrollment: false,
    Attendance: false,
    Exams: false,
  });

  toggleSidebar(): void {
    this.isCollapsed.update((value) => !value);
  }

  setSidebarCollapsed(collapsed: boolean): void {
    this.isCollapsed.set(collapsed);
  }

  isGroupOpen(groupTitle: string): boolean {
    return this.openGroups()[groupTitle] ?? false;
  }

  toggleGroup(groupTitle: string): void {
    this.openGroups.update((groups) => ({
      ...groups,
      [groupTitle]: !groups[groupTitle],
    }));
  }

  openGroup(groupTitle: string): void {
    this.openGroups.update((groups) => ({
      ...groups,
      [groupTitle]: true,
    }));
  }
}
