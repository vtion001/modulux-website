"use client"
import { useEffect, useMemo, useState } from "react"

type Platform = "facebook" | "instagram" | "twitter" | "linkedin"

export function SocialPreviewModal({
  open,
  onClose,
  content,
  mediaUrl,
  linkUrl,
  selectedPlatforms,
  platformColors,
}: {
  open: boolean
  onClose: () => void
  content: string
  mediaUrl?: string
  linkUrl?: string
  selectedPlatforms?: string[]
  platformColors: Record<string, string>
}) {
  const tabs: Platform[] = ["facebook", "instagram", "twitter", "linkedin"]
  const initialTab: Platform = useMemo(() => {
    const first = (selectedPlatforms || []).find((p) => tabs.includes(p as Platform))
    return (first as Platform) || "facebook"
  }, [selectedPlatforms])
  const [active, setActive] = useState<Platform>(initialTab)
  const [postType, setPostType] = useState<"text" | "image" | "video" | "link">("text")
  const [showMeta, setShowMeta] = useState(true)

  useEffect(() => {
    setActive(initialTab)
  }, [initialTab])

  if (!open) return null

  const limits: Record<Platform, number | null> = {
    twitter: 280,
    instagram: 2200,
    facebook: null,
    linkedin: 3000,
  }

  const count = content.length
  const limit = limits[active]

  const Badge = ({ p }: { p: Platform }) => (
    <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${platformColors[p] || "bg-muted"} text-white`}>{p}</span>
  )

  const MediaBox = ({ ratio }: { ratio: string }) => (
    <div className={`w-full ${ratio} bg-muted rounded-md overflow-hidden`}>
      {postType === "image" && mediaUrl ? (
        <img src={mediaUrl} alt="media" className="w-full h-full object-cover" />
      ) : postType === "video" ? (
        <div className="w-full h-full bg-black/70 flex items-center justify-center text-white text-xs">Video</div>
      ) : postType === "link" && linkUrl ? (
        <div className="w-full h-full bg-background border border-border/40">
          <div className="p-3">
            <div className="text-sm font-medium truncate">{linkUrl}</div>
            {showMeta && <div className="text-xs text-muted-foreground mt-1">Preview title and description</div>}
          </div>
        </div>
      ) : null}
    </div>
  )

  const renderFacebook = () => (
    <div className="max-w-xl mx-auto">
      <div className="flex items-center gap-2 mb-3">
        <div className="w-8 h-8 rounded-full bg-muted" />
        <div>
          <div className="text-sm font-medium">ModuLux</div>
          <div className="text-xs text-muted-foreground">Just now</div>
        </div>
      </div>
      <div className="text-sm text-foreground whitespace-pre-wrap">{content}</div>
      {(postType === "image" || postType === "video" || postType === "link") && (
        <div className="mt-3">
          <MediaBox ratio="aspect-[1.91/1]" />
        </div>
      )}
      {limit && (
        <div className="mt-2 text-xs text-muted-foreground">{count}/{limit}</div>
      )}
    </div>
  )

  const renderInstagram = () => (
    <div className="max-w-sm mx-auto">
      <div className="flex items-center gap-2 mb-3">
        <div className="w-8 h-8 rounded-full bg-muted" />
        <div className="text-sm font-medium">modulux</div>
      </div>
      <MediaBox ratio="aspect-square" />
      <div className="mt-3 text-sm">
        <span className="font-medium">modulux</span> {content}
      </div>
      {limit && (
        <div className="mt-2 text-xs text-muted-foreground">{count}/{limit}</div>
      )}
    </div>
  )

  const renderTwitter = () => (
    <div className="max-w-xl mx-auto">
      <div className="flex items-center gap-2 mb-3">
        <div className="w-8 h-8 rounded-full bg-muted" />
        <div className="text-sm font-medium">ModuLux</div>
        <Badge p="twitter" />
      </div>
      <div className="text-sm text-foreground whitespace-pre-wrap">{content}</div>
      {(postType === "image" || postType === "video" || postType === "link") && (
        <div className="mt-3">
          <MediaBox ratio="aspect-[2/1]" />
        </div>
      )}
      {limit && (
        <div className="mt-2 text-xs text-muted-foreground">{count}/{limit}</div>
      )}
    </div>
  )

  const renderLinkedIn = () => (
    <div className="max-w-xl mx-auto">
      <div className="flex items-center gap-2 mb-3">
        <div className="w-8 h-8 rounded-md bg-muted" />
        <div>
          <div className="text-sm font-medium">ModuLux</div>
          <div className="text-xs text-muted-foreground">Company • Now</div>
        </div>
      </div>
      <div className="text-sm text-foreground whitespace-pre-wrap">{content}</div>
      {(postType === "image" || postType === "video" || postType === "link") && (
        <div className="mt-3">
          <MediaBox ratio="aspect-[1.91/1]" />
        </div>
      )}
      {limit && (
        <div className="mt-2 text-xs text-muted-foreground">{count}/{limit}</div>
      )}
    </div>
  )

  const body = active === "facebook" ? renderFacebook() : active === "instagram" ? renderInstagram() : active === "twitter" ? renderTwitter() : renderLinkedIn()

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm">
      <div className="flex items-start justify-center min-h-screen pt-16 px-4">
        <div className="bg-card rounded-lg shadow-xl border border-border/40 w-full max-w-4xl">
          <div className="p-4 border-b border-border/40">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {tabs.map((p) => (
                  <button
                    key={p}
                    onClick={() => setActive(p)}
                    className={`px-3 py-1.5 rounded-md text-sm ${active === p ? "bg-muted text-foreground" : "border border-border/40 text-muted-foreground hover:bg-muted/40"}`}
                  >
                    <span className="capitalize">{p}</span>
                  </button>
                ))}
              </div>
              <div className="flex items-center gap-2">
                <div className="hidden md:flex items-center gap-2">
                  <button onClick={() => setPostType("text")} className={`px-2.5 py-1.5 rounded-md text-xs border ${postType === "text" ? "bg-primary text-white border-primary" : "border-border/40"}`}>Text</button>
                  <button onClick={() => setPostType("image")} className={`px-2.5 py-1.5 rounded-md text-xs border ${postType === "image" ? "bg-primary text-white border-primary" : "border-border/40"}`}>Image</button>
                  <button onClick={() => setPostType("video")} className={`px-2.5 py-1.5 rounded-md text-xs border ${postType === "video" ? "bg-primary text-white border-primary" : "border-border/40"}`}>Video</button>
                  <button onClick={() => setPostType("link")} className={`px-2.5 py-1.5 rounded-md text-xs border ${postType === "link" ? "bg-primary text-white border-primary" : "border-border/40"}`}>Link</button>
                  <label className="ml-2 inline-flex items-center gap-2 text-xs text-muted-foreground">
                    <input type="checkbox" checked={showMeta} onChange={(e) => setShowMeta(e.target.checked)} /> Show metadata
                  </label>
                </div>
                <button onClick={onClose} className="px-3 py-1.5 rounded-md border border-border/40 text-sm">Close</button>
              </div>
            </div>
          </div>
          <div className="p-4">
            {body}
          </div>
        </div>
      </div>
    </div>
  )
}

