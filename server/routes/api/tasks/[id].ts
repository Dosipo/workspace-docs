import {
  TASK_STATUSES,
  type TaskStatus,
  type UpdateTaskBody,
  getTask,
  updateTask,
  deleteTask,
} from '../../../utils/taskStore'

/**
 * GET    /api/tasks/:id    — get a single task
 * PATCH  /api/tasks/:id    — update task fields (title, description, status)
 * DELETE /api/tasks/:id    — delete a task
 */
export default defineEventHandler(async (event) => {
  const method = getMethod(event)
  const id = getRouterParam(event, 'id')!

  if (method === 'GET') {
    const task = getTask(id)
    if (!task) {
      setResponseStatus(event, 404)
      return { error: `Task ${id} not found` }
    }
    return { task }
  }

  if (method === 'PATCH') {
    const body = await readBody<UpdateTaskBody>(event)

    if (body.status !== undefined && !TASK_STATUSES.includes(body.status as TaskStatus)) {
      setResponseStatus(event, 400)
      return {
        error: `Invalid status. Allowed values: ${TASK_STATUSES.join(', ')}`,
      }
    }

    const task = updateTask(id, {
      title: body.title?.trim(),
      description: body.description,
      status: body.status,
    })

    if (!task) {
      setResponseStatus(event, 404)
      return { error: `Task ${id} not found` }
    }

    return { task }
  }

  if (method === 'DELETE') {
    const existed = deleteTask(id)
    if (!existed) {
      setResponseStatus(event, 404)
      return { error: `Task ${id} not found` }
    }
    setResponseStatus(event, 204)
    return null
  }

  setResponseStatus(event, 405)
  return { error: 'Method not allowed' }
})
