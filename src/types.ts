export type TaskStatus = 'todo' | 'in-progress' | 'completed' | 'failed';

export interface SubTask {
  id: string;
  title: string;
  description: string;
  status: TaskStatus;
  assignedAgent?: string;
  context?: string | undefined;
  executionHint?: string | undefined;
}

export interface Task {
  id: string;
  goal: string;
  description: string;
  status: TaskStatus;
  subTasks: SubTask[];
  createdAt: string;
  updatedAt: string;
}
