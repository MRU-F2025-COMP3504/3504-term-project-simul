export type Course = {
  course_id: string;
  title: string;
  description: string;
  thumbnail_url: string | null;
  created_by: string;
  instructor_name: string;
  estimated_hours: number;
  tags: string[];
  lessons?: Lesson[];
  created_at: Date;
  updated_at: Date;
};

export type Lesson = {
  lesson_id: string;
  course_id: string;
  title: string;
  order_index: number;
  created_at: Date;
};
