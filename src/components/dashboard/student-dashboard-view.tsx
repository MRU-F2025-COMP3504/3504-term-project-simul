"use client";

import Link from "next/link";

import type { Course } from "~/types/course";

import { Button } from "~/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";

type StudentDashboardViewProps = {
  enrolledCourses: Course[];
};

export function StudentDashboardView({
  enrolledCourses,
}: StudentDashboardViewProps) {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">My Courses</h1>
          <p className="text-muted-foreground">
            {enrolledCourses.length === 0
              ? "You haven't enrolled in any courses yet"
              : (
                  `You are enrolled in ${enrolledCourses.length} course${enrolledCourses.length === 1 ? "" : "s"}`
                )}
          </p>
        </div>
        <Link href="/dashboard/courses">
          <Button variant="outline">Explore Courses</Button>
        </Link>
      </div>

      {/* Enrolled Courses Grid */}
      {enrolledCourses.length > 0
        ? (
            <div
              className={`
                grid gap-4
                md:grid-cols-2
                lg:grid-cols-3
              `}
            >
              {enrolledCourses.map(course => (
                <Link
                  key={course.id}
                  href={`/dashboard/courses/${course.id}`}
                  className="group"
                >
                  <Card
                    className={`
                      h-full transition-all
                      hover:shadow-lg
                    `}
                  >
                    <CardHeader>
                      <CardTitle
                        className={`
                          group-hover:text-primary
                          line-clamp-2
                        `}
                      >
                        {course.title}
                      </CardTitle>
                      <CardDescription>{course.instructorName}</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <p
                        className="text-muted-foreground line-clamp-3 text-sm"
                      >
                        {course.description}
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {course.tags
                          && (Array.isArray(course.tags)
                            ? course.tags
                            : Object.values(course.tags)
                          )
                            .slice(0, 2)
                            .map((tag, idx) => (
                              <span
                                // eslint-disable-next-line react/no-array-index-key
                                key={idx}
                                className={`
                                  bg-muted inline-block rounded-full px-2 py-1
                                  text-xs font-medium
                                `}
                              >
                                {String(tag)}
                              </span>
                            ))}
                      </div>
                      {course.estimatedHours && (
                        <p className="text-muted-foreground text-xs">
                          {course.estimatedHours}
                          {" "}
                          h estimated
                        </p>
                      )}
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          )
        : (
            <Card className="gap-2">
              <CardHeader>
                <CardTitle>No Courses Yet</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-4">
                  Start your learning journey by exploring available courses.
                </p>
                <Link href="/dashboard/courses">
                  <Button>Browse Courses</Button>
                </Link>
              </CardContent>
            </Card>
          )}
    </div>
  );
}
