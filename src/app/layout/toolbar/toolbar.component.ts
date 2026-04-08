import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { RouterModule } from '@angular/router';
import { BreadcrumbComponent } from '../../shared/components/breadcrumb/breadcrumb.component';
import { SidebarStateService } from '../sidebar/sidebar-state.service';

@Component({
  selector: 'app-toolbar',
  standalone: true,
  imports: [CommonModule, RouterModule, BreadcrumbComponent],
  templateUrl: './toolbar.component.html',
  styleUrl: './toolbar.component.css',
})
export class ToolbarComponent {
  private readonly sidebarState = inject(SidebarStateService);

  readonly isCollapsed = this.sidebarState.isCollapsed;

  toggleSidebar(): void {
    this.sidebarState.toggleSidebar();
  }
}
