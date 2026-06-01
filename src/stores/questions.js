import { defineStore, acceptHMRUpdate } from 'pinia'
import { ref } from 'vue'

export const useQuestionsStore = defineStore('questions', () => {
  const bank = ref([])
  const history = ref([])

  function init(data) {
    bank.value = data.bank ?? []
    history.value = data.history ?? []
  }

  async function sync() {
    await fetch('/api/questions', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ bank: bank.value, history: history.value }),
    })
  }

  function addQuestion(q) {
    bank.value.push({ id: uid(), ...q, createdAt: new Date().toISOString() })
    sync()
  }

  function editQuestion(id, data) {
    const q = bank.value.find(q => q.id === id)
    if (q) { Object.assign(q, data); sync() }
  }

  function deleteQuestion(id) {
    const i = bank.value.findIndex(q => q.id === id)
    if (i !== -1) { bank.value.splice(i, 1); sync() }
  }

  function publishQuestion(id) {
    const i = bank.value.findIndex(q => q.id === id)
    if (i !== -1) {
      const [q] = bank.value.splice(i, 1)
      history.value.unshift({ ...q, usedAt: new Date().toISOString() })
      sync()
    }
  }

  function deleteHistory(id) {
    const i = history.value.findIndex(q => q.id === id)
    if (i !== -1) { history.value.splice(i, 1); sync() }
  }

  function editHistoryDate(id, usedAt) {
    const q = history.value.find(q => q.id === id)
    if (q) { q.usedAt = usedAt; sync() }
  }

  return { bank, history, init, addQuestion, editQuestion, deleteQuestion, publishQuestion, deleteHistory, editHistoryDate }
})

function uid() {
  return `${Date.now()}_${Math.random().toString(36).slice(2, 6)}`
}

// 让 Pinia 在 Vite 热更新时保留 state，避免改 store 后内存数据被重置为初始值
if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useQuestionsStore, import.meta.hot))
}
