"use client";

import { useAction } from "next-safe-action/hooks";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { enrollInCourseAction } from "~/lib/actions/enrollments";

type EnrollmentButtonProps = {
  courseId: string;
  initialIsEnrolled: boolean;
  isLoggedIn?: boolean;
};

export default function EnrollmentButton({
  courseId,
  initialIsEnrolled,
  isLoggedIn,
}: EnrollmentButtonProps) {
  const router = useRouter();
  const [isEnrolled, setIsEnrolled] = useState(initialIsEnrolled);
  const { executeAsync, isExecuting } = useAction(enrollInCourseAction);

  const handleEnroll = async () => {
    if (!isLoggedIn) {
      // Redirect to login if not authenticated
      router.push("/auth");
      return;
    }

    if (isEnrolled) {
      // If already enrolled, navigate to course
      router.push(`/dashboard/courses/${courseId}`);
      return;
    }

    const result = await executeAsync({ courseId });
    if (result?.data?.success) {
      toast.success("Enrolled successfully!");
      // Update state immediately to show enrolled UI
      setIsEnrolled(true);
    }
    else if (result?.serverError) {
      toast.error(result.serverError);
    }
  };

  if (isEnrolled) {
    return (
      <div className="space-y-2">
        <Badge className="w-full justify-center" variant="secondary">
          Enrolled
        </Badge>
        <Button
          onClick={handleEnroll}
          className="w-full"
          size="lg"
        >
          View Course
        </Button>
      </div>
    );
  }

  return (
    <Button
      onClick={handleEnroll}
      disabled={isExecuting}
      className="w-full"
      size="lg"
    >
      {isExecuting ? "Enrolling..." : "Enroll Now"}
    </Button>
  );
}
