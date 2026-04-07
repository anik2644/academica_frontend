import { Component } from '@angular/core';
import { PlaceholderPageComponent } from '../../shared/components/placeholder-page/placeholder-page.component';

@Component({
  selector: 'app-parents',
  standalone: true,
  imports: [PlaceholderPageComponent],
  template: `
    <app-placeholder-page
      title="Parents"
      subtitle="Manage parent and guardian information"
    ></app-placeholder-page>
  `,
})
export class ParentsComponent {}
