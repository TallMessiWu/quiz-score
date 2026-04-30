import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useGroupsStore = defineStore('groups', () => {
  const groups = ref([])

  function init(data) {
    groups.value = data.groups ?? []
  }

  async function sync() {
    await fetch('/api/groups', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(groups.value),
    })
  }

  function addGroup(name) {
    groups.value.push({ id: uid(), name: name.trim() })
    sync()
  }

  function editGroup(id, name) {
    const g = groups.value.find(g => g.id === id)
    if (g) { g.name = name.trim(); sync() }
  }

  function deleteGroup(id) {
    const i = groups.value.findIndex(g => g.id === id)
    if (i !== -1) { groups.value.splice(i, 1); sync() }
  }

  function markDone() {
    if (groups.value.length > 0) {
      groups.value.push(groups.value.shift())
      sync()
    }
  }

  return { groups, init, addGroup, editGroup, deleteGroup, markDone }
})

function uid() {
  return `${Date.now()}_${Math.random().toString(36).slice(2, 6)}`
}
