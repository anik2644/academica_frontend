import { CommonModule, formatDate } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { forkJoin } from 'rxjs';
import { SchoolManagementApiService } from '../../../core/services/school-management-api.service';
import { NotificationService } from '../../../core/services/notification.service';
import { extractItem, extractList, getErrorMessage, normalizeImageSource, readString } from '../../../core/utils/api-response.utils';
import { ShimmerBlockComponent } from '../../../shared/components/shimmer-block/shimmer-block.component';
import { FormModalComponent } from '../../../shared/components/form-modal/form-modal.component';

@Component({
  selector: 'app-student-detail',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, ShimmerBlockComponent, FormModalComponent],
  templateUrl: './student-detail.component.html',
  styleUrl: './student-detail.component.css',
})
export class StudentDetailComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly api = inject(SchoolManagementApiService);
  private readonly notify = inject(NotificationService);

  readonly readString = readString;

  isLoading = true;
  errorMessage = '';
  detail: Record<string, unknown> | null = null;
  title = 'Student Profile';
  photoUrl = '';
  studentParents: Array<{ name: string; relationship: string; email: string; phone: string }> = [];
  enrollments: Array<{ academicYear: string; sectionId: string; rollNumber: string; status: string }> = [];
  private academicYearMap = new Map<string, string>();
  private studentId = '';

  showPhotoModal = false;
  photoFormUrl = '';
  photoUploading = false;
  photoPreviewError = false;
  private selectedPhotoFile: File | null = null;

  get initials(): string {
    const first = readString(this.detail, 'firstName')?.charAt(0) || '';
    const last = readString(this.detail, 'lastName')?.charAt(0) || '';
    return (first + last).toUpperCase() || '?';
  }

  ngOnInit(): void {
    this.studentId = this.route.snapshot.paramMap.get('id') || '';
    if (!this.studentId) {
      this.errorMessage = 'Student id is missing from the route.';
      this.isLoading = false;
      return;
    }

    forkJoin({
      detail: this.api.getStudent(this.studentId),
      parents: this.api.listStudentParents(this.studentId),
      enrollments: this.api.listEnrollments(),
      years: this.api.listAcademicYears(),
    }).subscribe({
      next: ({ detail, parents, enrollments, years }) => {
        this.detail = extractItem<Record<string, unknown>>(detail);
        this.title = this.fullName(this.detail);
        this.photoUrl = normalizeImageSource(
          readString(this.detail, 'profilePhotoUrl', 'profile_photo_url', 'photoUrl', 'photo_url')
            || readString(this.detail, 'profilePhotoBase64', 'profile_photo_base64', 'photoBase64', 'photo_base64')
            || ''
        );
        this.studentParents = extractList<unknown>(parents).map((item) => ({
          name: [readString(item, 'parentFirstName'), readString(item, 'parentLastName')].filter(Boolean).join(' '),
          relationship: readString(item, 'relationshipToStudent'),
          email: readString(item, 'parentEmail'),
          phone: readString(item, 'parentPhonePrimary'),
        }));
        this.academicYearMap = new Map(extractList<unknown>(years).map((item) => [readString(item, 'id'), readString(item, 'label')]));
        this.enrollments = extractList<unknown>(enrollments)
          .filter((item) => readString(item, 'studentId') === this.studentId)
          .map((item) => ({
            academicYear: this.academicYearMap.get(readString(item, 'academicYearId')) || readString(item, 'academicYearId'),
            sectionId: readString(item, 'sectionId'),
            rollNumber: readString(item, 'rollNumber'),
            status: readString(item, 'status'),
          }));
        this.isLoading = false;
      },
      error: (error) => {
        this.errorMessage = getErrorMessage(error, 'Student details could not be loaded from the API.');
        this.isLoading = false;
      },
    });
  }

  openPhotoModal(): void {
    this.photoFormUrl = this.photoUrl;
    this.photoPreviewError = false;
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
    this.api.updateStudent(this.studentId, {}, this.selectedPhotoFile || undefined).subscribe({
      next: (response) => {
        const updated = extractItem<Record<string, unknown>>(response);
        this.photoUrl = normalizeImageSource(
          readString(updated, 'profilePhotoUrl', 'profile_photo_url', 'photoUrl', 'photo_url')
            || readString(updated, 'profilePhotoBase64', 'profile_photo_base64', 'photoBase64', 'photo_base64')
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
      { label: 'Student ID', value: readString(this.detail, 'studentId') || 'N/A', detail: 'Primary student identifier.' },
      { label: 'Birth Date', value: this.date(readString(this.detail, 'dateOfBirth')), detail: 'Student birth date.' },
      { label: 'Blood Type', value: readString(this.detail, 'bloodType') || 'N/A', detail: 'Medical reference field.' },
      { label: 'Guardians', value: String(this.studentParents.length), detail: 'Linked parent or guardian records.' },
    ];
  }

  get profileSections(): Array<{ title: string; items: Array<{ label: string; value: string }> }> {
    if (!this.detail) return [];
    return [
      {
        title: 'Identity',
        items: [
          { label: 'Full Name', value: this.fullName(this.detail) },
          { label: 'Nick Name', value: this.value('nickName') },
          { label: 'Gender', value: this.value('gender') },
          { label: 'Nationality', value: this.value('nationality') },
          { label: 'Religion', value: this.value('religion') },
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
          { label: 'National ID', value: this.value('nationalId') },
          { label: 'Birth Certificate ID', value: this.value('birthCertificateId') },
          { label: 'Passport Number', value: this.value('passportNumber') },
          { label: 'Admission Status', value: this.value('admissionStatus') },
        ],
      },
      {
        title: 'Timeline',
        items: [
          { label: 'Created', value: this.dateTime(readString(this.detail, 'createdAt')) },
          { label: 'Updated', value: this.dateTime(readString(this.detail, 'updatedAt')) },
          { label: 'Additional Notes', value: this.value('additionalNotes') },
        ],
      },
    ];
  }

  private fullName(source: unknown): string {
    return [readString(source, 'firstName'), readString(source, 'middleName'), readString(source, 'lastName')].filter(Boolean).join(' ') || 'Student profile';
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
