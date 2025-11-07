import Banner from "~/components/banner";
import CoursesListView from "~/components/courses-list-view";
import Footer from "~/components/footer";
import { MOCK_COURSES } from "~/lib/mock-data/courses";

export default async function CoursesPage() {
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
          <CoursesListView courses={MOCK_COURSES} />
        </div>
      </main>
      <Footer />
    </div>
  );
}
