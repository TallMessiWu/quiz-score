<template>
  <div>
    <div class="section-header">
      <span class="section-title">
        积分历史
        <el-tag type="info" style="margin-left: 8px;">共 {{ store.scoreHistory.length }} 条</el-tag>
      </span>
    </div>

    <el-table :data="store.scoreHistory" border stripe empty-text="暂无积分历史记录">
      <el-table-column type="index" label="#" width="60" align="center" />
      <el-table-column prop="playerName" label="姓名" width="120" />
      <el-table-column prop="employeeId" label="工号" width="130" />
      <el-table-column label="获得积分" width="110" align="center">
        <template #default="{ row }">
          <el-tag v-if="row.points" type="success" style="font-weight: 600;">+{{ row.points }}</el-tag>
          <span v-else style="color: #c0c4cc;">—</span>
        </template>
      </el-table-column>
      <el-table-column label="出题次数" width="110" align="center">
        <template #default="{ row }">
          <el-tag v-if="row.questionCount" type="warning" style="font-weight: 600;">+{{ row.questionCount }}</el-tag>
          <span v-else style="color: #c0c4cc;">—</span>
        </template>
      </el-table-column>
      <el-table-column label="日期" min-width="160" align="center">
        <template #default="{ row }">
          <span class="date-text">{{ formatDate(row.date) }}</span>
        </template>
      </el-table-column>
      <el-table-column label="操作" width="90" align="center">
        <template #default="{ row }">
          <el-button size="small" type="danger" :icon="Delete" @click="handleDelete(row)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>
  </div>
</template>

<script setup>
import { ElMessage, ElMessageBox } from 'element-plus'
import { Delete } from '@element-plus/icons-vue'
import { useLeaderboardStore } from '../stores/leaderboard'

const store = useLeaderboardStore()

function handleDelete(row) {
  const parts = []
  if (row.points) parts.push(`-${row.points} 答题积分`)
  if (row.questionCount) parts.push(`-${row.questionCount} 出题次数`)
  const detail = parts.length ? `\n\n将从「${row.playerName}」（${row.employeeId}）扣回：${parts.join('，')}` : ''

  ElMessageBox.confirm(
    `确认删除该条积分记录？${detail}`,
    '删除确认',
    { confirmButtonText: '删除', cancelButtonText: '取消', type: 'warning' }
  ).then(() => {
    store.deleteScoreHistory(row.id)
    ElMessage.success('已删除')
  }).catch(() => {})
}

function formatDate(iso) {
  if (!iso) return ''
  return new Date(iso).toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  })
}
</script>

<style scoped>
.date-text {
  font-size: 13px;
  color: #606266;
}
</style>
