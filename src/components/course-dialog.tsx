"use client";

import { useState } from "react";

import type { Course } from "~/types/course";

import { Button } from "~/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "~/components/ui/dialog";

import { CourseForm } from "./course-form";

type CourseDialogProps = {
  mode: "create" | "edit";
  course?: Course;
  onSuccess?: () => void;
  triggerLabel?: string;
};

export function CourseDialog({
  mode,
  course,
  onSuccess,
  triggerLabel,
}: CourseDialogProps) {
  const [open, setOpen] = useState(false);

  const isCreateMode = mode === "create";
  const title = isCreateMode ? "Create Course" : "Edit Course";
  const description = isCreateMode
    ? "Add a new course for your students"
    : "Update course information";
  const defaultTriggerLabel = isCreateMode ? "New Course" : "Edit";

  const handleSuccess = () => {
    setOpen(false);
    onSuccess?.();
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant={isCreateMode ? "default" : "outline"} size={isCreateMode ? "default" : "sm"}>
          {triggerLabel || defaultTriggerLabel}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <CourseForm
          mode={mode}
          initialData={course}
          onSuccess={handleSuccess}
        />
      </DialogContent>
    </Dialog>
  );
}
