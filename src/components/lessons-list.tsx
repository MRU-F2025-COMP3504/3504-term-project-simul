"use client";

import { ArrowDown, ArrowUp, Link2, Trash2 } from "lucide-react";
import { useAction } from "next-safe-action/hooks";
import { useCallback, useState } from "react";
import { toast } from "sonner";

import type { Lesson } from "~/types/course";
import type { Recording } from "~/types/recording";

import { Button } from "~/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import {
  deleteLessonAction,
  linkRecordingToLessonAction,
  reorderLessonsAction,
} from "~/lib/actions/lessons";

type LessonsListProps = {
  courseId: string;
  lessons: Lesson[];
  onLessonUpdatedAction?: () => void;
  recordings: Recording[];
};

export function LessonsList({
  courseId,
  lessons,
  onLessonUpdatedAction,
  recordings,
}: LessonsListProps) {
  const [linkingRecordingLessonId, setLinkingRecordingLessonId] = useState<
    string | null
  >(null);
  const [selectedRecordingId, setSelectedRecordingId] = useState<string>("");
  const [deleteConfirmLessonId, setDeleteConfirmLessonId] = useState<
    string | null
  >(null);

  const deleteAction = useAction(deleteLessonAction);
  const reorderAction = useAction(reorderLessonsAction);
  const linkRecordingAction = useAction(linkRecordingToLessonAction);

  const isLoading
    = deleteAction.isExecuting
      || reorderAction.isExecuting
      || linkRecordingAction.isExecuting;

  const sortedLessons = [...lessons].sort(
    (a, b) => a.orderIndex - b.orderIndex,
  );

  const handleMoveUp = useCallback(
    async (lessonId: string) => {
      const lesson = sortedLessons.find(l => l.id === lessonId);
      if (!lesson || lesson.orderIndex === 1)
        return;

      const lessonsToReorder = sortedLessons
        .filter(
          l =>
            l.orderIndex === lesson.orderIndex - 1
            || l.orderIndex === lesson.orderIndex,
        )
        .map(l => ({
          id: l.id,
          orderIndex:
            l.id === lessonId
              ? l.orderIndex - 1
              : l.orderIndex + 1,
        }));

      const result = await reorderAction.executeAsync({
        courseId,
        lessons: lessonsToReorder,
      });

      if (result?.data?.success) {
        toast.success("Lesson moved up");
        onLessonUpdatedAction?.();
      }
      else if (result?.serverError) {
        toast.error(result.serverError);
      }
    },
    [sortedLessons, courseId, reorderAction, onLessonUpdatedAction],
  );

  const handleMoveDown = useCallback(
    async (lessonId: string) => {
      const lesson = sortedLessons.find(l => l.id === lessonId);
      if (!lesson || lesson.orderIndex === sortedLessons.length)
        return;

      const lessonsToReorder = sortedLessons
        .filter(
          l =>
            l.orderIndex === lesson.orderIndex + 1
            || l.orderIndex === lesson.orderIndex,
        )
        .map(l => ({
          id: l.id,
          orderIndex:
            l.id === lessonId
              ? l.orderIndex + 1
              : l.orderIndex - 1,
        }));

      const result = await reorderAction.executeAsync({
        courseId,
        lessons: lessonsToReorder,
      });

      if (result?.data?.success) {
        toast.success("Lesson moved down");
        onLessonUpdatedAction?.();
      }
      else if (result?.serverError) {
        toast.error(result.serverError);
      }
    },
    [sortedLessons, courseId, reorderAction, onLessonUpdatedAction],
  );

  const handleDelete = useCallback(
    async (lessonId: string) => {
      const result = await deleteAction.executeAsync({
        id: lessonId,
        courseId,
      });

      if (result?.data?.success) {
        toast.success("Lesson deleted successfully");
        setDeleteConfirmLessonId(null);
        onLessonUpdatedAction?.();
      }
      else if (result?.serverError) {
        toast.error(result.serverError);
      }
    },
    [courseId, deleteAction, onLessonUpdatedAction],
  );

  const handleLinkRecording = useCallback(
    async (lessonId: string, recordingIdToLink: string) => {
      if (!recordingIdToLink) {
        toast.error("Please select a recording");
        return;
      }

      const result = await linkRecordingAction.executeAsync({
        lessonId,
        recordingId: recordingIdToLink,
      });

      if (result?.data?.lesson) {
        toast.success("Recording linked to lesson");
        setLinkingRecordingLessonId(null);
        setSelectedRecordingId("");
        onLessonUpdatedAction?.();
      }
      else if (result?.serverError) {
        toast.error(result.serverError);
      }
    },
    [linkRecordingAction, onLessonUpdatedAction],
  );

  if (sortedLessons.length === 0) {
    return (
      <div className={`
        bg-muted/30 flex min-h-[200px] flex-col items-center justify-center
        border p-8 text-center
      `}
      >
        <p className="text-muted-foreground">No lessons yet</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {sortedLessons.map((lesson, index) => {
        const recordingTitle = recordings.find(
          r => r.id === lesson.recordingId,
        )?.title;

        return (
          <Card key={lesson.id}>
            <CardHeader>
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <CardTitle className="text-base">
                    Lesson
                    {" "}
                    {lesson.orderIndex}
                    {": "}
                    {lesson.title}
                  </CardTitle>
                  {recordingTitle && (
                    <CardDescription className="mt-1 flex items-center gap-1.5">
                      <Link2 className="h-3 w-3" />
                      {recordingTitle}
                    </CardDescription>
                  )}
                  {!recordingTitle && (
                    <CardDescription className="mt-1">
                      No recording linked
                    </CardDescription>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                <Button
                  disabled={isLoading || index === 0}
                  onClick={() => handleMoveUp(lesson.id)}
                  size="sm"
                  variant="outline"
                >
                  <ArrowUp className="h-4 w-4" />
                </Button>
                <Button
                  disabled={isLoading || index === sortedLessons.length - 1}
                  onClick={() => handleMoveDown(lesson.id)}
                  size="sm"
                  variant="outline"
                >
                  <ArrowDown className="h-4 w-4" />
                </Button>

                <Button
                  disabled={isLoading}
                  onClick={() => {
                    setLinkingRecordingLessonId(lesson.id);
                    setSelectedRecordingId(lesson.recordingId || "");
                  }}
                  size="sm"
                  variant="outline"
                >
                  <Link2 className="h-4 w-4" />
                  Link Recording
                </Button>

                <Button
                  disabled={isLoading}
                  onClick={() => setDeleteConfirmLessonId(lesson.id)}
                  size="sm"
                  variant="outline"
                >
                  <Trash2 className="h-4 w-4" />
                  Delete
                </Button>
              </div>
            </CardContent>
          </Card>
        );
      })}

      <Dialog
        open={linkingRecordingLessonId !== null}
        onOpenChange={(open) => {
          if (!open) {
            setLinkingRecordingLessonId(null);
            setSelectedRecordingId("");
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Link Recording</DialogTitle>
            <DialogDescription>
              Select a recording to link to this lesson
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Select value={selectedRecordingId || "none"} onValueChange={val => setSelectedRecordingId(val === "none" ? "" : val)}>
              <SelectTrigger>
                <SelectValue placeholder="Select a recording..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Select a recording...</SelectItem>
                {recordings.map(recording => (
                  <SelectItem key={recording.id} value={recording.id}>
                    {recording.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              className="w-full"
              disabled={isLoading || !selectedRecordingId}
              onClick={() =>
                linkingRecordingLessonId
                && handleLinkRecording(
                  linkingRecordingLessonId,
                  selectedRecordingId,
                )}
              size="sm"
            >
              {isLoading ? "Linking..." : "Link Recording"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog
        open={deleteConfirmLessonId !== null}
        onOpenChange={(open) => {
          if (!open) {
            setDeleteConfirmLessonId(null);
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Lesson?</DialogTitle>
            <DialogDescription>
              This action cannot be undone. The lesson will be permanently
              deleted.
            </DialogDescription>
          </DialogHeader>
          <div className="flex gap-3">
            <Button
              disabled={isLoading}
              onClick={() => setDeleteConfirmLessonId(null)}
              type="button"
              variant="outline"
            >
              Cancel
            </Button>
            <Button
              disabled={isLoading}
              onClick={() =>
                deleteConfirmLessonId && handleDelete(deleteConfirmLessonId)}
              type="button"
              variant="destructive"
            >
              {isLoading ? "Deleting..." : "Delete"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
