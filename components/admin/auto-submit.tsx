"use client"

import { SaveForm } from "@/components/admin/save-form"

export function AutoSubmitDate({ action, hidden, defaultValue, className, name = "due_date", successMessage }: { action: (formData: FormData) => Promise<any>; hidden: { name: string; value: string }[]; defaultValue?: string; className?: string; name?: string; successMessage?: string }) {
  return (
    <SaveForm action={action} successMessage={successMessage}>
      {hidden.map((h) => (
        <input key={h.name} type="hidden" name={h.name} defaultValue={h.value} />
      ))}
      <input type="date" name={name} defaultValue={defaultValue} className={className} onChange={(e) => { try { (e.currentTarget as any).form?.requestSubmit() } catch {} }} />
    </SaveForm>
  )
}

export function AutoSubmitRange({ action, hidden, defaultValue, className, name = "progress", min = 0, max = 100, successMessage }: { action: (formData: FormData) => Promise<any>; hidden: { name: string; value: string }[]; defaultValue?: number; className?: string; name?: string; min?: number; max?: number; successMessage?: string }) {
  return (
    <SaveForm action={action} successMessage={successMessage}>
      {hidden.map((h) => (
        <input key={h.name} type="hidden" name={h.name} defaultValue={h.value} />
      ))}
      <input type="range" name={name} min={min} max={max} defaultValue={defaultValue} className={className} onChange={(e) => { try { (e.currentTarget as any).form?.requestSubmit() } catch {} }} />
    </SaveForm>
  )
}

export function AutoSubmitSelect({ action, hidden, defaultValue, className, name, options, successMessage }: { action: (formData: FormData) => Promise<any>; hidden: { name: string; value: string }[]; defaultValue: string; className?: string; name: string; options: string[]; successMessage?: string }) {
  return (
    <SaveForm action={action} successMessage={successMessage}>
      {hidden.map((h) => (
        <input key={h.name} type="hidden" name={h.name} defaultValue={h.value} />
      ))}
      <select name={name} defaultValue={defaultValue} className={className} onChange={(e) => { try { (e.currentTarget as any).form?.requestSubmit() } catch {} }}>
        {options.map((o) => (
          <option key={o}>{o}</option>
        ))}
      </select>
    </SaveForm>
  )
}
