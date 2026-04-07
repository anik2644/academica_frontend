import { Component } from '@angular/core';
import { PlaceholderPageComponent } from '../../../shared/components/placeholder-page/placeholder-page.component';

@Component({
  selector: 'app-teacher-detail',
  standalone: true,
  imports: [PlaceholderPageComponent],
  template: `
    <app-placeholder-page
      title="Teacher Profile"
      subtitle="View and edit teacher information, qualifications, and section assignments"
    ></app-placeholder-page>
  `,
})
export class TeacherDetailComponent {}
