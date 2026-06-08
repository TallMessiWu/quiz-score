import { defineStore, acceptHMRUpdate } from 'pinia'
import { ref } from 'vue'

export const useReportConfigStore = defineStore('reportConfig', () => {
  const companyName = ref('')
  const departmentName = ref('')
  const seasonName = ref('')
  const archiveUrl = ref('')
  const logo = ref('')
  const logoRatio = ref(0) // Logo 宽高比（宽/高），供邮件 HTML 锁定尺寸、避免 Outlook 拉伸
  const themeColor = ref('')

  function init(cfg) {
    companyName.value = cfg?.companyName ?? ''
    departmentName.value = cfg?.departmentName ?? ''
    seasonName.value = cfg?.seasonName ?? ''
    archiveUrl.value = cfg?.archiveUrl ?? ''
    logo.value = cfg?.logo ?? ''
    logoRatio.value = Number(cfg?.logoRatio) || 0
    themeColor.value = cfg?.themeColor ?? ''
  }

  async function sync() {
    await fetch('/api/report-config', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        companyName: companyName.value,
        departmentName: departmentName.value,
        seasonName: seasonName.value,
        archiveUrl: archiveUrl.value,
        logo: logo.value,
        logoRatio: logoRatio.value,
        themeColor: themeColor.value,
      }),
    })
  }

  async function save(patch) {
    if (patch) {
      if ('companyName' in patch) companyName.value = patch.companyName
      if ('departmentName' in patch) departmentName.value = patch.departmentName
      if ('seasonName' in patch) seasonName.value = patch.seasonName
      if ('archiveUrl' in patch) archiveUrl.value = patch.archiveUrl
      if ('logo' in patch) logo.value = patch.logo
      if ('logoRatio' in patch) logoRatio.value = patch.logoRatio
      if ('themeColor' in patch) themeColor.value = patch.themeColor
    }
    await sync()
  }

  return { companyName, departmentName, seasonName, archiveUrl, logo, logoRatio, themeColor, init, sync, save }
})

// 让 Pinia 在 Vite 热更新时保留 state，避免改 store 后内存数据被重置为初始值
if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useReportConfigStore, import.meta.hot))
}
