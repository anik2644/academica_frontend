import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ToolbarComponent } from '../toolbar/toolbar.component';
import { SidebarComponent } from '../sidebar/sidebar.component';
import { ToastContainerComponent } from '../../shared/components/toast-container/toast-container.component';

@Component({
  selector: 'app-shell',
  standalone: true,
  imports: [CommonModule, RouterModule, ToolbarComponent, SidebarComponent, ToastContainerComponent],
  template: `
    <div class="flex h-screen flex-col bg-gray-50">
      <app-toolbar></app-toolbar>
      <div class="flex flex-1 overflow-hidden">
        <app-sidebar></app-sidebar>
        <main class="flex-1 overflow-auto">
          <div class="container mx-auto max-w-7xl px-6 py-8">
            <router-outlet></router-outlet>
          </div>
        </main>
      </div>
    </div>
    <app-toast-container></app-toast-container>
  `,
})
export class ShellComponent {}
