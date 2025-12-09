/**
 * Course type (relative to schema)
 */
export type Course = {
  id: string;
  title: string;
  description: string;
  thumbnailUrl: string | null;
  instructorName: string;
  estimatedHours: number;
  tags: string[];
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
};

/**
 * Course with instructor user data
 */
export type CourseWithInstructor = Course & {
  instructor?: {
    id: string;
    name: string;
    email: string;
  };
};

/**
 * Course with lessons included
 */
export type CourseWithLessons = Course & {
  lessons: Lesson[];
};

/**
 * Lesson type (relative to schema)
 */
export type Lesson = {
  id: string;
  title: string;
  orderIndex: number;
  courseId: string;
  recordingId: string | null;
  createdAt: Date;
};

/**
 * Lesson with recording data
 */
export type LessonWithRecording = Lesson & {
  recording?: {
    id: string;
    title: string;
    duration: number | null;
    createdAt: Date;
  } | null;
};

/**
 * Input for creating a course
 */
export type CreateCourseInput = {
  title: string;
  description: string;
  estimatedHours: number;
  tags?: string[];
  thumbnailUrl?: string;
};

/**
 * Input for updating a course
 */
export type UpdateCourseInput = {
  id: string;
  title?: string;
  description?: string;
  estimatedHours?: number;
  tags?: string[];
  thumbnailUrl?: string;
};

/**
 * Input for creating a lesson
 */
export type CreateLessonInput = {
  courseId: string;
  title: string;
  orderIndex?: number;
  recordingId?: string;
};

/**
 * Input for updating a lesson
 */
export type UpdateLessonInput = {
  id: string;
  courseId: string;
  title?: string;
  orderIndex?: number;
  recordingId?: string | null;
};

/**
 * Input for reordering lessons
 */
export type ReorderLessonsInput = {
  courseId: string;
  lessons: Array<{
    id: string;
    orderIndex: number;
  }>;
};

/**
 * Input for linking a recording to a lesson
 */
export type LinkRecordingToLessonInput = {
  lessonId: string;
  recordingId: string;
};
