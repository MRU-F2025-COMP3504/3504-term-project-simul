import type { Course } from "~/types/course";

/**
 * Mock course data for development
 * TODO: Replace with actual database queries once DB schema is finalized
 */
export const MOCK_COURSES: Course[] = [
  {
    course_id: "intro-javascript",
    title: "Introduction to JavaScript",
    description: "Learn the fundamentals of JavaScript programming. This course covers everything from basic syntax to advanced concepts like closures and async programming. Perfect for beginners who want to start their web development journey.",
    thumbnail_url: null,
    created_by: "user-1",
    instructor_name: "Dr. Sarah Johnson",
    estimated_hours: 8,
    lessons: [
      {
        lesson_id: "lesson-1",
        course_id: "intro-javascript",
        title: "Your First Program",
        order_index: 1,
        created_at: new Date("2025-01-01"),
      },
      {
        lesson_id: "lesson-2",
        course_id: "intro-javascript",
        title: "Variables and Data Types",
        order_index: 2,
        created_at: new Date("2025-01-05"),
      },
      {
        lesson_id: "lesson-3",
        course_id: "intro-javascript",
        title: "If Statements",
        order_index: 3,
        created_at: new Date("2025-01-10"),
      },
      {
        lesson_id: "lesson-4",
        course_id: "intro-javascript",
        title: "Loops",
        order_index: 4,
        created_at: new Date("2025-01-15"),
      },
      {
        lesson_id: "lesson-5",
        course_id: "intro-javascript",
        title: "Functions",
        order_index: 5,
        created_at: new Date("2025-01-20"),
      },
    ],
    tags: ["JavaScript", "Programming", "Web Development", "Beginner"],
    created_at: new Date("2025-01-01"),
    updated_at: new Date("2025-10-15"),
  },
  {
    course_id: "web-development",
    title: "Web Development Basics",
    description: "Build your first website with HTML, CSS, and JavaScript. This comprehensive course teaches you the three core technologies that power the modern web. Learn by building real projects and creating interactive websites.",
    thumbnail_url: null,
    created_by: "user-1",
    instructor_name: "Prof. Michael Chen",
    estimated_hours: 6,
    lessons: [
      {
        lesson_id: "lesson-6",
        course_id: "web-development",
        title: "HTML Basics",
        order_index: 1,
        created_at: new Date("2025-01-01"),
      },
      {
        lesson_id: "lesson-7",
        course_id: "web-development",
        title: "CSS Styling",
        order_index: 2,
        created_at: new Date("2025-01-08"),
      },
      {
        lesson_id: "lesson-8",
        course_id: "web-development",
        title: "JavaScript and the DOM",
        order_index: 3,
        created_at: new Date("2025-01-15"),
      },
    ],
    tags: ["HTML", "CSS", "JavaScript", "Web Development"],
    created_at: new Date("2025-01-01"),
    updated_at: new Date("2025-09-20"),
  },
  {
    course_id: "python-fundamentals",
    title: "Python Fundamentals",
    description: "Master the basics of Python programming. From variables and functions to object-oriented programming, this course provides a solid foundation in one of the world's most popular programming languages.",
    thumbnail_url: null,
    created_by: "user-2",
    instructor_name: "Dr. Emily Rodriguez",
    estimated_hours: 10,
    lessons: [
      {
        lesson_id: "lesson-9",
        course_id: "python-fundamentals",
        title: "Getting Started with Python",
        order_index: 1,
        created_at: new Date("2025-02-01"),
      },
      {
        lesson_id: "lesson-10",
        course_id: "python-fundamentals",
        title: "Data Types and Variables",
        order_index: 2,
        created_at: new Date("2025-02-05"),
      },
      {
        lesson_id: "lesson-11",
        course_id: "python-fundamentals",
        title: "Control Flow",
        order_index: 3,
        created_at: new Date("2025-02-10"),
      },
      {
        lesson_id: "lesson-12",
        course_id: "python-fundamentals",
        title: "Functions in Python",
        order_index: 4,
        created_at: new Date("2025-02-15"),
      },
    ],
    tags: ["Python", "Programming", "Beginner"],
    created_at: new Date("2025-02-01"),
    updated_at: new Date("2025-10-20"),
  },
  {
    course_id: "react-essentials",
    title: "React Essentials",
    description: "Learn modern React development including hooks, context, and state management. Build interactive user interfaces with confidence using the latest React features and best practices.",
    thumbnail_url: null,
    created_by: "user-1",
    instructor_name: "Dr. Sarah Johnson",
    estimated_hours: 12,
    lessons: [
      {
        lesson_id: "lesson-13",
        course_id: "react-essentials",
        title: "Introduction to React",
        order_index: 1,
        created_at: new Date("2025-03-01"),
      },
      {
        lesson_id: "lesson-14",
        course_id: "react-essentials",
        title: "React Components and Props",
        order_index: 2,
        created_at: new Date("2025-03-05"),
      },
    ],
    tags: ["React", "JavaScript", "Frontend", "Intermediate"],
    created_at: new Date("2025-03-01"),
    updated_at: new Date("2025-10-25"),
  },
];

/**
 * Helper function to get a course by ID
 */
export function getMockCourseById(courseId: string): Course | undefined {
  return MOCK_COURSES.find(course => course.course_id === courseId);
}
