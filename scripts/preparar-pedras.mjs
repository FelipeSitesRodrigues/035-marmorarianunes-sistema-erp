/*
 * Gera as imagens que o sistema usa a partir de recursos/:
 *   public/pedras/<slug>.webp     miniatura quadrada de cada pedra do catálogo do site
 *   public/textura/marmore.webp   mármore branco do cartão de saldo (Calacatita)
 *   public/textura/escuro.webp    mármore preto bem apagado do menu (Preto Via Láctea)
 *   public/textura/fita.webp      a faixa vermelha do N da logo, de pé (fita do cartão de saldo)
 *   public/marca/icone.png        o N da logo, recortado
 *   src/app/icon.png              ícone da aba
 *
 *   npm run pedras
 */
import { mkdir, readFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import sharp from 'sharp'

const raiz = path.dirname(path.dirname(fileURLToPath(import.meta.url)))
const r = (...p) => path.join(raiz, ...p)

await mkdir(r('public', 'pedras'), { recursive: true })
await mkdir(r('public', 'textura'), { recursive: true })
await mkdir(r('public', 'marca'), { recursive: true })

const pedras = JSON.parse(await readFile(r('recursos', 'pedras.json'), 'utf8'))
for (const { slug } of pedras) {
  await sharp(r('recursos', 'pedras', `${slug}.jpg`))
    .resize(192, 192, { fit: 'cover', position: 'centre' })
    .webp({ quality: 74 })
    .toFile(r('public', 'pedras', `${slug}.webp`))
}

// Mármore claro: um pouco mais claro e frio, pra o número em grafite ler bem por cima
await sharp(r('recursos', 'marca', 'marmore-calacatita.jpg'))
  .modulate({ brightness: 1.04, saturation: 0.6 })
  .webp({ quality: 80 })
  .toFile(r('public', 'textura', 'marmore.webp'))

// Mármore escuro do menu: quase preto, os veios só aparecem de perto
await sharp(r('recursos', 'marca', 'marmore-via-lactea.png'))
  .resize(720, 720, { fit: 'cover' })
  .modulate({ brightness: 0.55, saturation: 0 })
  .linear(0.55, 0)
  .webp({ quality: 70 })
  .toFile(r('public', 'textura', 'escuro.webp'))

// Fita: o miolo da faixa vermelha do N, girado até ficar reto (-49°), recortado e posto de pé
const faixa = await sharp(r('recursos', 'marca', 'icone-logo-cinza.png'))
  .removeAlpha()
  .rotate(-49, { background: '#888' })
  .toBuffer()
// Um passo por vez: na mesma corrente, o sharp gira antes de recortar e a tira sai branca
const tira = await sharp(faixa).extract({ left: 430, top: 680, width: 370, height: 35 }).png().toBuffer()
const dePe = await sharp(tira).rotate(90).png().toBuffer()
const vermelho = await sharp(dePe).resize(104, 1100, { fit: 'fill' }).png().toBuffer()
// O veio: o mármore da Calacatita em cinza, multiplicado por cima do vermelho (como na faixa do mockup)
const veio = await sharp(r('recursos', 'marca', 'marmore-calacatita.jpg'))
  .rotate(90)
  .resize(104, 1100, { fit: 'cover' })
  .greyscale()
  .linear(1.5, -95)
  .png()
  .toBuffer()
await sharp(vermelho)
  .composite([{ input: veio, blend: 'multiply' }])
  .webp({ quality: 84 })
  .toFile(r('public', 'textura', 'fita.webp'))

await sharp(r('recursos', 'marca', 'icone-nunes.png')).png().toFile(r('public', 'marca', 'icone.png'))
await sharp(r('recursos', 'marca', 'icone-nunes.png'))
  .resize(180, 180, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
  .png()
  .toFile(r('src', 'app', 'icon.png'))

console.log(`${pedras.length} pedras, 2 texturas e o ícone prontos`)
