import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { forkJoin } from 'rxjs';
import { SchoolManagementApiService } from '../../../core/services/school-management-api.service';
import { extractItem, extractList, getErrorMessage, readString } from '../../../core/utils/api-response.utils';
import { ShimmerBlockComponent } from '../../../shared/components/shimmer-block/shimmer-block.component';

@Component({
  selector: 'app-admission-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule, ShimmerBlockComponent],
  templateUrl: './admission-form.component.html',
  styleUrl: './admission-form.component.css',
})
export class AdmissionFormComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly api = inject(SchoolManagementApiService);
  private readonly router = inject(Router);

  isLoading = true;
  isSubmitting = false;
  submitError = false;
  loadErrorMessage = '';
  submitMessage = '';

  academicYears: Array<{ id: string; label: string }> = [];
  classes: Array<{ id: string; label: string }> = [];

  readonly form = this.fb.group({
    academicYearId: ['', Validators.required],
    appliedClassId: ['', Validators.required],
    applicationDate: ['', Validators.required],
    lastTransferCertificateNumber: [''],
    firstName: ['', Validators.required],
    middleName: [''],
    lastName: ['', Validators.required],
    nickName: [''],
    dateOfBirth: ['', Validators.required],
    gender: ['male'],
    bloodType: [''],
    religion: [''],
    nationality: [''],
    nationalId: [''],
    birthCertificateId: [''],
    passportNumber: [''],
    email: [''],
    phonePrimary: [''],
    phoneSecondary: [''],
    presentAddress: [''],
    permanentAddress: [''],
    additionalNotes: [''],
    fatherFirstName: [''],
    fatherMiddleName: [''],
    fatherLastName: [''],
    fatherPhonePrimary: [''],
    fatherEmail: [''],
    fatherProfession: [''],
    fatherEmployerName: [''],
    motherFirstName: [''],
    motherMiddleName: [''],
    motherLastName: [''],
    motherPhonePrimary: [''],
    motherEmail: [''],
    motherProfession: [''],
    motherEmployerName: [''],
    hasSeparateGuardian: [false],
    guardianFirstName: [''],
    guardianLastName: [''],
    guardianRelation: [''],
    guardianPhonePrimary: [''],
    guardianEmail: [''],
    emergencyContactName: [''],
    emergencyContactRelation: [''],
    emergencyContactPhone: [''],
    applicationStatus: ['submitted'],
    paymentStatus: ['unpaid'],
    confirmationStatus: ['pending'],
    examStatus: ['pending'],
    notes: [''],
  });

  readonly studentFields = [
    { key: 'firstName', label: 'First Name', type: 'text' },
    { key: 'middleName', label: 'Middle Name', type: 'text' },
    { key: 'lastName', label: 'Last Name', type: 'text' },
    { key: 'nickName', label: 'Nick Name', type: 'text' },
    { key: 'dateOfBirth', label: 'Date of Birth', type: 'date' },
    { key: 'gender', label: 'Gender', type: 'select', options: ['male', 'female', 'other'] },
    { key: 'bloodType', label: 'Blood Type', type: 'text' },
    { key: 'religion', label: 'Religion', type: 'text' },
    { key: 'nationality', label: 'Nationality', type: 'text' },
    { key: 'nationalId', label: 'National ID', type: 'text' },
    { key: 'birthCertificateId', label: 'Birth Certificate ID', type: 'text' },
    { key: 'passportNumber', label: 'Passport Number', type: 'text' },
    { key: 'email', label: 'Email', type: 'email' },
    { key: 'phonePrimary', label: 'Phone Primary', type: 'text' },
    { key: 'phoneSecondary', label: 'Phone Secondary', type: 'text' },
    { key: 'presentAddress', label: 'Present Address', type: 'text' },
    { key: 'permanentAddress', label: 'Permanent Address', type: 'text' },
    { key: 'additionalNotes', label: 'Additional Notes', type: 'textarea' },
  ];

  readonly fatherFields = [
    { key: 'fatherFirstName', label: 'Father First Name' },
    { key: 'fatherMiddleName', label: 'Father Middle Name' },
    { key: 'fatherLastName', label: 'Father Last Name' },
    { key: 'fatherPhonePrimary', label: 'Father Phone' },
    { key: 'fatherEmail', label: 'Father Email' },
    { key: 'fatherProfession', label: 'Father Profession' },
    { key: 'fatherEmployerName', label: 'Father Employer' },
  ];

  readonly motherFields = [
    { key: 'motherFirstName', label: 'Mother First Name' },
    { key: 'motherMiddleName', label: 'Mother Middle Name' },
    { key: 'motherLastName', label: 'Mother Last Name' },
    { key: 'motherPhonePrimary', label: 'Mother Phone' },
    { key: 'motherEmail', label: 'Mother Email' },
    { key: 'motherProfession', label: 'Mother Profession' },
    { key: 'motherEmployerName', label: 'Mother Employer' },
  ];

  readonly guardianFields = [
    { key: 'guardianFirstName', label: 'Guardian First Name' },
    { key: 'guardianLastName', label: 'Guardian Last Name' },
    { key: 'guardianRelation', label: 'Guardian Relation' },
    { key: 'guardianPhonePrimary', label: 'Guardian Phone' },
    { key: 'guardianEmail', label: 'Guardian Email' },
    { key: 'emergencyContactName', label: 'Emergency Contact Name' },
    { key: 'emergencyContactRelation', label: 'Emergency Contact Relation' },
    { key: 'emergencyContactPhone', label: 'Emergency Contact Phone' },
  ];

  readonly processingFields = [
    { key: 'applicationStatus', label: 'Application Status', type: 'select', options: ['submitted', 'under_review', 'approved', 'rejected'] },
    { key: 'paymentStatus', label: 'Payment Status', type: 'select', options: ['unpaid', 'partial', 'paid'] },
    { key: 'confirmationStatus', label: 'Confirmation Status', type: 'select', options: ['pending', 'confirmed', 'rejected'] },
    { key: 'examStatus', label: 'Exam Status', type: 'select', options: ['pending', 'passed', 'failed'] },
    { key: 'notes', label: 'Internal Notes', type: 'text' },
  ];

  ngOnInit(): void {
    forkJoin({
      years: this.api.listAcademicYears(),
      classes: this.api.listClasses(),
    }).subscribe({
      next: ({ years, classes }) => {
        this.academicYears = extractList<unknown>(years).map((item) => ({
          id: readString(item, 'id'),
          label: readString(item, 'label'),
        }));
        this.classes = extractList<unknown>(classes).map((item) => ({
          id: readString(item, 'id'),
          label: readString(item, 'name'),
        }));
        this.form.patchValue({
          academicYearId: this.academicYears[0]?.id ?? '',
          appliedClassId: this.classes[0]?.id ?? '',
          applicationDate: this.defaultApplicationDate(),
        });
        this.isLoading = false;
      },
      error: (error) => {
        this.loadErrorMessage = getErrorMessage(error, 'Admission form metadata could not be loaded from the API.');
        this.isLoading = false;
      },
    });
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.isSubmitting = true;
    this.submitError = false;
    this.submitMessage = '';

    this.api.createAdmission(this.form.getRawValue()).subscribe({
      next: (response) => {
        const created = extractItem<Record<string, unknown>>(response);
        this.submitMessage = 'Admission created successfully.';
        this.isSubmitting = false;
        const createdId = created ? readString(created, 'id') : '';
        if (createdId) {
          this.router.navigate(['/admissions', createdId]);
        }
      },
      error: (error) => {
        this.submitError = true;
        this.submitMessage = getErrorMessage(error, 'Admission could not be created.');
        this.isSubmitting = false;
      },
    });
  }

  private defaultApplicationDate(): string {
    const now = new Date();
    const pad = (value: number) => String(value).padStart(2, '0');
    return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}T${pad(now.getHours())}:${pad(now.getMinutes())}`;
  }
}
