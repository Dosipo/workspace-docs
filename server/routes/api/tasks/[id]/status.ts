import {
  TASK_STATUSES,
  type TaskStatus,
  type StatusUpdateBody,
  getTask,
  updateTask,
} from '../../../../utils/taskStore'

/**
 * PUT /api/tasks/:id/status  — transition a task to a new status.
 *
 * Body: { "status": "<new_status>" }
 *
 * Valid statuses: backlog | todo | in_progress | agent_review | in_review | blocked | done | cancelled
 *
 * `agent_review` — task is being reviewed by an automated agent (QA agent or
 * similar); no human action is required at this stage.
 */
export default defineEventHandler(async (event) => {
  const method = getMethod(event)

  if (method !== 'PUT') {
    setResponseStatus(event, 405)
    return { error: 'Method not allowed' }
  }

  const id = getRouterParam(event, 'id')!

  const existing = getTask(id)
  if (!existing) {
    setResponseStatus(event, 404)
    return { error: `Task ${id} not found` }
  }

  const body = await readBody<StatusUpdateBody>(event)

  if (!body?.status) {
    setResponseStatus(event, 400)
    return { error: 'status is required' }
  }

  if (!TASK_STATUSES.includes(body.status as TaskStatus)) {
    setResponseStatus(event, 400)
    return {
      error: `Invalid status "${body.status}". Allowed values: ${TASK_STATUSES.join(', ')}`,
    }
  }

  const task = updateTask(id, { status: body.status as TaskStatus })!

  return {
    task,
    previous_status: existing.status,
  }
})
