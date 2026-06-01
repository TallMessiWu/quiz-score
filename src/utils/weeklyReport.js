// 业务快答每周汇总 —— 邮件友好 HTML 生成器
//
// 邮件客户端（尤其 Outlook / 网页邮箱）会丢弃 <style> 标签和 class，
// 因此整封邮件全部采用 <table> 布局 + 行内 style，确保排版稳定。
// 风格取向：企业正式商务，主色默认华为红，可通过 themeColor 自定义。

const HUAWEI_RED = '#C7000B' // 默认主色：华为红

// 中性色（不随主题变化）
const BG = '#eef1f5'
const CARD_BG = '#ffffff'
const SOFT = '#f6f8fa'
const BORDER = '#dfe3e8'
const HEAD_BORDER = '#cdd5de'
const TEXT = '#1f2d3d'
const SUB = '#52606d'
const MUTED = '#8a97a4'
const GREEN = '#1f7a3d'

function escapeHtml(str) {
  return String(str ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

function formatDate(iso) {
  if (!iso) return ''
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return escapeHtml(iso)
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

function typeLabel(type) {
  return type === 'multiple' ? '多选' : '单选'
}

// 期数文本：单期显示「第 X 期」，跨期显示「第 X ~ Y 期」
export function episodeText(episode, episodeEnd = null) {
  if (episode == null) return '—'
  if (episodeEnd != null && episodeEnd !== episode) {
    const lo = Math.min(episode, episodeEnd)
    const hi = Math.max(episode, episodeEnd)
    return `第 ${lo} ~ ${hi} 期`
  }
  return `第 ${episode} 期`
}

// ---- 主色派生 ----
function hexToRgb(hex) {
  const h = hex.replace('#', '')
  return { r: parseInt(h.slice(0, 2), 16), g: parseInt(h.slice(2, 4), 16), b: parseInt(h.slice(4, 6), 16) }
}

function rgbToHex(r, g, b) {
  const f = v => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0')
  return `#${f(r)}${f(g)}${f(b)}`
}

// percent < 0 变暗，> 0 变浅
function shade(hex, percent) {
  const { r, g, b } = hexToRgb(hex)
  const t = percent < 0 ? 0 : 255
  const p = Math.abs(percent)
  return rgbToHex(r + (t - r) * p, g + (t - g) * p, b + (t - b) * p)
}

function buildPalette(themeColor) {
  let primary = HUAWEI_RED
  if (themeColor && /^#?[0-9a-fA-F]{6}$/.test(String(themeColor).trim())) {
    primary = String(themeColor).trim().startsWith('#') ? String(themeColor).trim() : `#${String(themeColor).trim()}`
  }
  return {
    primary,                          // 强调色（白底上的标题竖条、数据）
    headerBg: primary,                // 页眉背景
    headerLine: shade(primary, -0.25), // 页眉底部强调线（更深）
    subtle: shade(primary, 0.78),      // 页眉浅色文字（红底上的副标题）
  }
}

// 章节标题（统一样式）
function sectionTitle(text, palette, extra = '') {
  const suffix = extra
    ? ` <span style="font-size:13px;font-weight:400;color:${MUTED};">${extra}</span>`
    : ''
  return `<div style="font-size:16px;font-weight:600;color:${TEXT};border-left:3px solid ${palette.primary};padding-left:10px;letter-spacing:0.5px;">${text}${suffix}</div>`
}

// 页眉：主色实色，含公司名 / 部门名 / 主标题 / 周期 / Logo
function renderHeader(config, palette, weekLabel) {
  const company = config.companyName ? escapeHtml(config.companyName) : ''
  const dept = config.departmentName ? escapeHtml(config.departmentName) : ''

  const brandLine = [company, dept].filter(Boolean).join(' · ')
  const brandHtml = brandLine
    ? `<div style="font-size:13px;color:${palette.subtle};letter-spacing:1px;margin-bottom:8px;">${brandLine}</div>`
    : ''

  const titleSuffix = dept ? `${dept}业务快答 · 每周汇总` : '业务快答 · 每周汇总'

  const logoCell = config.logo
    ? `<img src="${escapeHtml(config.logo)}" alt="logo" width="120" style="display:block;max-height:46px;width:auto;border:0;outline:none;text-decoration:none;" />`
    : `<table role="presentation" cellpadding="0" cellspacing="0" border="0"><tr><td style="border:1px solid rgba(255,255,255,0.45);border-radius:4px;padding:9px 16px;font-size:12px;color:${palette.subtle};letter-spacing:2px;">LOGO</td></tr></table>`

  const subParts = []
  if (config.seasonName) subParts.push(escapeHtml(config.seasonName))
  if (weekLabel) subParts.push(`汇总周期：${escapeHtml(weekLabel)}`)
  const sub = subParts.length
    ? `<div style="margin-top:8px;font-size:13px;color:${palette.subtle};">${subParts.join('　·　')}</div>`
    : ''

  return `
  <tr>
    <td style="background-color:${palette.headerBg};padding:24px 28px;border-bottom:3px solid ${palette.headerLine};">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
        <tr>
          <td style="vertical-align:middle;">
            ${brandHtml}
            <div style="font-size:21px;font-weight:600;color:#ffffff;letter-spacing:1.5px;">${titleSuffix}</div>
            ${sub}
          </td>
          <td style="vertical-align:middle;text-align:right;width:140px;">${logoCell}</td>
        </tr>
      </table>
    </td>
  </tr>`
}

// 活动说明：正式段落 + 无装饰要点表
function renderIntro(config, palette, seasonStartDate) {
  const dept = config.departmentName ? escapeHtml(config.departmentName) : '相关'
  const company = config.companyName ? escapeHtml(config.companyName) : '公司'
  const season = config.seasonName ? escapeHtml(config.seasonName) : '本赛季'
  const startTxt = seasonStartDate ? formatDate(seasonStartDate) : '—'

  const points = [
    ['活动形式', '每日中午 12:00 开始，17:20 后公布题解，以选择题方式承载。'],
    ['覆盖范围', '从硬件到软件、从底层组网拓扑到上层业务，并涵盖当前热点话题。'],
    ['在线测评', '基于过往题目开展，巩固业务知识理解（规划中）。'],
    ['有奖竞猜', '以趣味方式加深对业务知识的印象（规划中）。'],
  ]
  const rows = points.map(([k, v]) => `
    <tr>
      <td style="padding:8px 14px 8px 0;vertical-align:top;width:84px;white-space:nowrap;font-size:13px;font-weight:600;color:${palette.primary};">${k}</td>
      <td style="padding:8px 0;vertical-align:top;font-size:13px;line-height:1.7;color:${SUB};border-bottom:1px solid ${BORDER};">${v}</td>
    </tr>`).join('')

  return `
  <tr>
    <td style="padding:26px 28px 8px;">
      ${sectionTitle('活动说明', palette)}
      <p style="margin:14px 0 6px;font-size:13px;line-height:1.9;color:${SUB};">
        【业务快答】是 <strong style="color:${TEXT};">${dept}</strong> 部门面向全员开展的业务知识快问快答活动，${season}自
        <strong style="color:${palette.primary};">${startTxt}</strong> 起持续进行，旨在通过多种形式加深团队对业务的理解，
        助力 <strong style="color:${TEXT};">${dept}</strong> 部门追赶先锋步伐，为 <strong style="color:${TEXT};">${company}</strong> 积累更扎实的业务知识储备。
      </p>
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-top:10px;border-top:1px solid ${BORDER};">
        ${rows}
      </table>
    </td>
  </tr>`
}

// 本周题目（按传入顺序，组件已按 usedAt 升序排好）
function renderQuestions(questions, palette) {
  if (!questions || questions.length === 0) {
    return `
    <tr><td style="padding:24px 28px 8px;">
      ${sectionTitle('本周题目', palette)}
      <p style="margin:14px 0;font-size:13px;color:${MUTED};">本周暂无入选题目。</p>
    </td></tr>`
  }

  const items = questions.map((q, idx) => {
    const meta = `${formatDate(q.usedAt)} ｜ ${typeLabel(q.type)} ｜ ${escapeHtml(q.groupName || '')} · ${escapeHtml(q.creator || '')}`
    const explanation = (q.explanation && q.explanation.trim()) ? escapeHtml(q.explanation.trim()) : '（暂无解析）'
    return `
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:14px;background:${CARD_BG};border:1px solid ${BORDER};border-radius:6px;">
        <tr><td style="padding:0;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
            <tr><td style="background:${SOFT};padding:8px 16px;border-bottom:1px solid ${BORDER};border-radius:6px 6px 0 0;">
              <span style="font-size:13px;font-weight:600;color:${TEXT};">第 ${idx + 1} 题</span>
              <span style="font-size:12px;color:${MUTED};margin-left:10px;">${meta}</span>
            </td></tr>
            <tr><td style="padding:14px 16px;">
              <div style="font-size:14px;line-height:1.8;color:${TEXT};white-space:pre-wrap;word-break:break-word;">${escapeHtml(q.content || '')}</div>
              <div style="margin-top:12px;padding-top:10px;border-top:1px dashed ${BORDER};font-size:13px;color:${GREEN};font-weight:600;">正确答案：${escapeHtml(q.answer || '')}</div>
              <div style="margin-top:8px;font-size:13px;line-height:1.8;color:${SUB};white-space:pre-wrap;word-break:break-word;">
                <span style="color:${TEXT};font-weight:600;">答案解析及相关知识</span><br/>${explanation}
              </div>
            </td></tr>
          </table>
        </td></tr>
      </table>`
  }).join('')

  return `
  <tr>
    <td style="padding:24px 28px 4px;">
      <div style="margin-bottom:14px;">${sectionTitle('本周题目', palette, `共 ${questions.length} 题`)}</div>
      ${items}
    </td>
  </tr>`
}

// 当前赛季 TOP10 榜单
function renderLeaderboard(topPlayers, palette, seasonName) {
  if (!topPlayers || topPlayers.length === 0) return ''
  const title = seasonName ? `${escapeHtml(seasonName)}积分榜` : '当前赛季积分榜'

  const th = (txt, align = 'center', width = '') =>
    `<th style="padding:10px 8px;font-size:12px;font-weight:600;color:#ffffff;text-align:${align};border-right:1px solid rgba(255,255,255,0.18);${width}">${txt}</th>`

  // 前三名序号着色（金 / 银 / 铜），保持中性，不随主题变化
  const rankColors = ['#b8860b', '#6b7785', '#a0673b']
  const rankBg = ['#fbf5e6', '#f1f3f5', '#f6efe9']

  const rows = topPlayers.map((p, i) => {
    const total = (p.totalScore || 0) + 5 * (p.questionCount || 0)
    let rankCell
    if (i < 3) {
      rankCell = `<span style="display:inline-block;min-width:24px;padding:2px 4px;background:${rankBg[i]};color:${rankColors[i]};border-radius:3px;font-weight:700;">${i + 1}</span>`
    } else {
      rankCell = `<span style="color:${SUB};">${i + 1}</span>`
    }
    const zebra = i % 2 === 1 ? `background:${SOFT};` : ''
    return `
      <tr style="${zebra}">
        <td style="padding:9px 8px;font-size:13px;text-align:center;border-bottom:1px solid ${BORDER};border-right:1px solid ${BORDER};">${rankCell}</td>
        <td style="padding:9px 12px;font-size:13px;color:${TEXT};text-align:left;border-bottom:1px solid ${BORDER};border-right:1px solid ${BORDER};">${escapeHtml(p.name || '')}</td>
        <td style="padding:9px 8px;font-size:13px;color:${SUB};text-align:center;border-bottom:1px solid ${BORDER};border-right:1px solid ${BORDER};">${p.totalScore || 0}</td>
        <td style="padding:9px 8px;font-size:13px;color:${SUB};text-align:center;border-bottom:1px solid ${BORDER};border-right:1px solid ${BORDER};">${p.questionCount || 0}</td>
        <td style="padding:9px 8px;font-size:14px;font-weight:700;color:${palette.primary};text-align:center;border-bottom:1px solid ${BORDER};">${total}</td>
      </tr>`
  }).join('')

  return `
  <tr>
    <td style="padding:24px 28px 4px;">
      <div style="margin-bottom:14px;">${sectionTitle(title, palette, 'TOP 10')}</div>
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;border:1px solid ${HEAD_BORDER};">
        <tr style="background:${palette.headerBg};">
          ${th('排名', 'center', 'width:56px;')}
          ${th('姓名', 'left')}
          ${th('答题分', 'center', 'width:72px;')}
          ${th('出题数', 'center', 'width:72px;')}
          ${th('总得分', 'center', 'width:80px;')}
        </tr>
        ${rows}
      </table>
      <div style="margin-top:8px;font-size:11px;color:${MUTED};">注：总得分 = 答题分 + 5 × 出题数</div>
    </td>
  </tr>`
}

// 赛季统计条
function renderStats(palette, episode, episodeEnd, participantCount, totalQuestionCount, seasonName) {
  const title = seasonName ? `${escapeHtml(seasonName)}概览` : '赛季概览'
  const isRange = episode != null && episodeEnd != null && episodeEnd !== episode
  const stat = (label, value, withBorder = true) => `
    <td width="33%" style="padding:14px 6px;text-align:center;${withBorder ? `border-right:1px solid ${BORDER};` : ''}">
      <div style="font-size:23px;font-weight:700;color:${palette.primary};letter-spacing:0.5px;">${value}</div>
      <div style="margin-top:4px;font-size:12px;color:${SUB};letter-spacing:0.5px;">${label}</div>
    </td>`

  return `
  <tr>
    <td style="padding:24px 28px 8px;">
      <div style="margin-bottom:14px;">${sectionTitle(title, palette)}</div>
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:${SOFT};border:1px solid ${BORDER};border-radius:6px;">
        <tr>
          ${stat(isRange ? '覆盖期数' : '当前期数', episodeText(episode, episodeEnd))}
          ${stat('累计参与', `${participantCount} 人`)}
          ${stat('累计出题', `${totalQuestionCount} 道`, false)}
        </tr>
      </table>
    </td>
  </tr>`
}

// 往期归档链接
function renderArchive(config, palette) {
  if (config.archiveUrl) {
    return `
    <tr>
      <td style="padding:18px 28px 8px;text-align:center;">
        <a href="${escapeHtml(config.archiveUrl)}" style="display:inline-block;padding:11px 26px;background:${palette.headerBg};color:#ffffff;font-size:13px;font-weight:600;text-decoration:none;border-radius:4px;letter-spacing:1px;">查看往期题目归档 &rsaquo;</a>
      </td>
    </tr>`
  }
  return `
    <tr>
      <td style="padding:18px 28px 8px;text-align:center;">
        <span style="display:inline-block;padding:11px 26px;background:${SOFT};color:${MUTED};font-size:13px;border:1px solid ${BORDER};border-radius:4px;letter-spacing:1px;">往期题目归档（链接待配置）</span>
      </td>
    </tr>`
}

function renderFooter(config) {
  const company = config.companyName ? escapeHtml(config.companyName) : ''
  const dept = config.departmentName ? escapeHtml(config.departmentName) : ''
  const sign = [company, dept].filter(Boolean).join(' · ')
  if (!sign) return ''
  return `
  <tr>
    <td style="padding:20px 28px 26px;text-align:center;border-top:1px solid ${BORDER};background:${SOFT};">
      <div style="font-size:11px;color:${MUTED};line-height:1.8;">${sign}</div>
    </td>
  </tr>`
}

/**
 * 生成完整的邮件友好 HTML 字符串。
 * @param {Object} opts
 * @param {Array}  opts.questions          本周入选题目（已按 usedAt 升序）
 * @param {Array}  opts.topPlayers         TOP10 玩家（已按总得分降序）
 * @param {Object} opts.config             { companyName, departmentName, seasonName, archiveUrl, logo, themeColor }
 * @param {number|null} opts.episode       起始期数
 * @param {number|null} opts.episodeEnd    结束期数（跨多期时显示「第 X ~ Y 期」）
 * @param {number} opts.participantCount   参与人数
 * @param {number} opts.totalQuestionCount 累计出题数
 * @param {string|null} opts.seasonStartDate 赛季开始日期
 * @param {string} opts.weekLabel          本周日期范围标签
 * @param {string} opts.themeColor         主色（留空默认华为红）
 */
export function buildReportHtml({
  questions = [],
  topPlayers = [],
  config = {},
  episode = null,
  episodeEnd = null,
  participantCount = 0,
  totalQuestionCount = 0,
  seasonStartDate = null,
  weekLabel = '',
  themeColor = '',
} = {}) {
  const palette = buildPalette(themeColor || config.themeColor)

  const titleParts = [config.companyName, config.departmentName, '业务快答周报'].filter(Boolean)
  const docTitle = escapeHtml(titleParts.join(' '))

  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>${docTitle}</title>
</head>
<body style="margin:0;padding:0;background:${BG};">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:${BG};padding:24px 0;">
  <tr>
    <td align="center">
      <table role="presentation" width="640" cellpadding="0" cellspacing="0" border="0" style="width:640px;max-width:640px;background:${CARD_BG};border:1px solid ${HEAD_BORDER};border-radius:8px;overflow:hidden;font-family:'PingFang SC','Microsoft YaHei','Segoe UI',sans-serif;">
        ${renderHeader(config, palette, weekLabel)}
        ${renderIntro(config, palette, seasonStartDate)}
        ${renderQuestions(questions, palette)}
        ${renderLeaderboard(topPlayers, palette, config.seasonName)}
        ${renderStats(palette, episode, episodeEnd, participantCount, totalQuestionCount, config.seasonName)}
        ${renderArchive(config, palette)}
        ${renderFooter(config)}
      </table>
    </td>
  </tr>
</table>
</body>
</html>`
}
