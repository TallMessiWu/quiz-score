function formatPublishDate(iso) {
  const d = iso ? new Date(iso) : new Date()
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export function buildQuestionText(row) {
  const date = formatPublishDate(row.usedAt)
  const type = row.type === 'single' ? '单选' : '多选'
  return `【${date}】【${type}】\n【${row.groupName}】【${row.creator}】\n${row.content}`
}

export function buildExplanationText(row) {
  const explanation = row.explanation?.trim() || '（暂无解析）'
  return `【正确答案】${row.answer}\n【答案解析及相关知识】\n${explanation}`
}
