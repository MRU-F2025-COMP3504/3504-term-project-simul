import { eq } from "drizzle-orm";
import { ArrowLeft, BookOpen, Calendar, Clock, User } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";

import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import { db } from "~/lib/db";
import { course as courseTable, lesson } from "~/lib/db/schema";
import { formatDate } from "~/lib/utils";

type CourseViewPageProps = {
  params: Promise<{
    courseId: string;
  }>;
};

// Colocated subcomponent for course detail rows
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

export default async function CourseViewPage({ params }: CourseViewPageProps) {
  const { courseId } = await params;

  // Fetch course from database
  const [courseData] = await db
    .select()
    .from(courseTable)
    .where(eq(courseTable.id, courseId));

  if (!courseData) {
    notFound();
  }

  // Fetch lessons for this course
  const lessonsData = await db
    .select()
    .from(lesson)
    .where(eq(lesson.courseId, courseId));

  const course = {
    id: courseData.id,
    title: courseData.title,
    description: courseData.description,
    thumbnailUrl: courseData.thumbnailUrl,
    instructorName: courseData.instructorName,
    estimatedHours: courseData.estimatedHours,
    tags: courseData.tags,
    createdBy: courseData.createdBy,
    createdAt: courseData.createdAt,
    updatedAt: courseData.updatedAt,
  };

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

                <CourseDetailRow
                  icon={User}
                  label="Instructor"
                  value={course.instructorName}
                />
                <CourseDetailRow
                  icon={BookOpen}
                  label="Lessons"
                  value="0 lessons"
                />
                <CourseDetailRow
                  icon={Clock}
                  label="Duration"
                  value={`${course.estimatedHours} hours`}
                />
                <CourseDetailRow
                  icon={Calendar}
                  label="Last Updated"
                  value={formatDate(course.updatedAt)}
                />
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
                      <Badge key={tag} variant="secondary">
                        {tag}
                      </Badge>
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
            {lessonsData.map(l => (
              <Card
                key={l.id}
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
                        {l.orderIndex}
                      </span>
                      <div className="flex flex-col gap-1">
                        <CardTitle className="text-lg font-semibold">
                          {l.title}
                        </CardTitle>
                        <span className="text-muted-foreground text-xs">
                          Added
                          {" "}
                          {formatDate(l.createdAt)}
                        </span>
                      </div>
                    </div>
                    <Link
                      href={`/dashboard/courses/${courseId}/lessons/${l.id}`}
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
