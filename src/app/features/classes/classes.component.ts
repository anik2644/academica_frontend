import { Component } from '@angular/core';
import { PlaceholderPageComponent } from '../../shared/components/placeholder-page/placeholder-page.component';

@Component({
  selector: 'app-classes',
  standalone: true,
  imports: [PlaceholderPageComponent],
  template: `
    <app-placeholder-page
      title="Classes"
      subtitle="Manage school classes and their details"
    ></app-placeholder-page>
  `,
})
export class ClassesComponent {}
