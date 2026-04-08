import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PageHeaderComponent } from '../../shared/components/page-header/page-header.component';
import { StatCardComponent } from './stat-card/stat-card.component';

interface DashboardStat {
  title: string;
  value: string | number;
  change?: number;
  icon: string;
  color: string;
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, PageHeaderComponent, StatCardComponent],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css',
})
export class DashboardComponent implements OnInit {
  stats: DashboardStat[] = [];

  ngOnInit(): void {
    this.loadStats();
  }

  private loadStats(): void {
    // Mock data - replace with API calls
    this.stats = [
      {
        title: 'Total Active Students',
        value: 1248,
        change: 12,
        icon: 'people',
        color: 'primary',
      },
      {
        title: 'Total Teachers',
        value: 87,
        change: 5,
        icon: 'person',
        color: 'accent',
      },
      {
        title: 'Current Academic Year',
        value: '2024-2025',
        icon: 'calendar',
        color: 'success',
      },
      {
        title: 'Pending Admissions',
        value: 34,
        change: -8,
        icon: 'assignment',
        color: 'warning',
      },
      {
        title: "Today's Attendance",
        value: '94.5%',
        change: 2.3,
        icon: 'event',
        color: 'success',
      },
      {
        title: 'Upcoming Exams',
        value: 12,
        icon: 'quiz',
        color: 'info',
      },
    ];
  }
}
