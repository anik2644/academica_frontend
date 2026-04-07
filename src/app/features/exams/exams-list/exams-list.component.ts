import { Component } from '@angular/core';
import { PlaceholderPageComponent } from '../../../shared/components/placeholder-page/placeholder-page.component';

@Component({
  selector: 'app-exams-list',
  standalone: true,
  imports: [PlaceholderPageComponent],
  template: `
    <app-placeholder-page
      title="Exams"
      subtitle="Manage exams, schedules, and results"
    ></app-placeholder-page>
  `,
})
export class ExamsListComponent {}
