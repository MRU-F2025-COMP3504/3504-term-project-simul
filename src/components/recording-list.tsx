import { useEffect, useState } from "react";

import { Button } from "~/components/ui/button";
import { deleteRecordingAction, listRecordingsAction } from "~/lib/actions/recordings";

type RecordingListProps = {
  onSelectRecording: (recordingId: string) => void;
};

type RecordingInfo = {
  id: string;
  title: string;
  problemTitle: string;
  createdAt: string;
  duration: number;
};

export function RecordingList({ onSelectRecording }: RecordingListProps) {
  const [recordings, setRecordings] = useState<RecordingInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const loadRecordings = async () => {
    try {
      setLoading(true);
      const result = await listRecordingsAction();

      if (result.data && Array.isArray(result.data.recordings)) {
        setRecordings(result.data.recordings);
        setActionError(null);
      }
      else {
        setError("Invalid data format received");
        console.error("Invalid data format received");
        setRecordings([]);
      }
    }
    catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load recordings");
    }
    finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRecordings();
  }, []);

  const handleDelete = async (recordingId: string) => {
    setActionError(null);
    setDeletingId(recordingId);

    try {
      await deleteRecordingAction({ id: recordingId });
      setRecordings(prev => prev.filter(recording => recording.id !== recordingId));
    }
    catch (err) {
      setActionError(err instanceof Error ? err.message : "Failed to delete recording");
    }
    finally {
      setDeletingId(null);
    }
  };

  const formatDuration = (ms: number) => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  if (loading) {
    return <div className="p-4 text-center">Loading recordings...</div>;
  }

  if (error) {
    return (
      <div className="text-destructive p-4 text-center">
        <p>
          Error:
          {" "}
          {error}
        </p>
        <Button onClick={loadRecordings} variant="outline" className="mt-2">
          Retry
        </Button>
      </div>
    );
  }

  if (recordings.length === 0) {
    return (
      <div className="text-muted-foreground p-4 text-center">
        No recordings found. Create a recording first.
      </div>
    );
  }

  return (
    <div className="p-4">
      {actionError && (
        <div className="text-destructive mb-3 text-sm">
          {actionError}
        </div>
      )}
      <div className="space-y-2">
        {recordings.map(recording => (
          <div
            key={recording.id}
            className={`
              hover:bg-accent
              cursor-pointer rounded-lg border p-3
            `}
          >
            <div className="flex flex-col items-start justify-between">
              <div className="flex-1">
                <h4 className="font-medium">{recording.title}</h4>
                <p className="text-muted-foreground text-sm">
                  {recording.problemTitle}
                </p>
                <div className="text-muted-foreground mt-1 flex gap-4 text-xs">
                  <span>{formatDate(recording.createdAt)}</span>
                  <span>{formatDuration(recording.duration)}</span>
                </div>
              </div>
              <div className="mt-1 flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelectRecording(recording.id);
                  }}
                >
                  Load
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  disabled={deletingId === recording.id}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDelete(recording.id);
                  }}
                >
                  {deletingId === recording.id ? "Deleting..." : "Delete"}
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
