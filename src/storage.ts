import fs from 'fs/promises';
import path from 'path';
import type { Task } from './types.js';

const STORAGE_FILE = path.join(process.cwd(), '.tasks.json');

export async function readTasks(): Promise<Task[]> {
  try {
    const data = await fs.readFile(STORAGE_FILE, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    return [];
  }
}

export async function writeTasks(tasks: Task[]): Promise<void> {
  await fs.writeFile(STORAGE_FILE, JSON.stringify(tasks, null, 2));
}

export async function getTask(id: string): Promise<Task | undefined> {
  const tasks = await readTasks();
  return tasks.find(t => t.id === id);
}

export async function saveTask(task: Task): Promise<void> {
  const tasks = await readTasks();
  const index = tasks.findIndex(t => t.id === task.id);
  if (index !== -1) {
    tasks[index] = { ...task, updatedAt: new Date().toISOString() };
  } else {
    tasks.push({ ...task, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() });
  }
  await writeTasks(tasks);
}
