import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ToolbarComponent } from '../toolbar/toolbar.component';
import { SidebarComponent } from '../sidebar/sidebar.component';

@Component({
  selector: 'app-shell',
  standalone: true,
  imports: [CommonModule, RouterModule, ToolbarComponent, SidebarComponent],
  template: `
    <div class="flex h-screen flex-col bg-gray-50">
      <!-- Toolbar -->
      <app-toolbar></app-toolbar>

      <!-- Main Content -->
      <div class="flex flex-1 overflow-hidden">
        <!-- Sidebar -->
        <app-sidebar></app-sidebar>

        <!-- Content Area -->
        <main class="flex-1 overflow-auto">
          <div class="container mx-auto max-w-7xl px-6 py-8">
            <router-outlet></router-outlet>
          </div>
        </main>
      </div>

      <!-- Footer -->
      <footer class="border-t border-gray-200 bg-white px-6 py-4 text-center text-sm text-gray-600">
        <p>KIT ERP v1.0.0 &#64; 2024</p>
      </footer>
    </div>
  `,
  styles: [],
})
export class ShellComponent {}
