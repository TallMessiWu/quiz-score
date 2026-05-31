import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const useLeaderboardStore = defineStore('leaderboard', () => {
  const players = ref([])
  const scoreHistory = ref([])
  const seasonStartDate = ref(null)

  const sortedPlayers = computed(() =>
    [...players.value].sort((a, b) => {
      const aTotal = a.totalScore + 5 * (a.questionCount || 0)
      const bTotal = b.totalScore + 5 * (b.questionCount || 0)
      return bTotal - aTotal
    })
  )

  const uniqueParticipantCount = computed(() => players.value.length)

  const currentEpisode = computed(() => {
    if (!seasonStartDate.value) return null
    const startDay = new Date(seasonStartDate.value)
    startDay.setHours(0, 0, 0, 0)
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const diffMs = today - startDay
    return diffMs < 0 ? 1 : Math.floor(diffMs / (7 * 24 * 60 * 60 * 1000)) + 1
  })

  function init(data) {
    players.value = data.players ?? []
    scoreHistory.value = data.scoreHistory ?? []
    seasonStartDate.value = data.seasonStartDate ?? null
  }

  async function updateSeasonStart(date) {
    seasonStartDate.value = date ?? null
    await fetch('/api/season', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ seasonStartDate: date ?? null }),
    })
  }

  async function sync() {
    await fetch('/api/leaderboard', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ players: players.value, scoreHistory: scoreHistory.value }),
    })
  }

  function addScore({ name, employeeId, points, questionCount }) {
    const pts = Number(points) || 0
    const qc = Number(questionCount) || 0
    const existing = players.value.find(p => p.employeeId === employeeId.trim())

    if (existing) {
      const nameMismatch = name.trim() !== '' && existing.name !== name.trim()
      existing.totalScore += pts
      existing.questionCount = (existing.questionCount || 0) + qc
      scoreHistory.value.unshift({
        id: uid(),
        playerId: existing.id,
        playerName: existing.name,
        employeeId: existing.employeeId,
        points: pts,
        questionCount: qc,
        date: new Date().toISOString(),
      })
      sync()
      return { status: 'updated', nameMismatch, player: existing }
    }

    const newPlayer = { id: uid(), name: name.trim(), employeeId: employeeId.trim(), totalScore: pts, questionCount: qc }
    players.value.push(newPlayer)
    scoreHistory.value.unshift({
      id: uid(),
      playerId: newPlayer.id,
      playerName: newPlayer.name,
      employeeId: newPlayer.employeeId,
      points: pts,
      questionCount: qc,
      date: new Date().toISOString(),
    })
    sync()
    return { status: 'created', nameMismatch: false, player: newPlayer }
  }

  function editPlayer(id, data) {
    const p = players.value.find(p => p.id === id)
    if (p) { Object.assign(p, data); sync() }
  }

  function deletePlayer(id) {
    const i = players.value.findIndex(p => p.id === id)
    if (i !== -1) { players.value.splice(i, 1); sync() }
  }

  function deleteScoreHistory(id) {
    const i = scoreHistory.value.findIndex(s => s.id === id)
    if (i === -1) return
    const [entry] = scoreHistory.value.splice(i, 1)
    const player = players.value.find(p => p.id === entry.playerId || p.employeeId === entry.employeeId)
    if (player) {
      player.totalScore = Math.max(0, (player.totalScore || 0) - (entry.points || 0))
      player.questionCount = Math.max(0, (player.questionCount || 0) - (entry.questionCount || 0))
    }
    sync()
  }

  return { players, scoreHistory, seasonStartDate, sortedPlayers, uniqueParticipantCount, currentEpisode, init, addScore, editPlayer, deletePlayer, deleteScoreHistory, updateSeasonStart }
})

function uid() {
  return `${Date.now()}_${Math.random().toString(36).slice(2, 6)}`
}
