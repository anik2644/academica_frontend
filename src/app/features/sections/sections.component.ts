import { Component } from '@angular/core';
import { PlaceholderPageComponent } from '../../shared/components/placeholder-page/placeholder-page.component';

@Component({
  selector: 'app-sections',
  standalone: true,
  imports: [PlaceholderPageComponent],
  template: `
    <app-placeholder-page
      title="Sections"
      subtitle="Manage class sections and assignments"
    ></app-placeholder-page>
  `,
})
export class SectionsComponent {}
