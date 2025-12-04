"use client"

import { useEffect, useMemo, useRef, useState } from "react"

export function AssigneeFilter({ initial, inputName = "assignee" }: { initial?: string; inputName?: string }) {
  const initTokens = useMemo(() => (String(initial || "").split(",").map((s) => s.trim()).filter(Boolean)), [initial])
  const [tokens, setTokens] = useState<string[]>(initTokens)
  const [value, setValue] = useState("")
  const hiddenRef = useRef<HTMLInputElement | null>(null)

  useEffect(() => {
    if (hiddenRef.current) hiddenRef.current.value = tokens.join(",")
  }, [tokens])

  const addToken = (t: string) => {
    const v = t.trim().toUpperCase()
    if (!v) return
    if (tokens.includes(v)) return
    setTokens((prev) => [...prev, v])
    setValue("")
  }

  const removeToken = (v: string) => {
    setTokens((prev) => prev.filter((x) => x !== v))
  }

  return (
    <div>
      <label className="text-xs text-muted-foreground block mb-1">Assignee</label>
      <div className="flex flex-wrap gap-2 mb-2">
        {tokens.map((t) => (
          <span key={t} className="inline-flex items-center gap-1 px-2 py-1 rounded-full border text-xs bg-muted/40">
            <span>{t}</span>
            <button type="button" className="text-muted-foreground" aria-label={`Remove ${t}`} onClick={() => removeToken(t)}>×</button>
          </span>
        ))}
        {tokens.length === 0 && <span className="text-xs text-muted-foreground">No assignees selected</span>}
      </div>
      <input
        type="text"
        placeholder="Type initials then Enter"
        className="w-full p-2 rounded border"
        value={value}
        onChange={(e) => setValue(e.currentTarget.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === ",") {
            e.preventDefault()
            addToken(value)
          } else if (e.key === "Backspace" && value === "" && tokens.length) {
            removeToken(tokens[tokens.length - 1])
          }
        }}
      />
      <input ref={hiddenRef} type="hidden" name={inputName} defaultValue={initTokens.join(",")} />
    </div>
  )
}

