import { headers } from "next/headers";

import Banner from "~/components/banner";
import CoursesListView from "~/components/courses-list-view";
import Footer from "~/components/footer";
import { auth } from "~/lib/auth";
import { db } from "~/lib/db";
import { course } from "~/lib/db/schema";

export const dynamic = "force-dynamic";

export default async function CoursesPage() {
  // Fetch all courses from database
  const allCourses = await db.select().from(course);

  // Get current user session to check enrollment status
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  const userId = session?.user?.id;

  // Fetch user's enrollments if logged in
  let enrolledCourseIds = new Set<string>();
  if (userId) {
    const { getStudentEnrolledCoursesAction } = await import("~/lib/actions/enrollments");
    try {
      const result = await getStudentEnrolledCoursesAction();
      if (result.data?.courses) {
        enrolledCourseIds = new Set(result.data.courses.map(c => c.id));
      }
    }
    catch (error) {
      console.error("Failed to fetch enrolled courses:", error);
    }
  }

  // Map database courses to Course type and add enrollment status
  const coursesWithStatus = allCourses.map(c => ({
    id: c.id,
    title: c.title,
    description: c.description,
    thumbnailUrl: c.thumbnailUrl,
    instructorName: c.instructorName,
    estimatedHours: c.estimatedHours,
    tags: c.tags,
    createdBy: c.createdBy,
    createdAt: c.createdAt,
    updatedAt: c.updatedAt,
    isEnrolled: enrolledCourseIds.has(c.id),
  }));

  return (
    <div className="flex min-h-screen flex-col">
      <Banner />
      <main className="flex-1">
        <div className="container mx-auto px-4 py-8">
          {/* Header Section */}
          <div className="mb-8">
            <h1 className={`
              mb-4 text-4xl font-bold tracking-tight
              sm:text-5xl
            `}
            >
              Explore
              <span className={`
                from-primary to-primary/60 ml-3 bg-gradient-to-r bg-clip-text
                text-transparent
              `}
              >
                Our Courses
              </span>
            </h1>

            <p className="text-muted-foreground max-w-2xl text-lg">
              Choose from our collection of interactive coding courses. Watch instructor
              playbacks, practice with hands-on exercises, and master new skills.
            </p>
          </div>

          {/* Courses List with Detail View */}
          <CoursesListView courses={coursesWithStatus} isLoggedIn={!!userId} />
        </div>
      </main>
      <Footer />
    </div>
  );
}
