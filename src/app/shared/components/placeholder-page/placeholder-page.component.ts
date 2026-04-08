import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PageHeaderComponent } from '../page-header/page-header.component';

@Component({
  selector: 'app-placeholder-page',
  standalone: true,
  imports: [CommonModule, PageHeaderComponent],
  templateUrl: './placeholder-page.component.html',
  styleUrl: './placeholder-page.component.css',
})
export class PlaceholderPageComponent {
  @Input() title = 'Feature Coming Soon';
  @Input() subtitle = 'This page is under development';

  tags = ['In Progress', 'Full CRUD', 'Responsive', 'Real-time Data'];

  goBack(): void {
    window.history.back();
  }
}
