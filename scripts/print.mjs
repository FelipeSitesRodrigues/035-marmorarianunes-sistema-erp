/*
 * Prints de revisão com login: puppeteer-core dirigindo o Chrome ou o Edge da máquina.
 *
 *   node scripts/print.mjs <caminho> [larguras] [nome] [--pagina-inteira] [--altura=900]
 *   node scripts/print.mjs "/?registrar=venda" 1440,390 venda
 *
 * Entra com o login da demonstração (val@nunes.local) e salva em revisao/.
 * Roda com movimento reduzido (animação não atrapalha o print).
 */
import { existsSync } from 'node:fs'
import { mkdir } from 'node:fs/promises'
import puppeteer from 'puppeteer-core'

// Chrome primeiro: o Edge às vezes fica preso no meio de uma atualização e não abre
const EDGE = [
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
  'C:/Program Files/Microsoft/Edge/Application/msedge.exe',
].find((p) => existsSync(p))
const BASE = process.env.BASE ?? 'http://localhost:3035'
const [caminho = '/', larguras = '1440', nome = 'tela'] = process.argv.slice(2).filter((a) => !a.startsWith('--'))
const inteira = process.argv.includes('--pagina-inteira')
const altura = Number(process.argv.find((a) => a.startsWith('--altura='))?.split('=')[1] ?? 900)

await mkdir('revisao', { recursive: true })
const navegador = await puppeteer.launch({ executablePath: EDGE, headless: 'new', args: ['--disable-gpu', '--hide-scrollbars', '--force-prefers-reduced-motion'] })
try {
  const pagina = await navegador.newPage()
  await pagina.emulateMediaFeatures([{ name: 'prefers-reduced-motion', value: 'reduce' }])
  await pagina.setViewport({ width: 1280, height: 900 })
  await pagina.goto(`${BASE}/entrar`, { waitUntil: 'networkidle0' })
  if (pagina.url().includes('/entrar')) {
    await pagina.type('#email', 'val@nunes.local')
    await pagina.type('#senha', 'nunes-demo-2026')
    await Promise.all([pagina.waitForNavigation({ waitUntil: 'networkidle0' }), pagina.click('button[type=submit]')])
  }
  for (const largura of larguras.split(',').map(Number)) {
    await pagina.setViewport({ width: largura, height: largura < 700 ? 844 : altura, deviceScaleFactor: 1 })
    await pagina.goto(`${BASE}${caminho}`, { waitUntil: 'networkidle0' })
    await pagina.evaluate(() => document.fonts.ready)
    await new Promise((r) => setTimeout(r, 400))
    const largo = await pagina.evaluate(() => document.documentElement.scrollWidth)
    const arquivo = `revisao/${nome}-${largura}.png`
    if (inteira) {
      // O fullPage do Chrome às vezes monta outro layout: estica a janela e tira print comum
      const alto = await pagina.evaluate(() => document.documentElement.scrollHeight)
      await pagina.setViewport({ width: largura, height: Math.min(alto, 6000), deviceScaleFactor: 1 })
      await new Promise((r) => setTimeout(r, 300))
    }
    await pagina.screenshot({ path: arquivo })
    console.log(`${arquivo}${largo > largura ? `  ESTOURO: página com ${largo}px` : ''}`)
  }
} finally {
  await navegador.close()
}
