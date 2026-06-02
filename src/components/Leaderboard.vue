<template>
  <div>
    <div class="section-header">
      <span class="section-title">积分榜</span>
    </div>

    <div class="stats-bar">
      <div class="stat-item">
        <span class="stat-label">参与人数</span>
        <span class="stat-value">{{ boardTab === 'season' ? store.seasonParticipantCount : store.uniqueParticipantCount }} 人</span>
      </div>
      <div class="stat-item">
        <span class="stat-label">当前期数</span>
        <span class="stat-value">{{ store.currentEpisode != null ? `第 ${store.currentEpisode} 期` : '—' }}</span>
      </div>
      <div class="stat-item">
        <span class="stat-label">赛季开始</span>
        <span class="stat-value">{{ store.seasonStartDate || '未设置' }}</span>
        <el-button size="small" :icon="Setting" style="margin-left: 8px;" @click="openSeasonDialog">设置</el-button>
      </div>
    </div>

    <el-radio-group v-model="boardTab" class="board-switch">
      <el-radio-button value="season">当赛季榜单（{{ store.seasonParticipantCount }} 人）</el-radio-button>
      <el-radio-button value="total">历史总积分（{{ store.uniqueParticipantCount }} 人）</el-radio-button>
    </el-radio-group>

    <div v-if="boardTab === 'season'" class="board-tip">
      当赛季积分根据「赛季开始日期」（{{ store.seasonStartDate || '未设置，默认统计全部' }}）自动从积分明细统计。如归属有误，请到「积分历史」中编辑对应明细的日期。
    </div>

    <el-table
      :data="boardData"
      border
      stripe
      :empty-text="boardTab === 'season' ? '当赛季暂无积分记录' : '暂无积分记录'"
    >
      <el-table-column label="排名" width="70" align="center">
        <template #default="{ $index }">
          <span v-if="$index === 0" class="medal">🥇</span>
          <span v-else-if="$index === 1" class="medal">🥈</span>
          <span v-else-if="$index === 2" class="medal">🥉</span>
          <span v-else class="rank-num">{{ $index + 1 }}</span>
        </template>
      </el-table-column>
      <el-table-column prop="name" label="姓名" />
      <el-table-column prop="employeeId" label="工号" width="130" />
      <el-table-column label="答题积分" width="100" align="center">
        <template #default="{ row }">
          <el-tag type="success" size="small" style="font-weight: 600;">
            {{ row.totalScore }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="出题次数" width="100" align="center">
        <template #default="{ row }">
          <el-tag type="warning" size="small" style="font-weight: 600;">
            {{ row.questionCount || 0 }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="总得分" width="110" align="center">
        <template #default="{ row }">
          <el-tag type="danger" size="large" style="font-size: 15px; font-weight: 700;">
            {{ row.totalScore + 5 * (row.questionCount || 0) }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column v-if="boardTab === 'total'" label="操作" width="160" align="center">
        <template #default="{ row }">
          <el-button size="small" :icon="Edit" @click="openEdit(row)">编辑</el-button>
          <el-button size="small" type="danger" :icon="Delete" @click="handleDelete(row)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>

    <!-- Add Score Form -->
    <el-card class="score-form-card" shadow="never">
      <div class="score-form-title">添加 / 更新积分</div>
      <div class="score-form-hint">以工号为唯一标识。工号已存在则累加；不存在则新增人员。总得分 = 答题积分 + 5 × 出题次数</div>
      <div class="score-form-row">
        <el-form-item label="姓名 工号" class="form-item form-item-wide">
          <el-input v-model="form.person" placeholder="如：周翔 E2024010（用空格分隔）" clearable @keyup.enter="handleSubmit" />
        </el-form-item>
        <el-form-item label="答题积分" class="form-item-sm">
          <el-input-number v-model="form.points" :min="0" :max="999" controls-position="right" />
        </el-form-item>
        <el-form-item label="出题次数" class="form-item-sm">
          <el-input-number v-model="form.questionCount" :min="0" :max="999" controls-position="right" />
        </el-form-item>
        <div class="form-buttons">
          <el-button type="primary" @click="handleSubmit">提交</el-button>
          <el-button @click="resetForm">重置</el-button>
        </div>
      </div>
    </el-card>

    <!-- Season Dialog -->
    <el-dialog v-model="showSeasonDialog" title="设置赛季开始日期" width="360px" align-center>
      <div style="margin-bottom: 12px; font-size: 13px; color: #909399;">
        每周为一期，系统将根据开始日期自动计算当前期数。
      </div>
      <el-date-picker
        v-model="seasonDateInput"
        type="date"
        placeholder="选择赛季开始日期"
        style="width: 100%;"
        value-format="YYYY-MM-DD"
      />
      <template #footer>
        <el-button @click="showSeasonDialog = false">取消</el-button>
        <el-button type="danger" plain @click="clearSeason">清除</el-button>
        <el-button type="primary" @click="submitSeason">保存</el-button>
      </template>
    </el-dialog>

    <!-- Edit Dialog -->
    <el-dialog v-model="showEditDialog" title="编辑人员信息" width="420px" align-center>
      <el-form :model="editForm" label-width="80px">
        <el-form-item label="姓名">
          <el-input v-model="editForm.name" />
        </el-form-item>
        <el-form-item label="工号">
          <el-input v-model="editForm.employeeId" />
        </el-form-item>
        <el-form-item label="答题积分">
          <el-input-number v-model="editForm.totalScore" :min="0" :max="9999" controls-position="right" />
        </el-form-item>
        <el-form-item label="出题次数">
          <el-input-number v-model="editForm.questionCount" :min="0" :max="9999" controls-position="right" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showEditDialog = false">取消</el-button>
        <el-button type="primary" @click="submitEdit">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Edit, Delete, Setting } from '@element-plus/icons-vue'
import { useLeaderboardStore } from '../stores/leaderboard'

const store = useLeaderboardStore()

// 榜单切换：season=当赛季（按明细聚合）/ total=历史总积分（累计）
const boardTab = ref('season')
const boardData = computed(() => boardTab.value === 'season' ? store.seasonPlayers : store.sortedPlayers)

const showSeasonDialog = ref(false)
const seasonDateInput = ref('')

function openSeasonDialog() {
  seasonDateInput.value = store.seasonStartDate || ''
  showSeasonDialog.value = true
}

async function submitSeason() {
  if (!seasonDateInput.value) { ElMessage.warning('请选择日期'); return }
  await store.updateSeasonStart(seasonDateInput.value)
  showSeasonDialog.value = false
  ElMessage.success('赛季开始日期已更新')
}

async function clearSeason() {
  await store.updateSeasonStart(null)
  showSeasonDialog.value = false
  ElMessage.success('已清除赛季设置')
}

const form = reactive({ person: '', points: 1, questionCount: 0 })

function parsePerson(input) {
  const parts = (input || '').trim().split(/[\s　]+/).filter(Boolean)
  if (parts.length < 2) return null
  return { employeeId: parts[parts.length - 1], name: parts.slice(0, -1).join(' ') }
}

const showEditDialog = ref(false)
const editForm = reactive({ name: '', employeeId: '', totalScore: 0, questionCount: 0 })
const editingId = ref(null)

function handleSubmit() {
  const parsed = parsePerson(form.person)
  if (!parsed) { ElMessage.warning('请按「姓名 工号」格式输入，用空格分隔'); return }
  if (form.points <= 0 && form.questionCount <= 0) { ElMessage.warning('答题积分和出题次数至少填一项'); return }

  const result = store.addScore({ name: parsed.name, employeeId: parsed.employeeId, points: form.points, questionCount: form.questionCount })

  if (result.nameMismatch) {
    ElMessage.warning({
      message: `工号「${parsed.employeeId}」在榜单中对应姓名是「${result.player.name}」，与输入的「${parsed.name}」不一致，请确认是否打错了。已按榜单姓名累加。`,
      duration: 7000,
      showClose: true
    })
  } else if (result.status === 'created') {
    ElMessage.success(`已新增「${result.player.name}」，答题积分：${form.points}，出题次数：${form.questionCount}`)
  } else {
    const msgs = []
    if (form.points > 0) msgs.push(`+${form.points} 答题积分`)
    if (form.questionCount > 0) msgs.push(`+${form.questionCount} 出题次数`)
    const detail = msgs.length ? msgs.join('，') : '无变化'
    ElMessage.success(`「${result.player.name}」${detail}，总得分：${result.player.totalScore + 5 * (result.player.questionCount || 0)}`)
  }
  resetForm()
}

function resetForm() {
  form.person = ''
  form.points = 1
  form.questionCount = 0
}

function openEdit(row) {
  editingId.value = row.id
  Object.assign(editForm, { name: row.name, employeeId: row.employeeId, totalScore: row.totalScore, questionCount: row.questionCount || 0 })
  showEditDialog.value = true
}

function submitEdit() {
  if (!editForm.name.trim()) { ElMessage.warning('姓名不能为空'); return }
  if (!editForm.employeeId.trim()) { ElMessage.warning('工号不能为空'); return }
  store.editPlayer(editingId.value, { ...editForm })
  showEditDialog.value = false
  ElMessage.success('修改成功')
}

function handleDelete(row) {
  ElMessageBox.confirm(
    `确认删除「${row.name}」（工号：${row.employeeId}）？`,
    '删除确认',
    { confirmButtonText: '删除', cancelButtonText: '取消', type: 'warning' }
  ).then(() => {
    store.deletePlayer(row.id)
    ElMessage.success('已删除')
  }).catch(() => {})
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

.board-switch {
  margin-bottom: 12px;
}

.board-tip {
  font-size: 12px;
  color: #909399;
  background: #f5f7fa;
  border: 1px solid #e4e7ed;
  border-radius: 6px;
  padding: 8px 12px;
  margin-bottom: 12px;
}

.medal { font-size: 20px; }
.rank-num { font-weight: 600; color: #606266; }

.score-form-card {
  margin-top: 28px;
  background: #f8f9fb;
  border: 1px solid #e4e7ed;
  border-radius: 8px;
}

.score-form-title {
  font-size: 14px;
  font-weight: 600;
  color: #303133;
  margin-bottom: 4px;
}

.score-form-hint {
  font-size: 12px;
  color: #909399;
  margin-bottom: 16px;
}

.score-form-row {
  display: flex;
  align-items: flex-end;
  gap: 16px;
  flex-wrap: wrap;
}

.form-item {
  display: flex;
  flex-direction: column;
  gap: 6px;
  min-width: 160px;
}

.form-item-wide {
  flex: 1;
  min-width: 280px;
}

.form-item-sm {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.form-item :deep(.el-form-item__label),
.form-item-sm :deep(.el-form-item__label) {
  font-size: 13px;
  color: #606266;
}

.form-buttons {
  display: flex;
  gap: 8px;
  padding-bottom: 1px;
}
</style>
