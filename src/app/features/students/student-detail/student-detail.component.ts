import { Component } from '@angular/core';
import { PlaceholderPageComponent } from '../../../shared/components/placeholder-page/placeholder-page.component';

@Component({
  selector: 'app-student-detail',
  standalone: true,
  imports: [PlaceholderPageComponent],
  template: `
    <app-placeholder-page
      title="Student Profile"
      subtitle="View and edit student information and parent details"
    ></app-placeholder-page>
  `,
})
export class StudentDetailComponent {}
