/**
 * Format milliseconds to display time (HH:MM:SS or MM:SS)
 * @param timeInMs - Time in milliseconds
 * @returns Formatted time string
 */
export function formatDisplayTime(timeInMs: number): string {
  const parsedSeconds = Math.floor((timeInMs / 1000) % 60);
  const parsedMinutes = Math.floor((timeInMs / (1000 * 60)) % 60);
  const parsedHours = Math.floor((timeInMs / (1000 * 60 * 60)) % 24);

  const formattedSeconds = parsedSeconds < 10 ? `0${parsedSeconds}` : `${parsedSeconds}`;
  const formattedMinutes = parsedMinutes < 10 ? `0${parsedMinutes}` : `${parsedMinutes}`;
  const formattedHours = parsedHours < 10 ? `0${parsedHours}` : `${parsedHours}`;

  if (parsedHours === 0) {
    return `${formattedMinutes}:${formattedSeconds}`;
  }

  return `${formattedHours}:${formattedMinutes}:${formattedSeconds}`;
}
