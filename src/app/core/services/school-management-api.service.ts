import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { API_ENDPOINTS } from '../config/api.config';
import {
  AcademicQualification,
  AcademicYear,
  Admission,
  AdmissionDocument,
  AdmissionFee,
  ApiItemResult,
  ApiListResult,
  ApiMutationPayload,
  ApiQueryParams,
  Attendance,
  Class,
  ClassSubject,
  Enrollment,
  Exam,
  ExamResult,
  ExamSchedule,
  LeaveRequest,
  OtherQualification,
  Parent,
  PreviousAcademic,
  Promotion,
  Section,
  SectionTeacher,
  Student,
  StudentParent,
  Subject,
  Teacher,
} from '../models';
import { ApiService } from './api.service';

@Injectable({
  providedIn: 'root',
})
export class SchoolManagementApiService {
  constructor(private api: ApiService) {}

  get swaggerUrl(): string {
    return API_ENDPOINTS.swagger;
  }

  listAcademicYears(params?: ApiQueryParams): Observable<ApiListResult<AcademicYear>> {
    return this.api.get(API_ENDPOINTS.academicYears.root, params);
  }

  getAcademicYear(id: number | string): Observable<ApiItemResult<AcademicYear>> {
    return this.api.get(API_ENDPOINTS.academicYears.byId(id));
  }

  createAcademicYear(
    payload: ApiMutationPayload<AcademicYear>
  ): Observable<ApiItemResult<AcademicYear>> {
    return this.api.post(API_ENDPOINTS.academicYears.root, payload);
  }

  updateAcademicYear(
    id: number | string,
    payload: ApiMutationPayload<AcademicYear>
  ): Observable<ApiItemResult<AcademicYear>> {
    return this.api.put(API_ENDPOINTS.academicYears.byId(id), payload);
  }

  deleteAcademicYear(id: number | string): Observable<ApiItemResult<unknown>> {
    return this.api.delete(API_ENDPOINTS.academicYears.byId(id));
  }

  setCurrentAcademicYear(id: number | string): Observable<ApiItemResult<AcademicYear>> {
    return this.api.patch(API_ENDPOINTS.academicYears.setCurrent(id));
  }

  getCurrentAcademicYear(): Observable<ApiItemResult<AcademicYear>> {
    return this.api.get(API_ENDPOINTS.academicYears.current);
  }

  listClasses(params?: ApiQueryParams): Observable<ApiListResult<Class>> {
    return this.api.get(API_ENDPOINTS.classes.root, params);
  }

  getClass(id: number | string): Observable<ApiItemResult<Class>> {
    return this.api.get(API_ENDPOINTS.classes.byId(id));
  }

  createClass(payload: ApiMutationPayload<Class>): Observable<ApiItemResult<Class>> {
    return this.api.post(API_ENDPOINTS.classes.root, payload);
  }

  updateClass(
    id: number | string,
    payload: ApiMutationPayload<Class>
  ): Observable<ApiItemResult<Class>> {
    return this.api.put(API_ENDPOINTS.classes.byId(id), payload);
  }

  deleteClass(id: number | string): Observable<ApiItemResult<unknown>> {
    return this.api.delete(API_ENDPOINTS.classes.byId(id));
  }

  listClassSubjects(params?: ApiQueryParams): Observable<ApiListResult<ClassSubject>> {
    return this.api.get(API_ENDPOINTS.classSubjects.root, params);
  }

  getClassSubject(id: number | string): Observable<ApiItemResult<ClassSubject>> {
    return this.api.get(API_ENDPOINTS.classSubjects.byId(id));
  }

  createClassSubject(
    payload: ApiMutationPayload<ClassSubject>
  ): Observable<ApiItemResult<ClassSubject>> {
    return this.api.post(API_ENDPOINTS.classSubjects.root, payload);
  }

  updateClassSubject(
    id: number | string,
    payload: ApiMutationPayload<ClassSubject>
  ): Observable<ApiItemResult<ClassSubject>> {
    return this.api.put(API_ENDPOINTS.classSubjects.byId(id), payload);
  }

  deleteClassSubject(id: number | string): Observable<ApiItemResult<unknown>> {
    return this.api.delete(API_ENDPOINTS.classSubjects.byId(id));
  }

  listSections(params?: ApiQueryParams): Observable<ApiListResult<Section>> {
    return this.api.get(API_ENDPOINTS.sections.root, params);
  }

  getSection(id: number | string): Observable<ApiItemResult<Section>> {
    return this.api.get(API_ENDPOINTS.sections.byId(id));
  }

  createSection(
    payload: ApiMutationPayload<Section>
  ): Observable<ApiItemResult<Section>> {
    return this.api.post(API_ENDPOINTS.sections.root, payload);
  }

  updateSection(
    id: number | string,
    payload: ApiMutationPayload<Section>
  ): Observable<ApiItemResult<Section>> {
    return this.api.put(API_ENDPOINTS.sections.byId(id), payload);
  }

  deleteSection(id: number | string): Observable<ApiItemResult<unknown>> {
    return this.api.delete(API_ENDPOINTS.sections.byId(id));
  }

  assignSectionTeacher(
    id: number | string,
    payload: Record<string, unknown>
  ): Observable<ApiItemResult<Section>> {
    return this.api.patch(API_ENDPOINTS.sections.assignTeacher(id), payload);
  }

  listSubjects(params?: ApiQueryParams): Observable<ApiListResult<Subject>> {
    return this.api.get(API_ENDPOINTS.subjects.root, params);
  }

  getSubject(id: number | string): Observable<ApiItemResult<Subject>> {
    return this.api.get(API_ENDPOINTS.subjects.byId(id));
  }

  createSubject(
    payload: ApiMutationPayload<Subject>
  ): Observable<ApiItemResult<Subject>> {
    return this.api.post(API_ENDPOINTS.subjects.root, payload);
  }

  updateSubject(
    id: number | string,
    payload: ApiMutationPayload<Subject>
  ): Observable<ApiItemResult<Subject>> {
    return this.api.put(API_ENDPOINTS.subjects.byId(id), payload);
  }

  deleteSubject(id: number | string): Observable<ApiItemResult<unknown>> {
    return this.api.delete(API_ENDPOINTS.subjects.byId(id));
  }

  listAdmissions(params?: ApiQueryParams): Observable<ApiListResult<Admission>> {
    return this.api.get(API_ENDPOINTS.admissions.root, params);
  }

  getAdmission(id: number | string): Observable<ApiItemResult<Admission>> {
    return this.api.get(API_ENDPOINTS.admissions.byId(id));
  }

  createAdmission(
    payload: ApiMutationPayload<Admission>
  ): Observable<ApiItemResult<Admission>> {
    return this.api.post(API_ENDPOINTS.admissions.root, payload);
  }

  updateAdmission(
    id: number | string,
    payload: ApiMutationPayload<Admission>
  ): Observable<ApiItemResult<Admission>> {
    return this.api.put(API_ENDPOINTS.admissions.byId(id), payload);
  }

  deleteAdmission(id: number | string): Observable<ApiItemResult<unknown>> {
    return this.api.delete(API_ENDPOINTS.admissions.byId(id));
  }

  updateAdmissionStatus(
    id: number | string,
    payload: Record<string, unknown>
  ): Observable<ApiItemResult<Admission>> {
    return this.api.patch(API_ENDPOINTS.admissions.updateStatus(id), payload);
  }

  updateAdmissionPayment(
    id: number | string,
    payload: Record<string, unknown>
  ): Observable<ApiItemResult<Admission>> {
    return this.api.patch(API_ENDPOINTS.admissions.updatePayment(id), payload);
  }

  approveAdmission(
    id: number | string,
    payload: Record<string, unknown> = {}
  ): Observable<ApiItemResult<Admission>> {
    return this.api.post(API_ENDPOINTS.admissions.approve(id), payload);
  }

  listAdmissionDocuments(
    applicationId: number | string,
    params?: ApiQueryParams
  ): Observable<ApiListResult<AdmissionDocument>> {
    return this.api.get(API_ENDPOINTS.admissions.documents(applicationId), params);
  }

  createAdmissionDocument(
    applicationId: number | string,
    payload: Record<string, unknown>
  ): Observable<ApiItemResult<AdmissionDocument>> {
    return this.api.post(API_ENDPOINTS.admissions.documents(applicationId), payload);
  }

  deleteAdmissionDocument(
    applicationId: number | string,
    docId: number | string
  ): Observable<ApiItemResult<unknown>> {
    return this.api.delete(API_ENDPOINTS.admissions.documentById(applicationId, docId));
  }

  verifyAdmissionDocument(
    applicationId: number | string,
    docId: number | string,
    payload: Record<string, unknown>
  ): Observable<ApiItemResult<AdmissionDocument>> {
    return this.api.patch(
      API_ENDPOINTS.admissions.verifyDocument(applicationId, docId),
      payload
    );
  }

  listAdmissionFees(
    applicationId: number | string,
    params?: ApiQueryParams
  ): Observable<ApiListResult<AdmissionFee>> {
    return this.api.get(API_ENDPOINTS.admissions.fees(applicationId), params);
  }

  createAdmissionFee(
    applicationId: number | string,
    payload: Record<string, unknown>
  ): Observable<ApiItemResult<AdmissionFee>> {
    return this.api.post(API_ENDPOINTS.admissions.fees(applicationId), payload);
  }

  refundAdmissionFee(
    applicationId: number | string,
    feeId: number | string,
    payload: Record<string, unknown>
  ): Observable<ApiItemResult<AdmissionFee>> {
    return this.api.patch(API_ENDPOINTS.admissions.refundFee(applicationId, feeId), payload);
  }

  listPreviousAcademics(
    applicationId: number | string,
    params?: ApiQueryParams
  ): Observable<ApiListResult<PreviousAcademic>> {
    return this.api.get(
      API_ENDPOINTS.admissions.previousAcademics(applicationId),
      params
    );
  }

  createPreviousAcademic(
    applicationId: number | string,
    payload: ApiMutationPayload<PreviousAcademic>
  ): Observable<ApiItemResult<PreviousAcademic>> {
    return this.api.post(
      API_ENDPOINTS.admissions.previousAcademics(applicationId),
      payload
    );
  }

  updatePreviousAcademic(
    applicationId: number | string,
    id: number | string,
    payload: ApiMutationPayload<PreviousAcademic>
  ): Observable<ApiItemResult<PreviousAcademic>> {
    return this.api.put(
      API_ENDPOINTS.admissions.previousAcademicById(applicationId, id),
      payload
    );
  }

  deletePreviousAcademic(
    applicationId: number | string,
    id: number | string
  ): Observable<ApiItemResult<unknown>> {
    return this.api.delete(
      API_ENDPOINTS.admissions.previousAcademicById(applicationId, id)
    );
  }

  listAttendance(params?: ApiQueryParams): Observable<ApiListResult<Attendance>> {
    return this.api.get(API_ENDPOINTS.attendance.root, params);
  }

  listAttendanceBySection(
    sectionId: number | string,
    params?: ApiQueryParams
  ): Observable<ApiListResult<Attendance>> {
    return this.api.get(API_ENDPOINTS.attendance.bySection(sectionId), params);
  }

  createAttendance(
    payload: ApiMutationPayload<Attendance>
  ): Observable<ApiItemResult<Attendance>> {
    return this.api.post(API_ENDPOINTS.attendance.root, payload);
  }

  createAttendanceBulk(
    payload: Record<string, unknown>
  ): Observable<ApiItemResult<Attendance[]>> {
    return this.api.post(API_ENDPOINTS.attendance.bulk, payload);
  }

  updateAttendance(
    id: number | string,
    payload: ApiMutationPayload<Attendance>
  ): Observable<ApiItemResult<Attendance>> {
    return this.api.put(API_ENDPOINTS.attendance.byId(id), payload);
  }

  listLeaveRequests(
    params?: ApiQueryParams
  ): Observable<ApiListResult<LeaveRequest>> {
    return this.api.get(API_ENDPOINTS.attendance.leaveRequests, params);
  }

  createLeaveRequest(
    payload: ApiMutationPayload<LeaveRequest>
  ): Observable<ApiItemResult<LeaveRequest>> {
    return this.api.post(API_ENDPOINTS.attendance.leaveRequests, payload);
  }

  reviewLeaveRequest(
    id: number | string,
    payload: Record<string, unknown>
  ): Observable<ApiItemResult<LeaveRequest>> {
    return this.api.patch(API_ENDPOINTS.attendance.reviewLeaveRequest(id), payload);
  }

  listEnrollments(params?: ApiQueryParams): Observable<ApiListResult<Enrollment>> {
    return this.api.get(API_ENDPOINTS.enrollments.root, params);
  }

  getEnrollment(id: number | string): Observable<ApiItemResult<Enrollment>> {
    return this.api.get(API_ENDPOINTS.enrollments.byId(id));
  }

  createEnrollment(
    payload: ApiMutationPayload<Enrollment>
  ): Observable<ApiItemResult<Enrollment>> {
    return this.api.post(API_ENDPOINTS.enrollments.root, payload);
  }

  transferEnrollment(
    id: number | string,
    payload: Record<string, unknown>
  ): Observable<ApiItemResult<Enrollment>> {
    return this.api.patch(API_ENDPOINTS.enrollments.transfer(id), payload);
  }

  listPromotions(params?: ApiQueryParams): Observable<ApiListResult<Promotion>> {
    return this.api.get(API_ENDPOINTS.promotions.root, params);
  }

  createPromotion(
    payload: ApiMutationPayload<Promotion>
  ): Observable<ApiItemResult<Promotion>> {
    return this.api.post(API_ENDPOINTS.promotions.root, payload);
  }

  assignPromotion(
    id: number | string,
    payload: Record<string, unknown>
  ): Observable<ApiItemResult<Promotion>> {
    return this.api.patch(API_ENDPOINTS.promotions.assign(id), payload);
  }

  listExams(params?: ApiQueryParams): Observable<ApiListResult<Exam>> {
    return this.api.get(API_ENDPOINTS.exams.root, params);
  }

  getExam(id: number | string): Observable<ApiItemResult<Exam>> {
    return this.api.get(API_ENDPOINTS.exams.byId(id));
  }

  createExam(payload: ApiMutationPayload<Exam>): Observable<ApiItemResult<Exam>> {
    return this.api.post(API_ENDPOINTS.exams.root, payload);
  }

  updateExam(
    id: number | string,
    payload: ApiMutationPayload<Exam>
  ): Observable<ApiItemResult<Exam>> {
    return this.api.put(API_ENDPOINTS.exams.byId(id), payload);
  }

  deleteExam(id: number | string): Observable<ApiItemResult<unknown>> {
    return this.api.delete(API_ENDPOINTS.exams.byId(id));
  }

  publishExamResults(
    id: number | string,
    payload: Record<string, unknown> = {}
  ): Observable<ApiItemResult<Exam>> {
    return this.api.patch(API_ENDPOINTS.exams.publishResults(id), payload);
  }

  listExamResults(
    examId: number | string,
    params?: ApiQueryParams
  ): Observable<ApiListResult<ExamResult>> {
    return this.api.get(API_ENDPOINTS.exams.results(examId), params);
  }

  createExamResult(
    examId: number | string,
    payload: ApiMutationPayload<ExamResult>
  ): Observable<ApiItemResult<ExamResult>> {
    return this.api.post(API_ENDPOINTS.exams.results(examId), payload);
  }

  createExamResultsBulk(
    examId: number | string,
    payload: Record<string, unknown>
  ): Observable<ApiItemResult<ExamResult[]>> {
    return this.api.post(API_ENDPOINTS.exams.bulkResults(examId), payload);
  }

  listExamSchedules(
    examId: number | string,
    params?: ApiQueryParams
  ): Observable<ApiListResult<ExamSchedule>> {
    return this.api.get(API_ENDPOINTS.exams.schedules(examId), params);
  }

  createExamSchedule(
    examId: number | string,
    payload: ApiMutationPayload<ExamSchedule>
  ): Observable<ApiItemResult<ExamSchedule>> {
    return this.api.post(API_ENDPOINTS.exams.schedules(examId), payload);
  }

  updateExamSchedule(
    examId: number | string,
    scheduleId: number | string,
    payload: ApiMutationPayload<ExamSchedule>
  ): Observable<ApiItemResult<ExamSchedule>> {
    return this.api.put(
      API_ENDPOINTS.exams.scheduleById(examId, scheduleId),
      payload
    );
  }

  deleteExamSchedule(
    examId: number | string,
    scheduleId: number | string
  ): Observable<ApiItemResult<unknown>> {
    return this.api.delete(API_ENDPOINTS.exams.scheduleById(examId, scheduleId));
  }

  listParents(params?: ApiQueryParams): Observable<ApiListResult<Parent>> {
    return this.api.get(API_ENDPOINTS.parents.root, params);
  }

  getParent(id: number | string): Observable<ApiItemResult<Parent>> {
    return this.api.get(API_ENDPOINTS.parents.byId(id));
  }

  createParent(payload: ApiMutationPayload<Parent>): Observable<ApiItemResult<Parent>> {
    return this.api.post(API_ENDPOINTS.parents.root, payload);
  }

  updateParent(
    id: number | string,
    payload: ApiMutationPayload<Parent>
  ): Observable<ApiItemResult<Parent>> {
    return this.api.put(API_ENDPOINTS.parents.byId(id), payload);
  }

  deleteParent(id: number | string): Observable<ApiItemResult<unknown>> {
    return this.api.delete(API_ENDPOINTS.parents.byId(id));
  }

  listStudents(params?: ApiQueryParams): Observable<ApiListResult<Student>> {
    return this.api.get(API_ENDPOINTS.students.root, params);
  }

  getStudent(id: number | string): Observable<ApiItemResult<Student>> {
    return this.api.get(API_ENDPOINTS.students.byId(id));
  }

  updateStudent(
    id: number | string,
    payload: ApiMutationPayload<Student>
  ): Observable<ApiItemResult<Student>> {
    return this.api.put(API_ENDPOINTS.students.byId(id), payload);
  }

  deactivateStudent(
    id: number | string,
    payload: Record<string, unknown> = {}
  ): Observable<ApiItemResult<Student>> {
    return this.api.patch(API_ENDPOINTS.students.deactivate(id), payload);
  }

  listStudentParents(
    studentId: number | string,
    params?: ApiQueryParams
  ): Observable<ApiListResult<StudentParent>> {
    return this.api.get(API_ENDPOINTS.students.parents(studentId), params);
  }

  createStudentParent(
    studentId: number | string,
    payload: Record<string, unknown>
  ): Observable<ApiItemResult<StudentParent>> {
    return this.api.post(API_ENDPOINTS.students.parents(studentId), payload);
  }

  deleteStudentParent(
    studentId: number | string,
    studentParentId: number | string
  ): Observable<ApiItemResult<unknown>> {
    return this.api.delete(
      API_ENDPOINTS.students.studentParentById(studentId, studentParentId)
    );
  }

  listTeachers(params?: ApiQueryParams): Observable<ApiListResult<Teacher>> {
    return this.api.get(API_ENDPOINTS.teachers.root, params);
  }

  getTeacher(id: number | string): Observable<ApiItemResult<Teacher>> {
    return this.api.get(API_ENDPOINTS.teachers.byId(id));
  }

  createTeacher(
    payload: ApiMutationPayload<Teacher>
  ): Observable<ApiItemResult<Teacher>> {
    return this.api.post(API_ENDPOINTS.teachers.root, payload);
  }

  updateTeacher(
    id: number | string,
    payload: ApiMutationPayload<Teacher>
  ): Observable<ApiItemResult<Teacher>> {
    return this.api.put(API_ENDPOINTS.teachers.byId(id), payload);
  }

  deleteTeacher(id: number | string): Observable<ApiItemResult<unknown>> {
    return this.api.delete(API_ENDPOINTS.teachers.byId(id));
  }

  deactivateTeacher(
    id: number | string,
    payload: Record<string, unknown> = {}
  ): Observable<ApiItemResult<Teacher>> {
    return this.api.patch(API_ENDPOINTS.teachers.deactivate(id), payload);
  }

  listTeacherAcademicQualifications(
    teacherId: number | string,
    params?: ApiQueryParams
  ): Observable<ApiListResult<AcademicQualification>> {
    return this.api.get(API_ENDPOINTS.teachers.academicQualifications(teacherId), params);
  }

  createTeacherAcademicQualification(
    teacherId: number | string,
    payload: ApiMutationPayload<AcademicQualification>
  ): Observable<ApiItemResult<AcademicQualification>> {
    return this.api.post(
      API_ENDPOINTS.teachers.academicQualifications(teacherId),
      payload
    );
  }

  updateTeacherAcademicQualification(
    teacherId: number | string,
    id: number | string,
    payload: ApiMutationPayload<AcademicQualification>
  ): Observable<ApiItemResult<AcademicQualification>> {
    return this.api.put(
      API_ENDPOINTS.teachers.academicQualificationById(teacherId, id),
      payload
    );
  }

  deleteTeacherAcademicQualification(
    teacherId: number | string,
    id: number | string
  ): Observable<ApiItemResult<unknown>> {
    return this.api.delete(
      API_ENDPOINTS.teachers.academicQualificationById(teacherId, id)
    );
  }

  listTeacherOtherQualifications(
    teacherId: number | string,
    params?: ApiQueryParams
  ): Observable<ApiListResult<OtherQualification>> {
    return this.api.get(API_ENDPOINTS.teachers.otherQualifications(teacherId), params);
  }

  createTeacherOtherQualification(
    teacherId: number | string,
    payload: ApiMutationPayload<OtherQualification>
  ): Observable<ApiItemResult<OtherQualification>> {
    return this.api.post(API_ENDPOINTS.teachers.otherQualifications(teacherId), payload);
  }

  updateTeacherOtherQualification(
    teacherId: number | string,
    id: number | string,
    payload: ApiMutationPayload<OtherQualification>
  ): Observable<ApiItemResult<OtherQualification>> {
    return this.api.put(
      API_ENDPOINTS.teachers.otherQualificationById(teacherId, id),
      payload
    );
  }

  deleteTeacherOtherQualification(
    teacherId: number | string,
    id: number | string
  ): Observable<ApiItemResult<unknown>> {
    return this.api.delete(API_ENDPOINTS.teachers.otherQualificationById(teacherId, id));
  }

  listSectionTeachers(
    params?: ApiQueryParams
  ): Observable<ApiListResult<SectionTeacher>> {
    return this.api.get(API_ENDPOINTS.sectionTeachers.root, params);
  }

  createSectionTeacher(
    payload: ApiMutationPayload<SectionTeacher>
  ): Observable<ApiItemResult<SectionTeacher>> {
    return this.api.post(API_ENDPOINTS.sectionTeachers.root, payload);
  }

  deactivateSectionTeacher(
    id: number | string,
    payload: Record<string, unknown> = {}
  ): Observable<ApiItemResult<SectionTeacher>> {
    return this.api.patch(API_ENDPOINTS.sectionTeachers.deactivate(id), payload);
  }
}
