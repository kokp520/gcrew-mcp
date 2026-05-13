# gcrew-mcp

`gcrew-mcp` is a task orchestration and state management tool based on the Model Context Protocol (MCP). Its core philosophy is to serve as the "Orchestrator/Brain" for AI agents, responsible for decomposing complex goals into executable sub-tasks and improving work efficiency through state tracking.

## Core Positioning

*   **gcrew-mcp (Orchestrator/Brain)**: Task dispatcher. Responsible for "planning" and "tracking". It helps AI agents manage complex task flows, ensuring every step is correctly recorded and obtains the required context.

## Typical Use Case: Task Automation Orchestration

1.  **Task Definition**: The user assigns a complex task.
2.  **Orchestrator Planning (gcrew-mcp)**:
    *   Calls `create_main_task`: Define core goal and description.
    *   Calls `decompose_task`: Decompose into multiple specific sub-tasks and specify dependencies.
3.  **Sub-task Execution**:
    *   Main Agent calls `get_next_task` to get the next executable task.
    *   Main Agent calls `get_launch_command` to get the command for starting a sub-agent (containing results from prerequisite tasks).
    *   Main Agent executes the command to start a new sub-agent instance for specific work.
    *   Sub-agent completes the work, and the Main Agent calls `update_task_status` to update status and store results.

## Installation & Execution

### Development Mode
```bash
npm install
npm run dev
```

### Build
```bash
npm run build
```

## MCP Tools Description

*   `create_main_task`: Create a high-level task.
*   `decompose_task`: Decompose a task into sub-tasks.
*   `list_tasks`: List all tasks and their status.
*   `update_task_status`: Update the status of a main task or sub-task.
*   `get_next_task`: Get the next pending sub-task.
*   `get_launch_command`: Generate the launch command for a sub-agent (combining task context and dependency results).

## Development Goals & Roadmap

- [x] Basic Task Management (Create, Decompose, List, Update)
- [x] Sub-Agent Command Generation (Launch Command)
- [x] **Execution Hint**: Provide execution environment suggestions for sub-tasks.
- [x] **Dependency Graph**: Support `dependsOn` relationships between sub-tasks, automatically determining execution order.
- [x] **Data Pipeline**: Sub-tasks can store results upon completion, which are automatically passed to subsequent dependent tasks.
- [ ] **Reliability (Unit Tests)**: Establish automated tests for `storage` and `index` to ensure stable orchestrator operation.
- [ ] **Persistent Storage Optimization**: Consider upgrading from JSON files to a more robust storage solution.
