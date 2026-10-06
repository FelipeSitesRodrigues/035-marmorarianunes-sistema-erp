'use client'

import { dataCurta, FORMAS, lerNumero, reais } from '@/lib/formatos'
import type { ModoPagamento } from '@/lib/tipos'
import { CampoDinheiro, Fichas, Grupo, Opcoes, Pergunta, Resumo } from './campos'

/*
 * "O cliente já pagou?" (venda) / "Já pagou?" (compra e despesa).
 * Três respostas resolvem à vista, sinal + resto e a prazo no mesmo lugar, e
 * o resumo embaixo mostra o que vai acontecer antes de salvar.
 */

export type EstadoPagamento = { modo: ModoPagamento | null; parte: string; forma: string | null; vencimento: string }

export const pagamentoInicial = (vencimento: string): EstadoPagamento => ({
  modo: null,
  parte: '',
  forma: null,
  vencimento,
})

export function errosPagamento(p: EstadoPagamento, total: number | null, natureza: 'entrada' | 'saida') {
  const verbo = natureza === 'entrada' ? 'recebeu' : 'pagou'
  const parte = lerNumero(p.parte)
  return {
    pag_modo: !p.modo && (natureza === 'entrada' ? 'Diga se o cliente já pagou.' : 'Diga se já pagou.'),
    pag_parte:
      p.modo === 'parte' &&
      (!parte || parte <= 0
        ? `Diga quanto ${verbo} agora.`
        : total !== null && parte >= total
          ? `O valor de agora precisa ser menor que o total de ${reais(total)}.`
          : null),
    pag_forma: (p.modo === 'tudo' || p.modo === 'parte') && !p.forma && `Diga como ${verbo}.`,
    pag_vencimento: (p.modo === 'parte' || p.modo === 'depois') && !p.vencimento && 'Escolha a data.',
  }
}

export function paraEnvio(p: EstadoPagamento) {
  return {
    modo: p.modo ?? 'tudo',
    valor_pago: p.modo === 'parte' ? (lerNumero(p.parte) ?? undefined) : undefined,
    forma: p.modo === 'depois' ? undefined : (p.forma ?? undefined),
    vencimento: p.modo === 'parte' || p.modo === 'depois' ? p.vencimento : undefined,
  }
}

export function Pagamento({
  valor,
  onChange,
  natureza,
  total,
  contraparte,
  erros,
  permitirParte = true,
}: {
  valor: EstadoPagamento
  onChange: (p: EstadoPagamento) => void
  natureza: 'entrada' | 'saida'
  total: number | null
  contraparte?: string
  erros: Partial<Record<'pag_modo' | 'pag_parte' | 'pag_forma' | 'pag_vencimento', string>>
  permitirParte?: boolean
}) {
  const entrada = natureza === 'entrada'
  const mudar = (parcial: Partial<EstadoPagamento>) => onChange({ ...valor, ...parcial })

  const opcoes: { valor: ModoPagamento; titulo: string }[] = entrada
    ? [
        { valor: 'tudo', titulo: 'Pagou tudo' },
        { valor: 'parte', titulo: 'Pagou uma parte' },
        { valor: 'depois', titulo: 'Vai pagar depois' },
      ]
    : permitirParte
      ? [
          { valor: 'tudo', titulo: 'Paguei tudo' },
          { valor: 'parte', titulo: 'Paguei uma parte' },
          { valor: 'depois', titulo: 'Vou pagar depois' },
        ]
      : [
          { valor: 'tudo', titulo: 'Sim, já paguei' },
          { valor: 'depois', titulo: 'Vou pagar depois' },
        ]

  const parte = lerNumero(valor.parte) ?? 0
  const agora = valor.modo === 'tudo' ? (total ?? 0) : valor.modo === 'parte' ? parte : 0
  const resto = Math.max(0, (total ?? 0) - agora)
  const quem = contraparte?.trim() ? (entrada ? ` de ${contraparte.trim()}` : ` a ${contraparte.trim()}`) : ''

  return (
    <>
      <Grupo legenda={entrada ? 'O cliente já pagou?' : 'Já pagou?'} erro={erros.pag_modo}>
        <div id="pag_modo" tabIndex={-1}>
          <Opcoes
            nome="pagamento"
            valor={valor.modo}
            onChange={(modo) => mudar({ modo })}
            opcoes={opcoes}
            colunas={opcoes.length}
          />
        </div>
      </Grupo>

      {valor.modo === 'parte' && (
        <Pergunta rotulo={entrada ? 'Quanto recebeu agora?' : 'Quanto pagou agora?'} htmlFor="pag_parte" erro={erros.pag_parte}>
          <CampoDinheiro id="pag_parte" valor={valor.parte} onChange={(parte) => mudar({ parte })} invalido={!!erros.pag_parte} />
        </Pergunta>
      )}

      {(valor.modo === 'tudo' || valor.modo === 'parte') && (
        <Grupo legenda={entrada ? 'Como pagou?' : 'Como pagou?'} erro={erros.pag_forma}>
          <div id="pag_forma" tabIndex={-1}>
            <Fichas nome="forma" valor={valor.forma} onChange={(forma) => mudar({ forma })} opcoes={FORMAS} />
          </div>
        </Grupo>
      )}

      {(valor.modo === 'parte' || valor.modo === 'depois') && (
        <Pergunta
          rotulo={valor.modo === 'parte' ? 'Quando paga o resto?' : entrada ? 'Quando vai pagar?' : 'Quando vence?'}
          htmlFor="pag_vencimento"
          erro={erros.pag_vencimento}
        >
          <input
            id="pag_vencimento"
            type="date"
            className="entrada"
            value={valor.vencimento}
            onChange={(e) => mudar({ vencimento: e.target.value })}
            aria-invalid={!!erros.pag_vencimento || undefined}
          />
        </Pergunta>
      )}

      {valor.modo && total !== null && total > 0 && (
        <Resumo tom={entrada ? 'verde' : 'neutro'}>
          {agora > 0 && (
            <p>
              {entrada ? 'Entra hoje no caixa: ' : 'Sai do caixa: '}
              <strong>{reais(Math.min(agora, total))}</strong>.
            </p>
          )}
          {resto > 0 && (
            <p>
              {entrada ? `Fica a receber${quem}: ` : `Fica a pagar${quem}: `}
              <strong>{reais(resto)}</strong>
              {valor.vencimento ? ` até ${dataCurta(valor.vencimento)}` : ''}.
            </p>
          )}
        </Resumo>
      )}
    </>
  )
}
