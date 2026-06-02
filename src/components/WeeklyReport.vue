<template>
  <div>
    <div class="section-header">
      <span class="section-title">周报汇总</span>
      <div class="header-actions">
        <el-button type="primary" :icon="DocumentCopy" @click="copyRich">复制（富文本）</el-button>
        <el-button :icon="Download" @click="downloadHtml">下载 .html</el-button>
      </div>
    </div>

    <!-- 配置区 -->
    <el-collapse v-model="activePanels" class="config-collapse">
      <el-collapse-item name="config">
        <template #title>
          <span class="collapse-title">📋 周报配置（公司名 / 部门名 / 归档链接 / Logo）</span>
        </template>
        <div class="config-grid">
          <el-form-item label="公司名称" class="cfg-item">
            <el-input v-model="form.companyName" placeholder="如：山海会展" clearable />
          </el-form-item>
          <el-form-item label="部门名称" class="cfg-item">
            <el-input v-model="form.departmentName" placeholder="业务快答所属部门" clearable />
          </el-form-item>
          <el-form-item label="赛季名称" class="cfg-item">
            <el-input v-model="form.seasonName" placeholder="如：第三赛季（留空显示「本赛季」）" clearable />
          </el-form-item>
          <el-form-item label="往期归档链接" class="cfg-item cfg-item-wide">
            <el-input v-model="form.archiveUrl" placeholder="https://… 往期题目归档地址" clearable />
          </el-form-item>
          <el-form-item label="主题色" class="cfg-item">
            <div class="theme-row">
              <el-color-picker v-model="form.themeColor" :predefine="themePresets" />
              <span class="theme-hint">默认华为红，可自定义</span>
              <el-button v-if="form.themeColor" link size="small" @click="form.themeColor = ''">恢复默认</el-button>
            </div>
          </el-form-item>
          <el-form-item label="Logo 图片地址" class="cfg-item cfg-item-wide">
            <el-input v-model="form.logo" placeholder="图片 URL，或点右侧上传本地图片转 base64" clearable>
              <template #append>
                <el-upload
                  :auto-upload="false"
                  :show-file-list="false"
                  accept="image/*"
                  :on-change="onLogoChange"
                >
                  <el-button :icon="Upload">上传</el-button>
                </el-upload>
              </template>
            </el-input>
          </el-form-item>
          <div class="cfg-preview">
            <span class="cfg-preview-label">Logo 预览：</span>
            <img v-if="form.logo" :src="form.logo" alt="logo" class="cfg-logo-img" />
            <span v-else class="cfg-logo-placeholder">公司 LOGO（待替换）</span>
            <el-button v-if="form.logo" link type="danger" size="small" @click="form.logo = ''">清除</el-button>
          </div>
          <div class="cfg-actions">
            <el-button type="primary" :icon="Check" @click="saveConfig">保存配置</el-button>
            <span class="cfg-hint">配置存于本地 report-config.json，已被 git 忽略，不会上传。</span>
          </div>
        </div>
      </el-collapse-item>
    </el-collapse>

    <!-- 选题区 -->
    <div class="select-bar">
      <div class="select-left">
        <span class="select-label">本周范围</span>
        <el-date-picker
          v-model="weekRange"
          type="daterange"
          range-separator="至"
          start-placeholder="开始日期"
          end-placeholder="结束日期"
          value-format="YYYY-MM-DD"
          :clearable="false"
          style="width: 280px;"
        />
        <el-button size="small" @click="resetToCurrentWeek">本周</el-button>
      </div>
      <div class="select-right">
        <el-tag type="info">本周共 {{ weekQuestions.length }} 题</el-tag>
        <el-tag type="success">已选 {{ selected.length }} 题</el-tag>
      </div>
    </div>

    <el-table
      ref="tableRef"
      :data="weekQuestions"
      border
      stripe
      row-key="id"
      empty-text="该时间范围内暂无出题记录"
      @selection-change="selected = $event"
    >
      <el-table-column type="selection" width="46" reserve-selection />
      <el-table-column type="index" label="#" width="50" align="center" />
      <el-table-column label="出题时间" width="120" align="center">
        <template #default="{ row }">{{ formatDate(row.usedAt) }}</template>
      </el-table-column>
      <el-table-column label="题目" min-width="260">
        <template #default="{ row }">
          <div class="q-text">{{ truncate(row.content) }}</div>
        </template>
      </el-table-column>
      <el-table-column label="类型" width="76" align="center">
        <template #default="{ row }">
          <el-tag :type="row.type === 'single' ? 'primary' : 'warning'" size="small">
            {{ row.type === 'single' ? '单选' : '多选' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="creator" label="出题人" width="100" align="center" />
      <el-table-column prop="groupName" label="出题组" width="120" align="center" />
    </el-table>

    <div class="select-foot">
      <span class="foot-hint">
        默认勾选本周全部题目；可手动取消不需要纳入周报的题目。题目在周报中按出题时间从早到晚排列。
      </span>
    </div>

    <!-- 预览区 -->
    <el-card class="preview-card" shadow="never">
      <div class="preview-head">
        <span class="preview-title">邮件预览（所见即所得）</span>
        <span class="preview-sub">{{ reportQuestions.length }} 题 · 含 TOP{{ topPlayers.length }} 榜单</span>
      </div>
      <iframe :srcdoc="reportHtml" class="preview-frame" title="周报预览"></iframe>
    </el-card>
  </div>
</template>

<script setup>
import { ref, computed, reactive, watch, nextTick, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { DocumentCopy, Download, Upload, Check } from '@element-plus/icons-vue'
import { useQuestionsStore } from '../stores/questions'
import { useLeaderboardStore } from '../stores/leaderboard'
import { useReportConfigStore } from '../stores/reportConfig'
import { buildReportHtml, episodeText } from '../utils/weeklyReport'

const questionsStore = useQuestionsStore()
const leaderboardStore = useLeaderboardStore()
const configStore = useReportConfigStore()

const activePanels = ref([])
const tableRef = ref(null)

// ---- 配置表单（与 store 双向同步：store 异步加载完成后回填，保存时写回） ----
const form = reactive({ companyName: '', departmentName: '', seasonName: '', archiveUrl: '', logo: '', themeColor: '' })

// 主题色预设（默认华为红）
const themePresets = ['#C7000B', '#0e3d66', '#15539e', '#1f7a3d', '#7b1fa2', '#e6a23c', '#303133']

watch(
  () => [configStore.companyName, configStore.departmentName, configStore.seasonName, configStore.archiveUrl, configStore.logo, configStore.themeColor],
  ([c, d, s, a, l, t]) => {
    form.companyName = c
    form.departmentName = d
    form.seasonName = s
    form.archiveUrl = a
    form.logo = l
    form.themeColor = t
  },
  { immediate: true }
)

function onLogoChange(file) {
  const raw = file?.raw
  if (!raw) return
  if (!raw.type.startsWith('image/')) { ElMessage.warning('请选择图片文件'); return }
  if (raw.size > 1024 * 1024) { ElMessage.warning('图片建议小于 1MB，过大可能被邮件客户端拦截'); return }
  const reader = new FileReader()
  reader.onload = () => { form.logo = reader.result }
  reader.readAsDataURL(raw)
}

async function saveConfig() {
  await configStore.save({
    companyName: form.companyName.trim(),
    departmentName: form.departmentName.trim(),
    seasonName: form.seasonName.trim(),
    archiveUrl: form.archiveUrl.trim(),
    logo: form.logo,
    themeColor: form.themeColor || '',
  })
  ElMessage.success('配置已保存')
}

// ---- 周范围（默认本周一 ~ 本周日，本地时间） ----
function currentWeekRange() {
  const now = new Date()
  const day = now.getDay() === 0 ? 7 : now.getDay() // 周日记为 7
  const monday = new Date(now)
  monday.setDate(now.getDate() - (day - 1))
  const sunday = new Date(monday)
  sunday.setDate(monday.getDate() + 6)
  return [toDateStr(monday), toDateStr(sunday)]
}

function toDateStr(d) {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

const weekRange = ref(currentWeekRange())

function resetToCurrentWeek() {
  weekRange.value = currentWeekRange()
}

// ---- 本周题目（按 usedAt 升序），默认全选 ----
const weekQuestions = computed(() => {
  const [s, e] = weekRange.value || []
  if (!s || !e) return []
  const start = new Date(`${s}T00:00:00`).getTime()
  const end = new Date(`${e}T23:59:59.999`).getTime()
  return questionsStore.history
    .filter(q => {
      if (!q.usedAt) return false
      const t = new Date(q.usedAt).getTime()
      return t >= start && t <= end
    })
    .sort((a, b) => new Date(a.usedAt) - new Date(b.usedAt))
})

const selected = ref([])

// 范围变化后，默认勾选全部本周题目
watch(weekQuestions, async (list) => {
  await nextTick()
  if (!tableRef.value) return
  tableRef.value.clearSelection()
  list.forEach(row => tableRef.value.toggleRowSelection(row, true))
}, { immediate: true })

// ---- 报告数据 ----
const reportQuestions = computed(() =>
  [...selected.value].sort((a, b) => new Date(a.usedAt) - new Date(b.usedAt))
)

// 周报榜单展示当赛季 TOP10（与积分榜「当赛季」一致），而非历史累计
const topPlayers = computed(() => leaderboardStore.seasonPlayers.slice(0, 10))

// 期数按日期计算（自赛季开始每 7 天一期），而非按今天
function episodeOf(dateStr) {
  const start = leaderboardStore.seasonStartDate
  if (!start || !dateStr) return null
  const startDay = new Date(`${start}T00:00:00`).setHours(0, 0, 0, 0)
  const ref = new Date(`${dateStr}T00:00:00`).setHours(0, 0, 0, 0)
  const diffMs = ref - startDay
  return diffMs < 0 ? 1 : Math.floor(diffMs / (7 * 24 * 60 * 60 * 1000)) + 1
}

// 按所选范围的起止日各算一个期数；跨多期时展示「第 X ~ Y 期」
const episodeStart = computed(() => episodeOf((weekRange.value || [])[0]))
const episodeEnd = computed(() => episodeOf((weekRange.value || [])[1]))

const weekLabel = computed(() => {
  const [s, e] = weekRange.value || []
  if (!s || !e) return ''
  const ep = episodeText(episodeStart.value, episodeEnd.value)
  return ep === '—' ? `${s} ~ ${e}` : `${s} ~ ${e}（${ep}）`
})

// 当赛季累计出题数（与当赛季榜单口径一致）
const seasonQuestionCount = computed(() => {
  const start = leaderboardStore.seasonStartDate
  if (!start) return questionsStore.history.length
  const startTs = new Date(`${start}T00:00:00`).getTime()
  return questionsStore.history.filter(q => {
    if (!q.usedAt) return false
    return new Date(q.usedAt).getTime() >= startTs
  }).length
})

const reportHtml = computed(() =>
  buildReportHtml({
    questions: reportQuestions.value,
    topPlayers: topPlayers.value,
    config: {
      companyName: configStore.companyName,
      departmentName: configStore.departmentName,
      seasonName: configStore.seasonName,
      archiveUrl: configStore.archiveUrl,
      logo: configStore.logo,
      themeColor: configStore.themeColor,
    },
    themeColor: configStore.themeColor,
    episode: episodeStart.value,
    episodeEnd: episodeEnd.value,
    participantCount: leaderboardStore.seasonParticipantCount,
    totalQuestionCount: seasonQuestionCount.value,
    seasonStartDate: leaderboardStore.seasonStartDate,
    weekLabel: weekLabel.value,
  })
)

// ---- 表格辅助 ----
function formatDate(iso) {
  if (!iso) return ''
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return iso
  return toDateStr(d)
}

function truncate(text, n = 60) {
  const t = (text || '').replace(/\s+/g, ' ').trim()
  return t.length > n ? `${t.slice(0, n)}…` : t
}

// ---- 导出 ----
async function copyRich() {
  const html = reportHtml.value
  const plain = reportQuestions.value.length
    ? '业务快答 · 每周汇总（请使用支持富文本的邮件客户端粘贴以保留排版）'
    : '本周暂无入选题目'
  try {
    if (navigator.clipboard && window.ClipboardItem) {
      await navigator.clipboard.write([
        new ClipboardItem({
          'text/html': new Blob([html], { type: 'text/html' }),
          'text/plain': new Blob([plain], { type: 'text/plain' }),
        }),
      ])
      ElMessage.success('已复制富文本，可直接粘贴到邮件正文')
      return
    }
    throw new Error('Clipboard API 不可用')
  } catch {
    // 回退：选区 + execCommand
    if (copyViaSelection(html)) {
      ElMessage.success('已复制富文本，可直接粘贴到邮件正文')
    } else {
      ElMessage.error('复制失败，请改用「下载 .html」')
    }
  }
}

function copyViaSelection(html) {
  const container = document.createElement('div')
  container.style.position = 'fixed'
  container.style.left = '-9999px'
  container.innerHTML = html
  document.body.appendChild(container)
  const range = document.createRange()
  range.selectNodeContents(container)
  const sel = window.getSelection()
  sel.removeAllRanges()
  sel.addRange(range)
  let ok = false
  try { ok = document.execCommand('copy') } catch { ok = false }
  sel.removeAllRanges()
  document.body.removeChild(container)
  return ok
}

function downloadHtml() {
  const blob = new Blob([reportHtml.value], { type: 'text/html;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `业务快答周报-${toDateStr(new Date())}.html`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
  ElMessage.success('已开始下载')
}

onMounted(() => {
  // 若配置全空，自动展开配置面板提示填写
  if (!configStore.companyName && !configStore.departmentName) {
    activePanels.value = ['config']
  }
})
</script>

<style scoped>
.section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.header-actions {
  display: flex;
  gap: 8px;
}

.config-collapse {
  margin-bottom: 16px;
  border: 1px solid #e4e7ed;
  border-radius: 8px;
  overflow: hidden;
}

.collapse-title {
  font-size: 14px;
  font-weight: 600;
  color: #303133;
}

.config-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 12px 20px;
  padding: 4px 4px 8px;
}

.cfg-item {
  flex: 1;
  min-width: 280px;
  margin-bottom: 0;
}

.cfg-item-wide {
  flex-basis: 100%;
}

.cfg-item :deep(.el-form-item__label) {
  font-size: 13px;
  color: #606266;
}

.cfg-preview {
  flex-basis: 100%;
  display: flex;
  align-items: center;
  gap: 10px;
}

.cfg-preview-label {
  font-size: 13px;
  color: #606266;
}

.theme-row {
  display: flex;
  align-items: center;
  gap: 10px;
}

.theme-hint {
  font-size: 12px;
  color: #909399;
}

.cfg-logo-img {
  max-height: 40px;
  max-width: 160px;
  border: 1px solid #e4e7ed;
  border-radius: 4px;
  background: #fff;
}

.cfg-logo-placeholder {
  font-size: 12px;
  color: #909399;
  padding: 8px 14px;
  border: 1px dashed #c0c4cc;
  border-radius: 4px;
}

.cfg-actions {
  flex-basis: 100%;
  display: flex;
  align-items: center;
  gap: 12px;
}

.cfg-hint {
  font-size: 12px;
  color: #909399;
}

.select-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 12px;
  padding: 12px 20px;
  background: #f5f7fa;
  border: 1px solid #e4e7ed;
  border-radius: 8px;
  margin-bottom: 16px;
}

.select-left {
  display: flex;
  align-items: center;
  gap: 10px;
}

.select-label {
  font-size: 13px;
  color: #909399;
}

.select-right {
  display: flex;
  gap: 8px;
}

.q-text {
  line-height: 1.6;
  color: #303133;
}

.select-foot {
  margin: 10px 2px 0;
}

.foot-hint {
  font-size: 12px;
  color: #909399;
}

.preview-card {
  margin-top: 24px;
  background: #fff;
  border: 1px solid #e4e7ed;
  border-radius: 8px;
}

.preview-head {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  margin-bottom: 12px;
}

.preview-title {
  font-size: 14px;
  font-weight: 600;
  color: #303133;
}

.preview-sub {
  font-size: 12px;
  color: #909399;
}

.preview-frame {
  width: 100%;
  height: 640px;
  border: 1px solid #e4e7ed;
  border-radius: 6px;
  background: #f0f2f5;
}
</style>
