import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const useLeaderboardStore = defineStore('leaderboard', () => {
  const players = ref([])
  const scoreHistory = ref([])

  const sortedPlayers = computed(() =>
    [...players.value].sort((a, b) => {
      const aTotal = a.totalScore + 5 * (a.questionCount || 0)
      const bTotal = b.totalScore + 5 * (b.questionCount || 0)
      return bTotal - aTotal
    })
  )

  function init(data) {
    players.value = data.players ?? []
    scoreHistory.value = data.scoreHistory ?? []
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

  return { players, scoreHistory, sortedPlayers, init, addScore, editPlayer, deletePlayer }
})

function uid() {
  return `${Date.now()}_${Math.random().toString(36).slice(2, 6)}`
}
