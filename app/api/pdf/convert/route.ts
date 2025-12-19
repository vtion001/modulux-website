import { NextResponse } from "next/server"
export const runtime = "nodejs"

export async function POST(req: Request) {
  try {
    const { html, format } = await req.json()
    let puppeteer: any
    try {
      const reqFn = (globalThis as any).require || (0, eval)("require")
      puppeteer = reqFn("puppeteer")
    } catch {
      return NextResponse.json({ ok: false, error: "Puppeteer unavailable" }, { status: 500 })
    }
    const browser = await puppeteer.launch({ args: ["--no-sandbox", "--disable-setuid-sandbox"], headless: true })
    const page = await browser.newPage()
    await page.setContent(String(html || ""), { waitUntil: "networkidle0" })
    await page.emulateMediaType("screen")
    const pdf = await page.pdf({ format: (format as any) || "A4", printBackground: true, margin: { top: "10mm", bottom: "10mm", left: "10mm", right: "10mm" } })
    await browser.close()
    const pdf_base64 = Buffer.from(pdf).toString("base64")
    return NextResponse.json({ ok: true, pdf_base64 })
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e.message || "PDF conversion failed" }, { status: 500 })
  }
}
