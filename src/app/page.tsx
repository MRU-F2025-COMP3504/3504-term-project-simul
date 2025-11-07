import type { LucideIcon } from "lucide-react";

import { CheckCircle, MousePointerClick, PlayCircle } from "lucide-react";
import { headers } from "next/headers";
import Link from "next/link";

import SignInButton from "~/components/auth/signin-button";
import Banner from "~/components/banner";
import Footer from "~/components/footer";
import { Button } from "~/components/ui/button";
import { auth } from "~/lib/auth";

type FeatureCardProps = {
  icon: LucideIcon;
  title: string;
  description: string;
};

function FeatureCard({ icon: Icon, title, description }: FeatureCardProps) {
  return (
    <div className={`
      bg-card border p-6 transition-shadow
      hover:shadow-lg
    `}
    >
      <div className={`
        bg-primary/10 mb-4 flex h-12 w-12 items-center justify-center
      `}
      >
        <Icon className="text-primary h-6 w-6" />
      </div>
      <h3 className="mb-2 text-xl font-semibold">{title}</h3>
      <p className="text-muted-foreground">
        {description}
      </p>
    </div>
  );
}

export default async function Home() {
  const session = await auth.api.getSession({ headers: await headers() });

  return (
    <div className="flex min-h-screen flex-col">
      <Banner />
      <main className="flex-1">
        <div className={`
          container mx-auto px-4 py-20
          md:py-32
        `}
        >
          <div className="mx-auto max-w-4xl text-center">
            <div className={`
              bg-muted text-muted-foreground mb-6 inline-flex items-center
              rounded-full border px-3 py-1 text-sm font-medium
            `}
            >
              <span className="bg-primary mr-2 h-2 w-2 rounded-full"></span>
              Educational Coding Platform
            </div>

            <h1 className={`
              mb-6 text-4xl font-bold tracking-tight
              sm:text-5xl
              md:text-6xl
              lg:text-7xl
            `}
            >
              Learn Coding Through
              <span className={`
                from-primary to-primary/60 block bg-gradient-to-r bg-clip-text
                text-transparent
              `}
              >
                Interactive Playbacks
              </span>
            </h1>

            <p className={`
              text-muted-foreground mx-auto mb-10 max-w-2xl text-lg
              sm:text-xl
            `}
            >
              Watch instructor coding playbacks, take control of the editor, and practice with
              hands-on exercises. Perfect for instructors creating interactive lessons and students
              learning by doing.
            </p>

            <div className={`
              flex flex-col items-center justify-center gap-4
              sm:flex-row
            `}
            >
              {session
                ? (
                    <Button
                      asChild
                      size="lg"
                      className="min-w-[200px] text-base"
                    >
                      <Link href="/dashboard">Go to Dashboard</Link>
                    </Button>
                  )
                : (
                    <>
                      <SignInButton
                        size="lg"
                        className="min-w-[200px] text-base"
                      />
                      <Button
                        asChild
                        variant="outline"
                        size="lg"
                        className="min-w-[200px] text-base"
                      >
                        <Link href="#features">Learn More</Link>
                      </Button>
                    </>
                  )}
            </div>
          </div>
        </div>

        <div id="features" className="bg-muted/30 border-t py-20">
          <div className="container mx-auto px-4">
            <div className="mx-auto max-w-5xl">
              <h2 className={`
                mb-12 text-center text-3xl font-bold tracking-tight
                sm:text-4xl
              `}
              >
                How It Works
              </h2>
              <div className={`
                grid gap-8
                md:grid-cols-3
              `}
              >
                <FeatureCard
                  icon={PlayCircle}
                  title="Instructor Recordings"
                  description="Instructors create interactive coding session recordings that capture every keystroke, demonstrating problem-solving techniques in real-time."
                />

                <FeatureCard
                  icon={MousePointerClick}
                  title="Watch & Take Control"
                  description="Students watch instructor playbacks and seamlessly take over the editor to write their own code, experimenting with the concepts being taught."
                />

                <FeatureCard
                  icon={CheckCircle}
                  title="Practice with Tests"
                  description="Run test cases provided by instructors to validate your solutions and get immediate feedback on your code."
                />
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
