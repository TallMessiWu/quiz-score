<template>
  <div>
    <div class="section-header">
      <span class="section-title">
        积分历史
        <el-tag type="info" style="margin-left: 8px;">共 {{ store.scoreHistory.length }} 条</el-tag>
      </span>
    </div>

    <div class="stats-bar">
      <div class="stat-item">
        <span class="stat-label">参与人数</span>
        <span class="stat-value">{{ store.uniqueParticipantCount }} 人</span>
      </div>
      <div class="stat-item">
        <span class="stat-label">当前期数</span>
        <span class="stat-value">{{ store.currentEpisode != null ? `第 ${store.currentEpisode} 期` : '—' }}</span>
      </div>
      <div class="stat-item">
        <span class="stat-label">赛季开始</span>
        <span class="stat-value">{{ store.seasonStartDate || '未设置' }}</span>
      </div>
    </div>

    <el-table :data="sortedHistory" border stripe empty-text="暂无积分历史记录">
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
      <el-table-column label="操作" width="160" align="center">
        <template #default="{ row }">
          <el-button size="small" :icon="Edit" @click="openEdit(row)">日期</el-button>
          <el-button size="small" type="danger" :icon="Delete" @click="handleDelete(row)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>

    <!-- Edit Date Dialog -->
    <el-dialog v-model="showEditDialog" title="编辑记录日期" width="380px" align-center>
      <div style="margin-bottom: 12px; font-size: 13px; color: #909399;">
        修改日期会影响该条记录归属哪个赛季 / 期数，不影响人员的累计总分。
      </div>
      <el-date-picker
        v-model="editDate"
        type="datetime"
        placeholder="选择日期时间"
        style="width: 100%;"
        format="YYYY-MM-DD HH:mm"
      />
      <template #footer>
        <el-button @click="showEditDialog = false">取消</el-button>
        <el-button type="primary" @click="submitEdit">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Edit, Delete } from '@element-plus/icons-vue'
import { useLeaderboardStore } from '../stores/leaderboard'

const store = useLeaderboardStore()

// 按日期降序展示，编辑日期后会自动重新排序到正确位置
const sortedHistory = computed(() =>
  [...store.scoreHistory].sort((a, b) => new Date(b.date) - new Date(a.date))
)

const showEditDialog = ref(false)
const editingId = ref(null)
const editDate = ref(null)

function openEdit(row) {
  editingId.value = row.id
  editDate.value = row.date ? new Date(row.date) : new Date()
  showEditDialog.value = true
}

function submitEdit() {
  if (!editDate.value) { ElMessage.warning('请选择日期'); return }
  store.editScoreHistory(editingId.value, { date: new Date(editDate.value).toISOString() })
  showEditDialog.value = false
  ElMessage.success('日期已更新')
}

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
.stats-bar {
  display: flex;
  gap: 24px;
  align-items: center;
  padding: 12px 20px;
  background: #f5f7fa;
  border: 1px solid #e4e7ed;
  border-radius: 8px;
  margin-bottom: 16px;
  flex-wrap: wrap;
}

.stat-item {
  display: flex;
  align-items: center;
  gap: 6px;
}

.stat-label {
  font-size: 13px;
  color: #909399;
}

.stat-value {
  font-size: 15px;
  font-weight: 600;
  color: #303133;
}

.date-text {
  font-size: 13px;
  color: #606266;
}
</style>
