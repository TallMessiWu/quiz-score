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
          <el-tag type="success" style="font-weight: 600;">+{{ row.points }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="日期" align="center">
        <template #default="{ row }">
          <span class="date-text">{{ formatDate(row.date) }}</span>
        </template>
      </el-table-column>
    </el-table>
  </div>
</template>

<script setup>
import { useLeaderboardStore } from '../stores/leaderboard'

const store = useLeaderboardStore()

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
