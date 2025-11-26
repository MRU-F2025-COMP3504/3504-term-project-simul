"use client";

import { X } from "lucide-react";
import { useAction } from "next-safe-action/hooks";
import { useCallback, useMemo, useState } from "react";
import { toast } from "sonner";
import { z } from "zod";

import type { Course } from "~/types/course";

import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Textarea } from "~/components/ui/textarea";
import { createCourseAction, updateCourseAction } from "~/lib/actions/courses";

type CourseFormProps = {
  mode: "create" | "edit";
  initialData?: Course;
  onSuccessAction?: () => void;
};

const MAX_TITLE = 100;
const MAX_DESCRIPTION = 1000;
const MAX_TAGS = 5;

const courseFormSchema = z.object({
  title: z.string().min(1, "Title is required").max(MAX_TITLE, `Title must be at most ${MAX_TITLE} characters`),
  description: z.string().min(1, "Description is required").max(MAX_DESCRIPTION, `Description must be at most ${MAX_DESCRIPTION} characters`),
  estimatedHours: z.coerce.number().positive("Estimated hours must be greater than 0"),
  tags: z.array(z.string()).max(MAX_TAGS, `Maximum ${MAX_TAGS} tags allowed`),
  thumbnailUrl: z.string().url("Invalid URL format").optional().nullable(),
});

export function CourseForm({
  mode,
  initialData,
  onSuccessAction,
}: CourseFormProps) {
  const [title, setTitle] = useState(initialData?.title || "");
  const [description, setDescription] = useState(initialData?.description || "");
  const [estimatedHours, setEstimatedHours] = useState(
    initialData?.estimatedHours?.toString() || "",
  );
  const [tags, setTags] = useState<string[]>(initialData?.tags || []);
  const [tagInput, setTagInput] = useState("");
  const [thumbnailUrl, setThumbnailUrl] = useState(
    initialData?.thumbnailUrl || "",
  );
  const [thumbnailPreviewError, setThumbnailPreviewError] = useState(false);

  const createAction = useAction(createCourseAction);
  const updateAction = useAction(updateCourseAction);

  const isLoading = createAction.isExecuting || updateAction.isExecuting;
  const titleLength = title.length;
  const descriptionLength = description.length;

  const isFormValid = useMemo(() => {
    const result = courseFormSchema.safeParse({
      title: title.trim(),
      description: description.trim(),
      estimatedHours,
      tags,
      thumbnailUrl: thumbnailUrl.trim(),
    });
    return result.success;
  }, [title, description, estimatedHours, tags, thumbnailUrl]);

  const handleAddTag = useCallback(() => {
    const trimmedTag = tagInput.trim();
    if (
      trimmedTag
      && !tags.includes(trimmedTag)
      && tags.length < MAX_TAGS
    ) {
      setTags([...tags, trimmedTag]);
      setTagInput("");
    }
  }, [tagInput, tags]);

  const handleRemoveTag = useCallback((tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  }, [tags]);

  const handleTagInputKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Enter") {
        e.preventDefault();
        handleAddTag();
      }
    },
    [handleAddTag],
  );

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const formData = {
      title: title.trim(),
      description: description.trim(),
      estimatedHours,
      tags,
      thumbnailUrl: thumbnailUrl.trim(),
    };

    const validation = courseFormSchema.safeParse(formData);

    if (!validation.success) {
      const firstError = validation.error.issues[0];
      toast.error(firstError?.message || "Please fill in all required fields");
      return;
    }

    const payload = {
      title: validation.data.title,
      description: validation.data.description,
      estimatedHours: validation.data.estimatedHours,
      tags: validation.data.tags.length > 0 ? validation.data.tags : undefined,
      thumbnailUrl: validation.data.thumbnailUrl || undefined,
    };

    if (mode === "create") {
      const result = await createAction.executeAsync(payload);
      if (result?.data?.course) {
        toast.success("Course created successfully");
        setTitle("");
        setDescription("");
        setEstimatedHours("");
        setTags([]);
        setThumbnailUrl("");
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
      if (result?.data?.course) {
        toast.success("Course updated successfully");
        onSuccessAction?.();
      }
      else if (result?.serverError) {
        toast.error(result.serverError);
      }
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-2">
        <label htmlFor="title" className="block text-sm font-medium">
          Course Title
        </label>
        <Input
          id="title"
          placeholder="e.g., Introduction to JavaScript"
          value={title}
          onChange={e => setTitle(e.target.value.slice(0, MAX_TITLE))}
          disabled={isLoading}
          maxLength={MAX_TITLE}
        />
        <div className="text-muted-foreground text-right text-xs">
          {titleLength}
          /
          {MAX_TITLE}
        </div>
      </div>

      <div className="space-y-2">
        <label
          htmlFor="description"
          className="block text-sm font-medium"
        >
          Description
        </label>
        <Textarea
          id="description"
          placeholder="Describe what students will learn in this course..."
          value={description}
          onChange={e => setDescription(e.target.value.slice(0, MAX_DESCRIPTION))}
          disabled={isLoading}
          maxLength={MAX_DESCRIPTION}
        />
        <div className="text-muted-foreground text-right text-xs">
          {descriptionLength}
          /
          {MAX_DESCRIPTION}
        </div>
      </div>

      <div className="space-y-2">
        <label
          htmlFor="estimatedHours"
          className="block text-sm font-medium"
        >
          Estimated Hours
        </label>
        <Input
          id="estimatedHours"
          type="number"
          placeholder="e.g., 8"
          value={estimatedHours}
          onChange={e => setEstimatedHours(e.target.value)}
          disabled={isLoading}
          min="1"
          step="0.5"
        />
      </div>

      <div className="space-y-2">
        <label htmlFor="tags" className="block text-sm font-medium">
          Tags
          <span className="text-muted-foreground ml-2 text-xs">
            (max
            {" "}
            {MAX_TAGS}
            )
          </span>
        </label>
        <div className="space-y-2">
          <div className="flex gap-2">
            <Input
              id="tags"
              placeholder="Add a tag and press Enter"
              value={tagInput}
              onChange={e => setTagInput(e.target.value)}
              onKeyDown={handleTagInputKeyDown}
              disabled={isLoading || tags.length >= MAX_TAGS}
            />
            <Button
              type="button"
              variant="outline"
              onClick={handleAddTag}
              disabled={isLoading || tags.length >= MAX_TAGS || !tagInput.trim()}
            >
              Add
            </Button>
          </div>
          {tags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {tags.map(tag => (
                <div
                  key={tag}
                  className={`
                    bg-secondary text-secondary-foreground inline-flex
                    items-center gap-2 px-3 py-1 text-sm
                  `}
                >
                  {tag}
                  <button
                    type="button"
                    onClick={() => handleRemoveTag(tag)}
                    disabled={isLoading}
                    className={`
                      ml-1
                      hover:opacity-70
                    `}
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="space-y-2">
        <label
          htmlFor="thumbnailUrl"
          className="block text-sm font-medium"
        >
          Thumbnail URL
          <span className="text-muted-foreground ml-2 text-xs">(optional)</span>
        </label>
        <Input
          id="thumbnailUrl"
          placeholder="https://example.com/image.jpg"
          value={thumbnailUrl}
          onChange={e => setThumbnailUrl(e.target.value)}
          disabled={isLoading}
          type="url"
        />
        {thumbnailUrl && !thumbnailPreviewError && (
          <div className="mt-3 border p-3">
            <img
              src={thumbnailUrl}
              alt="Thumbnail preview"
              className="max-h-32 w-auto"
              onError={() => setThumbnailPreviewError(true)}
            />
          </div>
        )}
        {thumbnailPreviewError && (
          <div className="text-destructive mt-2 text-xs">
            Failed to load image preview
          </div>
        )}
      </div>

      <div className="flex gap-3 pt-4">
        <Button
          type="submit"
          disabled={isLoading || !isFormValid}
          className="flex-1"
        >
          {isLoading ? "Saving..." : mode === "create" ? "Create Course" : "Update Course"}
        </Button>
      </div>
    </form>
  );
}
