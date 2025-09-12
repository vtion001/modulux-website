"use client"

import { useState } from "react"

const languages = [
  { code: "en", name: "English", flag: "🇺🇸" },
  { code: "tl", name: "Filipino", flag: "🇵🇭" },
  { code: "zh", name: "中文", flag: "🇨🇳" },
  { code: "ja", name: "日本語", flag: "🇯🇵" },
]

export function LanguageSelector() {
  const [currentLang, setCurrentLang] = useState("en")
  const [isOpen, setIsOpen] = useState(false)

  const currentLanguage = languages.find((lang) => lang.code === currentLang) || languages[0]

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 p-2 text-muted-foreground hover:text-foreground transition-colors duration-200 rounded-md hover:bg-muted/50"
        aria-label="Select language"
        aria-expanded={isOpen}
      >
        <span className="text-sm">{currentLanguage.flag}</span>
        <span className="hidden sm:inline text-sm font-medium">{currentLanguage.name}</span>
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute top-full right-0 mt-2 w-40 bg-background/95 backdrop-blur-xl border border-border/50 rounded-lg shadow-lg overflow-hidden z-10">
          {languages.map((language) => (
            <button
              key={language.code}
              onClick={() => {
                setCurrentLang(language.code)
                setIsOpen(false)
              }}
              className={`w-full flex items-center gap-3 px-4 py-3 text-sm transition-colors duration-200 ${
                currentLang === language.code ? "bg-primary/10 text-primary" : "text-foreground hover:bg-muted/50"
              }`}
            >
              <span>{language.flag}</span>
              <span>{language.name}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
