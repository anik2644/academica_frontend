import { Component } from '@angular/core';
import { PlaceholderPageComponent } from '../../shared/components/placeholder-page/placeholder-page.component';

@Component({
  selector: 'app-academic-years',
  standalone: true,
  imports: [PlaceholderPageComponent],
  template: `
    <app-placeholder-page
      title="Academic Years"
      subtitle="Manage academic years and set the current active year"
    ></app-placeholder-page>
  `,
})
export class AcademicYearsComponent {}
