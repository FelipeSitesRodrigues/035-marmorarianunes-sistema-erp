import Link from 'next/link'

export default function NaoEncontrado() {
  return (
    <div className="cartao" style={{ maxWidth: 560, padding: 28, display: 'grid', gap: 14, justifyItems: 'start' }}>
      <h1 style={{ fontSize: '2rem' }}>Não achei essa página</h1>
      <p>O lançamento ou a pedra pode ter outro número. Volte pro início e procure pelo Histórico ou pelo Estoque.</p>
      <Link href="/" className="botao botao-principal">
        Voltar pro início
      </Link>
    </div>
  )
}
