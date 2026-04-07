import { Component } from '@angular/core';
import { PlaceholderPageComponent } from '../../shared/components/placeholder-page/placeholder-page.component';

@Component({
  selector: 'app-enrollments',
  standalone: true,
  imports: [PlaceholderPageComponent],
  template: `
    <app-placeholder-page
      title="Enrollments"
      subtitle="Manage student enrollments in sections and academic years"
    ></app-placeholder-page>
  `,
})
export class EnrollmentsComponent {}
