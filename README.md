# gcrew-mcp

`gcrew-mcp` is a task orchestration and state management tool based on the Model Context Protocol (MCP). Its core philosophy is to serve as the "Orchestrator/Brain" for AI agents, responsible for decomposing complex goals into executable sub-tasks and improving work efficiency through multi-terminal collaboration.

## Core Positioning

*   **gcrew-mcp (Orchestrator/Brain)**: Task dispatcher. Responsible for "planning" and "tracking".
*   **cmux-mcp (Executor/Agent)**: Environment operator. Responsible for "execution" and "environment switching".

## Typical Use Case: Multi-Terminal Translation Collaboration

Here is a classic scenario showing how `gcrew-mcp` cooperates with `cmux`:

1.  **Task Definition**: The user assigns a translation task.
2.  **Orchestrator Planning (gcrew-mcp)**:
    *   Calls `create_main_task`: Translate and report the result.
    *   Calls `decompose_task`: Decompose into (1) Create Workspace (2) Launch another Gemini (3) Execute translation (4) Return result.
3.  **Executor Execution (cmux + sub-agent)**:
    *   Main Agent calls `get_launch_command` to get the command.
    *   Main Agent calls `cmux` to create a new Workspace `Translation-Task`.
    *   In the new Workspace, the Main Agent starts another `gemini` instance via `write_to_terminal`.
    *   The Sub Agent (newly opened Gemini) takes over the translation work, and upon completion, the Main Agent reads the output and reports.

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
*   `get_launch_command`: Generate the launch command for a sub-agent (incorporating task context).

## Development Goals & Roadmap

- [x] Basic Task Management (Create, Decompose, List, Update)
- [x] Sub-Agent Command Generation (Launch Command)
- [x] **Execution Hint**: The orchestrator can now suggest the execution environment (e.g., suggesting cmux to open a new space).
- [ ] **Dependency Graph**: Support `dependsOn` relationships between sub-tasks, allowing the orchestrator to determine the execution order.
- [ ] **Data Pipeline (Auto-Return Results)**: Sub-tasks can store results upon completion, and the orchestrator automatically passes the results to subsequent tasks.
- [ ] **Deep cmux Integration**:
    *   **Visual Progress Bar**: Automatically call cmux's `set_progress` tool to show overall progress.
    *   **Automated Environment Deployment**: `get_launch_command` directly generates scripts containing `cmux` commands.
- [ ] **Reliability (Unit Tests)**: Establish automated tests for `storage` and `index` to ensure stable orchestrator operation.
- [ ] **Persistent Storage Optimization**: Consider upgrading from JSON files to a more robust storage solution.
