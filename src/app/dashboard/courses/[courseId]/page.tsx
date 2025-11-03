import { ArrowLeft, BookOpen, Calendar, Clock, User } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";

import { Button } from "~/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";

// Mock data
// Courses: course_id, title, description, thumbnail_url, created_by, created_at, updated_at
// Lessons: lesson_id, course_id, title, order_index, created_at
const MOCK_COURSES = {
  "intro-javascript": {
    course_id: "intro-javascript",
    title: "Introduction to JavaScript",
    description: "Learn the fundamentals of JavaScript programming. This course covers everything from basic syntax to advanced concepts like closures and async programming. Perfect for beginners who want to start their web development journey.",
    thumbnail_url: null,
    created_by: "user-1",
    instructor_name: "Dr. Sarah Johnson",
    estimated_hours: 8,
    tags: ["JavaScript", "Programming", "Web Development", "Beginner"],
    created_at: new Date("2025-01-01"),
    updated_at: new Date("2025-10-15"),
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
  },
  "web-development": {
    course_id: "web-development",
    title: "Web Development Basics",
    description: "Build your first website with HTML, CSS, and JavaScript. This comprehensive course teaches you the three core technologies that power the modern web.",
    thumbnail_url: null,
    created_by: "user-1",
    instructor_name: "Prof. Michael Chen",
    estimated_hours: 6,
    tags: ["HTML", "CSS", "JavaScript", "Web Development"],
    created_at: new Date("2025-01-01"),
    updated_at: new Date("2025-09-20"),
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
  },
};

type CourseViewPageProps = {
  params: Promise<{
    courseId: string;
  }>;
};

function formatDate(date: Date): string {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

export default async function CourseViewPage({ params }: CourseViewPageProps) {
  const { courseId } = await params;
  const course = MOCK_COURSES[courseId as keyof typeof MOCK_COURSES];

  if (!course) {
    notFound();
  }

  return (
    <div className="container mx-auto py-8">
      {/* Back Button */}
      <div className="mb-6">
        <Link href="/dashboard/courses">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Courses
          </Button>
        </Link>
      </div>

      {/* Split View Layout */}
      <div className={`
        grid gap-8
        lg:grid-cols-[1fr_2fr]
      `}
      >
        {/* Left: Course Overview */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl">{course.title}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Description */}
              <div>
                <h3 className={`
                  text-muted-foreground mb-2 text-sm font-semibold tracking-wide
                  uppercase
                `}
                >
                  About this course
                </h3>
                <p className="text-sm leading-relaxed">
                  {course.description}
                </p>
              </div>

              {/* Course Details */}
              <div className="space-y-3">
                <h3 className={`
                  text-muted-foreground text-sm font-semibold tracking-wide
                  uppercase
                `}
                >
                  Course Details
                </h3>

                <div className="flex items-center gap-3 text-sm">
                  <User className="text-muted-foreground h-4 w-4" />
                  <span className="font-medium">Instructor:</span>
                  <span className="text-muted-foreground">
                    {course.instructor_name}
                  </span>
                </div>

                <div className="flex items-center gap-3 text-sm">
                  <BookOpen className="text-muted-foreground h-4 w-4" />
                  <span className="font-medium">Lessons:</span>
                  <span className="text-muted-foreground">
                    {course.lessons.length}
                    {" "}
                    lessons
                  </span>
                </div>

                <div className="flex items-center gap-3 text-sm">
                  <Clock className="text-muted-foreground h-4 w-4" />
                  <span className="font-medium">Duration:</span>
                  <span className="text-muted-foreground">
                    {course.estimated_hours}
                    {" "}
                    hours
                  </span>
                </div>

                <div className="flex items-center gap-3 text-sm">
                  <Calendar className="text-muted-foreground h-4 w-4" />
                  <span className="font-medium">Last Updated:</span>
                  <span className="text-muted-foreground">
                    {formatDate(course.updated_at)}
                  </span>
                </div>
              </div>

              {/* Tags */}
              {course.tags && course.tags.length > 0 && (
                <div>
                  <h3 className={`
                    text-muted-foreground mb-2 text-sm font-semibold
                    tracking-wide uppercase
                  `}
                  >
                    Topics
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {course.tags.map(tag => (
                      <span
                        key={tag}
                        className={`
                          bg-primary/10 text-primary rounded-full px-3 py-1
                          text-xs font-medium
                        `}
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right: Lessons List */}
        <div className="space-y-4">
          <div className="space-y-3">
            {course.lessons.map(lesson => (
              <Card
                key={lesson.lesson_id}
                className={`
                  transition-shadow
                  hover:shadow-md
                `}
              >
                <CardHeader>
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex flex-1 items-center gap-3">
                      <span className={`
                        bg-primary/10 text-primary flex h-8 w-8 shrink-0
                        items-center justify-center rounded-full text-sm
                        font-medium
                      `}
                      >
                        {lesson.order_index}
                      </span>
                      <div className="flex flex-col gap-1">
                        <CardTitle className="text-lg font-semibold">
                          {lesson.title}
                        </CardTitle>
                        <span className="text-muted-foreground text-xs">
                          Added
                          {" "}
                          {formatDate(lesson.created_at)}
                        </span>
                      </div>
                    </div>
                    <Link
                      href={`/dashboard/courses/${courseId}/lessons/${lesson.lesson_id}`}
                    >
                      <Button size="sm">Start</Button>
                    </Link>
                  </div>
                </CardHeader>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
