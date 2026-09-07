'use client'

import { useCallback, useRef, useState } from 'react'
import { motion } from 'motion/react'
import { CloudUpload, ImageIcon, Video, AudioLines, FileText, File, Lock } from 'lucide-react'
import { cn } from '@/lib/utils'

const formats = [
  { label: 'Image', icon: ImageIcon },
  { label: 'Video', icon: Video },
  { label: 'Audio', icon: AudioLines },
  { label: 'PDF', icon: FileText },
  { label: 'DOCX', icon: File },
]

function detectType(file: File): string {
  const mime = file.type
  const name = file.name.toLowerCase()
  if (mime.startsWith('image/') || /\.(png|jpg|jpeg|gif|webp|svg|bmp)$/.test(name)) return 'image'
  if (mime.startsWith('video/') || /\.(mp4|mov|avi|mkv|webm|flv)$/.test(name)) return 'video'
  if (mime.startsWith('audio/') || /\.(mp3|wav|ogg|aac|flac|m4a)$/.test(name)) return 'audio'
  if (mime === 'application/pdf' || name.endsWith('.pdf')) return 'document'
  if (
    mime === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
    name.endsWith('.docx') ||
    name.endsWith('.doc')
  )
    return 'document'
  return 'document'
}

interface UploadBoxProps {
  onFileSelect: (file: File) => void
  className?: string
  locked?: boolean
  onLockedClick?: () => void
}

export function UploadBox({ onFileSelect, className, locked, onLockedClick }: UploadBoxProps) {
  const [dragging, setDragging] = useState(false)
  const [hovering, setHovering] = useState(false)
  const [selected, setSelected] = useState<File | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const handleFile = useCallback(
    (file: File) => {
      setSelected(file)
      onFileSelect(file)
    },
    [onFileSelect],
  )

  const onDragOver = (e: React.DragEvent) => { if (!locked) { e.preventDefault(); setDragging(true) } }
  const onDragLeave = () => setDragging(false)
  const onDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragging(false)
    if (locked) return
    const file = e.dataTransfer.files?.[0]
    if (file) handleFile(file)
  }
  const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) handleFile(file)
  }
  const handleBoxClick = () => {
    if (locked) {
      onLockedClick?.()
      return
    }
    inputRef.current?.click()
  }

  const active = !locked && (dragging || hovering)

  if (locked) {
    return (
      <div
        role="button"
        tabIndex={0}
        onClick={handleBoxClick}
        onKeyDown={(e) => e.key === 'Enter' && handleBoxClick()}
        className={cn(
          'upload-box relative cursor-pointer select-none rounded-2xl border border-border/60 bg-secondary/20 transition-all duration-300',
          className,
        )}
      >
        <div className="relative flex flex-col items-center justify-center gap-4 px-6 py-12 text-center">
          <div className="grid size-20 place-items-center rounded-2xl bg-secondary/60">
            <Lock className="size-9 text-muted-foreground" strokeWidth={1.5} />
          </div>
          <div>
            <p className="text-lg font-semibold text-foreground">You've used your free verification</p>
            <p className="mt-1 text-sm text-muted-foreground">Upgrade to Premium for unlimited verifications</p>
          </div>
          <span className="rounded-xl bg-gradient-to-r from-primary to-accent px-5 py-2 text-sm font-medium text-primary-foreground">
            View Premium Plans
          </span>
        </div>
      </div>
    )
  }

  return (
    <div
      role="button"
      tabIndex={0}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
      onMouseEnter={() => setHovering(true)}
      onMouseLeave={() => setHovering(false)}
      onClick={handleBoxClick}
      onKeyDown={(e) => e.key === 'Enter' && handleBoxClick()}
      className={cn('upload-box relative cursor-pointer select-none rounded-2xl transition-all duration-300', className)}
      data-active={active ? 'true' : undefined}
      data-dragging={dragging ? 'true' : undefined}
    >
      {/* Dotted pattern background */}
      <div className="upload-dots pointer-events-none absolute inset-0 rounded-2xl" />

      {/* Animated gradient border (via pseudo-element trick using box-shadow + outline) */}
      {/* We use a real rotating conic-gradient border */}
      <div className={cn('upload-border pointer-events-none absolute inset-0 rounded-2xl', active && 'upload-border-active')} />

      {/* Pulse ring when hovering */}
      {active && !selected && (
        <div className="pointer-events-none absolute inset-0 rounded-2xl animate-ping-slow border-2 border-primary/30" />
      )}

      <input
        ref={inputRef}
        type="file"
        accept="*/*"
        className="hidden"
        onChange={onChange}
        aria-label="Upload file"
      />

      <div className="relative flex flex-col items-center justify-center gap-4 px-6 py-12 text-center">
        {/* Floating upload icon with pulse ring */}
        <div className="relative">
          {/* Outer pulse ring */}
          {active && (
            <div className="absolute inset-0 -m-3 animate-ping rounded-full bg-primary/20" />
          )}
          <motion.div
            animate={{ y: [0, -8, 0] }}
            transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
            className={cn(
              'relative grid size-20 place-items-center rounded-2xl shadow-lg transition-all duration-300',
              active
                ? 'bg-gradient-to-br from-primary/40 to-accent/40 shadow-primary/30 shadow-xl'
                : 'bg-gradient-to-br from-primary/20 to-accent/20',
            )}
          >
            <CloudUpload
              className={cn('size-10 transition-colors duration-300', active ? 'text-primary' : 'text-primary/80')}
              strokeWidth={1.5}
            />
          </motion.div>
        </div>

        {selected ? (
          <div className="flex flex-col items-center gap-1">
            <p className="text-base font-semibold text-foreground">{selected.name}</p>
            <p className="text-sm text-muted-foreground">
              {detectType(selected).toUpperCase()} &middot; {(selected.size / 1024).toFixed(1)} KB
            </p>
            <span className="mt-1 rounded-full bg-success/15 px-3 py-0.5 text-xs font-medium text-success">
              File selected — click Verify to continue
            </span>
          </div>
        ) : (
          <>
            <div>
              <p className="text-lg font-semibold text-foreground">
                {dragging ? 'Drop it here!' : 'Drag & Drop Your File'}
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                {dragging ? 'Release to upload' : 'or click to browse'}
              </p>
            </div>
            {!dragging && (
              <span className="rounded-xl border border-border/60 bg-secondary/60 px-5 py-2 text-sm font-medium text-foreground transition-colors hover:bg-secondary">
                Choose File
              </span>
            )}
          </>
        )}

        {/* Format badges */}
        <div className="flex flex-wrap justify-center gap-2 pt-1">
          {formats.map(({ label, icon: Icon }) => (
            <span
              key={label}
              className="inline-flex items-center gap-1 rounded-full border border-border/40 bg-secondary/40 px-2.5 py-0.5 text-xs text-muted-foreground"
            >
              <Icon className="size-3" />
              {label}
            </span>
          ))}
        </div>
      </div>
    </div>
  )
}
