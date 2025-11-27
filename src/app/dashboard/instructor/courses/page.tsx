import { BookOpen, Clock } from "lucide-react";

import { CourseDialog } from "~/components/course-dialog";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import { listUserCoursesAction } from "~/lib/actions/courses";
import { formatDate } from "~/lib/utils";

export default async function InstructorCoursesPage() {
  const result = await listUserCoursesAction();
  const courses = result?.data?.courses || [];

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">My Courses</h1>
          <p className="text-muted-foreground mt-1">
            Manage your courses and lessons
          </p>
        </div>
        <CourseDialog mode="create" />
      </div>

      {courses.length === 0
        ? (
            <div className={`
              bg-muted/30 flex min-h-[400px] flex-col items-center
              justify-center border p-8 text-center
            `}
            >
              <BookOpen className="text-muted-foreground mb-4 h-12 w-12" />
              <h2 className="mb-2 text-xl font-semibold">No courses yet</h2>
              <p className="text-muted-foreground mb-6 max-w-sm text-sm">
                Create your first course to get started with managing lessons
                and recordings.
              </p>
              <CourseDialog mode="create" triggerLabel="Create First Course" />
            </div>
          )
        : (
            <div className={`
              grid gap-4
              sm:grid-cols-2
              lg:grid-cols-3
            `}
            >
              {courses.map(course => (
                <Card key={course.id}>
                  <CardHeader>
                    <CardTitle className="text-lg">{course.title}</CardTitle>
                    <CardDescription className="line-clamp-2">
                      {course.description}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm">
                        <Clock className="text-muted-foreground h-4 w-4" />
                        <span>
                          {course.estimatedHours}
                          {" "}
                          hours
                        </span>
                      </div>
                      {course.tags && course.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {course.tags.slice(0, 2).map(tag => (
                            <Badge
                              key={tag}
                              variant="secondary"
                              className="text-xs"
                            >
                              {tag}
                            </Badge>
                          ))}
                          {course.tags.length > 2 && (
                            <Badge variant="outline" className="text-xs">
                              +
                              {course.tags.length - 2}
                            </Badge>
                          )}
                        </div>
                      )}
                    </div>
                    <div className="border-t pt-4">
                      <p className="text-muted-foreground mb-3 text-xs">
                        Updated
                        {" "}
                        {formatDate(course.updatedAt)}
                      </p>
                      <div className="flex gap-2">
                        <Button
                          asChild
                          size="sm"
                          variant="outline"
                          className="flex-1"
                        >
                          <a href={`/dashboard/instructor/courses/${course.id}/manage`}>
                            Manage
                          </a>
                        </Button>
                        <CourseDialog
                          mode="edit"
                          course={course}
                          triggerLabel="Edit"
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
    </div>
  );
}
