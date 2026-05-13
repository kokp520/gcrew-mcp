# gcrew-mcp

`gcrew-mcp` 是一個基於 Model Context Protocol (MCP) 的任務編排與狀態管理工具。它的核心理念是作為 AI 代理人的「大腦」，負責將複雜目標拆解為可執行的子任務，並透過狀態追蹤來提升工作效率。

## 核心定位

*   **gcrew-mcp**：任務調度員。負責「規劃」與「追蹤」。它能幫助 AI 代理人管理複雜的任務流，確保每個步驟都被正確記錄並獲取所需的上下文。

## 典型使用情境：任務自動化編排

1.  **任務定義**：使用者交辦一個複雜任務。
2.  **大腦規劃 (gcrew-mcp)**：
    *   建立 `create_main_task`：定義核心目標與描述。
    *   執行 `decompose_task`：拆解為多個具體的子任務，並指定相依性。
3.  **子任務執行**：
    *   主 Agent 呼叫 `get_next_task` 取得下一個可執行的任務。
    *   主 Agent 呼叫 `get_launch_command` 取得用於啟動子 Agent 的指令（內含前置任務的執行結果）。
    *   主 Agent 執行指令啟動新的子 Agent 實例處理具體工作。
    *   子 Agent 完成工作後，主 Agent 呼叫 `update_task_status` 更新狀態並儲存結果。

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
*   `get_launch_command`: 產生啟動子 Agent 的指令（結合任務上下文與依賴結果）。

## 開發目標與進度 (Roadmap)

- [x] 基礎任務管理 (Create, Decompose, List, Update)
- [x] 子 Agent 指令產生 (Launch Command)
- [x] **環境提示 (Execution Hint)**：為子任務提供執行環境建議。
- [x] **任務相依性管理 (Dependency Graph)**：支援子任務間的 `dependsOn` 關係，自動判斷執行先後順序。
- [x] **結果自動傳遞 (Data Pipeline)**：子任務完成後可存放結果，自動將結果傳遞給後續相依任務。
- [ ] **單元測試 (Reliability)**：建立 `storage` 與 `index` 的自動化測試，確保系統運作穩定。
- [ ] **持久化儲存優化**：考慮從 JSON 檔案升級到更穩健的儲存方案。
