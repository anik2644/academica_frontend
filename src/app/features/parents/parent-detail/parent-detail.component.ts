import { Component } from '@angular/core';
import { PlaceholderPageComponent } from '../../../shared/components/placeholder-page/placeholder-page.component';

@Component({
  selector: 'app-parent-detail',
  standalone: true,
  imports: [PlaceholderPageComponent],
  template: `
    <app-placeholder-page
      title="Parent Profile"
      subtitle="View and edit parent information"
    ></app-placeholder-page>
  `,
})
export class ParentDetailComponent {}
