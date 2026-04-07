import { Component } from '@angular/core';
import { PlaceholderPageComponent } from '../../../shared/components/placeholder-page/placeholder-page.component';

@Component({
  selector: 'app-admission-form',
  standalone: true,
  imports: [PlaceholderPageComponent],
  template: `
    <app-placeholder-page
      title="New Admission"
      subtitle="Create a new student admission application with multi-step form"
    ></app-placeholder-page>
  `,
})
export class AdmissionFormComponent {}
