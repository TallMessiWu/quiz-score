<template>
  <div>
    <div class="section-header">
      <span class="section-title">
        历史出题
        <el-tag type="info" style="margin-left: 8px;">共 {{ store.history.length }} 题</el-tag>
      </span>
    </div>

    <el-table :data="store.history" border stripe empty-text="暂无历史出题记录">
      <el-table-column type="index" label="#" width="50" align="center" />
      <el-table-column label="题目" min-width="240">
        <template #default="{ row }">
          <div class="question-cell">
            <span class="question-text">{{ row.content }}</span>
            <el-button size="small" :icon="CopyDocument" @click="copyText(row.content)" style="margin-left: 8px; flex-shrink: 0;">
              复制
            </el-button>
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
      <el-table-column label="操作" width="80" align="center">
        <template #default="{ row }">
          <el-button size="small" type="danger" :icon="Delete" @click="handleDelete(row)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>
  </div>
</template>

<script setup>
import { ElMessage, ElMessageBox } from 'element-plus'
import { Delete, CopyDocument } from '@element-plus/icons-vue'
import { useQuestionsStore } from '../stores/questions'

const store = useQuestionsStore()

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
  gap: 4px;
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
