<template>
  <div>
    <!-- Current Group Card -->
    <div v-if="store.groups.length > 0" class="current-card">
      <div class="current-label">本轮出题组</div>
      <div class="current-name">{{ store.groups[0].name }}</div>
      <div v-if="store.groups[0].leader" class="current-leader">
        负责人：{{ store.groups[0].leader }}
        <span v-if="store.groups[0].leaderNo"> {{ store.groups[0].leaderNo }}</span>
      </div>
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

    <div v-if="queueGroups.length > 0" class="queue-list">
      <div
        v-for="(row, $index) in queueGroups"
        :key="row.id"
        class="queue-item"
        :class="{ 'drag-over': dragOverIndex === $index }"
        draggable="true"
        @dragstart="handleDragStart($event, $index)"
        @dragover.prevent="handleDragOver($event, $index)"
        @drop="handleDrop($index)"
        @dragend="handleDragEnd"
      >
        <span class="drag-handle" title="拖拽排序">⠿</span>
        <span class="queue-index">{{ $index + 2 }}</span>
        <span class="queue-name">{{ row.name }}</span>
        <span class="queue-leader">{{ row.leader || '—' }}</span>
        <span class="queue-leader-no">{{ row.leaderNo || '—' }}</span>
        <span class="queue-actions">
          <el-button size="small" :icon="Edit" @click="openEdit(row)">编辑</el-button>
          <el-button size="small" type="danger" :icon="Delete" @click="handleDelete(row)">删除</el-button>
        </span>
      </div>
    </div>
    <el-empty v-else description="队列为空" style="margin: 24px 0;" />

    <!-- Add Dialog -->
    <el-dialog v-model="showAddDialog" title="添加组" width="480px" align-center @closed="resetAddForm">
      <el-form label-width="100px">
        <el-form-item label="组名" required>
          <el-input
            v-model="newGroupName"
            placeholder="请输入组名"
            @keyup.enter="submitAdd"
            autofocus
          />
        </el-form-item>
        <el-form-item label="负责人">
          <el-input v-model="newLeader" placeholder="请输入负责人姓名" />
        </el-form-item>
        <el-form-item label="负责人工号">
          <el-input v-model="newLeaderNo" placeholder="请输入负责人工号" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showAddDialog = false">取消</el-button>
        <el-button type="primary" @click="submitAdd">确认添加</el-button>
      </template>
    </el-dialog>

    <!-- Edit Dialog -->
    <el-dialog v-model="showEditDialog" title="编辑组" width="480px" align-center>
      <el-form label-width="100px">
        <el-form-item label="组名" required>
          <el-input
            v-model="editName"
            placeholder="请输入组名"
            @keyup.enter="submitEdit"
          />
        </el-form-item>
        <el-form-item label="负责人">
          <el-input v-model="editLeader" placeholder="请输入负责人姓名" />
        </el-form-item>
        <el-form-item label="负责人工号">
          <el-input v-model="editLeaderNo" placeholder="请输入负责人工号" />
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
import { ref, computed } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, Edit, Delete } from '@element-plus/icons-vue'
import { useGroupsStore } from '../stores/groups'

const store = useGroupsStore()
const queueGroups = computed(() => store.groups.slice(1))

const showAddDialog = ref(false)
const newGroupName = ref('')
const newLeader = ref('')
const newLeaderNo = ref('')

const showEditDialog = ref(false)
const editName = ref('')
const editLeader = ref('')
const editLeaderNo = ref('')
const editingId = ref(null)

const dragOverIndex = ref(-1)
let dragFromIndex = -1

function resetAddForm() {
  newGroupName.value = ''
  newLeader.value = ''
  newLeaderNo.value = ''
}

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
  store.addGroup({
    name: newGroupName.value,
    leader: newLeader.value,
    leaderNo: newLeaderNo.value,
  })
  ElMessage.success(`已添加「${newGroupName.value.trim()}」`)
  resetAddForm()
  showAddDialog.value = false
}

function openEdit(row) {
  editingId.value = row.id
  editName.value = row.name
  editLeader.value = row.leader || ''
  editLeaderNo.value = row.leaderNo || ''
  showEditDialog.value = true
}

function submitEdit() {
  if (!editName.value.trim()) { ElMessage.warning('组名不能为空'); return }
  store.editGroup(editingId.value, {
    name: editName.value,
    leader: editLeader.value,
    leaderNo: editLeaderNo.value,
  })
  showEditDialog.value = false
  ElMessage.success('修改成功')
}

function handleDragStart(e, index) {
  dragFromIndex = index + 1
  e.dataTransfer.effectAllowed = 'move'
  e.dataTransfer.setData('text/plain', '')
  e.target.classList.add('dragging')
}

function handleDragOver(e, index) {
  e.dataTransfer.dropEffect = 'move'
  dragOverIndex.value = index
}

function handleDrop(toQueueIndex) {
  dragOverIndex.value = -1
  if (dragFromIndex < 0) return
  const toIndex = toQueueIndex + 1
  if (dragFromIndex === toIndex) return
  store.moveGroup(dragFromIndex, toIndex)
  ElMessage.success('已更新顺序')
}

function handleDragEnd(e) {
  e.target.classList.remove('dragging')
  dragOverIndex.value = -1
  dragFromIndex = -1
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
  margin-bottom: 8px;
}

.current-leader {
  font-size: 14px;
  color: #1976d2;
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

.queue-list {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.queue-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 14px 16px;
  background: #fff;
  border: 1px solid #e4e7ed;
  border-radius: 6px;
  cursor: default;
  transition: box-shadow 0.2s, border-color 0.2s, transform 0.15s;
}

.queue-item:hover {
  border-color: #c0c4cc;
}

.queue-item.drag-over {
  border-color: #409eff;
  background: #ecf5ff;
  box-shadow: 0 0 0 1px #409eff inset;
}

.queue-item.dragging {
  opacity: 0.45;
  transform: scale(0.98);
}

.drag-handle {
  cursor: grab;
  font-size: 18px;
  color: #c0c4cc;
  letter-spacing: 2px;
  user-select: none;
  line-height: 1;
  padding: 2px 4px;
  border-radius: 3px;
  transition: color 0.15s;
}

.drag-handle:hover {
  color: #409eff;
}

.queue-item .queue-index {
  width: 36px;
  text-align: center;
  flex-shrink: 0;
}

.queue-name {
  flex: 1;
  font-weight: 500;
  color: #303133;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.queue-leader {
  width: 100px;
  color: #606266;
  text-align: center;
  flex-shrink: 0;
}

.queue-leader-no {
  width: 120px;
  color: #909399;
  text-align: center;
  flex-shrink: 0;
}

.queue-actions {
  flex-shrink: 0;
  display: flex;
  gap: 6px;
}
</style>
