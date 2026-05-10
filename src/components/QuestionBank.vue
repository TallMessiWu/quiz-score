<template>
  <div>
    <div class="section-header">
      <span class="section-title">
        题库
        <el-tag type="info" style="margin-left: 8px;">{{ store.bank.length }} 题</el-tag>
      </span>
      <el-button type="primary" :icon="Plus" @click="openAdd">添加题目</el-button>
    </div>

    <el-table :data="store.bank" border stripe empty-text="题库为空，请添加题目">
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
      <el-table-column label="操作" width="200" align="center">
        <template #default="{ row }">
          <el-button size="small" type="success" @click="handlePublish(row)">出题</el-button>
          <el-button size="small" :icon="Edit" @click="openEdit(row)">编辑</el-button>
          <el-button size="small" type="danger" :icon="Delete" @click="handleDelete(row)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>

    <!-- Add/Edit Dialog -->
    <el-dialog v-model="showDialog" :title="isEdit ? '编辑题目' : '添加题目'" width="580px" align-center>
      <el-form :model="form" label-width="80px" style="padding-right: 16px;">
        <el-form-item label="题目">
          <el-input
            v-model="form.content"
            type="textarea"
            :rows="4"
            placeholder="请输入完整题目内容（含选项）"
          />
        </el-form-item>
        <el-form-item label="题型">
          <el-radio-group v-model="form.type">
            <el-radio value="single">单选题</el-radio>
            <el-radio value="multiple">多选题</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="答案">
          <el-input v-model="form.answer" placeholder="如：A  或  ABD" style="width: 200px;" />
        </el-form-item>
        <el-form-item label="解析">
          <el-input
            v-model="form.explanation"
            type="textarea"
            :rows="3"
            placeholder="（选填）输入题目解析"
          />
        </el-form-item>
        <el-form-item label="出题人">
          <el-input v-model="form.creator" placeholder="出题人姓名" style="width: 200px;" />
        </el-form-item>
        <el-form-item label="所属组">
          <el-select
            v-model="form.groupName"
            placeholder="选择或输入组别"
            allow-create
            filterable
            style="width: 240px;"
          >
            <el-option
              v-for="g in groupStore.groups"
              :key="g.id"
              :label="g.name"
              :value="g.name"
            />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showDialog = false">取消</el-button>
        <el-button type="primary" @click="submitForm">{{ isEdit ? '保存修改' : '添加' }}</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, Edit, Delete, CopyDocument } from '@element-plus/icons-vue'
import { useQuestionsStore } from '../stores/questions'
import { useGroupsStore } from '../stores/groups'
import { buildQuestionText, buildExplanationText } from '../utils/copyFormat'

const store = useQuestionsStore()
const groupStore = useGroupsStore()

const showDialog = ref(false)
const isEdit = ref(false)
const editingId = ref(null)

const defaultForm = () => ({ content: '', type: 'single', answer: '', explanation: '', creator: '', groupName: '' })
const form = reactive(defaultForm())

function openAdd() {
  isEdit.value = false
  Object.assign(form, defaultForm())
  showDialog.value = true
}

function openEdit(row) {
  isEdit.value = true
  editingId.value = row.id
  Object.assign(form, {
    content: row.content,
    type: row.type,
    answer: row.answer,
    explanation: row.explanation || '',
    creator: row.creator,
    groupName: row.groupName
  })
  showDialog.value = true
}

function submitForm() {
  if (!form.content.trim()) { ElMessage.warning('题目内容不能为空'); return }
  if (!form.answer.trim()) { ElMessage.warning('答案不能为空'); return }

  if (isEdit.value) {
    store.editQuestion(editingId.value, { ...form })
    ElMessage.success('修改成功')
  } else {
    store.addQuestion({ ...form })
    ElMessage.success('题目已添加到题库')
  }
  showDialog.value = false
}

function handlePublish(row) {
  const preview = row.content.length > 30 ? row.content.slice(0, 30) + '...' : row.content
  ElMessageBox.confirm(
    `确认将此题设为今日出题？\n\n「${preview}」\n\n题目将从题库移至历史出题记录。`,
    '出题确认',
    { confirmButtonText: '确认出题', cancelButtonText: '取消', type: 'warning' }
  ).then(() => {
    store.publishQuestion(row.id)
    ElMessage.success('已出题，题目已移至历史记录')
  }).catch(() => {})
}

function handleDelete(row) {
  ElMessageBox.confirm('确认从题库删除该题？', '删除确认', {
    confirmButtonText: '删除',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(() => {
    store.deleteQuestion(row.id)
    ElMessage.success('已删除')
  }).catch(() => {})
}

function copyText(text) {
  navigator.clipboard.writeText(text).then(() => {
    ElMessage.success('已复制到剪贴板')
  }).catch(() => {
    ElMessage.error('复制失败，请手动复制')
  })
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

.explanation-text {
  font-size: 13px;
  color: #606266;
  line-height: 1.6;
  white-space: pre-wrap;
  word-break: break-all;
}
</style>
