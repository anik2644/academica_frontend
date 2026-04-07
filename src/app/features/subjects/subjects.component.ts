import { Component } from '@angular/core';
import { PlaceholderPageComponent } from '../../shared/components/placeholder-page/placeholder-page.component';

@Component({
  selector: 'app-subjects',
  standalone: true,
  imports: [PlaceholderPageComponent],
  template: `
    <app-placeholder-page
      title="Subjects"
      subtitle="Manage school subjects and their details"
    ></app-placeholder-page>
  `,
})
export class SubjectsComponent {}
