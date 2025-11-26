"use client";

import { ArrowLeft } from "lucide-react";
import { useAction } from "next-safe-action/hooks";
import Link from "next/link";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { CourseDialog } from "~/components/course-dialog";
import { LessonDialog } from "~/components/lesson-dialog";
import { LessonsList } from "~/components/lessons-list";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "~/components/ui/dialog";
import { deleteCourseAction, getCourseAction } from "~/lib/actions/courses";
import { listRecordingsAction } from "~/lib/actions/recordings";
import { formatDate } from "~/lib/utils";

type PageProps = {
  params: Promise<{
    courseId: string;
  }>;
};

export default function CourseDetailPage({ params }: PageProps) {
  const [courseId, setCourseId] = useState<string>("");
  const [course, setCourse] = useState<any>(null);
  const [recordings, setRecordings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);

  const getCourseActionResult = useAction(getCourseAction);
  const listRecordingsActionResult = useAction(listRecordingsAction);
  const deleteActionResult = useAction(deleteCourseAction);

  useEffect(() => {
    const resolveParams = async () => {
      const resolvedParams = await params;
      setCourseId(resolvedParams.courseId);
    };
    void resolveParams();
  }, [params]);

  useEffect(() => {
    if (!courseId)
      return;

    const fetchData = async () => {
      try {
        setLoading(true);
        const courseResult = await getCourseActionResult.executeAsync({ id: courseId });
        const recordingsResult = await listRecordingsActionResult.executeAsync();

        if (courseResult?.data?.course) {
          setCourse(courseResult.data.course);
        }
        else if (courseResult?.serverError) {
          toast.error(courseResult.serverError);
        }

        if (recordingsResult?.data?.recordings) {
          setRecordings(recordingsResult.data.recordings);
        }
      }
      catch (error) {
        toast.error("Failed to load course data");
        console.error(error);
      }
      finally {
        setLoading(false);
      }
    };

    void fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [courseId]);

  const handleDeleteCourse = async () => {
    if (!courseId)
      return;
    const result = await deleteActionResult.executeAsync({ id: courseId });
    if (result?.data?.success) {
      toast.success("Course deleted successfully");
      setDeleteConfirmOpen(false);
      window.location.href = "/dashboard/instructor/courses";
    }
    else if (result?.serverError) {
      toast.error(result.serverError);
    }
  };

  const handleLessonUpdated = async () => {
    if (!courseId)
      return;
    const result = await getCourseActionResult.executeAsync({ id: courseId });
    if (result?.data?.course) {
      setCourse(result.data.course);
    }
  };

  if (!courseId) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-muted-foreground">Loading course...</p>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="space-y-4">
        <Link href="/dashboard/instructor/courses">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to courses
          </Button>
        </Link>
        <div className="py-20 text-center">
          <p className="text-muted-foreground">Course not found</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <Link href="/dashboard/instructor/courses">
        <Button variant="ghost" size="sm">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to courses
        </Button>
      </Link>

      <div>
        <h1 className="text-4xl font-bold">{course.title}</h1>
        <p className="text-muted-foreground mt-2">{course.description}</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Course Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className={`
            grid grid-cols-2 gap-4
            sm:grid-cols-4
          `}
          >
            <div>
              <p className="text-muted-foreground text-xs font-medium">
                Duration
              </p>
              <p className="mt-1 text-sm font-semibold">
                {course.estimatedHours}
                {" "}
                hours
              </p>
            </div>
            <div>
              <p className="text-muted-foreground text-xs font-medium">
                Lessons
              </p>
              <p className="mt-1 text-sm font-semibold">
                {course.lessons?.length ?? 0}
              </p>
            </div>
            <div>
              <p className="text-muted-foreground text-xs font-medium">
                Created
              </p>
              <p className="mt-1 text-sm font-semibold">
                {formatDate(course.createdAt)}
              </p>
            </div>
            <div>
              <p className="text-muted-foreground text-xs font-medium">
                Updated
              </p>
              <p className="mt-1 text-sm font-semibold">
                {formatDate(course.updatedAt)}
              </p>
            </div>
          </div>

          {course.tags && course.tags.length > 0 && (
            <div>
              <p className="text-muted-foreground mb-2 text-xs font-medium">
                Tags
              </p>
              <div className="flex flex-wrap gap-2">
                {course.tags.map((tag: string) => (
                  <Badge key={tag} variant="secondary">
                    {tag}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          <div className="flex gap-2 border-t pt-4">
            <CourseDialog mode="edit" course={course} triggerLabel="Edit Course" />
            <Button
              onClick={() => setDeleteConfirmOpen(true)}
              variant="destructive"
              size="sm"
            >
              Delete Course
            </Button>
          </div>
        </CardContent>
      </Card>

      <div>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-2xl font-bold">
            Lessons
            {" "}
            (
            {course.lessons?.length ?? 0}
            )
          </h2>
          <LessonDialog
            courseId={courseId}
            mode="create"
            recordings={recordings}
            onSuccessAction={handleLessonUpdated}
          />
        </div>

        <LessonsList
          courseId={courseId}
          lessons={course.lessons || []}
          recordings={recordings}
          onLessonUpdatedAction={handleLessonUpdated}
        />
      </div>

      <Dialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Course?</DialogTitle>
            <DialogDescription>
              This action cannot be undone. The course and all its lessons will
              be permanently deleted.
            </DialogDescription>
          </DialogHeader>
          <div className="flex gap-3">
            <Button
              disabled={deleteActionResult.isExecuting}
              onClick={() => setDeleteConfirmOpen(false)}
              type="button"
              variant="outline"
            >
              Cancel
            </Button>
            <Button
              disabled={deleteActionResult.isExecuting}
              onClick={handleDeleteCourse}
              type="button"
              variant="destructive"
            >
              {deleteActionResult.isExecuting ? "Deleting..." : "Delete"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
