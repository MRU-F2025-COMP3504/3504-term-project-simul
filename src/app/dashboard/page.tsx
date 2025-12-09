import { headers } from "next/headers";
import { redirect } from "next/navigation";

import Banner from "~/components/banner";
import { InstructorDashboardView } from "~/components/dashboard/instructor-dashboard-view";
import { StudentDashboardView } from "~/components/dashboard/student-dashboard-view";
import {
  getInstructorStatsAction,
  getStudentEnrolledCoursesAction,
} from "~/lib/actions/enrollments";
import { auth } from "~/lib/auth";

export default async function Dashboard() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    redirect("/sign-in");
  }

  if (session.user.role === "student") {
    // Fetch enrolled courses for student
    const result = await getStudentEnrolledCoursesAction();

    if (result.serverError) {
      return (
        <div className="flex min-h-screen flex-col">
          <Banner />
          <main className="flex-1">
            <div className="container mx-auto px-4 py-20">
              <p className="text-red-600">
                Failed to load courses
              </p>
            </div>
          </main>
        </div>
      );
    }

    return (
      <div className="flex min-h-screen flex-col">
        <Banner />
        <main className="flex-1">
          <div className="container mx-auto px-4 py-8">
            <StudentDashboardView enrolledCourses={result.data?.courses ?? []} />
          </div>
        </main>
      </div>
    );
  }

  if (session.user.role === "instructor") {
    // Fetch instructor stats
    const result = await getInstructorStatsAction();

    if (result.serverError) {
      return (
        <div className="flex min-h-screen flex-col">
          <Banner />
          <main className="flex-1">
            <div className="container mx-auto px-4 py-20">
              <p className="text-red-600">
                Failed to load stats
              </p>
            </div>
          </main>
        </div>
      );
    }

    return (
      <div className="flex min-h-screen flex-col">
        <Banner />
        <main className="flex-1">
          <div className="container mx-auto px-4 py-8">
            <InstructorDashboardView
              stats={result.data?.stats ?? {
                courseCount: 0,
                lessonCount: 0,
                totalRecordings: 0,
              }}
            />
          </div>
        </main>
      </div>
    );
  }

  // Unknown role
  return (
    <div className="flex min-h-screen flex-col">
      <Banner />
      <main className="flex-1">
        <div className="container mx-auto px-4 py-20">
          <p className="text-red-600">
            Unknown user role
          </p>
        </div>
      </main>
    </div>
  );
}
