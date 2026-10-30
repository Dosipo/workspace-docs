import {
  TASK_STATUSES,
  type TaskStatus,
  type CreateTaskBody,
  listTasks,
  createTask,
} from '../../../utils/taskStore'

/**
 * GET  /api/tasks          — list all tasks (optional ?status= filter)
 * POST /api/tasks          — create a new task
 */
export default defineEventHandler(async (event) => {
  const method = getMethod(event)

  if (method === 'GET') {
    const query = getQuery(event)
    const statusFilter = query.status as string | undefined

    if (statusFilter && !TASK_STATUSES.includes(statusFilter as TaskStatus)) {
      setResponseStatus(event, 400)
      return {
        error: `Invalid status. Allowed values: ${TASK_STATUSES.join(', ')}`,
      }
    }

    return {
      tasks: listTasks(statusFilter as TaskStatus | undefined),
      statuses: TASK_STATUSES,
    }
  }

  if (method === 'POST') {
    const body = await readBody<CreateTaskBody>(event)

    if (!body?.title || typeof body.title !== 'string' || !body.title.trim()) {
      setResponseStatus(event, 400)
      return { error: 'title is required' }
    }

    if (body.status && !TASK_STATUSES.includes(body.status)) {
      setResponseStatus(event, 400)
      return {
        error: `Invalid status. Allowed values: ${TASK_STATUSES.join(', ')}`,
      }
    }

    const task = createTask({
      title: body.title.trim(),
      description: body.description,
      status: body.status,
    })

    setResponseStatus(event, 201)
    return { task }
  }

  setResponseStatus(event, 405)
  return { error: 'Method not allowed' }
})
