"use client";

import { useAction } from "next-safe-action/hooks";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { z } from "zod";

import type { Lesson } from "~/types/course";

import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
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
  onSuccessAction?: () => void;
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
  onSuccessAction,
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
        onSuccessAction?.();
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
        onSuccessAction?.();
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
        <label className="block text-sm font-medium">
          Recording
          <span className="text-muted-foreground ml-2 text-xs">(optional)</span>
        </label>
        {recordings.length > 0
          ? (
              <Select value={recordingId || "none"} onValueChange={val => setRecordingId(val === "none" ? "" : val)} disabled={isLoading}>
                <SelectTrigger>
                  <SelectValue placeholder="No recording linked" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No recording linked</SelectItem>
                  {recordings.map(recording => (
                    <SelectItem key={recording.id} value={recording.id}>
                      {recording.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )
          : (
              <div className="text-muted-foreground px-3 py-2 text-sm">No recordings available</div>
            )}
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
