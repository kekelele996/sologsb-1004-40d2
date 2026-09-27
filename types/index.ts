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

export type HandoverAspect = 'title' | 'narration' | 'segments'

export interface LockedSegmentSnapshot {
  id: string
  label: string
  content: string
}

export interface BaselineEntry {
  languageId: string
  title: string
  narration: string
  lockedSegments: LockedSegmentSnapshot[]
}

export interface HandoverBaseline {
  id: string
  exhibitId: string
  createdAt: string
  entries: BaselineEntry[]
}

export interface RevisionEntry {
  id: string
  exhibitId: string
  languageId: string
  summary: string
  note: string
  aspects: HandoverAspect[]
  createdAt: string
}

export interface LanguageHandover {
  languageId: string
  missing: boolean
  addedAfterBaseline: boolean
  changedAspects: HandoverAspect[]
  undocumentedAspects: HandoverAspect[]
}

export interface HandoverReport {
  baseline?: HandoverBaseline
  languages: LanguageHandover[]
  revisions: RevisionEntry[]
  ready: boolean
  blockers: string[]
}

export interface PersistedState {
  halls: Hall[]
  exhibits: Exhibit[]
  versions: VersionSnapshot[]
  baselines: HandoverBaseline[]
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
