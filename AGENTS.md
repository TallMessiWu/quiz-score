# CLAUDE.md

## 项目概览

公司每日有奖竞猜活动管理看板。Vue 3 + Vite 单页应用，数据持久化到本地 `data.json`。

## 启动

路径含 `&`，只能在 **PowerShell** 中运行，cmd 会截断路径：

```powershell
Set-Location "C:\Users\tallm\Documents\Codes\quiz&score"
npm run dev        # 开发服务器，端口 6970
```

npm scripts 也因此改为直接调用 node：
```json
"dev": "node node_modules/vite/bin/vite.js"
```

构建验证：
```powershell
node "node_modules\vite\bin\vite.js" build
```

## 架构

### 数据层

`vite.config.js` 内置了一个 Vite 插件（`apiPlugin`），在开发服务器上挂载以下 API：

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/data` | 读取完整 `data.json` |
| PUT | `/api/groups` | 更新 groups 字段 |
| PUT | `/api/questions` | 更新 bank + history 字段 |
| PUT | `/api/leaderboard` | 更新 players + scoreHistory 字段 |

`data.json` 结构：
```json
{
  "groups": [],
  "bank": [],
  "history": [],
  "players": [],
  "scoreHistory": []
}
```

### 状态层

三个 Pinia store，均无 persist（不用 localStorage）：

- `src/stores/groups.js` — 轮值组列表
- `src/stores/questions.js` — 题库（bank）+ 历史出题（history）
- `src/stores/leaderboard.js` — 积分榜（players）+ 积分历史（scoreHistory）

每个 store 有 `init(data)` 方法（由 App.vue 在 `onMounted` 调用），以及 `sync()` 方法（每次数据变更后调用，写回文件）。

### 关键业务规则

- **工号是唯一标识**：加分时以工号查找，若工号存在但姓名不同，提交仍成功但弹出警告
- **出题**：将题目从 `bank` 移到 `history`，附加 `usedAt` 时间戳
- **轮值 markDone**：把 `groups[0]` shift 出来再 push 到末尾

## 文件结构

```
quiz&score/
├── vite.config.js          # Vite 配置 + 内置 API 插件
├── data.json               # 持久化数据文件
├── src/
│   ├── App.vue             # 根组件，onMounted 加载数据
│   ├── main.js
│   ├── stores/
│   │   ├── groups.js
│   │   ├── questions.js
│   │   └── leaderboard.js
│   └── components/
│       ├── GroupRotation.vue
│       ├── QuestionBank.vue
│       ├── QuestionHistory.vue
│       ├── Leaderboard.vue
│       └── ScoreHistory.vue
```

## 常见问题

**端口被占用自动+1**：有旧进程残留，用以下命令释放：
```powershell
$p = (netstat -ano | findstr ":6970" | findstr "LISTENING") -replace '.*\s(\d+)$','$1'
Stop-Process -Id $p -Force
```

提交时必须使用gitmoji-commit这个skill。