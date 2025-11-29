"use client"
import * as React from "react"
import { SaveForm, SubmitButton } from "@/components/admin/save-form"
import { Image as ImgIcon, Heart, MessageCircle, Send, ThumbsUp, Share2, MoreHorizontal } from "lucide-react"

export default function SocialPreviewComposer({ onSubmit, mockChannels }: { onSubmit: (prev: any, formData: FormData) => Promise<any>; mockChannels: { id: string; name: string }[] }) {
  const [open, setOpen] = React.useState(false)
  const [content, setContent] = React.useState("")
  const [mediaUrl, setMediaUrl] = React.useState("")
  const [platforms, setPlatforms] = React.useState<string[]>(["facebook", "instagram"])
  const [channels, setChannels] = React.useState<string[]>([mockChannels[0]?.id].filter(Boolean))

  const togglePlatform = (p: string) => {
    setPlatforms((prev) => (prev.includes(p) ? prev.filter((x) => x !== p) : [...prev, p]))
  }
  const toggleChannel = (c: string) => {
    setChannels((prev) => (prev.includes(c) ? prev.filter((x) => x !== c) : [...prev, c]))
  }

  return (
    <div className="space-y-4">
      <button onClick={() => setOpen((v) => !v)} className="w-full px-3 py-2 rounded-md bg-primary text-white text-sm hover:bg-primary/90">
        {open ? "Close Composer" : "Create Post"}
      </button>

      {open && (
        <div className="space-y-4">
          <div className="rounded-xl border border-border/40 bg-white shadow-sm">
            <SaveForm action={onSubmit} className="p-4 space-y-4">
              <textarea name="content" value={content} onChange={(e) => setContent(e.target.value)} placeholder="Write content..." className="w-full p-3 border border-border/40 rounded-md bg-gray-50 min-h-[120px] focus:outline-none focus:ring-1 focus:ring-primary/30" />

              <div className="grid grid-cols-1 gap-3">
                <input name="media_url" value={mediaUrl} onChange={(e) => setMediaUrl(e.target.value)} placeholder="Media URL" className="w-full p-2 border border-border/40 rounded-md bg-gray-50 focus:outline-none focus:ring-1 focus:ring-primary/30" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-xs text-gray-600 font-medium mb-2">Channels</div>
                  <div className="grid grid-cols-1 gap-2">
                    {mockChannels.map((c) => (
                      <label key={c.id} className="flex items-center gap-2 text-xs cursor-pointer">
                        <input type="checkbox" name="channels" value={c.id} checked={channels.includes(c.id)} onChange={() => toggleChannel(c.id)} />
                        <span>{c.name}</span>
                      </label>
                    ))}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-gray-600 font-medium mb-2">Platforms</div>
                  <div className="grid grid-cols-1 gap-2">
                    {(["facebook", "instagram"] as const).map((p) => (
                      <label key={p} className="flex items-center gap-2 text-xs cursor-pointer">
                        <input type="checkbox" name="platforms" value={p} checked={platforms.includes(p)} onChange={() => togglePlatform(p)} />
                        <span className="capitalize">{p}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <SubmitButton className="flex-1 bg-primary text-white py-2 px-4 rounded-md hover:bg-primary/90 transition-colors text-sm font-medium">Schedule</SubmitButton>
                <button type="button" className="px-3 py-2 rounded-md border border-border/40 text-sm" onClick={() => setOpen(true)}>Preview</button>
              </div>
            </SaveForm>
          </div>

          <div className="grid grid-cols-1 gap-4">
            {platforms.includes("facebook") && (
              <div className="rounded-xl border border-border/40 bg-white shadow-sm overflow-hidden">
                <div className="p-3 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-8 h-8 rounded-full bg-muted" aria-hidden="true"></span>
                    <div>
                      <div className="text-sm font-medium">ModuLux</div>
                      <div className="text-[11px] text-muted-foreground">Just now</div>
                    </div>
                  </div>
                  <MoreHorizontal className="w-4 h-4 text-muted-foreground" />
                </div>
                {content && (<div className="px-3 pb-3 text-sm text-foreground">{content}</div>)}
                {mediaUrl ? (
                  <img src={mediaUrl} alt="Media" className="w-full max-h-64 object-cover" />
                ) : (
                  <div className="h-40 bg-muted/50 flex items-center justify-center text-muted-foreground"><ImgIcon className="w-6 h-6" /></div>
                )}
                <div className="p-3 flex items-center gap-6 text-sm text-muted-foreground">
                  <div className="inline-flex items-center gap-2"><ThumbsUp className="w-4 h-4" /> Like</div>
                  <div className="inline-flex items-center gap-2"><MessageCircle className="w-4 h-4" /> Comment</div>
                  <div className="inline-flex items-center gap-2"><Share2 className="w-4 h-4" /> Share</div>
                </div>
              </div>
            )}

            {platforms.includes("instagram") && (
              <div className="rounded-xl border border-border/40 bg-white shadow-sm overflow-hidden">
                <div className="p-3 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-8 h-8 rounded-full bg-muted" aria-hidden="true"></span>
                    <div className="text-sm font-medium">ModuLux</div>
                  </div>
                  <MoreHorizontal className="w-4 h-4 text-muted-foreground" />
                </div>
                {mediaUrl ? (
                  <div className="relative">
                    <img src={mediaUrl} alt="Media" className="w-full aspect-square object-cover" />
                  </div>
                ) : (
                  <div className="aspect-square bg-muted/50 flex items-center justify-center text-muted-foreground"><ImgIcon className="w-6 h-6" /></div>
                )}
                <div className="p-3 flex items-center gap-4 text-muted-foreground">
                  <Heart className="w-5 h-5" />
                  <MessageCircle className="w-5 h-5" />
                  <Send className="w-5 h-5" />
                </div>
                {content && (<div className="px-3 pb-3 text-sm"><span className="font-medium mr-2">ModuLux</span>{content}</div>)}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
