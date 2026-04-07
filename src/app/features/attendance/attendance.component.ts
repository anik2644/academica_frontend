import { Component } from '@angular/core';
import { PlaceholderPageComponent } from '../../shared/components/placeholder-page/placeholder-page.component';

@Component({
  selector: 'app-attendance',
  standalone: true,
  imports: [PlaceholderPageComponent],
  template: `
    <app-placeholder-page
      title="Daily Attendance"
      subtitle="Record student attendance with present, absent, late, and leave status"
    ></app-placeholder-page>
  `,
})
export class AttendanceComponent {}
