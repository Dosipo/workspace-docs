/**
 * Task status enum.
 * `agent_review` — task is undergoing automated review by an AI/QA agent;
 * no human involvement required at this stage.
 */
export const TASK_STATUSES = [
  'backlog',
  'todo',
  'in_progress',
  'agent_review',
  'in_review',
  'blocked',
  'done',
  'cancelled',
] as const

export type TaskStatus = (typeof TASK_STATUSES)[number]

export interface Task {
  id: string
  title: string
  description?: string
  status: TaskStatus
  createdAt: string
  updatedAt: string
}

export interface CreateTaskBody {
  title: string
  description?: string
  status?: TaskStatus
}

export interface UpdateTaskBody {
  title?: string
  description?: string
  status?: TaskStatus
}

export interface StatusUpdateBody {
  status: TaskStatus
}

/** Singleton in-memory store. In production, replace with a database. */
const store = new Map<string, Task>()
let seq = 0

function nextId(): string {
  return `task-${++seq}`
}

export function listTasks(statusFilter?: TaskStatus | null): Task[] {
  const all = Array.from(store.values())
  if (!statusFilter) return all
  return all.filter((t) => t.status === statusFilter)
}

export function getTask(id: string): Task | undefined {
  return store.get(id)
}

export function createTask(body: CreateTaskBody): Task {
  const now = new Date().toISOString()
  const task: Task = {
    id: nextId(),
    title: body.title,
    description: body.description,
    status: body.status ?? 'todo',
    createdAt: now,
    updatedAt: now,
  }
  store.set(task.id, task)
  return task
}

export function updateTask(id: string, body: UpdateTaskBody): Task | undefined {
  const task = store.get(id)
  if (!task) return undefined
  if (body.title !== undefined) task.title = body.title
  if (body.description !== undefined) task.description = body.description
  if (body.status !== undefined) task.status = body.status
  task.updatedAt = new Date().toISOString()
  store.set(id, task)
  return task
}

export function deleteTask(id: string): boolean {
  return store.delete(id)
}
