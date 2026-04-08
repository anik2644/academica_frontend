import { CommonModule, formatDate } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { SchoolManagementApiService } from '../../../core/services/school-management-api.service';
import { NotificationService } from '../../../core/services/notification.service';
import { extractItem, getErrorMessage, normalizeImageSource, readString } from '../../../core/utils/api-response.utils';
import { ShimmerBlockComponent } from '../../../shared/components/shimmer-block/shimmer-block.component';
import { FormModalComponent } from '../../../shared/components/form-modal/form-modal.component';

@Component({
  selector: 'app-parent-detail',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, ShimmerBlockComponent, FormModalComponent],
  templateUrl: './parent-detail.component.html',
  styleUrl: './parent-detail.component.css',
})
export class ParentDetailComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly api = inject(SchoolManagementApiService);
  private readonly notify = inject(NotificationService);

  readonly readString = readString;

  isLoading = true;
  errorMessage = '';
  detail: Record<string, unknown> | null = null;
  title = 'Parent Profile';
  photoUrl = '';
  private parentId = '';

  showPhotoModal = false;
  photoFormUrl = '';
  photoUploading = false;
  selectedPhotoFile: File | null = null;

  get initials(): string {
    const first = readString(this.detail, 'firstName')?.charAt(0) || '';
    const last = readString(this.detail, 'lastName')?.charAt(0) || '';
    return (first + last).toUpperCase() || '?';
  }

  ngOnInit(): void {
    this.parentId = this.route.snapshot.paramMap.get('id') || '';
    if (!this.parentId) {
      this.errorMessage = 'Parent id is missing from the route.';
      this.isLoading = false;
      return;
    }

    this.api.getParent(this.parentId).subscribe({
      next: (response) => {
        this.detail = extractItem<Record<string, unknown>>(response);
        this.title = this.fullName(this.detail);
        this.photoUrl = normalizeImageSource(
          readString(this.detail, 'photoUrl', 'photo_url', 'profilePhotoUrl', 'profile_photo_url')
            || readString(this.detail, 'photoBase64', 'photo_base64', 'profilePhotoBase64', 'profile_photo_base64')
            || ''
        );
        this.isLoading = false;
      },
      error: (error) => {
        this.errorMessage = getErrorMessage(error, 'Parent details could not be loaded from the API.');
        this.isLoading = false;
      },
    });
  }

  openPhotoModal(): void {
    this.photoFormUrl = this.photoUrl;
    this.selectedPhotoFile = null;
    this.showPhotoModal = true;
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      this.notify.warning('File size must be under 2MB.');
      return;
    }
    this.selectedPhotoFile = file;
    const reader = new FileReader();
    reader.onload = () => {
      this.photoFormUrl = reader.result as string;
    };
    reader.readAsDataURL(file);
  }

  savePhoto(): void {
    if (!this.selectedPhotoFile && !this.photoFormUrl) {
      this.notify.warning('Please select or upload a photo.');
      return;
    }
    this.photoUploading = true;
    this.api.updateParent(this.parentId, {}, this.selectedPhotoFile || undefined).subscribe({
      next: (response) => {
        const updated = extractItem<Record<string, unknown>>(response);
        this.photoUrl = normalizeImageSource(
          readString(updated, 'photoUrl', 'photo_url', 'profilePhotoUrl', 'profile_photo_url')
            || readString(updated, 'photoBase64', 'photo_base64', 'profilePhotoBase64', 'profile_photo_base64')
            || this.photoFormUrl
        );
        this.showPhotoModal = false;
        this.photoUploading = false;
        this.selectedPhotoFile = null;
        this.notify.success('Profile photo updated.');
      },
      error: (error) => {
        this.notify.error(getErrorMessage(error, 'Failed to update photo.'));
        this.photoUploading = false;
      },
    });
  }

  get stats(): Array<{ label: string; value: string; detail: string }> {
    if (!this.detail) return [];
    return [
      { label: 'Primary Phone', value: readString(this.detail, 'phonePrimary') || 'N/A', detail: 'Main guardian contact number.' },
      { label: 'Email', value: readString(this.detail, 'email') || 'N/A', detail: 'Primary guardian email address.' },
      { label: 'NID', value: readString(this.detail, 'nidNumber') || 'N/A', detail: 'Identity reference returned by backend.' },
      { label: 'Created', value: this.date(readString(this.detail, 'createdAt')), detail: 'Record creation date.' },
    ];
  }

  get sections(): Array<{ title: string; items: Array<{ label: string; value: string }> }> {
    if (!this.detail) return [];
    return [
      {
        title: 'Personal Information',
        items: [
          { label: 'Full Name', value: this.fullName(this.detail) },
          { label: 'Gender', value: this.value('gender') },
          { label: 'Date of Birth', value: this.date(readString(this.detail, 'dateOfBirth')) },
          { label: 'Nationality', value: this.value('nationality') },
          { label: 'Religion', value: this.value('religion') },
          { label: 'Marital Status', value: this.value('maritalStatus') },
        ],
      },
      {
        title: 'Contact & Address',
        items: [
          { label: 'Phone Primary', value: this.value('phonePrimary') },
          { label: 'Phone Secondary', value: this.value('phoneSecondary') },
          { label: 'Email', value: this.value('email') },
          { label: 'Present Address', value: this.value('presentAddress') },
          { label: 'Permanent Address', value: this.value('permanentAddress') },
        ],
      },
      {
        title: 'Professional & Identity',
        items: [
          { label: 'Employer Name', value: this.value('employerName') },
          { label: 'Employer Contact', value: this.value('employerContact') },
          { label: 'Monthly Income', value: this.value('monthlyIncome') },
          { label: 'NID Number', value: this.value('nidNumber') },
          { label: 'Passport Number', value: this.value('passportNumber') },
        ],
      },
      {
        title: 'Timeline',
        items: [
          { label: 'Created', value: this.dateTime(readString(this.detail, 'createdAt')) },
          { label: 'Updated', value: this.dateTime(readString(this.detail, 'updatedAt')) },
        ],
      },
    ];
  }

  private fullName(source: unknown): string {
    return [readString(source, 'firstName'), readString(source, 'middleName'), readString(source, 'lastName')].filter(Boolean).join(' ') || 'Parent profile';
  }

  private value(key: string): string {
    return readString(this.detail, key) || 'Not provided';
  }

  private date(value: string): string {
    return value ? formatDate(value, 'MMM d, y', 'en-US') : 'Not provided';
  }

  private dateTime(value: string): string {
    return value ? formatDate(value, 'MMM d, y, h:mm a', 'en-US') : 'Not provided';
  }
}
