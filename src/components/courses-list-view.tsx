"use client";

import { BookOpen, Calendar, Clock, User, X } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

import type { Course } from "~/types/course";

import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import { formatDate } from "~/lib/utils";

type CoursesListViewProps = {
  courses: Course[];
};

function CourseDetailRow({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-3 text-sm">
      <Icon className="text-muted-foreground h-4 w-4" />
      <span className="font-medium">
        {label}
        :
      </span>
      <span className="text-muted-foreground">{value}</span>
    </div>
  );
}

export default function CoursesListView({ courses }: CoursesListViewProps) {
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);

  return (
    <div className="flex gap-6">
      <div className={`
        transition-all duration-500 ease-in-out
        ${selectedCourse
      ? `
        w-full
        lg:w-1/2
      `
      : "w-full"}
      `}
      >
        <div className="space-y-3">
          {courses.map(course => (
            <Card
              key={course.course_id}
              className={`
                group cursor-pointer gap-2 transition-all
                hover:shadow-md
                ${selectedCourse?.course_id === course.course_id
              ? `border-primary ring-primary/20 ring-2`
              : ""}
              `}
              onClick={() => setSelectedCourse(course)}
            >
              <CardHeader>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <CardTitle className={`
                      group-hover:text-primary
                      mb-2 text-lg transition-colors
                    `}
                    >
                      {course.title}
                    </CardTitle>
                    <CardDescription className="flex items-center gap-2 text-sm">
                      <User className="h-3 w-3" />
                      {course.instructor_name}
                    </CardDescription>
                  </div>
                  {selectedCourse?.course_id === course.course_id && (
                    <div className={`
                      bg-primary/10 text-primary flex h-6 w-6 shrink-0
                      items-center justify-center rounded-full text-xs
                      font-medium
                    `}
                    >
                      ✓
                    </div>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-3 pt-0">
                <div className="flex flex-wrap gap-3 text-xs">
                  <div className={`
                    text-muted-foreground flex items-center gap-1.5
                  `}
                  >
                    <BookOpen className="h-3 w-3" />
                    <span>
                      {course.lessons?.length}
                      {" "}
                      {course.lessons?.length === 1 ? "lesson" : "lessons"}
                    </span>
                  </div>
                  <div className={`
                    text-muted-foreground flex items-center gap-1.5
                  `}
                  >
                    <Clock className="h-3 w-3" />
                    <span>
                      {course.estimated_hours}
                      {" "}
                      hours
                    </span>
                  </div>
                </div>

                {course.tags && course.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {course.tags.slice(0, 3).map(tag => (
                      <Badge key={tag} variant="secondary" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                    {course.tags.length > 3 && (
                      <Badge variant="outline" className="text-xs">
                        +
                        {course.tags.length - 3}
                      </Badge>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        {courses.length === 0 && (
          <div className={`
            bg-muted/30 flex min-h-[400px] flex-col items-center justify-center
            rounded-lg border-2 border-dashed p-8 text-center
          `}
          >
            <BookOpen className="text-muted-foreground mb-4 h-12 w-12" />
            <h2 className="mb-2 text-xl font-semibold">No courses available yet</h2>
            <p className="text-muted-foreground max-w-sm text-sm">
              Check back soon! Instructors are working on creating new courses for you.
            </p>
          </div>
        )}
      </div>

      <div className={`
        hidden transition-all duration-500 ease-in-out
        lg:block
        ${selectedCourse ? "w-1/2 opacity-100" : "w-0 opacity-0"}
      `}
      >
        {selectedCourse && (
          <Card className="sticky top-24 overflow-hidden">
            <CardHeader className="border-b">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <CardTitle className="mb-2 text-2xl">
                    {selectedCourse.title}
                  </CardTitle>
                  <CardDescription className="flex items-center gap-2">
                    <User className="h-4 w-4" />
                    {selectedCourse.instructor_name}
                  </CardDescription>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 shrink-0"
                  onClick={() => setSelectedCourse(null)}
                >
                  <X className="h-4 w-4" />
                  <span className="sr-only">Close</span>
                </Button>
              </div>
            </CardHeader>

            <CardContent className="space-y-6 px-6">
              <div>
                <h3 className={`
                  text-muted-foreground mb-2 text-sm font-semibold tracking-wide
                  uppercase
                `}
                >
                  About this course
                </h3>
                <p className="text-sm leading-relaxed">
                  {selectedCourse.description}
                </p>
              </div>

              <div className="space-y-3">
                <h3 className={`
                  text-muted-foreground text-sm font-semibold tracking-wide
                  uppercase
                `}
                >
                  Course Details
                </h3>

                <CourseDetailRow
                  icon={User}
                  label="Instructor"
                  value={selectedCourse.instructor_name}
                />
                <CourseDetailRow
                  icon={BookOpen}
                  label="Lessons"
                  value={`${selectedCourse.lessons?.length} lessons`}
                />
                <CourseDetailRow
                  icon={Clock}
                  label="Duration"
                  value={`${selectedCourse.estimated_hours} hours`}
                />
                <CourseDetailRow
                  icon={Calendar}
                  label="Last Updated"
                  value={formatDate(selectedCourse.updated_at)}
                />
              </div>

              {selectedCourse.tags && selectedCourse.tags.length > 0 && (
                <div>
                  <h3 className={`
                    text-muted-foreground mb-2 text-sm font-semibold
                    tracking-wide uppercase
                  `}
                  >
                    Topics
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {selectedCourse.tags.map(tag => (
                      <Badge key={tag} variant="secondary">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              <div className="pt-4">
                <Button asChild className="w-full" size="lg">
                  <Link href={`/dashboard/courses/${selectedCourse.course_id}`}>
                    Enroll in Course
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      { /* TODO: Implement a proper dialog component (waiting on #141) */}
      {selectedCourse && (
        <div className={`
          bg-background fixed inset-0 z-50 overflow-y-auto
          lg:hidden
        `}
        >
          <div className="container mx-auto p-4">
            <Card>
              <CardHeader className="border-b">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <CardTitle className="mb-2 text-2xl">
                      {selectedCourse.title}
                    </CardTitle>
                    <CardDescription className="flex items-center gap-2">
                      <User className="h-4 w-4" />
                      {selectedCourse.instructor_name}
                    </CardDescription>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 shrink-0"
                    onClick={() => setSelectedCourse(null)}
                  >
                    <X className="h-4 w-4" />
                    <span className="sr-only">Close</span>
                  </Button>
                </div>
              </CardHeader>

              <CardContent className="space-y-6 p-6">
                <div>
                  <h3 className={`
                    text-muted-foreground mb-2 text-sm font-semibold
                    tracking-wide uppercase
                  `}
                  >
                    About this course
                  </h3>
                  <p className="text-sm leading-relaxed">
                    {selectedCourse.description}
                  </p>
                </div>

                <div className="space-y-3">
                  <h3 className={`
                    text-muted-foreground text-sm font-semibold tracking-wide
                    uppercase
                  `}
                  >
                    Course Details
                  </h3>

                  <CourseDetailRow
                    icon={User}
                    label="Instructor"
                    value={selectedCourse.instructor_name}
                  />
                  <CourseDetailRow
                    icon={BookOpen}
                    label="Lessons"
                    value={`${selectedCourse.lessons?.length} lessons`}
                  />
                  <CourseDetailRow
                    icon={Clock}
                    label="Duration"
                    value={`${selectedCourse.estimated_hours} hours`}
                  />
                  <CourseDetailRow
                    icon={Calendar}
                    label="Last Updated"
                    value={formatDate(selectedCourse.updated_at)}
                  />
                </div>

                {selectedCourse.tags && selectedCourse.tags.length > 0 && (
                  <div>
                    <h3 className={`
                      text-muted-foreground mb-2 text-sm font-semibold
                      tracking-wide uppercase
                    `}
                    >
                      Topics
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {selectedCourse.tags.map(tag => (
                        <Badge key={tag} variant="secondary">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* Enroll Button */}
                <div className="pt-4">
                  <Button asChild className="w-full" size="lg">
                    <Link href={`/dashboard/courses/${selectedCourse.course_id}`}>
                      Enroll in Course
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}
