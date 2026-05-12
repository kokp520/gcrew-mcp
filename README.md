# gcrew-mcp

`gcrew-mcp` 是一個基於 Model Context Protocol (MCP) 的任務編排與狀態管理工具。它的核心理念是作為 AI 代理人的「大腦」，負責將複雜目標拆解為可執行的子任務，並透過多終端協作來提升工作效率。

## 核心定位

*   **gcrew-mcp (大腦)**：任務調度員。負責「規劃」與「追蹤」。
*   **cmux-mcp (手腳)**：環境操作員。負責「執行」與「環境切換」。

## 典型使用情境：多終端翻譯協作

這是一個展示 `gcrew-mcp` 如何與 `cmux` 配合的經典情境：

1.  **任務定義**：使用者交辦一個翻譯任務。
2.  **大腦規劃 (gcrew-mcp)**：
    *   建立 `create_main_task`：翻譯並回報結果。
    *   執行 `decompose_task`：拆解為 (1) 建立 Workspace (2) 啟動另一個 Gemini (3) 執行翻譯 (4) 回傳結果。
3.  **手腳執行 (cmux + sub-agent)**：
    *   主 Agent 呼叫 `get_launch_command` 取得指令。
    *   主 Agent 呼叫 `cmux` 建立新的 Workspace `Translation-Task`。
    *   在新的 Workspace 中，主 Agent 透過 `write_to_terminal` 啟動另一個 `gemini` 實例。
    *   子 Agent (新開啟的 Gemini) 接手翻譯工作，完成後主 Agent 讀取輸出並回報。

## 安裝與執行

### 開發模式
```bash
npm install
npm run dev
```

### 建置
```bash
npm run build
```

## MCP 工具說明

*   `create_main_task`: 建立高階任務。
*   `decompose_task`: 將任務分解為子任務。
*   `list_tasks`: 列出所有任務與其狀態。
*   `update_task_status`: 更新主任務或子任務的狀態。
*   `get_next_task`: 獲取下一個待辦子任務。
*   `get_launch_command`: 產生啟動子 Agent 的指令（結合任務上下文）。

## 開發目標與進度 (Roadmap)

- [x] 基礎任務管理 (Create, Decompose, List, Update)
- [x] 子 Agent 指令產生 (Launch Command)
- [x] **環境提示 (Execution Hint)**：大腦現在能建議執行環境（例如：建議使用 cmux 開啟新空間）。
- [ ] **任務相依性管理 (Dependency Graph)**：支援子任務間的 `dependsOn` 關係，大腦能判斷執行先後順序。
- [ ] **結果自動回傳 (Data Pipeline)**：子任務完成後可存放結果，大腦自動將結果傳遞給後續任務。
- [ ] **cmux 深度整合**：
    *   **視覺化進度條**：自動呼叫 `cmux` 的 `set_progress` 工具顯示總體進度。
    *   **自動化環境部署**：`get_launch_command` 直接產生包含 `cmux` 指令的腳本。
- [ ] **單元測試 (Reliability)**：建立 `storage` 與 `index` 的自動化測試，確保大腦運作穩定。
- [ ] **持久化儲存優化**：考慮從 JSON 檔案升級到更穩健的儲存方案。
