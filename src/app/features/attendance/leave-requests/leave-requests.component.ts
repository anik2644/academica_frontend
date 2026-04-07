import { Component } from '@angular/core';
import { PlaceholderPageComponent } from '../../../shared/components/placeholder-page/placeholder-page.component';

@Component({
  selector: 'app-leave-requests',
  standalone: true,
  imports: [PlaceholderPageComponent],
  template: `
    <app-placeholder-page
      title="Leave Requests"
      subtitle="Manage student leave requests and approvals"
    ></app-placeholder-page>
  `,
})
export class LeaveRequestsComponent {}
