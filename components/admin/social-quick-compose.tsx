"use client"
import { useMemo, useState } from "react"
import { SaveForm, SubmitButton } from "@/components/admin/save-form"
import { SelectOnFocusInput, SelectOnFocusTextarea } from "@/components/select-on-focus"
import { SocialPreviewModal } from "@/components/admin/social-preview-modal"

type Channel = { id: string; name: string }

export function SocialQuickCompose({
  platformColors,
  mockChannels,
  onSubmit,
}: {
  platformColors: Record<string, string>
  mockChannels: Channel[]
  onSubmit: (prev: any, formData: FormData) => Promise<any>
}) {
  const [content, setContent] = useState("")
  const [mediaUrl, setMediaUrl] = useState("")
  const [linkUrl, setLinkUrl] = useState("")
  const [schedule, setSchedule] = useState("")
  const [channels, setChannels] = useState<string[]>([])
  const [platforms, setPlatforms] = useState<string[]>([])
  const [openPreview, setOpenPreview] = useState(false)

  const allPlatforms = useMemo(() => Object.keys(platformColors), [platformColors])

  const toggle = (list: string[], setList: (v: string[]) => void, v: string) => {
    setList(list.includes(v) ? list.filter((x) => x !== v) : [...list, v])
  }

  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-gray-200 bg-white shadow-sm">
        <div className="p-4 border-b border-gray-100">
          <div className="text-sm font-medium">Compose</div>
        </div>
        <SaveForm action={onSubmit} className="p-4 space-y-4">
          <SelectOnFocusTextarea name="content" value={content} onChange={(e: any) => setContent(e.target.value)} placeholder="Write content..." className="w-full p-3 border border-border/40 rounded-md bg-gray-50 min-h-[120px] focus:outline-none focus:ring-1 focus:ring-primary/30" />
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <div className="text-xs text-gray-600 font-medium">Channels</div>
              <div className="grid grid-cols-2 gap-2">
                {mockChannels.slice(0, 4).map((channel) => (
                  <label key={channel.id} className="flex items-center gap-2 text-xs cursor-pointer">
                    <input type="checkbox" name="channels" value={channel.id} checked={channels.includes(channel.id)} onChange={() => toggle(channels, setChannels, channel.id)} className="rounded border-gray-300" />
                    <span>{channel.name}</span>
                  </label>
                ))}
              </div>
            </div>
            <div className="space-y-2">
              <div className="text-xs text-gray-600 font-medium">Platforms</div>
              <div className="grid grid-cols-2 gap-2">
                {allPlatforms.map((platform) => (
                  <label key={platform} className="flex items-center gap-2 text-xs cursor-pointer">
                    <input type="checkbox" name="platforms" value={platform} checked={platforms.includes(platform)} onChange={() => toggle(platforms, setPlatforms, platform)} className="rounded border-gray-300" />
                    <span className="capitalize">{platform}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>
          <div className="grid grid-cols-1 gap-3">
            <SelectOnFocusInput name="media_url" value={mediaUrl} onChange={(e: any) => setMediaUrl(e.target.value)} placeholder="Media URL" className="w-full p-2 border border-border/40 rounded-md bg-gray-50 focus:outline-none focus:ring-1 focus:ring-primary/30" />
            <SelectOnFocusInput name="link_url" value={linkUrl} onChange={(e: any) => setLinkUrl(e.target.value)} placeholder="Link URL" className="w-full p-2 border border-border/40 rounded-md bg-gray-50 focus:outline-none focus:ring-1 focus:ring-primary/30" />
            <SelectOnFocusInput name="schedule" value={schedule} onChange={(e: any) => setSchedule(e.target.value)} placeholder="Schedule (YYYY-MM-DD HH:mm)" className="w-full p-2 border border-border/40 rounded-md bg-gray-50 focus:outline-none focus:ring-1 focus:ring-primary/30" />
          </div>
          <div className="flex items-center gap-2">
            <SubmitButton className="flex-1 bg-primary text-white py-2 px-4 rounded-md hover:bg-primary/90 transition-colors text-sm font-medium">Schedule</SubmitButton>
            <button type="button" onClick={() => setOpenPreview(true)} className="px-3 py-2 rounded-md border border-border/40 text-sm">Preview</button>
            <a href="/api/oauth/google/authorize" className="px-3 py-2 rounded-md border border-border/40 text-sm">Connect</a>
          </div>
        </SaveForm>
      </div>

      <SocialPreviewModal
        open={openPreview}
        onClose={() => setOpenPreview(false)}
        content={content}
        mediaUrl={mediaUrl}
        linkUrl={linkUrl}
        selectedPlatforms={platforms}
        platformColors={platformColors}
      />
    </div>
  )
}

