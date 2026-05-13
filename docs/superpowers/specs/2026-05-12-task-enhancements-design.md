# 設計文件：gcrew-mcp 任務增強功能 (相依性、數據管線)

- **日期**：2026-05-12
- **狀態**：設計中
- **目標**：提升任務編排的自動化程度，支援複雜任務流與數據流轉。

## 1. 核心變更

### 1.1 資料結構 (Types)

在 `src/types.ts` 中更新 `SubTask` 介面：

```typescript
export interface SubTask {
  id: string;
  title: string;
  description: string;
  status: TaskStatus;
  assignedAgent?: string;
  context?: string;
  executionHint?: string;
  // 新增欄位
  dependsOn: string[]; // 相依的子任務 ID 清單
  result?: string;     // 執行結果文字內容
}
```

## 2. 功能實作細節

### 2.1 任務相依性 (Dependency Graph)

- **建立相依性**：修改 `decompose_task` 工具，允許在建立子任務時指定 `dependsOn`。
- **獲取邏輯**：修改 `get_next_task` 工具。
    - 掃描子任務時，必須確認 `dependsOn` 中的所有任務 ID 對應的狀態皆為 `completed`。
    - 若相依任務中有任何一個為 `failed`，則該任務應自動標記為阻塞或失敗（可後續優化）。

### 2.2 數據管線 (Data Pipeline)

- **結果儲存**：修改 `update_task_status` 工具，當狀態更新為 `completed` 時，允許選填傳入 `result`。
- **上下文注入**：修改 `get_launch_command` 工具。
    - 遍歷目標任務的 `dependsOn` 列表。
    - 取得這些前置任務的 `result` 內容。
    - 將結果格式化為 Markdown 並併入啟動指令的 `context` 中。

## 3. 工具介面變更 (MCP Tools)

### 3.1 `decompose_task`
- `subTasks` 陣列項新增 `dependsOn: z.array(z.string()).optional()`。

### 3.2 `update_task_status`
- 新增 `result: z.string().optional()`。

### 3.3 `get_launch_command`
- 移除原本設計中的 `useCmux` 參數。

## 4. 驗證計劃

1.  **單元測試**：確認 `get_next_task` 能正確過濾未完成相依項的任務。
2.  **整合測試**：
    - 建立任務 A 與任務 B (B depends on A)。
    - 完成 A 並提供結果。
    - 獲取 B 的指令，確認 A 的結果出現在內容中。

