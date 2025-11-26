"use client";

import { useAction } from "next-safe-action/hooks";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { z } from "zod";

import type { Lesson } from "~/types/course";

import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { createLessonAction, updateLessonAction } from "~/lib/actions/lessons";

type Recording = {
  id: string;
  title: string;
  duration?: number | null;
  createdAt: Date;
};

type LessonFormProps = {
  courseId: string;
  initialData?: Lesson;
  mode: "create" | "edit";
  onSuccess?: () => void;
  recordings: Recording[];
};

const MAX_TITLE = 100;

const lessonFormSchema = z.object({
  title: z.string().min(1, "Title is required").max(MAX_TITLE, `Title must be at most ${MAX_TITLE} characters`),
  recordingId: z.uuid("Invalid recording ID").or(z.literal("")).optional(),
});

export function LessonForm({
  courseId,
  initialData,
  mode,
  onSuccess,
  recordings,
}: LessonFormProps) {
  const [title, setTitle] = useState(initialData?.title || "");
  const [recordingId, setRecordingId] = useState(
    initialData?.recordingId || "",
  );

  const createAction = useAction(createLessonAction);
  const updateAction = useAction(updateLessonAction);

  const isLoading = createAction.isExecuting || updateAction.isExecuting;
  const titleLength = title.length;

  const isFormValid = useMemo(() => {
    const result = lessonFormSchema.safeParse({
      title: title.trim(),
      recordingId: recordingId.trim(),
    });
    return result.success;
  }, [title, recordingId]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const formData = {
      title: title.trim(),
      recordingId: recordingId.trim(),
    };

    const validation = lessonFormSchema.safeParse(formData);

    if (!validation.success) {
      const firstError = validation.error.issues[0];
      toast.error(firstError?.message || "Please enter a lesson title");
      return;
    }

    const payload = {
      courseId,
      title: validation.data.title,
      recordingId: validation.data.recordingId || undefined,
    };

    if (mode === "create") {
      const result = await createAction.executeAsync(payload);
      if (result?.data?.lesson) {
        toast.success("Lesson created successfully");
        setTitle("");
        setRecordingId("");
        onSuccess?.();
      }
      else if (result?.serverError) {
        toast.error(result.serverError);
      }
    }
    else if (mode === "edit" && initialData) {
      const result = await updateAction.executeAsync({
        id: initialData.id,
        ...payload,
      });
      if (result?.data?.lesson) {
        toast.success("Lesson updated successfully");
        onSuccess?.();
      }
      else if (result?.serverError) {
        toast.error(result.serverError);
      }
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <label htmlFor="lessonTitle" className="block text-sm font-medium">
          Lesson Title
        </label>
        <Input
          disabled={isLoading}
          id="lessonTitle"
          maxLength={MAX_TITLE}
          onChange={e => setTitle(e.target.value.slice(0, MAX_TITLE))}
          placeholder="e.g., Variables and Data Types"
          value={title}
        />
        <div className="text-muted-foreground text-right text-xs">
          {titleLength}
          /
          {MAX_TITLE}
        </div>
      </div>

      <div className="space-y-2">
        <label htmlFor="recordingId" className="block text-sm font-medium">
          Recording
          <span className="text-muted-foreground ml-2 text-xs">(optional)</span>
        </label>
        <select
          className={`
            placeholder:text-muted-foreground
            selection:bg-primary selection:text-primary-foreground
            dark:bg-input/30
            border-input h-9 w-full border bg-transparent px-3 py-1 text-base
            shadow-xs transition-[color,box-shadow] outline-none
            focus-visible:border-ring focus-visible:ring-ring/50
            focus-visible:ring-[3px]
            aria-invalid:ring-destructive/20 aria-invalid:border-destructive
            dark:aria-invalid:ring-destructive/40
            disabled:pointer-events-none disabled:cursor-not-allowed
            disabled:opacity-50
            md:text-sm
          `}
          disabled={isLoading}
          id="recordingId"
          onChange={e => setRecordingId(e.target.value)}
          value={recordingId}
        >
          <option value="">No recording linked</option>
          {recordings.map(recording => (
            <option key={recording.id} value={recording.id}>
              {recording.title}
            </option>
          ))}
        </select>
      </div>

      <div className="flex gap-3 pt-2">
        <Button
          className="flex-1"
          disabled={isLoading || !isFormValid}
          type="submit"
        >
          {isLoading
            ? "Saving..."
            : mode === "create"
              ? "Add Lesson"
              : "Update Lesson"}
        </Button>
      </div>
    </form>
  );
}
