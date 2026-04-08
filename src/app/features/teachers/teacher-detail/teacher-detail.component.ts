import { CommonModule, formatDate } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { forkJoin } from 'rxjs';
import { SchoolManagementApiService } from '../../../core/services/school-management-api.service';
import { NotificationService } from '../../../core/services/notification.service';
import { extractItem, extractList, getErrorMessage, readBoolean, readString } from '../../../core/utils/api-response.utils';
import { ShimmerBlockComponent } from '../../../shared/components/shimmer-block/shimmer-block.component';
import { FormModalComponent } from '../../../shared/components/form-modal/form-modal.component';

@Component({
  selector: 'app-teacher-detail',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, ShimmerBlockComponent, FormModalComponent],
  templateUrl: './teacher-detail.component.html',
  styleUrl: './teacher-detail.component.css',
})
export class TeacherDetailComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly api = inject(SchoolManagementApiService);
  private readonly notify = inject(NotificationService);

  readonly readString = readString;
  readonly readBoolean = readBoolean;

  isLoading = true;
  errorMessage = '';
  detail: Record<string, unknown> | null = null;
  academicQualifications: unknown[] = [];
  otherQualifications: unknown[] = [];
  title = 'Teacher Profile';
  photoUrl = '';
  private teacherId = '';

  showPhotoModal = false;
  photoFormUrl = '';
  photoUploading = false;
  private selectedPhotoFile: File | null = null;

  get initials(): string {
    const first = readString(this.detail, 'firstName')?.charAt(0) || '';
    const last = readString(this.detail, 'lastName')?.charAt(0) || '';
    return (first + last).toUpperCase() || '?';
  }

  ngOnInit(): void {
    this.teacherId = this.route.snapshot.paramMap.get('id') || '';
    if (!this.teacherId) {
      this.errorMessage = 'Teacher id is missing from the route.';
      this.isLoading = false;
      return;
    }

    forkJoin({
      detail: this.api.getTeacher(this.teacherId),
      academic: this.api.listTeacherAcademicQualifications(this.teacherId),
      other: this.api.listTeacherOtherQualifications(this.teacherId),
    }).subscribe({
      next: ({ detail, academic, other }) => {
        this.detail = extractItem<Record<string, unknown>>(detail);
        this.academicQualifications = extractList(academic);
        this.otherQualifications = extractList(other);
        this.title = this.fullName(this.detail);
        this.photoUrl = readString(this.detail, 'profilePhotoUrl', 'profile_photo_url')
          || readString(this.detail, 'profilePhotoBase64')
          || '';
        this.isLoading = false;
      },
      error: (error) => {
        this.errorMessage = getErrorMessage(error, 'Teacher details could not be loaded from the API.');
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
    this.api.updateTeacher(this.teacherId, {}, this.selectedPhotoFile || undefined).subscribe({
      next: (response) => {
        const updated = extractItem<Record<string, unknown>>(response);
        this.photoUrl = readString(updated, 'profilePhotoUrl') || readString(updated, 'profilePhotoBase64') || this.photoFormUrl;
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

  date(value: string): string {
    return value ? formatDate(value, 'MMM d, y', 'en-US') : 'Not provided';
  }

  get stats(): Array<{ label: string; value: string; detail: string }> {
    if (!this.detail) return [];
    return [
      { label: 'Teacher ID', value: readString(this.detail, 'teacherId') || 'N/A', detail: 'Unique teacher reference.' },
      { label: 'Department', value: readString(this.detail, 'department') || 'N/A', detail: 'Primary department assignment.' },
      { label: 'Designation', value: readString(this.detail, 'designation') || 'N/A', detail: 'Current role title.' },
      { label: 'Join Date', value: this.date(readString(this.detail, 'joinDate')), detail: 'Employment start date.' },
    ];
  }

  get profileSections(): Array<{ title: string; items: Array<{ label: string; value: string }> }> {
    if (!this.detail) return [];
    return [
      {
        title: 'Personal Information',
        items: [
          { label: 'Full Name', value: this.fullName(this.detail) },
          { label: 'Gender', value: this.value('gender') },
          { label: 'Date of Birth', value: this.date(readString(this.detail, 'dateOfBirth')) },
          { label: 'Blood Type', value: this.value('bloodType') },
          { label: 'Religion', value: this.value('religion') },
          { label: 'Nationality', value: this.value('nationality') },
        ],
      },
      {
        title: 'Employment',
        items: [
          { label: 'Employment Type', value: this.value('employmentType') },
          { label: 'Specialization', value: this.value('specialization') },
          { label: 'Previous Experience', value: this.value('previousExperienceYears') },
          { label: 'Additional Notes', value: this.value('additionalNotes') },
          { label: 'Created', value: this.dateTime(readString(this.detail, 'createdAt')) },
          { label: 'Updated', value: this.dateTime(readString(this.detail, 'updatedAt')) },
        ],
      },
      {
        title: 'Contact',
        items: [
          { label: 'Email', value: this.value('email') },
          { label: 'Phone Primary', value: this.value('phonePrimary') },
          { label: 'Phone Secondary', value: this.value('phoneSecondary') },
          { label: 'Present Address', value: this.value('presentAddress') },
          { label: 'Permanent Address', value: this.value('permanentAddress') },
        ],
      },
      {
        title: 'Verification',
        items: [
          { label: 'NID Number', value: this.value('nidNumber') },
          { label: 'Passport Number', value: this.value('passportNumber') },
        ],
      },
    ];
  }

  private fullName(source: unknown): string {
    return [readString(source, 'firstName'), readString(source, 'middleName'), readString(source, 'lastName')].filter(Boolean).join(' ') || 'Teacher profile';
  }

  private value(key: string): string {
    return readString(this.detail, key) || 'Not provided';
  }

  private dateTime(value: string): string {
    return value ? formatDate(value, 'MMM d, y, h:mm a', 'en-US') : 'Not provided';
  }
}
