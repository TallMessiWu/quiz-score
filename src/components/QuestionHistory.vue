<template>
  <div>
    <div class="section-header">
      <span class="section-title">
        历史出题
        <el-tag type="info" style="margin-left: 8px;">共 {{ store.history.length }} 题</el-tag>
      </span>
      <el-button
        v-if="selected.length > 0"
        type="primary"
        :icon="CopyDocument"
        @click="batchExport"
      >
        批量导出（已选 {{ selected.length }} 题）
      </el-button>
    </div>

    <el-table :data="store.history" border stripe empty-text="暂无历史出题记录" @selection-change="selected = $event">
      <el-table-column type="selection" width="44" align="center" />
      <el-table-column type="index" label="#" width="50" align="center" />
      <el-table-column label="题目" min-width="240">
        <template #default="{ row }">
          <div class="question-cell">
            <span class="question-text">{{ row.content }}</span>
            <div class="copy-btns">
              <el-button size="small" :icon="CopyDocument" @click="copyText(buildQuestionText(row))">
                复制题目
              </el-button>
              <el-button size="small" :icon="CopyDocument" @click="copyText(buildExplanationText(row))">
                复制解析
              </el-button>
            </div>
          </div>
        </template>
      </el-table-column>
      <el-table-column label="类型" width="80" align="center">
        <template #default="{ row }">
          <el-tag :type="row.type === 'single' ? 'primary' : 'warning'" size="small">
            {{ row.type === 'single' ? '单选' : '多选' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="answer" label="答案" width="90" align="center">
        <template #default="{ row }">
          <el-tag type="success" size="small">{{ row.answer }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="解析" min-width="180">
        <template #default="{ row }">
          <span class="explanation-text">{{ row.explanation || '—' }}</span>
        </template>
      </el-table-column>
      <el-table-column prop="creator" label="出题人" width="90" />
      <el-table-column prop="groupName" label="所属组" width="100" />
      <el-table-column label="出题日期" width="130" align="center">
        <template #default="{ row }">
          <span class="date-text">{{ formatDate(row.usedAt) }}</span>
        </template>
      </el-table-column>
      <el-table-column label="操作" width="150" align="center">
        <template #default="{ row }">
          <el-button size="small" :icon="Edit" @click="openEditDate(row)">改时间</el-button>
          <el-button size="small" type="danger" :icon="Delete" @click="handleDelete(row)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>

    <el-dialog v-model="showDateDialog" title="修改出题日期" width="360px" align-center>
      <el-date-picker
        v-model="editingDate"
        type="date"
        placeholder="选择日期"
        style="width: 100%;"
        value-format="YYYY-MM-DD"
      />
      <template #footer>
        <el-button @click="showDateDialog = false">取消</el-button>
        <el-button type="primary" @click="submitEditDate">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Delete, Edit, CopyDocument } from '@element-plus/icons-vue'
import { useQuestionsStore } from '../stores/questions'
import { buildQuestionText, buildExplanationText } from '../utils/copyFormat'

const store = useQuestionsStore()

const selected = ref([])
const showDateDialog = ref(false)
const editingDate = ref('')
const editingId = ref(null)

function formatDate(iso) {
  if (!iso) return ''
  return new Date(iso).toLocaleDateString('zh-CN', {
    year: 'numeric', month: '2-digit', day: '2-digit'
  })
}

function copyText(text) {
  navigator.clipboard.writeText(text).then(() => {
    ElMessage.success('已复制到剪贴板')
  }).catch(() => {
    ElMessage.error('复制失败，请手动复制')
  })
}

function batchExport() {
  const sorted = [...selected.value].sort((a, b) => {
    return new Date(a.usedAt || 0) - new Date(b.usedAt || 0)
  })
  const text = sorted.map(row =>
    buildQuestionText(row) + '\n' + buildExplanationText(row)
  ).join('\n\n')
  copyText(text)
}

function openEditDate(row) {
  editingId.value = row.id
  editingDate.value = row.usedAt ? row.usedAt.slice(0, 10) : ''
  showDateDialog.value = true
}

function submitEditDate() {
  if (!editingDate.value) { ElMessage.warning('请选择日期'); return }
  const iso = new Date(editingDate.value + 'T00:00:00.000Z').toISOString()
  store.editHistoryDate(editingId.value, iso)
  showDateDialog.value = false
  ElMessage.success('出题日期已更新')
}

function handleDelete(row) {
  ElMessageBox.confirm('确认删除该历史记录？', '删除确认', {
    confirmButtonText: '删除',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(() => {
    store.deleteHistory(row.id)
    ElMessage.success('已删除')
  }).catch(() => {})
}
</script>

<style scoped>
.question-cell {
  display: flex;
  align-items: flex-start;
  gap: 8px;
}

.copy-btns {
  display: flex;
  flex-direction: column;
  gap: 4px;
  flex-shrink: 0;
}

.copy-btns .el-button + .el-button {
  margin-left: 0;
}

.question-text {
  flex: 1;
  line-height: 1.6;
  white-space: pre-wrap;
  word-break: break-all;
}

.date-text {
  font-size: 13px;
  color: #606266;
}

.explanation-text {
  font-size: 13px;
  color: #606266;
  line-height: 1.6;
  white-space: pre-wrap;
  word-break: break-all;
}
</style>
