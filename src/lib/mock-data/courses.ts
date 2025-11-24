import type { Course } from "~/types/course";

/**
 * Mock course data for development
 * TODO: Replace with actual database queries once database is set up
 */
export const MOCK_COURSES: Course[] = [
  {
    id: "intro-javascript",
    title: "Introduction to JavaScript",
    description: "Learn the fundamentals of JavaScript programming. This course covers everything from basic syntax to advanced concepts like closures and async programming. Perfect for beginners who want to start their web development journey.",
    thumbnailUrl: null,
    createdBy: "user-1",
    instructorName: "Dr. Sarah Johnson",
    estimatedHours: 8,
    tags: ["JavaScript", "Programming", "Web Development", "Beginner"],
    createdAt: new Date("2025-01-01"),
    updatedAt: new Date("2025-10-15"),
  },
  {
    id: "web-development",
    title: "Web Development Basics",
    description: "Build your first website with HTML, CSS, and JavaScript. This comprehensive course teaches you the three core technologies that power the modern web. Learn by building real projects and creating interactive websites.",
    thumbnailUrl: null,
    createdBy: "user-1",
    instructorName: "Prof. Michael Chen",
    estimatedHours: 6,
    tags: ["HTML", "CSS", "JavaScript", "Web Development"],
    createdAt: new Date("2025-01-01"),
    updatedAt: new Date("2025-09-20"),
  },
  {
    id: "python-fundamentals",
    title: "Python Fundamentals",
    description: "Master the basics of Python programming. From variables and functions to object-oriented programming, this course provides a solid foundation in one of the world's most popular programming languages.",
    thumbnailUrl: null,
    createdBy: "user-2",
    instructorName: "Dr. Emily Rodriguez",
    estimatedHours: 10,
    tags: ["Python", "Programming", "Beginner"],
    createdAt: new Date("2025-02-01"),
    updatedAt: new Date("2025-10-20"),
  },
  {
    id: "react-essentials",
    title: "React Essentials",
    description: "Learn modern React development including hooks, context, and state management. Build interactive user interfaces with confidence using the latest React features and best practices.",
    thumbnailUrl: null,
    createdBy: "user-1",
    instructorName: "Dr. Sarah Johnson",
    estimatedHours: 12,
    tags: ["React", "JavaScript", "Frontend", "Intermediate"],
    createdAt: new Date("2025-03-01"),
    updatedAt: new Date("2025-10-25"),
  },
];

/**
 * Helper function to get a course by ID
 */
export function getMockCourseById(courseId: string): Course | undefined {
  return MOCK_COURSES.find(course => course.id === courseId);
}
