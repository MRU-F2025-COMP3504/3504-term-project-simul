// TODO: This is a dead-simple file-storage implementation of RecordingStorage.
// We (I, probably) need to slot this out for a proper database solution later.
// I just wanted to get something working for now.

import { promises as fs } from "node:fs";
import path from "node:path";
import { v4 as uuidv4 } from "uuid";

import type { RecordingData } from "~/types/recording";

type RecordingIndexEntry = {
  id: string;
  title: string;
  problemTitle: string;
  createdAt: string;
  duration: number;
};

/**
 * File-based storage for coding session recordings
 *
 * Stores recordings as JSON files in a recordings/ directory.
 * Maintains an index file for quick listing and lookup.
 */
export class RecordingStorage {
  private static readonly RECORDINGS_DIR = "recordings";
  private static readonly INDEX_FILE = "recordings/index.json";

  /**
   * Ensure the recordings directory exists
   */
  private static async ensureDirectoryExists(): Promise<void> {
    try {
      await fs.access(this.RECORDINGS_DIR);
    }
    catch {
      await fs.mkdir(this.RECORDINGS_DIR, { recursive: true });
    }
  }

  /**
   * Save a recording to disk
   *
   * @param recording - The recording data to save
   * @returns The file path where the recording was saved
   */
  static async save(recording: RecordingData): Promise<string> {
    await this.ensureDirectoryExists();

    if (!recording.id) {
      recording.id = uuidv4();
    }

    const filePath = path.join(this.RECORDINGS_DIR, `${recording.id}.json`);

    await fs.writeFile(filePath, JSON.stringify(recording, null, 2), "utf-8");

    await this.updateIndex();

    return filePath;
  }

  /**
   * Load a recording by ID
   *
   * @param id - The recording ID to load
   * @returns The recording data
   * @throws Error if recording not found
   */
  static async load(id: string): Promise<RecordingData> {
    const filePath = path.join(this.RECORDINGS_DIR, `${id}.json`);

    try {
      const content = await fs.readFile(filePath, "utf-8");
      return JSON.parse(content) as RecordingData;
    }
    catch (error) {
      throw new Error(`Recording with ID ${id} not found: ${error}`);
    }
  }

  /**
   * List all available recordings
   *
   * @returns Array of recording metadata (without full event data for performance)
   */
  static async list(): Promise<RecordingIndexEntry[]> {
    try {
      const indexContent = await fs.readFile(this.INDEX_FILE, "utf-8");
      return JSON.parse(indexContent);
    }
    catch {
      await this.updateIndex();
      return this.list();
    }
  }

  /**
   * Delete a recording
   *
   * @param id - The recording ID to delete
   */
  static async delete(id: string): Promise<void> {
    const filePath = path.join(this.RECORDINGS_DIR, `${id}.json`);

    try {
      await fs.unlink(filePath);
      await this.updateIndex();
    }
    catch (error) {
      throw new Error(`Failed to delete recording ${id}: ${error}`);
    }
  }

  /**
   * Update the index file with current recordings
   */
  private static async updateIndex(): Promise<void> {
    try {
      const files = await fs.readdir(this.RECORDINGS_DIR);
      const jsonFiles = files.filter(file => file.endsWith(".json") && file !== "index.json");

      const recordings: RecordingIndexEntry[] = [];

      for (const file of jsonFiles) {
        try {
          const id = path.basename(file, ".json");
          const recording = await this.load(id);

          recordings.push({
            id: recording.id,
            title: recording.title,
            problemTitle: recording.problem.title,
            createdAt: recording.metadata.createdAt,
            duration: recording.metadata.duration,
          });
        }
        catch {
          // no idea if this will hit
          console.warn(`Skipping recording file: ${file}`);
        }
      }

      // newest first
      recordings.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

      await fs.writeFile(this.INDEX_FILE, JSON.stringify(recordings, null, 2), "utf-8");
    }
    catch (error) {
      console.error("Failed to update recordings index:", error);
    }
  }
}
