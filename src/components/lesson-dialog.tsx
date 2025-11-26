"use client";

import { useState } from "react";

import type { Lesson } from "~/types/course";
import type { Recording } from "~/types/recording";

import { Button } from "~/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "~/components/ui/dialog";

import { LessonForm } from "./lesson-form";

type LessonDialogProps = {
  courseId: string;
  lesson?: Lesson;
  mode: "create" | "edit";
  onSuccessAction?: () => void;
  recordings: Recording[];
  triggerLabel?: string;
};

export function LessonDialog({
  courseId,
  lesson,
  mode,
  onSuccessAction,
  recordings,
  triggerLabel,
}: LessonDialogProps) {
  const [open, setOpen] = useState(false);

  const isCreateMode = mode === "create";
  const title = isCreateMode ? "Add Lesson" : "Edit Lesson";
  const description = isCreateMode
    ? "Create a new lesson for this course"
    : "Update lesson information";
  const defaultTriggerLabel = isCreateMode ? "Add Lesson" : "Edit";

  const handleSuccess = () => {
    setOpen(false);
    onSuccessAction?.();
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          size={isCreateMode ? "default" : "sm"}
          variant={isCreateMode ? "default" : "outline"}
        >
          {triggerLabel || defaultTriggerLabel}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <LessonForm
          courseId={courseId}
          initialData={lesson}
          mode={mode}
          onSuccessAction={handleSuccess}
          recordings={recordings}
        />
      </DialogContent>
    </Dialog>
  );
}
