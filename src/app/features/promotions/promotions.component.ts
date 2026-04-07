import { Component } from '@angular/core';
import { PlaceholderPageComponent } from '../../shared/components/placeholder-page/placeholder-page.component';

@Component({
  selector: 'app-promotions',
  standalone: true,
  imports: [PlaceholderPageComponent],
  template: `
    <app-placeholder-page
      title="Promotions"
      subtitle="Manage student promotions, repeats, transfers, and graduations"
    ></app-placeholder-page>
  `,
})
export class PromotionsComponent {}
