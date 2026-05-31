<template>
  <div class="app-wrapper">
    <header class="app-header">
      <h1>竞猜活动管理看板</h1>
    </header>
    <main class="app-main">
      <el-tabs v-model="activeTab" type="border-card" class="main-tabs">
        <el-tab-pane label="轮值看板" name="rotation">
          <GroupRotation />
        </el-tab-pane>
        <el-tab-pane label="题库" name="bank">
          <QuestionBank />
        </el-tab-pane>
        <el-tab-pane label="历史出题" name="qhistory">
          <QuestionHistory />
        </el-tab-pane>
        <el-tab-pane label="积分榜" name="leaderboard">
          <Leaderboard />
        </el-tab-pane>
        <el-tab-pane label="积分历史" name="shistory">
          <ScoreHistory />
        </el-tab-pane>
        <el-tab-pane label="周报汇总" name="weekly">
          <WeeklyReport />
        </el-tab-pane>
      </el-tabs>
    </main>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import GroupRotation from './components/GroupRotation.vue'
import QuestionBank from './components/QuestionBank.vue'
import QuestionHistory from './components/QuestionHistory.vue'
import Leaderboard from './components/Leaderboard.vue'
import ScoreHistory from './components/ScoreHistory.vue'
import WeeklyReport from './components/WeeklyReport.vue'
import { useGroupsStore } from './stores/groups'
import { useQuestionsStore } from './stores/questions'
import { useLeaderboardStore } from './stores/leaderboard'
import { useReportConfigStore } from './stores/reportConfig'

const activeTab = ref('rotation')
const groupsStore = useGroupsStore()
const questionsStore = useQuestionsStore()
const leaderboardStore = useLeaderboardStore()
const reportConfigStore = useReportConfigStore()

onMounted(async () => {
  const data = await fetch('/api/data').then(r => r.json())
  groupsStore.init(data)
  questionsStore.init(data)
  leaderboardStore.init(data)

  const cfg = await fetch('/api/report-config').then(r => r.json())
  reportConfigStore.init(cfg)
})
</script>

<style>
* { box-sizing: border-box; margin: 0; padding: 0; }

body {
  background: #f0f2f5;
  font-family: 'PingFang SC', 'Microsoft YaHei', 'Segoe UI', sans-serif;
}

.app-wrapper { min-height: 100vh; }

.app-header {
  background: linear-gradient(135deg, #1565c0, #42a5f5);
  color: white;
  padding: 14px 28px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.18);
}

.app-header h1 {
  font-size: 20px;
  font-weight: 600;
  letter-spacing: 2px;
}

.app-main { padding: 20px 28px; }

.main-tabs { border-radius: 8px; }
.main-tabs .el-tabs__content { padding: 24px; min-height: 520px; }

.section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
}

.section-title {
  font-size: 15px;
  font-weight: 600;
  color: #303133;
}
</style>
