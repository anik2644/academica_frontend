import { Routes } from '@angular/router';
import { ShellComponent } from './layout/shell/shell.component';

export const routes: Routes = [
  {
    path: '',
    component: ShellComponent,
    children: [
      {
        path: 'dashboard',
        loadComponent: () => import('./features/dashboard/dashboard.component').then(m => m.DashboardComponent),
        data: { breadcrumb: 'Dashboard' }
      },
      {
        path: 'academic-years',
        loadComponent: () => import('./features/academic-years/academic-years.component').then(m => m.AcademicYearsComponent),
        data: { breadcrumb: 'Academic Years' }
      },
      {
        path: 'classes',
        loadComponent: () => import('./features/classes/classes.component').then(m => m.ClassesComponent),
        data: { breadcrumb: 'Classes' }
      },
      {
        path: 'sections',
        loadComponent: () => import('./features/sections/sections.component').then(m => m.SectionsComponent),
        data: { breadcrumb: 'Sections' }
      },
      {
        path: 'subjects',
        loadComponent: () => import('./features/subjects/subjects.component').then(m => m.SubjectsComponent),
        data: { breadcrumb: 'Subjects' }
      },
      {
        path: 'class-subjects',
        loadComponent: () => import('./features/class-subjects/class-subjects.component').then(m => m.ClassSubjectsComponent),
        data: { breadcrumb: 'Class Subjects' }
      },
      {
        path: 'teachers',
        loadComponent: () => import('./features/teachers/teachers-list/teachers-list.component').then(m => m.TeachersListComponent),
        data: { breadcrumb: 'Teachers' }
      },
      {
        path: 'teachers/:id',
        loadComponent: () => import('./features/teachers/teacher-detail/teacher-detail.component').then(m => m.TeacherDetailComponent),
        data: { breadcrumb: 'Teacher Detail' }
      },
      {
        path: 'students',
        loadComponent: () => import('./features/students/students-list/students-list.component').then(m => m.StudentsListComponent),
        data: { breadcrumb: 'Students' }
      },
      {
        path: 'students/:id',
        loadComponent: () => import('./features/students/student-detail/student-detail.component').then(m => m.StudentDetailComponent),
        data: { breadcrumb: 'Student Detail' }
      },
      {
        path: 'parents',
        loadComponent: () => import('./features/parents/parents.component').then(m => m.ParentsComponent),
        data: { breadcrumb: 'Parents' }
      },
      {
        path: 'parents/:id',
        loadComponent: () => import('./features/parents/parent-detail/parent-detail.component').then(m => m.ParentDetailComponent),
        data: { breadcrumb: 'Parent Detail' }
      },
      {
        path: 'admissions',
        loadComponent: () => import('./features/admissions/admissions-list/admissions-list.component').then(m => m.AdmissionsListComponent),
        data: { breadcrumb: 'Admissions' }
      },
      {
        path: 'admissions/new',
        loadComponent: () => import('./features/admissions/admission-form/admission-form.component').then(m => m.AdmissionFormComponent),
        data: { breadcrumb: 'New Admission' }
      },
      {
        path: 'admissions/:id',
        loadComponent: () => import('./features/admissions/admission-detail/admission-detail.component').then(m => m.AdmissionDetailComponent),
        data: { breadcrumb: 'Admission Detail' }
      },
      {
        path: 'enrollments',
        loadComponent: () => import('./features/enrollments/enrollments.component').then(m => m.EnrollmentsComponent),
        data: { breadcrumb: 'Enrollments' }
      },
      {
        path: 'promotions',
        loadComponent: () => import('./features/promotions/promotions.component').then(m => m.PromotionsComponent),
        data: { breadcrumb: 'Promotions' }
      },
      {
        path: 'attendance',
        loadComponent: () => import('./features/attendance/attendance.component').then(m => m.AttendanceComponent),
        data: { breadcrumb: 'Attendance' }
      },
      {
        path: 'attendance/leave-requests',
        loadComponent: () => import('./features/attendance/leave-requests/leave-requests.component').then(m => m.LeaveRequestsComponent),
        data: { breadcrumb: 'Leave Requests' }
      },
      {
        path: 'exams',
        loadComponent: () => import('./features/exams/exams-list/exams-list.component').then(m => m.ExamsListComponent),
        data: { breadcrumb: 'Exams' }
      },
      {
        path: 'exams/:id',
        loadComponent: () => import('./features/exams/exam-detail/exam-detail.component').then(m => m.ExamDetailComponent),
        data: { breadcrumb: 'Exam Detail' }
      },
      {
        path: 'section-teachers',
        loadComponent: () => import('./features/section-teachers/section-teachers.component').then(m => m.SectionTeachersComponent),
        data: { breadcrumb: 'Section Teachers' }
      },
      { path: '', redirectTo: '/dashboard', pathMatch: 'full' }
    ]
  },
  { path: '**', redirectTo: '/dashboard' }
];
