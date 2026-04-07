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
  template: `
    <section class="rounded-[30px] border border-slate-200 bg-white p-6 shadow-[0_30px_100px_-60px_rgba(15,23,42,0.5)] sm:p-8">
      <div class="flex items-center justify-between gap-4">
        <div>
          <a routerLink="/admissions" class="text-sm font-medium text-primary-700 hover:text-primary-800">Back to applications</a>
          <h1 class="mt-3 text-3xl font-semibold tracking-tight text-slate-950">New Admission</h1>
        </div>
      </div>

      <div *ngIf="loadErrorMessage" class="mt-6 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{{ loadErrorMessage }}</div>
      <div *ngIf="submitMessage" class="mt-6 rounded-2xl border px-4 py-3 text-sm" [ngClass]="submitError ? 'border-rose-200 bg-rose-50 text-rose-700' : 'border-emerald-200 bg-emerald-50 text-emerald-700'">{{ submitMessage }}</div>

      <div *ngIf="isLoading" class="mt-8 space-y-4">
        <app-shimmer-block *ngFor="let block of [1,2,3,4,5]" [height]="180"></app-shimmer-block>
      </div>

      <form *ngIf="!isLoading" [formGroup]="form" (ngSubmit)="submit()" class="mt-8 space-y-6">
        <section class="rounded-[24px] border border-slate-200 bg-slate-50/70 p-5">
          <h2 class="text-sm font-semibold uppercase tracking-[0.18em] text-slate-700">Application Setup</h2>
          <div class="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <label class="block">
              <span class="mb-2 block text-sm font-medium text-slate-700">Academic Year</span>
              <select formControlName="academicYearId" class="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm">
                <option value="">Select year</option>
                <option *ngFor="let year of academicYears" [value]="year.id">{{ year.label }}</option>
              </select>
            </label>
            <label class="block">
              <span class="mb-2 block text-sm font-medium text-slate-700">Applied Class</span>
              <select formControlName="appliedClassId" class="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm">
                <option value="">Select class</option>
                <option *ngFor="let item of classes" [value]="item.id">{{ item.label }}</option>
              </select>
            </label>
            <label class="block">
              <span class="mb-2 block text-sm font-medium text-slate-700">Application Date</span>
              <input formControlName="applicationDate" type="datetime-local" class="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm" />
            </label>
            <label class="block">
              <span class="mb-2 block text-sm font-medium text-slate-700">Last Transfer Certificate</span>
              <input formControlName="lastTransferCertificateNumber" type="text" class="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm" />
            </label>
          </div>
        </section>

        <section class="rounded-[24px] border border-slate-200 bg-white p-5">
          <h2 class="text-sm font-semibold uppercase tracking-[0.18em] text-slate-700">Student Information</h2>
          <div class="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <label *ngFor="let field of studentFields" class="block">
              <span class="mb-2 block text-sm font-medium text-slate-700">{{ field.label }}</span>
              <input *ngIf="field.type !== 'select' && field.type !== 'textarea'" [formControlName]="field.key" [type]="field.type" class="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm" />
              <select *ngIf="field.type === 'select'" [formControlName]="field.key" class="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm">
                <option value="">Select</option>
                <option *ngFor="let option of field.options" [value]="option">{{ option }}</option>
              </select>
              <textarea *ngIf="field.type === 'textarea'" [formControlName]="field.key" rows="3" class="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm"></textarea>
            </label>
          </div>
        </section>

        <section class="rounded-[24px] border border-slate-200 bg-white p-5">
          <h2 class="text-sm font-semibold uppercase tracking-[0.18em] text-slate-700">Father & Mother Information</h2>
          <div class="mt-4 grid gap-6 xl:grid-cols-2">
            <div class="grid gap-4 md:grid-cols-2">
              <label *ngFor="let field of fatherFields" class="block">
                <span class="mb-2 block text-sm font-medium text-slate-700">{{ field.label }}</span>
                <input [formControlName]="field.key" type="text" class="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm" />
              </label>
            </div>
            <div class="grid gap-4 md:grid-cols-2">
              <label *ngFor="let field of motherFields" class="block">
                <span class="mb-2 block text-sm font-medium text-slate-700">{{ field.label }}</span>
                <input [formControlName]="field.key" type="text" class="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm" />
              </label>
            </div>
          </div>
        </section>

        <section class="rounded-[24px] border border-slate-200 bg-white p-5">
          <h2 class="text-sm font-semibold uppercase tracking-[0.18em] text-slate-700">Guardian & Processing</h2>
          <div class="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <label class="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-700">
              <input formControlName="hasSeparateGuardian" type="checkbox" class="h-4 w-4 rounded border-slate-300" />
              Has Separate Guardian
            </label>
            <label *ngFor="let field of guardianFields" class="block">
              <span class="mb-2 block text-sm font-medium text-slate-700">{{ field.label }}</span>
              <input [formControlName]="field.key" type="text" class="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm" />
            </label>
            <label *ngFor="let field of processingFields" class="block">
              <span class="mb-2 block text-sm font-medium text-slate-700">{{ field.label }}</span>
              <select *ngIf="field.type === 'select'" [formControlName]="field.key" class="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm">
                <option value="">Select</option>
                <option *ngFor="let option of field.options" [value]="option">{{ option }}</option>
              </select>
              <input *ngIf="field.type !== 'select'" [formControlName]="field.key" type="text" class="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm" />
            </label>
          </div>
        </section>

        <div class="flex flex-wrap items-center justify-end gap-3">
          <a routerLink="/admissions" class="rounded-2xl border border-slate-200 px-4 py-3 text-sm font-medium text-slate-700 transition hover:border-primary-200 hover:text-primary-700">Cancel</a>
          <button type="submit" [disabled]="form.invalid || isSubmitting" class="rounded-2xl bg-primary-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-primary-700 disabled:cursor-not-allowed disabled:opacity-60">
            {{ isSubmitting ? 'Creating admission...' : 'Create admission' }}
          </button>
        </div>
      </form>
    </section>
  `,
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
