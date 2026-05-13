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

## Key Features

### 1. Automatic Model Selection (Token Efficiency)
When decomposing tasks, `gcrew-mcp` automatically analyzes the complexity of each sub-task. For simple tasks (short descriptions without complex keywords like `refactor` or `debug`), it defaults to using **`gemini-1.5-flash`** to minimize token costs.

### 2. Flexible Task Focusing
The `get_next_task` tool now supports an optional `taskId` parameter. This allows users or agents to focus on a specific task thread, making it easier to manage multiple concurrent projects.

### 3. Smart Command Generation
`get_launch_command` generates ready-to-use CLI commands that automatically include:
*   Specified model flags (`-m`).
*   Complete task context.
*   Results from all completed prerequisite tasks (Data Pipeline).

## Installation & Execution

### Run via npx (Recommended)
You can run the server directly without installation using `npx`:
```bash
npx gcrew-mcp
```

### Usage with Gemini CLI
To integrate `gcrew-mcp` into your Gemini CLI workflow, add it to your configuration (typically in `~/.gemini/config.json` or your local `.gemini/config.json`):

```json
{
  "mcp_servers": {
    "gcrew": {
      "command": "npx",
      "args": ["-y", "gcrew-mcp"]
    }
  }
}
```

### Development Mode
```bash
npm install
npm run build
npm start
```

### Build from source
```bash
npm run build
```

## MCP Tools Description

*   `create_main_task`: Create a high-level task.
*   `decompose_task`: Decompose a task into sub-tasks. Automatically selects model if not specified.
*   `list_tasks`: List all tasks and their status, including assigned models.
*   `update_task_status`: Update the status of a main task or sub-task and store results.
*   `get_next_task`: Get the next pending sub-task. Optionally filter by `taskId`.
*   `get_launch_command`: Generate the launch command for a sub-agent (combining task context, model selection, and dependency results).

## Development Goals & Roadmap

- [x] Basic Task Management (Create, Decompose, List, Update)
- [x] Sub-Agent Command Generation (Launch Command)
- [x] **Execution Hint**: Provide execution environment suggestions for sub-tasks.
- [x] **Dependency Graph**: Support `dependsOn` relationships between sub-tasks.
- [x] **Data Pipeline**: Sub-tasks store results, passed to subsequent tasks.
- [x] **Auto Model Selection**: Automatically assign cost-effective models for simple tasks.
- [ ] **Reliability (Unit Tests)**: Establish automated tests for `storage` and `index`.
- [ ] **Persistent Storage Optimization**: Upgrade from JSON files to a more robust storage solution.
