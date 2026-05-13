export type TaskStatus = 'todo' | 'in-progress' | 'completed' | 'failed';

export interface SubTask {
  id: string;
  title: string;
  description: string;
  status: TaskStatus;
  assignedAgent?: string | undefined;
  model?: string | undefined;
  context?: string | undefined;
  executionHint?: string | undefined;
  dependsOn: string[];
  result?: string;
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
