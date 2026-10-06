'use client'

import { useActionState, useState } from 'react'
import { Eye, EyeSlash, Warning } from '@phosphor-icons/react'
import { entrar, type EstadoEntrar } from '@/lib/acoes/entrar'
import s from './entrar.module.css'

export function FormEntrar() {
  const [estado, acao, pendente] = useActionState<EstadoEntrar, FormData>(entrar, { erro: null })
  const [verSenha, setVerSenha] = useState(false)

  return (
    <form action={acao} className={s.form}>
      <div className={s.campo}>
        <label htmlFor="email">E-mail</label>
        <input
          id="email"
          name="email"
          type="email"
          className="entrada"
          autoComplete="username"
          inputMode="email"
          defaultValue={estado.email}
          required
        />
      </div>
      <div className={s.campo}>
        <label htmlFor="senha">Senha</label>
        <div className={s.senha}>
          <input
            id="senha"
            name="senha"
            type={verSenha ? 'text' : 'password'}
            className="entrada"
            autoComplete="current-password"
            required
          />
          <button type="button" onClick={() => setVerSenha((v) => !v)} aria-pressed={verSenha}>
            {verSenha ? <EyeSlash aria-hidden /> : <Eye aria-hidden />}
            {verSenha ? 'Esconder' : 'Mostrar'}
          </button>
        </div>
      </div>
      {estado.erro && (
        <p className={s.erro} role="alert">
          <Warning weight="fill" aria-hidden />
          {estado.erro}
        </p>
      )}
      <button type="submit" className="botao botao-principal botao-largo" disabled={pendente}>
        {pendente ? 'Entrando...' : 'Entrar'}
      </button>
      <p className={s.esqueci}>Esqueceu a senha? Fale com o Felipe, que ele cria uma nova.</p>
    </form>
  )
}
