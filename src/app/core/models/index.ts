// Academic Years
export interface AcademicYear {
  id: number;
  label: string;
  start_date: string;
  end_date: string;
  is_current: boolean;
  created_at?: string;
  updated_at?: string;
}

// Classes
export interface Class {
  id: number;
  name: string;
  numeric_level: number;
  description?: string;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

// Sections
export interface Section {
  id: number;
  class_id: number;
  academic_year_id: number;
  name: string;
  display_name?: string;
  capacity: number;
  room_number?: string;
  class_teacher_id?: number;
  is_active: boolean;
  class?: Class;
  academic_year?: AcademicYear;
  class_teacher?: Teacher;
  created_at?: string;
  updated_at?: string;
}

// Subjects
export interface Subject {
  id: number;
  subject_code: string;
  name: string;
  description?: string;
  subject_type: 'theory' | 'practical' | 'both';
  category?: string;
  is_elective: boolean;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

// Class Subjects
export interface ClassSubject {
  id: number;
  class_id: number;
  subject_id: number;
  academic_year_id: number;
  full_marks: number;
  pass_marks: number;
  class?: Class;
  subject?: Subject;
  academic_year?: AcademicYear;
  created_at?: string;
  updated_at?: string;
}

// Teachers
export interface Teacher {
  id: number;
  first_name: string;
  middle_name?: string;
  last_name: string;
  gender?: 'male' | 'female' | 'other';
  date_of_birth?: string;
  blood_type?: string;
  religion?: string;
  nationality?: string;
  email: string;
  phone_primary: string;
  phone_secondary?: string;
  present_address?: string;
  permanent_address?: string;
  nid_number?: string;
  passport_number?: string;
  designation: string;
  department: string;
  specialization?: string;
  employment_type: string;
  join_date: string;
  previous_experience_years?: number;
  additional_notes?: string;
  profile_photo_url?: string;
  status: 'active' | 'inactive' | 'on_leave';
  created_at?: string;
  updated_at?: string;
}

// Teacher Qualifications
export interface AcademicQualification {
  id: number;
  teacher_id: number;
  institute: string;
  board: string;
  exam_name: string;
  session: string;
  exam_year: number;
  result_year: number;
  result: string;
  remarks?: string;
  created_at?: string;
  updated_at?: string;
}

export interface OtherQualification {
  id: number;
  teacher_id: number;
  type: string;
  title: string;
  org: string;
  issue_date: string;
  expiry_date?: string;
  score?: string;
  description?: string;
  certificate_url?: string;
  created_at?: string;
  updated_at?: string;
}

// Students
export interface Student {
  id: number;
  first_name: string;
  middle_name?: string;
  last_name: string;
  gender?: 'male' | 'female' | 'other';
  date_of_birth?: string;
  blood_type?: string;
  religion?: string;
  nationality?: string;
  email?: string;
  phone?: string;
  present_address?: string;
  permanent_address?: string;
  nid_number?: string;
  passport_number?: string;
  profile_photo_url?: string;
  status: 'active' | 'inactive' | 'graduated' | 'transferred';
  notes?: string;
  created_at?: string;
  updated_at?: string;
}

// Parents
export interface Parent {
  id: number;
  first_name: string;
  middle_name?: string;
  last_name: string;
  gender?: 'male' | 'female' | 'other';
  date_of_birth?: string;
  email?: string;
  phone_primary: string;
  phone_secondary?: string;
  nationality?: string;
  marital_status?: string;
  religion?: string;
  monthly_income?: number;
  nid_number?: string;
  passport_number?: string;
  present_address?: string;
  permanent_address?: string;
  employer_name?: string;
  employer_contact?: string;
  created_at?: string;
  updated_at?: string;
}

// Student Parents
export interface StudentParent {
  id: number;
  student_id: number;
  parent_id: number;
  relationship: string;
  is_primary_contact: boolean;
  parent?: Parent;
  created_at?: string;
  updated_at?: string;
}

// Admissions
export interface Admission {
  id: number;
  application_number: string;
  student_first_name: string;
  student_middle_name?: string;
  student_last_name: string;
  student_gender?: string;
  student_date_of_birth?: string;
  student_blood_type?: string;
  student_religion?: string;
  student_nationality?: string;
  student_phone?: string;
  student_email?: string;
  student_present_address?: string;
  student_permanent_address?: string;
  student_nid_number?: string;
  student_passport_number?: string;
  student_photo_url?: string;
  student_notes?: string;
  father_first_name?: string;
  father_middle_name?: string;
  father_last_name?: string;
  father_gender?: string;
  father_phone?: string;
  father_email?: string;
  father_address?: string;
  mother_first_name?: string;
  mother_middle_name?: string;
  mother_last_name?: string;
  mother_gender?: string;
  mother_phone?: string;
  mother_email?: string;
  mother_address?: string;
  has_separate_guardian: boolean;
  guardian_first_name?: string;
  guardian_last_name?: string;
  guardian_phone?: string;
  guardian_email?: string;
  guardian_relationship?: string;
  emergency_contact_name?: string;
  emergency_contact_phone?: string;
  academic_year_id: number;
  applied_class_id: number;
  last_transfer_certificate_number?: string;
  application_status: 'submitted' | 'under_review' | 'approved' | 'rejected' | 'withdrawn';
  payment_status: 'unpaid' | 'partial' | 'paid' | 'refunded';
  created_at?: string;
  updated_at?: string;
  academic_year?: AcademicYear;
  applied_class?: Class;
}

// Enrollments
export interface Enrollment {
  id: number;
  student_id: number;
  section_id: number;
  academic_year_id: number;
  roll_number: number;
  enrollment_date: string;
  status: 'active' | 'transferred' | 'promoted' | 'graduated';
  created_at?: string;
  updated_at?: string;
  student?: Student;
  section?: Section;
  academic_year?: AcademicYear;
}

// Promotions
export interface Promotion {
  id: number;
  student_id: number;
  from_enrollment_id: number;
  to_academic_year_id: number;
  to_enrollment_id?: number;
  promotion_type: 'promoted' | 'repeated' | 'transferred' | 'graduated';
  remarks?: string;
  promoted_by?: number;
  status: 'pending' | 'assigned' | 'completed';
  created_at?: string;
  updated_at?: string;
  student?: Student;
  from_enrollment?: Enrollment;
  to_academic_year?: AcademicYear;
  to_enrollment?: Enrollment;
}

// Attendance
export interface Attendance {
  id: number;
  enrollment_id: number;
  attendance_date: string;
  status: 'present' | 'absent' | 'late' | 'leave' | 'holiday';
  late_minutes?: number;
  remarks?: string;
  created_at?: string;
  updated_at?: string;
  enrollment?: Enrollment;
}

// Leave Requests
export interface LeaveRequest {
  id: number;
  enrollment_id: number;
  from_date: string;
  to_date: string;
  leave_type: string;
  reason: string;
  requested_by?: number;
  status: 'pending' | 'approved' | 'rejected';
  remarks?: string;
  created_at?: string;
  updated_at?: string;
  enrollment?: Enrollment;
}

// Exams
export interface Exam {
  id: number;
  academic_year_id: number;
  class_id: number;
  name: string;
  exam_type: string;
  start_date: string;
  end_date: string;
  remarks?: string;
  result_published: boolean;
  created_at?: string;
  updated_at?: string;
  academic_year?: AcademicYear;
  class?: Class;
}

// Exam Schedules
export interface ExamSchedule {
  id: number;
  exam_id: number;
  class_subject_id: number;
  section_id?: number;
  exam_date: string;
  start_time: string;
  end_time: string;
  room?: string;
  full_marks: number;
  pass_marks: number;
  created_at?: string;
  updated_at?: string;
  exam?: Exam;
  class_subject?: ClassSubject;
  section?: Section;
}

// Exam Results
export interface ExamResult {
  id: number;
  exam_id: number;
  enrollment_id: number;
  exam_schedule_id: number;
  marks_obtained?: number;
  is_absent: boolean;
  grade?: string;
  remarks?: string;
  created_at?: string;
  updated_at?: string;
  exam?: Exam;
  enrollment?: Enrollment;
  exam_schedule?: ExamSchedule;
}

// Section Teachers
export interface SectionTeacher {
  id: number;
  academic_year_id: number;
  section_id: number;
  class_subject_id: number;
  teacher_id: number;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
  academic_year?: AcademicYear;
  section?: Section;
  class_subject?: ClassSubject;
  teacher?: Teacher;
}

// API Response
export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data?: T;
  error?: string;
}

// Pagination
export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  meta?: {
    current_page: number;
    per_page: number;
    total: number;
    total_pages: number;
  };
}

// Dashboard Statistics
export interface DashboardStats {
  total_active_students: number;
  total_teachers: number;
  current_academic_year: string;
  pending_admissions: number;
  today_attendance_percentage: number;
  upcoming_exams: number;
}

export interface AdmissionDocument {
  id: number;
  application_id: number;
  document_type: string;
  file_name?: string;
  file_url?: string;
  is_verified: boolean;
  verified_at?: string;
  remarks?: string;
  created_at?: string;
  updated_at?: string;
}

export interface AdmissionFee {
  id: number;
  application_id: number;
  fee_type: string;
  amount: number;
  payment_status?: 'pending' | 'paid' | 'partial' | 'refunded';
  payment_method?: string;
  transaction_reference?: string;
  paid_at?: string;
  refunded_at?: string;
  remarks?: string;
  created_at?: string;
  updated_at?: string;
}

export interface PreviousAcademic {
  id: number;
  application_id: number;
  institute_name: string;
  board?: string;
  exam_name?: string;
  group_name?: string;
  passing_year?: number;
  result?: string;
  remarks?: string;
  created_at?: string;
  updated_at?: string;
}

export type ApiQueryPrimitive = string | number | boolean;
export type ApiQueryValue =
  | ApiQueryPrimitive
  | readonly ApiQueryPrimitive[]
  | null
  | undefined;
export type ApiQueryParams = Record<string, ApiQueryValue>;
export type ApiMutationPayload<T = Record<string, unknown>> = Partial<T> &
  Record<string, unknown>;
export type ApiItemResult<T> = ApiResponse<T> | T;
export type ApiListResult<T> = PaginatedResponse<T> | ApiResponse<T[]> | T[];
