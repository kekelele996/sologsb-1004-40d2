export type ScriptStatus = 'draft' | 'review' | 'returned' | 'approved'
export type DeviceKind = 'desktop' | 'tablet' | 'mobile' | 'kiosk'

export interface Hall {
  id: string
  name: string
  description: string
}

export interface Segment {
  id: string
  label: string
  content: string
  locked: boolean
}

export interface LanguageDraft {
  id: string
  languageId: string
  title: string
  narration: string
  accessibility: string
  durationMinutes: number
  sources: string
  status: ScriptStatus
  segments: Segment[]
  updatedAt: string
}

export interface Exhibit {
  id: string
  hallId: string
  code: string
  title: string
  order: number
  drafts: LanguageDraft[]
}

export interface Language {
  id: string
  code: string
  label: string
  shortLabel: string
}

export interface VersionSnapshot {
  id: string
  exhibitId: string
  languageId: string
  name: string
  createdAt: string
  draft: LanguageDraft
}

/** 纳入交接基线追踪的内容：标题、正文（讲解词）、段落锁定 */
export type HandoverField = 'title' | 'narration' | 'segments'

export interface BaselineSegment {
  id: string
  content: string
}

/** 建立基线时，单一语言记录的内容快照 */
export interface BaselineEntry {
  title: string
  narration: string
  lockedSegments: BaselineSegment[]
}

/** 一个展项的交接基线：按语言记录建线时的标题、正文与锁定段落 */
export interface HandoverBaseline {
  exhibitId: string
  createdAt: string
  entries: Record<string, BaselineEntry>
}

/** 基线之后一次带说明的改动登记 */
export interface RevisionEntry {
  id: string
  exhibitId: string
  languageId: string
  field: HandoverField
  note: string
  changedAt: string
}

export interface HandoverFieldState {
  changed: boolean
  explained: boolean
}

export interface HandoverRow {
  languageId: string
  hasDraft: boolean
  /** 基线中是否包含该语言（基线之后新建的文稿为 false） */
  baselined: boolean
  fields: Record<HandoverField, HandoverFieldState>
  changedFields: HandoverField[]
  unexplainedFields: HandoverField[]
  revisions: RevisionEntry[]
}

export interface HandoverReport {
  baseline?: HandoverBaseline
  rows: HandoverRow[]
  canHandover: boolean
  reasons: string[]
}

export interface PersistedState {
  halls: Hall[]
  exhibits: Exhibit[]
  versions: VersionSnapshot[]
  handoverBaselines: HandoverBaseline[]
  revisions: RevisionEntry[]
  selectedHallId: string
  selectedExhibitId: string
  selectedLanguageId: string
  lastSavedAt: string
}

export interface DiffLine {
  type: 'same' | 'add' | 'remove'
  text: string
}
