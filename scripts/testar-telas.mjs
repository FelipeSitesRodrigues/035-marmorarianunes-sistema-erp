/*
 * Teste de ponta a ponta das telas, no banco local de demonstração:
 * venda com sinal, saída barrada por falta de estoque, "Recebi" parcial e
 * correção de venda com o "o que mudou". Clica como a Val clicaria.
 *
 *   npm run db -- --demo   (em outro terminal)
 *   npm run dev            (em outro terminal)
 *   node scripts/testar-telas.mjs
 */
import { existsSync } from 'node:fs'
import { mkdir } from 'node:fs/promises'
import puppeteer from 'puppeteer-core'

const NAVEGADOR = [
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
].find((p) => existsSync(p))
const BASE = process.env.BASE ?? 'http://localhost:3035'
await mkdir('revisao', { recursive: true })

let falhas = 0
const confere = (nome, ok, extra = '') => {
  if (!ok) falhas++
  console.log(`${ok ? '  ok ' : 'FALHA'} ${nome}${ok ? '' : ` ${extra}`}`)
}

const navegador = await puppeteer.launch({ executablePath: NAVEGADOR, headless: 'new', args: ['--disable-gpu', '--force-prefers-reduced-motion'] })
const pagina = await navegador.newPage()
const errosConsole = []
pagina.on('pageerror', (e) => errosConsole.push(e.message))
pagina.on('console', (m) => m.type() === 'error' && errosConsole.push(m.text()))
await pagina.emulateMediaFeatures([{ name: 'prefers-reduced-motion', value: 'reduce' }])
await pagina.setViewport({ width: 1440, height: 1000 })

const esperar = (ms) => new Promise((r) => setTimeout(r, ms))
const texto = () => pagina.evaluate(() => document.body.innerText)
const clicarTexto = async (seletor, conteudo) => {
  const ok = await pagina.evaluate(
    (sel, c) => {
      const el = [...document.querySelectorAll(sel)].find((e) => e.textContent.trim().includes(c))
      if (el) el.click()
      return !!el
    },
    seletor,
    conteudo,
  )
  if (!ok) throw new Error(`não achei ${seletor} com "${conteudo}"`)
}
const definirData = (seletor, valor) =>
  pagina.evaluate(
    (sel, v) => {
      const el = document.querySelector(sel)
      Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set.call(el, v)
      el.dispatchEvent(new Event('input', { bubbles: true }))
      el.dispatchEvent(new Event('change', { bubbles: true }))
    },
    seletor,
    valor,
  )
const escolherPedra = async (campo, nome) => {
  await pagina.click(`#${campo}`)
  await pagina.waitForSelector(`input#${campo}`)
  await pagina.type(`input#${campo}`, nome)
  await pagina.keyboard.press('Enter')
  await esperar(200)
}
const preencher = async (seletor, valor) => {
  await pagina.click(seletor, { clickCount: 3 })
  await pagina.keyboard.press('Backspace')
  await pagina.type(seletor, valor)
}
const aviso = async () => {
  await pagina.waitForFunction(() => document.querySelector('[role=status] strong'), { timeout: 15000 })
  return pagina.evaluate(() => document.querySelector('[role=status]').innerText)
}

try {
  console.log('\nEntrar')
  await pagina.goto(`${BASE}/entrar`, { waitUntil: 'networkidle0' })
  await pagina.type('#email', 'val@nunes.local')
  await pagina.type('#senha', 'senha-errada-123')
  await pagina.click('button[type=submit]')
  await pagina.waitForSelector('[role=alert]')
  confere('senha errada mostra o aviso', (await texto()).includes('E-mail ou senha não conferem'))
  await preencher('#senha', 'nunes-demo-2026')
  await Promise.all([pagina.waitForNavigation({ waitUntil: 'networkidle0' }), pagina.click('button[type=submit]')])
  confere('entrou e caiu no Início', (await texto()).includes('O que você quer fazer?'))

  console.log('\nVenda com sinal')
  await pagina.goto(`${BASE}/estoque`, { waitUntil: 'networkidle0' })
  const antes = await pagina.evaluate(() =>
    [...document.querySelectorAll('tbody tr')].find((tr) => tr.innerText.includes('Verde Ubatuba'))?.querySelector('td')?.innerText,
  )
  await pagina.goto(`${BASE}/?registrar=venda`, { waitUntil: 'networkidle0' })
  await pagina.waitForSelector('dialog[open]')
  await pagina.screenshot({ path: 'revisao/form-venda-vazio-1440.png' })
  await escolherPedra('item_0_material', 'Verde Ubatuba')
  await preencher('#item_0_qtd', '2')
  await pagina.type('#cliente', 'Marcos Teste')
  await pagina.type('#servico', 'Bancada da cozinha')
  await pagina.type('#valor', '4200')
  await clicarTexto('dialog label', 'Pagou uma parte')
  await pagina.waitForSelector('#pag_parte')
  await pagina.type('#pag_parte', '2100')
  await pagina.keyboard.press('Tab')
  await clicarTexto('dialog label', 'Pix')
  await definirData('#pag_vencimento', '2026-11-15')
  await esperar(300)
  await pagina.screenshot({ path: 'revisao/form-venda-cheio-1440.png' })
  const resumoTela = await pagina.evaluate(() => document.querySelector('dialog[open]').innerText)
  confere('mostra quanto fica no estoque antes de salvar', /Depois ficam/.test(resumoTela))
  confere('mostra o que fica a receber', resumoTela.includes('Fica a receber de Marcos Teste'))
  confere('valor formata ao sair do campo', (await pagina.$eval('#pag_parte', (e) => e.value)) === '2.100,00')
  await clicarTexto('dialog button[type=submit]', 'Salvar venda')
  const msgVenda = await aviso()
  confere('confirmação diz o estoque novo', /Verde Ubatuba agora tem/.test(msgVenda), msgVenda)
  confere('confirmação diz o que entrou e o que falta', msgVenda.includes('Entrou R$ 2.100,00') && msgVenda.includes('Fica a receber R$ 2.100,00'), msgVenda)
  await esperar(1000)
  await pagina.screenshot({ path: 'revisao/aviso-venda-1440.png' })
  confere('painel fechou depois de salvar', !(await pagina.$('dialog[open]')))
  await pagina.goto(`${BASE}/estoque`, { waitUntil: 'networkidle0' })
  const depois = await pagina.evaluate(() =>
    [...document.querySelectorAll('tbody tr')].find((tr) => tr.innerText.includes('Verde Ubatuba'))?.querySelector('td')?.innerText,
  )
  confere('estoque caiu 2 chapas', parseFloat(antes) - parseFloat(depois) === 2, `${antes} -> ${depois}`)

  console.log('\nSaída maior que o estoque')
  await pagina.goto(`${BASE}/estoque?registrar=saida`, { waitUntil: 'networkidle0' })
  await pagina.waitForSelector('dialog[open]')
  await clicarTexto('dialog label', 'Usar numa obra')
  await escolherPedra('item_0_material', 'Preto São Gabriel')
  await preencher('#item_0_qtd', '99')
  await clicarTexto('dialog button[type=submit]', 'Salvar saída')
  await esperar(300)
  const erroSaida = await pagina.evaluate(() => document.querySelector('dialog[open]').innerText)
  confere('barra e explica quanto tem', /Só tem 4 chapas de Preto São Gabriel no estoque/.test(erroSaida), erroSaida.slice(0, 300))
  await pagina.screenshot({ path: 'revisao/form-saida-erro-1440.png' })
  await clicarTexto('dialog button', 'Cancelar')
  await esperar(300)

  console.log('\nRecebi uma parte')
  await pagina.goto(`${BASE}/financeiro`, { waitUntil: 'networkidle0' })
  await pagina.evaluate(() => {
    const li = [...document.querySelectorAll('#receber li')].find((l) => l.innerText.includes('Marcos Teste'))
    ;[...li.querySelectorAll('button')].find((b) => b.innerText.includes('Recebi')).click()
  })
  await pagina.waitForSelector('#receber input[inputmode=decimal]')
  await pagina.evaluate(() => {
    const el = document.querySelector('#receber input[inputmode=decimal]')
    el.select()
  })
  await pagina.keyboard.type('1000')
  await clicarTexto('#receber label', 'Dinheiro')
  await pagina.screenshot({ path: 'revisao/financeiro-recebi-1440.png' })
  await clicarTexto('#receber button', 'Confirmar')
  const msgRecebi = await aviso()
  confere('recebimento parcial deixa o resto aberto', msgRecebi.includes('Continua em aberto: R$ 1.100,00'), msgRecebi)
  await esperar(800)
  confere('a conta mostra o que falta', (await pagina.evaluate(() => document.querySelector('#receber').innerText)).includes('R$ 1.100,00'))

  console.log('\nCorrigir a venda')
  await pagina.goto(`${BASE}/historico?q=Marcos%20Teste`, { waitUntil: 'networkidle0' })
  const linkVenda = await pagina.evaluate(() => [...document.querySelectorAll('a')].find((a) => a.innerText.includes('Marcos Teste'))?.getAttribute('href'))
  await pagina.goto(`${BASE}${linkVenda}`, { waitUntil: 'networkidle0' })
  await clicarTexto('a', 'Corrigir este lançamento')
  await pagina.waitForSelector('#item_0_qtd')
  await preencher('#item_0_qtd', '3')
  await preencher('#valor', '5000')
  await pagina.type('#motivo', 'Eram 3 chapas')
  await pagina.screenshot({ path: 'revisao/form-correcao-1440.png' })
  const corpoCorrecao = await pagina.evaluate(() => document.querySelector('dialog[open]').innerText)
  confere('correção mostra o que já foi recebido', corpoCorrecao.includes('Já recebido: R$ 3.100,00'), corpoCorrecao.slice(0, 400))
  await clicarTexto('dialog button[type=submit]', 'Salvar correção')
  const msgCorrecao = await aviso()
  confere('correção confirma e guarda o original', msgCorrecao.includes('O original ficou guardado'), msgCorrecao)
  await clicarTexto('[role=status] a', 'Ver lançamento')
  await pagina.waitForFunction(() => document.body.innerText.includes('O que mudou na correção'), { timeout: 15000 })
  await esperar(500)
  const detalhe = await texto()
  if (!(detalhe.includes('R$ 4.200,00') && detalhe.includes('R$ 5.000,00') && detalhe.includes('3 chapas'))) console.log(detalhe.slice(0, 1500))
  confere('detalhe mostra o que mudou', detalhe.includes('R$ 4.200,00') && detalhe.includes('R$ 5.000,00') && detalhe.includes('3 chapas'))
  await pagina.screenshot({ path: 'revisao/historico-correcao-1440.png', fullPage: false })

  console.log('\nCelular')
  await pagina.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true })
  await pagina.goto(`${BASE}/?registrar=venda`, { waitUntil: 'networkidle0' })
  await pagina.waitForSelector('dialog[open]')
  await pagina.screenshot({ path: 'revisao/form-venda-390.png' })
  const largura = await pagina.evaluate(() => document.querySelector('dialog[open]').scrollWidth)
  confere('formulário cabe no celular', largura <= 390, `${largura}px`)
  await clicarTexto('dialog button', 'Cancelar')
  await esperar(300)
  await clicarTexto('nav button', 'Registrar')
  await esperar(400)
  await pagina.screenshot({ path: 'revisao/folha-registrar-390.png' })
  confere('botão do meio abre os cinco registros', (await pagina.$$('dialog[open] li a')).length === 5)

  confere('nenhum erro no console', errosConsole.length === 0, errosConsole.slice(0, 3).join(' | '))
} catch (e) {
  falhas++
  console.log('FALHA', e.message)
  await pagina.screenshot({ path: 'revisao/erro-teste.png' })
} finally {
  await navegador.close()
}
console.log(falhas ? `\n${falhas} FALHA(S)` : '\ntudo ok')
process.exit(falhas ? 1 : 0)
