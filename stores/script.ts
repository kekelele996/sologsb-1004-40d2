import { defineStore } from 'pinia'
import type { Exhibit, Hall, HandoverAspect, HandoverBaseline, HandoverReport, Language, LanguageDraft, LanguageHandover, LockedSegmentSnapshot, PersistedState, RevisionEntry, ScriptStatus, Segment, VersionSnapshot } from '~/types'

export const LANGUAGES: Language[] = [
  { id: 'zh', code: 'zh-CN', label: '简体中文', shortLabel: '中' },
  { id: 'en', code: 'en-US', label: 'English', shortLabel: 'EN' },
  { id: 'ja', code: 'ja-JP', label: '日本語', shortLabel: '日' }
]

export const ASPECT_LABELS: Record<HandoverAspect, string> = { title: '标题', narration: '正文', segments: '锁定段落' }

const STORAGE_KEY = 'museum-script-studio-v1'

function lockedSegmentSnapshots(draft: LanguageDraft): LockedSegmentSnapshot[] {
  return draft.segments.filter(segment => segment.locked).map(segment => ({ id: segment.id, label: segment.label, content: segment.content }))
}

export function buildHandoverReport(exhibit: Exhibit, baselines: HandoverBaseline[], revisions: RevisionEntry[]): HandoverReport {
  const baseline = baselines.find(item => item.exhibitId === exhibit.id)
  const exhibitRevisions = revisions
    .filter(item => item.exhibitId === exhibit.id)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
  const languages: LanguageHandover[] = LANGUAGES.map(language => {
    const draft = exhibit.drafts.find(item => item.languageId === language.id)
    const missing = !draft || !draft.title.trim() || !draft.narration.trim()
    const entry = baseline?.entries.find(item => item.languageId === language.id)
    const changedAspects: HandoverAspect[] = []
    if (baseline && draft) {
      const locked = lockedSegmentSnapshots(draft)
      if (!entry) {
        if (draft.title.trim()) changedAspects.push('title')
        if (draft.narration.trim()) changedAspects.push('narration')
        if (locked.length) changedAspects.push('segments')
      } else {
        if (draft.title !== entry.title) changedAspects.push('title')
        if (draft.narration !== entry.narration) changedAspects.push('narration')
        if (JSON.stringify(locked) !== JSON.stringify(entry.lockedSegments)) changedAspects.push('segments')
      }
    }
    const documented = new Set(exhibitRevisions.filter(item => item.languageId === language.id).flatMap(item => item.aspects))
    const undocumentedAspects = changedAspects.filter(aspect => !documented.has(aspect))
    return { languageId: language.id, missing, addedAfterBaseline: Boolean(baseline && draft && !entry), changedAspects, undocumentedAspects }
  })
  const blockers: string[] = []
  if (!baseline) blockers.push('尚未建立交接基线')
  languages.forEach((report, index) => {
    const label = LANGUAGES[index].label
    if (report.missing) blockers.push(`${label}缺稿`)
    report.undocumentedAspects.forEach(aspect => blockers.push(`${label}的${ASPECT_LABELS[aspect]}改动未登记说明`))
  })
  const ready = Boolean(baseline) && languages.every(report => !report.missing && report.undocumentedAspects.length === 0)
  return { baseline, languages, revisions: exhibitRevisions, ready, blockers }
}

const segments = (prefix: string, values: Array<[string, string, boolean?]>): Segment[] => values.map(([label, content, locked], index) => ({
  id: `${prefix}-${index + 1}`,
  label,
  content,
  locked: Boolean(locked)
}))

function demoState(): PersistedState {
  const halls: Hall[] = [
    { id: 'hall-ancient', name: '文明肇始厅', description: '史前至先秦文明，共 18 个展项' },
    { id: 'hall-silk', name: '丝路交融厅', description: '丝绸之路上的器物、信仰与生活' },
    { id: 'hall-city', name: '城市记忆厅', description: '近现代城市空间与市民生活' }
  ]
  const exhibits: Exhibit[] = [
    {
      id: 'exhibit-jade', hallId: 'hall-ancient', code: 'A-03', title: '玉琮：沟通天地的礼器', order: 3,
      drafts: [
        {
          id: 'draft-jade-zh', languageId: 'zh', title: '玉琮：沟通天地的礼器',
          narration: '这件玉琮出土于长江下游的良渚遗址。它外方内圆，四角雕刻神人兽面纹，体现了新石器时代晚期精湛的玉器工艺。',
          accessibility: '玉琮为深青色，高约二十厘米。触摸模型可感受方形四角与中央圆孔；圆孔贯穿器身。',
          durationMinutes: 2.5, sources: '《中国玉器全集》第一卷；本馆藏品档案 1987-J-042',
          status: 'approved', updatedAt: '2026-09-23T08:35:00.000Z',
          segments: segments('jade-zh', [
            ['开场定位', '这件玉琮来自距今约五千年的良渚文化。', true],
            ['器物观察', '它外方内圆，四角雕刻神人兽面纹。', true],
            ['文化含义', '玉琮常被看作沟通天地的礼器，也象征权力与身份。'],
            ['参观提示', '请沿展柜顺时针观察，触摸复制品前先使用免洗消毒液。']
          ])
        },
        {
          id: 'draft-jade-en', languageId: 'en', title: 'Jade Cong: A Ritual Object Between Heaven and Earth',
          narration: 'This jade cong was made by the Liangzhu culture. Its square exterior and circular bore embody an early Chinese vision of the cosmos.',
          accessibility: 'The object is dark green. A tactile model shows four corners, carved faces, and a central circular opening.',
          durationMinutes: 2.3, sources: 'Complete Collection of Chinese Jades, Vol. 1; Museum accession 1987-J-042',
          status: 'review', updatedAt: '2026-09-24T02:15:00.000Z',
          segments: segments('jade-en', [
            ['Introduction', 'This jade cong is about five thousand years old.', true],
            ['Visual description', 'Its square body encloses a circular opening, while spirit-and-animal motifs cover the corners.'],
            ['Meaning', 'Jade cong is understood as a ritual link between heaven and earth.']
          ])
        },
        {
          id: 'draft-jade-ja', languageId: 'ja', title: '玉琮：天と地を結ぶ礼器',
          narration: 'こちらは良渚文化の玉琮です。外側は方形、中央は円形で、四隅には神人獣面文が刻まれています。',
          accessibility: '暗い青緑色の玉製です。複製模型では四つの角と中央の円孔を触って確認できます。',
          durationMinutes: 2.6, sources: '『中国玉器全集』第一巻；収蔵資料 1987-J-042',
          status: 'draft', updatedAt: '2026-09-21T06:10:00.000Z',
          segments: segments('jade-ja', [
            ['導入', '約五千年前の良渚文化を代表する玉琮です。'],
            ['観察', '外側は方形、中央は円形で、四隅に精緻な文様があります。'],
            ['意味', '天地を結ぶ礼器として、力と身分を象徴しました。']
          ])
        }
      ]
    },
    {
      id: 'exhibit-bronze', hallId: 'hall-ancient', code: 'A-08', title: '青铜爵与礼制', order: 8,
      drafts: [
        {
          id: 'draft-bronze-zh', languageId: 'zh', title: '青铜爵与礼制',
          narration: '爵是最早的青铜酒器之一。三足稳定器身，长流便于倾倒，柱饰则与商周礼仪密切相关。',
          accessibility: '器物为青铜色，器口一侧有长流，底部三足支撑。复制件配有可触摸的局部纹样。',
          durationMinutes: 3, sources: '《殷周青铜器通论》；展品说明卡 A-08',
          status: 'returned', updatedAt: '2026-09-23T11:20:00.000Z',
          segments: segments('bronze-zh', [
            ['器物介绍', '这是一件商代青铜爵，用于温酒和饮酒。'],
            ['结构说明', '三足使器身稳定，前端的流便于倾倒。'],
            ['礼制背景', '青铜器数量与形制反映了使用者的身份。'],
            ['修改说明', '审校意见：补充“柱饰”的用途，并核对年代。']
          ])
        },
        {
          id: 'draft-bronze-en', languageId: 'en', title: 'Bronze Jue and Ritual Order',
          narration: 'The jue was among the earliest bronze drinking vessels. Its tripod base, pouring spout, and posts were closely tied to Shang and Zhou ritual.',
          accessibility: 'The tactile replica includes the long spout, tripod feet, and raised posts.',
          durationMinutes: 2.8, sources: 'A General Survey of Yin-Zhou Bronzes; Gallery label A-08',
          status: 'draft', updatedAt: '2026-09-22T09:00:00.000Z',
          segments: segments('bronze-en', [['Object', 'This bronze jue dates to the Shang dynasty.'], ['Structure', 'Three legs support the body; the long spout guides the pour.']])
        }
      ]
    },
    {
      id: 'exhibit-silk', hallId: 'hall-silk', code: 'B-02', title: '织机与丝路纹样', order: 2,
      drafts: [{
        id: 'draft-silk-zh', languageId: 'zh', title: '织机与丝路纹样',
        narration: '织机把一根根丝线组织成布匹，也把不同地区的图案与故事连接在一起。',
        accessibility: '体验区提供放大纹样、凸点经纬结构以及可操作的小型织机模型。',
        durationMinutes: 4, sources: '馆内教育活动资料；丝绸之路纺织史专题',
        status: 'draft', updatedAt: '2026-09-20T03:00:00.000Z',
        segments: segments('silk-zh', [['序言', '丝绸不只是一种材料，也是交流的媒介。'], ['互动', '请试着推动梭子，观察经纬线如何交会。']])
      }]
    }
  ]
  return {
    halls,
    exhibits,
    versions: [],
    baselines: [],
    revisions: [],
    selectedHallId: halls[0].id,
    selectedExhibitId: exhibits[0].id,
    selectedLanguageId: 'zh',
    lastSavedAt: new Date().toISOString()
  }
}

export const useScriptStore = defineStore('museum-script', {
  state: () => ({
    halls: [] as Hall[],
    exhibits: [] as Exhibit[],
    versions: [] as VersionSnapshot[],
    baselines: [] as HandoverBaseline[],
    revisions: [] as RevisionEntry[],
    selectedHallId: '',
    selectedExhibitId: '',
    selectedLanguageId: 'zh',
    lastSavedAt: '',
    hydrated: false,
    past: [] as string[],
    future: [] as string[],
    notice: ''
  }),
  getters: {
    selectedHall(state): Hall | undefined {
      return state.halls.find(hall => hall.id === state.selectedHallId)
    },
    hallExhibits(state): Exhibit[] {
      return state.exhibits.filter(exhibit => exhibit.hallId === state.selectedHallId).sort((a, b) => a.order - b.order)
    },
    selectedExhibit(state): Exhibit | undefined {
      return state.exhibits.find(exhibit => exhibit.id === state.selectedExhibitId)
    },
    selectedDraft(): LanguageDraft | undefined {
      return this.selectedExhibit?.drafts.find(draft => draft.languageId === this.selectedLanguageId)
    },
    wordCount(): number {
      return (this.selectedDraft?.narration || '').replace(/\s/g, '').length
    },
    baselineFor(state) {
      return (exhibitId: string): HandoverBaseline | undefined => state.baselines.find(item => item.exhibitId === exhibitId)
    },
    handoverReport(state) {
      return (exhibit: Exhibit): HandoverReport => buildHandoverReport(exhibit, state.baselines, state.revisions)
    },
    canUndo(state): boolean { return state.past.length > 0 },
    canRedo(state): boolean { return state.future.length > 0 }
  },
  actions: {
    hydrate() {
      if (this.hydrated || typeof localStorage === 'undefined') return
      const saved = localStorage.getItem(STORAGE_KEY)
      if (saved) {
        try {
          const data = JSON.parse(saved) as PersistedState
          this.$patch({ ...data, hydrated: true })
          if (!Array.isArray(this.baselines)) this.baselines = []
          if (!Array.isArray(this.revisions)) this.revisions = []
          if (!this.halls.length || !this.exhibits.length) this.resetDemo()
        } catch {
          this.resetDemo()
        }
      } else {
        this.resetDemo()
      }
      this.ensureSelection()
      this.hydrated = true
    },
    resetDemo() {
      this.$patch({ ...demoState(), hydrated: true, past: [], future: [] })
      this.persist()
      this.notice = '示例数据已就绪，可直接开始编辑。'
    },
    snapshot(): string {
      return JSON.stringify({ halls: this.halls, exhibits: this.exhibits, versions: this.versions })
    },
    commit(mutator: () => void) {
      this.past.push(this.snapshot())
      if (this.past.length > 50) this.past.shift()
      this.future = []
      mutator()
      this.lastSavedAt = new Date().toISOString()
      this.persist()
    },
    persist() {
      if (typeof localStorage === 'undefined') return
      const data: PersistedState = {
        halls: this.halls, exhibits: this.exhibits, versions: this.versions,
        baselines: this.baselines, revisions: this.revisions,
        selectedHallId: this.selectedHallId, selectedExhibitId: this.selectedExhibitId,
        selectedLanguageId: this.selectedLanguageId, lastSavedAt: this.lastSavedAt
      }
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
    },
    ensureSelection() {
      if (!this.halls.some(hall => hall.id === this.selectedHallId)) this.selectedHallId = this.halls[0]?.id || ''
      const inHall = this.exhibits.filter(exhibit => exhibit.hallId === this.selectedHallId)
      if (!inHall.some(exhibit => exhibit.id === this.selectedExhibitId)) this.selectedExhibitId = inHall[0]?.id || ''
      const exhibit = this.selectedExhibit
      if (!exhibit?.drafts.some(draft => draft.languageId === this.selectedLanguageId)) this.selectedLanguageId = exhibit?.drafts[0]?.languageId || 'zh'
    },
    selectHall(id: string) {
      this.selectedHallId = id
      const exhibit = this.exhibits.find(item => item.hallId === id)
      this.selectedExhibitId = exhibit?.id || ''
      this.ensureSelection()
      this.persist()
    },
    selectExhibit(id: string) {
      this.selectedExhibitId = id
      this.ensureSelection()
      this.persist()
    },
    selectLanguage(id: string) {
      this.selectedLanguageId = id
      this.persist()
    },
    updateDraft(patch: Partial<Pick<LanguageDraft, 'title' | 'narration' | 'accessibility' | 'durationMinutes' | 'sources'>>, note?: string) {
      const draft = this.selectedDraft
      const exhibit = this.selectedExhibit
      if (!draft || !exhibit) return false
      const tracked = (['title', 'narration'] as const).filter(field => field in patch && patch[field] !== draft[field])
      const baseline = this.baselines.find(item => item.exhibitId === exhibit.id)
      if (baseline && tracked.length && !note?.trim()) {
        this.notice = '交接基线已建立：请填写修订说明后再保存，本次改动未写入。'
        return false
      }
      this.commit(() => {
        Object.assign(draft, patch, { updatedAt: new Date().toISOString() })
        if (baseline && tracked.length && note) {
          this.logRevision(exhibit.id, draft.languageId, tracked.map(field => field === 'title' ? '更新展项标题' : '更新讲解词正文').join('、'), [...tracked], note)
        }
      })
      this.notice = baseline && tracked.length ? '改动已保存，并登记了修订说明。' : '改动已自动保存到浏览器。'
      return true
    },
    updateSegment(id: string, patch: Partial<Pick<Segment, 'label' | 'content'>>, note?: string) {
      const draft = this.selectedDraft
      const exhibit = this.selectedExhibit
      const segment = draft?.segments.find(item => item.id === id)
      if (!draft || !exhibit || !segment || segment.locked) return false
      const baseline = this.baselines.find(item => item.exhibitId === exhibit.id)
      if (baseline && !note?.trim()) {
        this.notice = '交接基线已建立：请填写修订说明后再保存，本次改动未写入。'
        return false
      }
      this.commit(() => {
        Object.assign(segment, patch)
        if (baseline && note) this.logRevision(exhibit.id, draft.languageId, `编辑段落「${segment.label || '未命名段落'}」`, ['segments'], note)
      })
      this.notice = baseline ? '段落改动已保存，并登记了修订说明。' : '改动已自动保存到浏览器。'
      return true
    },
    toggleLock(id: string, note?: string) {
      const draft = this.selectedDraft
      const exhibit = this.selectedExhibit
      const segment = draft?.segments.find(item => item.id === id)
      if (!draft || !exhibit || !segment) return false
      const baseline = this.baselines.find(item => item.exhibitId === exhibit.id)
      if (baseline && !note?.trim()) {
        this.notice = '交接基线已建立：请填写修订说明后再调整锁定，本次改动未写入。'
        return false
      }
      this.commit(() => {
        segment.locked = !segment.locked
        if (baseline && note) this.logRevision(exhibit.id, draft.languageId, `${segment.locked ? '锁定' : '解锁'}段落「${segment.label || '未命名段落'}」`, ['segments'], note)
      })
      this.notice = segment.locked ? '段落已锁定，避免误改。' : '段落已解锁。'
      return true
    },
    addSegment(note?: string) {
      const draft = this.selectedDraft
      const exhibit = this.selectedExhibit
      if (!draft || !exhibit) return false
      const baseline = this.baselines.find(item => item.exhibitId === exhibit.id)
      if (baseline && !note?.trim()) {
        this.notice = '交接基线已建立：请填写修订说明后再新增段落。'
        return false
      }
      this.commit(() => {
        draft.segments.push({ id: `segment-${Date.now()}`, label: `新段落 ${draft.segments.length + 1}`, content: '', locked: false })
        if (baseline && note) this.logRevision(exhibit.id, draft.languageId, '新增段落', ['segments'], note)
      })
      this.notice = baseline ? '段落已新增，并登记了修订说明。' : '已新增段落。'
      return true
    },
    removeSegment(id: string, note?: string) {
      const draft = this.selectedDraft
      const exhibit = this.selectedExhibit
      const segment = draft?.segments.find(item => item.id === id)
      if (!draft || !exhibit || !segment || segment.locked) return false
      const baseline = this.baselines.find(item => item.exhibitId === exhibit.id)
      if (baseline && !note?.trim()) {
        this.notice = '交接基线已建立：请填写修订说明后再删除段落。'
        return false
      }
      this.commit(() => {
        draft.segments = draft.segments.filter(item => item.id !== id)
        if (baseline && note) this.logRevision(exhibit.id, draft.languageId, `删除段落「${segment.label || '未命名段落'}」`, ['segments'], note)
      })
      return true
    },
    setStatus(status: ScriptStatus) {
      const draft = this.selectedDraft
      if (!draft) return
      this.commit(() => { draft.status = status; draft.updatedAt = new Date().toISOString() })
      this.notice = `状态已更新为“${this.statusLabel(status)}”。`
    },
    statusLabel(status: ScriptStatus) {
      return ({ draft: '草稿', review: '待审', returned: '退回', approved: '已定稿' })[status]
    },
    createVersion(name?: string) {
      const draft = this.selectedDraft
      if (!draft) return
      const version: VersionSnapshot = {
        id: `version-${Date.now()}`,
        exhibitId: this.selectedExhibitId,
        languageId: this.selectedLanguageId,
        name: name || `${new Date().toLocaleString('zh-CN', { hour12: false })} 快照`,
        createdAt: new Date().toISOString(),
        draft: JSON.parse(JSON.stringify(draft))
      }
      this.commit(() => this.versions.unshift(version))
      this.notice = '已保存当前版本，可在版本页比较或恢复。'
    },
    restoreVersion(id: string, note?: string) {
      const version = this.versions.find(item => item.id === id)
      if (!version) return false
      const baseline = this.baselines.find(item => item.exhibitId === version.exhibitId)
      if (baseline && !note?.trim()) {
        this.notice = '交接基线已建立：请填写修订说明后再恢复版本。'
        return false
      }
      this.commit(() => {
        const exhibit = this.exhibits.find(item => item.id === version.exhibitId)
        if (!exhibit) return
        const index = exhibit.drafts.findIndex(item => item.languageId === version.languageId)
        const restored = JSON.parse(JSON.stringify(version.draft)) as LanguageDraft
        if (index >= 0) exhibit.drafts[index] = restored
        else exhibit.drafts.push(restored)
        if (baseline && note) this.logRevision(version.exhibitId, version.languageId, `恢复版本「${version.name}」`, ['title', 'narration', 'segments'], note)
      })
      this.selectedExhibitId = version.exhibitId
      this.selectedLanguageId = version.languageId
      this.notice = '版本已恢复，并作为一次可撤销操作保存。'
      return true
    },
    createDraft(languageId: string, note?: string) {
      const exhibit = this.selectedExhibit
      const language = LANGUAGES.find(item => item.id === languageId)
      if (!exhibit || !language || exhibit.drafts.some(item => item.languageId === languageId)) return false
      const baseline = this.baselines.find(item => item.exhibitId === exhibit.id)
      if (baseline && !note?.trim()) {
        this.notice = '交接基线已建立：请填写修订说明后再新建稿件。'
        return false
      }
      this.commit(() => {
        exhibit.drafts.push({
          id: `draft-${exhibit.id}-${languageId}-${Date.now()}`,
          languageId,
          title: '',
          narration: '',
          accessibility: '',
          durationMinutes: 1,
          sources: '',
          status: 'draft',
          segments: [],
          updatedAt: new Date().toISOString()
        })
        if (baseline && note) this.logRevision(exhibit.id, languageId, `新建${language.label}稿件`, [], note)
      })
      this.selectedLanguageId = languageId
      this.persist()
      this.notice = `已新建${language.label}稿件，请补全标题与正文。`
      return true
    },
    establishBaseline() {
      const exhibit = this.selectedExhibit
      if (!exhibit) return
      const baseline: HandoverBaseline = {
        id: `baseline-${Date.now()}`,
        exhibitId: exhibit.id,
        createdAt: new Date().toISOString(),
        entries: exhibit.drafts.map(draft => ({
          languageId: draft.languageId,
          title: draft.title,
          narration: draft.narration,
          lockedSegments: lockedSegmentSnapshots(draft)
        }))
      }
      this.commit(() => {
        this.baselines = [...this.baselines.filter(item => item.exhibitId !== exhibit.id), baseline]
        this.revisions = this.revisions.filter(item => item.exhibitId !== exhibit.id)
      })
      this.past = []
      this.future = []
      this.notice = '交接基线已建立：已记录三种语言当前的标题、正文和锁定段落，之后修改需填写修订说明。'
    },
    logRevision(exhibitId: string, languageId: string, summary: string, aspects: HandoverAspect[], note: string) {
      this.revisions.unshift({
        id: `revision-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        exhibitId,
        languageId,
        summary,
        note: note.trim(),
        aspects,
        createdAt: new Date().toISOString()
      })
    },
    undo() {
      const state = this.past.pop()
      if (!state) return
      this.future.push(this.snapshot())
      this.$patch(JSON.parse(state))
      this.lastSavedAt = new Date().toISOString()
      this.ensureSelection()
      this.persist()
      this.notice = '已撤销上一步。'
    },
    redo() {
      const state = this.future.pop()
      if (!state) return
      this.past.push(this.snapshot())
      this.$patch(JSON.parse(state))
      this.lastSavedAt = new Date().toISOString()
      this.ensureSelection()
      this.persist()
      this.notice = '已重做。'
    },
    completionFor(exhibit: Exhibit, languageId: string): number {
      const draft = exhibit.drafts.find(item => item.languageId === languageId)
      if (!draft) return 0
      const checks = [draft.title, draft.narration, draft.accessibility, draft.sources, draft.segments.length > 0 ? 'segments' : '']
      return Math.round(checks.filter(Boolean).length / checks.length * 100)
    }
  }
})
