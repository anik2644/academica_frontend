import { Component } from '@angular/core';
import { PlaceholderPageComponent } from '../../../shared/components/placeholder-page/placeholder-page.component';

@Component({
  selector: 'app-exam-detail',
  standalone: true,
  imports: [PlaceholderPageComponent],
  template: `
    <app-placeholder-page
      title="Exam Details"
      subtitle="View and manage exam schedules and results"
    ></app-placeholder-page>
  `,
})
export class ExamDetailComponent {}
