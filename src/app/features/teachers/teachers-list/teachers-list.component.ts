import { Component } from '@angular/core';
import { PlaceholderPageComponent } from '../../../shared/components/placeholder-page/placeholder-page.component';

@Component({
  selector: 'app-teachers-list',
  standalone: true,
  imports: [PlaceholderPageComponent],
  template: `
    <app-placeholder-page
      title="Teachers"
      subtitle="Manage teacher profiles, qualifications, and assignments"
    ></app-placeholder-page>
  `,
})
export class TeachersListComponent {}
