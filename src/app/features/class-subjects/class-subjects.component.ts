import { Component } from '@angular/core';
import { PlaceholderPageComponent } from '../../shared/components/placeholder-page/placeholder-page.component';

@Component({
  selector: 'app-class-subjects',
  standalone: true,
  imports: [PlaceholderPageComponent],
  template: `
    <app-placeholder-page
      title="Class Subjects"
      subtitle="Manage subjects assigned to classes"
    ></app-placeholder-page>
  `,
})
export class ClassSubjectsComponent {}
