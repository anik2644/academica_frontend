import { Component } from '@angular/core';
import { PlaceholderPageComponent } from '../../../shared/components/placeholder-page/placeholder-page.component';

@Component({
  selector: 'app-admissions-list',
  standalone: true,
  imports: [PlaceholderPageComponent],
  template: `
    <app-placeholder-page
      title="Admissions"
      subtitle="Manage student admission applications and documents"
    ></app-placeholder-page>
  `,
})
export class AdmissionsListComponent {}
