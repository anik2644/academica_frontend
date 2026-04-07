import { Component } from '@angular/core';
import { PlaceholderPageComponent } from '../../../shared/components/placeholder-page/placeholder-page.component';

@Component({
  selector: 'app-students-list',
  standalone: true,
  imports: [PlaceholderPageComponent],
  template: `
    <app-placeholder-page
      title="Students"
      subtitle="Manage student profiles and information"
    ></app-placeholder-page>
  `,
})
export class StudentsListComponent {}
