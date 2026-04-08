import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

export type BadgeType =
  | 'active'
  | 'inactive'
  | 'approved'
  | 'rejected'
  | 'pending'
  | 'present'
  | 'absent'
  | 'late'
  | 'leave'
  | 'holiday'
  | 'published'
  | 'draft'
  | 'submitted'
  | 'under_review'
  | 'withdrawn'
  | 'unpaid'
  | 'partial'
  | 'paid'
  | 'refunded'
  | 'promoted'
  | 'repeated'
  | 'transferred'
  | 'graduated'
  | string;

@Component({
  selector: 'app-status-badge',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './status-badge.component.html',
  styleUrl: './status-badge.component.css',
})
export class StatusBadgeComponent {
  @Input() status: BadgeType = 'pending';

  getBadgeClasses(): string {
    const baseClasses = 'badge inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium';

    const colorMap: Record<BadgeType, string> = {
      active: 'bg-green-100 text-green-800',
      inactive: 'bg-red-100 text-red-800',
      approved: 'bg-green-100 text-green-800',
      rejected: 'bg-red-100 text-red-800',
      pending: 'bg-amber-100 text-amber-800',
      present: 'bg-green-100 text-green-800',
      absent: 'bg-red-100 text-red-800',
      late: 'bg-amber-100 text-amber-800',
      leave: 'bg-blue-100 text-blue-800',
      holiday: 'bg-purple-100 text-purple-800',
      published: 'bg-green-100 text-green-800',
      draft: 'bg-gray-100 text-gray-800',
      submitted: 'bg-blue-100 text-blue-800',
      under_review: 'bg-blue-100 text-blue-800',
      withdrawn: 'bg-gray-100 text-gray-800',
      unpaid: 'bg-red-100 text-red-800',
      partial: 'bg-amber-100 text-amber-800',
      paid: 'bg-green-100 text-green-800',
      refunded: 'bg-blue-100 text-blue-800',
      promoted: 'bg-green-100 text-green-800',
      repeated: 'bg-amber-100 text-amber-800',
      transferred: 'bg-blue-100 text-blue-800',
      graduated: 'bg-purple-100 text-purple-800',
    };

    return `${baseClasses} ${colorMap[this.status] || 'bg-gray-100 text-gray-800'}`;
  }
}
