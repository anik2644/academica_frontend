import { Component } from '@angular/core';
import { PlaceholderPageComponent } from '../../../shared/components/placeholder-page/placeholder-page.component';

@Component({
  selector: 'app-admission-detail',
  standalone: true,
  imports: [PlaceholderPageComponent],
  template: `
    <app-placeholder-page
      title="Admission Details"
      subtitle="View and manage admission application status, documents, and fees"
    ></app-placeholder-page>
  `,
})
export class AdmissionDetailComponent {}
