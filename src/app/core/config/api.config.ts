import { environment } from '../../../environments/environment';

export const API_CONFIG = {
  apiBaseUrl: environment.apiBaseUrl,
} as const;

export const API_ENDPOINTS = {
  academicYears: {
    root: '/academic-years',
    byId: (id: number | string) => `/academic-years/${id}`,
    current: '/academic-years/current',
    setCurrent: (id: number | string) => `/academic-years/${id}/set-current`,
  },
  classes: {
    root: '/classes',
    byId: (id: number | string) => `/classes/${id}`,
  },
  classSubjects: {
    root: '/class-subjects',
    byId: (id: number | string) => `/class-subjects/${id}`,
  },
  sections: {
    root: '/sections',
    byId: (id: number | string) => `/sections/${id}`,
    assignTeacher: (id: number | string) => `/sections/${id}/assign-teacher`,
  },
  subjects: {
    root: '/subjects',
    byId: (id: number | string) => `/subjects/${id}`,
  },
  admissions: {
    root: '/admissions',
    byId: (id: number | string) => `/admissions/${id}`,
    updateStatus: (id: number | string) => `/admissions/${id}/status`,
    updatePayment: (id: number | string) => `/admissions/${id}/payment`,
    approve: (id: number | string) => `/admissions/${id}/approve`,
    documents: (applicationId: number | string) =>
      `/admissions/${applicationId}/documents`,
    documentById: (applicationId: number | string, docId: number | string) =>
      `/admissions/${applicationId}/documents/${docId}`,
    verifyDocument: (applicationId: number | string, docId: number | string) =>
      `/admissions/${applicationId}/documents/${docId}/verify`,
    fees: (applicationId: number | string) => `/admissions/${applicationId}/fees`,
    refundFee: (applicationId: number | string, feeId: number | string) =>
      `/admissions/${applicationId}/fees/${feeId}/refund`,
    previousAcademics: (applicationId: number | string) =>
      `/admissions/${applicationId}/previous-academics`,
    previousAcademicById: (applicationId: number | string, id: number | string) =>
      `/admissions/${applicationId}/previous-academics/${id}`,
  },
  attendance: {
    root: '/attendance',
    bulk: '/attendance/bulk',
    byId: (id: number | string) => `/attendance/${id}`,
    bySection: (sectionId: number | string) => `/attendance/section/${sectionId}`,
    leaveRequests: '/attendance/leave-requests',
    reviewLeaveRequest: (id: number | string) =>
      `/attendance/leave-requests/${id}/review`,
  },
  enrollments: {
    root: '/enrollments',
    byId: (id: number | string) => `/enrollments/${id}`,
    transfer: (id: number | string) => `/enrollments/${id}/transfer`,
  },
  promotions: {
    root: '/promotions',
    assign: (id: number | string) => `/promotions/${id}/assign`,
  },
  exams: {
    root: '/exams',
    byId: (id: number | string) => `/exams/${id}`,
    publishResults: (id: number | string) => `/exams/${id}/publish-results`,
    results: (examId: number | string) => `/exams/${examId}/results`,
    bulkResults: (examId: number | string) => `/exams/${examId}/results/bulk`,
    schedules: (examId: number | string) => `/exams/${examId}/schedules`,
    scheduleById: (examId: number | string, scheduleId: number | string) =>
      `/exams/${examId}/schedules/${scheduleId}`,
  },
  parents: {
    root: '/parents',
    byId: (id: number | string) => `/parents/${id}`,
  },
  students: {
    root: '/students',
    byId: (id: number | string) => `/students/${id}`,
    deactivate: (id: number | string) => `/students/${id}/deactivate`,
    parents: (studentId: number | string) => `/students/${studentId}/parents`,
    studentParentById: (
      studentId: number | string,
      studentParentId: number | string
    ) => `/students/${studentId}/parents/${studentParentId}`,
  },
  teachers: {
    root: '/teachers',
    byId: (id: number | string) => `/teachers/${id}`,
    deactivate: (id: number | string) => `/teachers/${id}/deactivate`,
    academicQualifications: (teacherId: number | string) =>
      `/teachers/${teacherId}/academic-qualifications`,
    academicQualificationById: (
      teacherId: number | string,
      id: number | string
    ) => `/teachers/${teacherId}/academic-qualifications/${id}`,
    otherQualifications: (teacherId: number | string) =>
      `/teachers/${teacherId}/other-qualifications`,
    otherQualificationById: (teacherId: number | string, id: number | string) =>
      `/teachers/${teacherId}/other-qualifications/${id}`,
  },
  sectionTeachers: {
    root: '/section-teachers',
    deactivate: (id: number | string) => `/section-teachers/${id}/deactivate`,
  },
} as const;
