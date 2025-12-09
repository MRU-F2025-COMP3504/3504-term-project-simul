"use client";

import Link from "next/link";

import type { InstructorStats } from "~/lib/actions/enrollments";

import { Button } from "~/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";

type InstructorDashboardViewProps = {
  stats: InstructorStats;
};

export function InstructorDashboardView({
  stats,
}: InstructorDashboardViewProps) {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Instructor Dashboard</h1>
          <p className="text-muted-foreground">
            Manage your courses and view statistics
          </p>
        </div>
        <Link href="/dashboard/instructor/courses">
          <Button>Manage Courses</Button>
        </Link>
      </div>

      {/* Stats Grid */}
      <div
        className={`
          grid gap-4
          md:grid-cols-3
        `}
      >
        {/* Courses Card */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">
              Courses Created
            </CardTitle>
            <CardDescription>Total courses</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.courseCount}</div>
            <p className="text-muted-foreground mt-1 text-xs">
              {stats.courseCount === 0
                ? "No courses yet"
                : `${stats.courseCount} course${stats.courseCount === 1 ? "" : "s"}`}
            </p>
          </CardContent>
        </Card>

        {/* Lessons Card */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Lessons</CardTitle>
            <CardDescription>Total lessons</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.lessonCount}</div>
            <p className="text-muted-foreground mt-1 text-xs">
              {stats.lessonCount === 0
                ? "No lessons yet"
                : `${stats.lessonCount} lesson${stats.lessonCount === 1 ? "" : "s"}`}
            </p>
          </CardContent>
        </Card>

        {/* Recordings Card */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Recordings</CardTitle>
            <CardDescription>Lessons with recordings</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.totalRecordings}</div>
            <p className="text-muted-foreground mt-1 text-xs">
              {stats.totalRecordings === 0
                ? "No recordings yet"
                : `${stats.totalRecordings} recording${stats.totalRecordings === 1 ? "" : "s"}`}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <Link href="/dashboard/instructor/courses">
            <Button variant="outline" className="w-full justify-start">
              Manage Courses
            </Button>
          </Link>
          <Link href="/dashboard/instructor/courses/create">
            <Button variant="outline" className="w-full justify-start">
              Create New Course
            </Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
