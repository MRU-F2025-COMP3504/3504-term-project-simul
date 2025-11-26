"use client";

import { useState } from "react";

import type { Lesson } from "~/types/course";

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

type Recording = {
  id: string;
  title: string;
  duration?: number | null;
  createdAt: Date;
};

type LessonDialogProps = {
  courseId: string;
  lesson?: Lesson;
  mode: "create" | "edit";
  onSuccess?: () => void;
  recordings: Recording[];
  triggerLabel?: string;
};

export function LessonDialog({
  courseId,
  lesson,
  mode,
  onSuccess,
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
    onSuccess?.();
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
          onSuccess={handleSuccess}
          recordings={recordings}
        />
      </DialogContent>
    </Dialog>
  );
}
