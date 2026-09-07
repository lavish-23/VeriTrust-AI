export type MediaType = 'image' | 'video' | 'audio' | 'document' | 'cross-modal'
export type Verdict = 'authentic' | 'suspicious' | 'deepfake'

export const mediaLabels: Record<MediaType, string> = {
  image: 'Image',
  video: 'Video',
  audio: 'Audio',
  document: 'Document',
  'cross-modal': 'Cross-Modal',
}

export const verdictLabels: Record<Verdict, string> = {
  authentic: 'Likely Genuine',
  suspicious: 'Suspicious',
  deepfake: 'Likely Deepfake',
}

export type ScanRecord = {
  id: string
  name: string
  type: MediaType
  score: number
  verdict: Verdict
  date: string
  threat: string
  caseId?: string
}

export const scanHistory: ScanRecord[] = [
  { id: 'SCN-4821', name: 'quarterly_earnings.mp4', type: 'video', score: 22, verdict: 'deepfake', date: '2026-07-29 14:22', threat: 'Executive Impersonation' },
  { id: 'SCN-4820', name: 'ceo_voice_memo.wav', type: 'audio', score: 34, verdict: 'suspicious', date: '2026-07-29 11:05', threat: 'Financial Scam' },
  { id: 'SCN-4819', name: 'passport_scan.pdf', type: 'document', score: 91, verdict: 'authentic', date: '2026-07-28 18:40', threat: 'None' },
  { id: 'SCN-4818', name: 'campaign_hero.png', type: 'image', score: 96, verdict: 'authentic', date: '2026-07-28 16:12', threat: 'None' },
  { id: 'SCN-4817', name: 'kyc_bundle_331', type: 'cross-modal', score: 41, verdict: 'suspicious', date: '2026-07-28 09:57', threat: 'Identity Fraud' },
  { id: 'SCN-4816', name: 'news_clip_viral.mp4', type: 'video', score: 18, verdict: 'deepfake', date: '2026-07-27 22:33', threat: 'Fake News' },
  { id: 'SCN-4815', name: 'signed_contract.pdf', type: 'document', score: 88, verdict: 'authentic', date: '2026-07-27 15:19', threat: 'None' },
  { id: 'SCN-4814', name: 'support_call.mp3', type: 'audio', score: 73, verdict: 'suspicious', date: '2026-07-27 12:44', threat: 'Financial Scam' },
  { id: 'SCN-4813', name: 'product_render.jpg', type: 'image', score: 62, verdict: 'suspicious', date: '2026-07-26 19:02', threat: 'None' },
  { id: 'SCN-4812', name: 'gov_permit_A12.pdf', type: 'document', score: 29, verdict: 'deepfake', date: '2026-07-26 10:15', threat: 'Government Forgery' },
  { id: 'SCN-4811', name: 'interview_final.mp4', type: 'video', score: 94, verdict: 'authentic', date: '2026-07-25 17:48', threat: 'None' },
  { id: 'SCN-4810', name: 'anchor_broadcast.png', type: 'image', score: 37, verdict: 'deepfake', date: '2026-07-25 08:21', threat: 'Fake News' },
]

export const dashboardStats = [
  { label: 'Total Scans', value: '4,821', delta: '+12.4%', trend: 'up' as const, icon: 'scan' },
  { label: 'Deepfakes Detected', value: '612', delta: '+8.1%', trend: 'up' as const, icon: 'alert' },
  { label: 'Authentic Files', value: '3,944', delta: '+4.6%', trend: 'up' as const, icon: 'check' },
  { label: 'Avg. Authenticity', value: '78.3%', delta: '-1.2%', trend: 'down' as const, icon: 'gauge' },
]

export const weeklyScans = [
  { day: 'Mon', scans: 320, deepfakes: 41 },
  { day: 'Tue', scans: 412, deepfakes: 58 },
  { day: 'Wed', scans: 386, deepfakes: 47 },
  { day: 'Thu', scans: 505, deepfakes: 72 },
  { day: 'Fri', scans: 478, deepfakes: 63 },
  { day: 'Sat', scans: 240, deepfakes: 22 },
  { day: 'Sun', scans: 198, deepfakes: 18 },
]

export const monthlyTrend = [
  { month: 'Jan', authentic: 620, fake: 120 },
  { month: 'Feb', authentic: 710, fake: 160 },
  { month: 'Mar', authentic: 680, fake: 190 },
  { month: 'Apr', authentic: 820, fake: 210 },
  { month: 'May', authentic: 910, fake: 260 },
  { month: 'Jun', authentic: 1020, fake: 240 },
  { month: 'Jul', authentic: 1180, fake: 310 },
]

export const authenticityTrend = [
  { month: 'Jan', score: 82 },
  { month: 'Feb', score: 80 },
  { month: 'Mar', score: 76 },
  { month: 'Apr', score: 79 },
  { month: 'May', score: 74 },
  { month: 'Jun', score: 77 },
  { month: 'Jul', score: 78 },
]

export const mediaDistribution = [
  { name: 'Image', value: 1820, key: 'image' },
  { name: 'Video', value: 1240, key: 'video' },
  { name: 'Audio', value: 760, key: 'audio' },
  { name: 'Document', value: 680, key: 'document' },
  { name: 'Cross-Modal', value: 321, key: 'cross' },
]

export const threatCategories = [
  { name: 'Identity Fraud', value: 184 },
  { name: 'Financial Scam', value: 152 },
  { name: 'Fake News', value: 121 },
  { name: 'Exec Impersonation', value: 88 },
  { name: 'Government Forgery', value: 67 },
]

export const riskDistribution = [
  { name: 'Low', value: 3944 },
  { name: 'Medium', value: 265 },
  { name: 'High', value: 612 },
]

export const liveFeed = [
  { id: 1, type: 'video', label: 'Face-swap detected in uploaded interview', level: 'high', time: '12s ago', region: 'EU-West' },
  { id: 2, type: 'audio', label: 'Voice clone flagged on support line', level: 'high', time: '48s ago', region: 'US-East' },
  { id: 3, type: 'document', label: 'Metadata tampering on ID document', level: 'medium', time: '1m ago', region: 'APAC' },
  { id: 4, type: 'image', label: 'AI watermark absent, GAN artifacts found', level: 'medium', time: '2m ago', region: 'US-West' },
  { id: 5, type: 'video', label: 'Lip-sync mismatch in political clip', level: 'high', time: '3m ago', region: 'EU-North' },
  { id: 6, type: 'document', label: 'Forged government permit intercepted', level: 'high', time: '5m ago', region: 'MEA' },
]

export const securityTips = [
  'Always verify executive payment requests over a second channel.',
  'Cross-modal checks catch fakes single-file scans miss.',
  'Look for missing C2PA / AI watermark provenance metadata.',
  'Voice clones often lack natural breathing micro-pauses.',
]

export const latestThreats = [
  { title: 'Real-time video call face-swaps', delta: '+34%', level: 'high' },
  { title: 'Cloned-voice CEO fraud (vishing)', delta: '+21%', level: 'high' },
  { title: 'AI-forged KYC identity documents', delta: '+17%', level: 'medium' },
  { title: 'Synthetic news anchor broadcasts', delta: '+9%', level: 'medium' },
]

export type AnalysisCard = {
  key: string
  title: string
  score: number
  status: Verdict
  confidence: number
  explanation: string
  findings: { label: string; value: string; risk: 'low' | 'medium' | 'high' }[]
}

export const reportAnalysis: AnalysisCard[] = [
  {
    key: 'video',
    title: 'Video Analysis',
    score: 24,
    status: 'deepfake',
    confidence: 97,
    explanation:
      'Frame-level inconsistencies and temporal flicker around the jawline strongly indicate a GAN-based face reenactment.',
    findings: [
      { label: 'Face swap probability', value: '94%', risk: 'high' },
      { label: 'Lip-sync mismatch', value: 'Detected', risk: 'high' },
      { label: 'Temporal flicker', value: 'High', risk: 'high' },
      { label: 'Blink rate', value: 'Abnormal', risk: 'medium' },
    ],
  },
  {
    key: 'audio',
    title: 'Audio Analysis',
    score: 31,
    status: 'deepfake',
    confidence: 92,
    explanation:
      'Spectral formant artifacts and absent breathing micro-pauses are consistent with a neural voice clone.',
    findings: [
      { label: 'Voice clone probability', value: '89%', risk: 'high' },
      { label: 'Breathing pattern', value: 'Missing', risk: 'high' },
      { label: 'Spectral artifacts', value: 'Present', risk: 'medium' },
      { label: 'Background coherence', value: 'Low', risk: 'medium' },
    ],
  },
  {
    key: 'image',
    title: 'Image Analysis',
    score: 38,
    status: 'suspicious',
    confidence: 84,
    explanation:
      'Localized diffusion-model texture patterns detected in the background, though the subject appears partially genuine.',
    findings: [
      { label: 'GAN artifacts', value: 'Detected', risk: 'medium' },
      { label: 'AI watermark', value: 'Absent', risk: 'medium' },
      { label: 'Noise fingerprint', value: 'Inconsistent', risk: 'medium' },
      { label: 'ELA residue', value: 'Elevated', risk: 'low' },
    ],
  },
  {
    key: 'document',
    title: 'Document Analysis',
    score: 46,
    status: 'suspicious',
    confidence: 79,
    explanation:
      'OCR font-rendering deltas and layer edits suggest fields were digitally altered after issuance.',
    findings: [
      { label: 'Forgery indicators', value: '3 found', risk: 'medium' },
      { label: 'Font consistency', value: 'Mismatch', risk: 'medium' },
      { label: 'OCR confidence', value: '71%', risk: 'low' },
      { label: 'Digital signature', value: 'Invalid', risk: 'high' },
    ],
  },
  {
    key: 'metadata',
    title: 'Metadata Analysis',
    score: 29,
    status: 'deepfake',
    confidence: 88,
    explanation:
      'Creation timestamps, device signature and C2PA provenance chain do not align across the submitted files.',
    findings: [
      { label: 'Metadata mismatch', value: 'Yes', risk: 'high' },
      { label: 'C2PA provenance', value: 'Broken', risk: 'high' },
      { label: 'Device signature', value: 'Spoofed', risk: 'medium' },
      { label: 'Edit history', value: 'Stripped', risk: 'medium' },
    ],
  },
  {
    key: 'cross',
    title: 'Cross-Modal Consistency',
    score: 21,
    status: 'deepfake',
    confidence: 95,
    explanation:
      'The voice, face and document identity signals contradict one another — a hallmark of a coordinated synthetic identity.',
    findings: [
      { label: 'Voice ↔ face match', value: 'Fails', risk: 'high' },
      { label: 'Identity coherence', value: 'Low', risk: 'high' },
      { label: 'Timeline alignment', value: 'Broken', risk: 'high' },
      { label: 'Source correlation', value: 'None', risk: 'medium' },
    ],
  },
]
