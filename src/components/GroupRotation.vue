<template>
  <div>
    <!-- Current Group Card -->
    <div v-if="store.groups.length > 0" class="current-card">
      <div class="current-label">本轮出题组</div>
      <div class="current-name">{{ store.groups[0].name }}</div>
      <div class="current-actions">
        <el-button type="primary" size="large" @click="handleMarkDone">
          已出题，移至末位
        </el-button>
        <el-button size="large" :icon="Edit" @click="openEdit(store.groups[0])">编辑</el-button>
        <el-button size="large" type="danger" :icon="Delete" @click="handleDelete(store.groups[0])">删除</el-button>
      </div>
    </div>
    <el-empty v-else description="暂无组别，请点击右上角「添加组」" style="margin: 40px 0;" />

    <!-- Queue -->
    <div class="section-header" style="margin-top: 28px;">
      <span class="section-title">
        出题队列
        <el-tag type="info" style="margin-left: 8px;">{{ queueGroups.length }} 组待出题</el-tag>
      </span>
      <el-button type="primary" :icon="Plus" @click="showAddDialog = true">添加组</el-button>
    </div>

    <el-table :data="queueGroups" border stripe empty-text="队列为空">
      <el-table-column label="顺序" width="70" align="center">
        <template #default="{ $index }">
          <span class="queue-index">{{ $index + 2 }}</span>
        </template>
      </el-table-column>
      <el-table-column prop="name" label="组名" />
      <el-table-column label="操作" width="160" align="center">
        <template #default="{ row }">
          <el-button size="small" :icon="Edit" @click="openEdit(row)">编辑</el-button>
          <el-button size="small" type="danger" :icon="Delete" @click="handleDelete(row)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>

    <!-- Add Dialog -->
    <el-dialog v-model="showAddDialog" title="添加组" width="420px" align-center>
      <el-input
        v-model="newGroupName"
        placeholder="请输入组名"
        size="large"
        @keyup.enter="submitAdd"
        autofocus
      />
      <template #footer>
        <el-button @click="showAddDialog = false">取消</el-button>
        <el-button type="primary" @click="submitAdd">确认添加</el-button>
      </template>
    </el-dialog>

    <!-- Edit Dialog -->
    <el-dialog v-model="showEditDialog" title="编辑组名" width="420px" align-center>
      <el-input
        v-model="editName"
        placeholder="请输入组名"
        size="large"
        @keyup.enter="submitEdit"
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
import { Plus, Edit, Delete } from '@element-plus/icons-vue'
import { useGroupsStore } from '../stores/groups'

const store = useGroupsStore()
const queueGroups = computed(() => store.groups.slice(1))

const showAddDialog = ref(false)
const newGroupName = ref('')

const showEditDialog = ref(false)
const editName = ref('')
const editingId = ref(null)

function handleMarkDone() {
  ElMessageBox.confirm(
    `确认「${store.groups[0].name}」本轮已出题，将其移至队列末位？`,
    '确认出题',
    { confirmButtonText: '确认', cancelButtonText: '取消', type: 'warning' }
  ).then(() => {
    store.markDone()
    ElMessage.success('已更新轮值顺序')
  }).catch(() => {})
}

function submitAdd() {
  if (!newGroupName.value.trim()) { ElMessage.warning('组名不能为空'); return }
  store.addGroup(newGroupName.value)
  ElMessage.success(`已添加「${newGroupName.value.trim()}」`)
  newGroupName.value = ''
  showAddDialog.value = false
}

function openEdit(row) {
  editingId.value = row.id
  editName.value = row.name
  showEditDialog.value = true
}

function submitEdit() {
  if (!editName.value.trim()) { ElMessage.warning('组名不能为空'); return }
  store.editGroup(editingId.value, editName.value)
  showEditDialog.value = false
  ElMessage.success('修改成功')
}

function handleDelete(row) {
  ElMessageBox.confirm(
    `确认删除「${row.name}」？`,
    '删除确认',
    { confirmButtonText: '删除', cancelButtonText: '取消', type: 'warning', confirmButtonClass: 'el-button--danger' }
  ).then(() => {
    store.deleteGroup(row.id)
    ElMessage.success('已删除')
  }).catch(() => {})
}
</script>

<style scoped>
.current-card {
  background: linear-gradient(135deg, #e3f2fd, #bbdefb);
  border: 2px solid #64b5f6;
  border-radius: 12px;
  padding: 28px 32px;
  text-align: center;
}

.current-label {
  font-size: 13px;
  color: #1565c0;
  font-weight: 500;
  letter-spacing: 1px;
  margin-bottom: 10px;
}

.current-name {
  font-size: 32px;
  font-weight: 700;
  color: #1565c0;
  margin-bottom: 20px;
}

.current-actions {
  display: flex;
  justify-content: center;
  gap: 12px;
  flex-wrap: wrap;
}

.queue-index {
  font-weight: 600;
  color: #606266;
}
</style>
