import { Component } from '@angular/core';
import { PlaceholderPageComponent } from '../../shared/components/placeholder-page/placeholder-page.component';

@Component({
  selector: 'app-section-teachers',
  standalone: true,
  imports: [PlaceholderPageComponent],
  template: `
    <app-placeholder-page
      title="Section Teachers"
      subtitle="Assign teachers to sections and subjects"
    ></app-placeholder-page>
  `,
})
export class SectionTeachersComponent {}
