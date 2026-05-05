'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { TrendingUp, Mail, Lock, ArrowRight, Loader2, Sparkles, BarChart3, FileText } from 'lucide-react'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    const supabase = createClient()
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) { setError(error.message); setLoading(false); return }
    router.push('/dashboard')
    router.refresh()
  }

  return (
    <div className="flex min-h-screen">
      {/* Left: Branding */}
      <div className="hidden lg:flex lg:flex-1 items-center justify-center relative overflow-hidden bg-gradient-to-br from-[#06060B] via-[#0F0F18] to-[#06060B]">
        {/* Decorative elements */}
        <div className="absolute top-1/4 left-1/4 w-[400px] h-[400px] bg-primary/5 rounded-full blur-[120px]" />
        <div className="absolute bottom-1/4 right-1/4 w-[300px] h-[300px] bg-accent/5 rounded-full blur-[100px]" />

        <div className="relative z-10 max-w-md px-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-primary/60 shadow-lg shadow-primary/20">
              <TrendingUp className="h-6 w-6 text-white" />
            </div>
            <span className="text-2xl font-bold gradient-text-primary">LumaFinance</span>
          </div>

          <h1 className="text-[32px] font-extrabold leading-tight tracking-tight mb-4">
            Suas finanças sob<br />
            <span className="gradient-text">controle total</span>
          </h1>
          <p className="text-[15px] text-muted-foreground leading-relaxed mb-8">
            Dashboard inteligente com categorização automática por IA, orçamentos, metas e consultor financeiro pessoal.
          </p>

          <div className="grid grid-cols-3 gap-3">
            {[
              { icon: Sparkles, title: 'IA', desc: 'Categorização' },
              { icon: BarChart3, title: 'Tempo Real', desc: 'Gráficos' },
              { icon: FileText, title: 'PDF', desc: 'Relatórios' },
            ].map((item) => (
              <div key={item.title} className="card p-3 text-center group hover:border-border-strong">
                <item.icon className="h-5 w-5 mx-auto mb-1.5 text-primary group-hover:scale-110 transition-transform" />
                <p className="text-[11px] font-bold text-foreground">{item.title}</p>
                <p className="text-[10px] text-muted">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right: Login Form */}
      <div className="flex flex-1 flex-col items-center justify-center px-6 py-12 lg:max-w-[480px]">
        <div className="w-full max-w-sm">
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-3 mb-8">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-primary/60">
              <TrendingUp className="h-5 w-5 text-white" />
            </div>
            <span className="text-xl font-bold gradient-text-primary">LumaFinance</span>
          </div>

          <h2 className="text-[22px] font-bold tracking-tight">Entrar na sua conta</h2>
          <p className="mt-1 text-[13px] text-muted">Acesse seu gerenciador financeiro</p>

          <form onSubmit={handleLogin} className="mt-8 space-y-4">
            <div>
              <label className="mb-1.5 block text-[12px] font-semibold text-muted uppercase tracking-wider">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="seu@email.com" required className="input input-icon" />
              </div>
            </div>
            <div>
              <label className="mb-1.5 block text-[12px] font-semibold text-muted uppercase tracking-wider">Senha</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
                <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" required className="input input-icon" />
              </div>
            </div>

            {error && (
              <div className="rounded-xl bg-destructive/10 border border-destructive/20 px-4 py-3 text-[12px] text-destructive">{error}</div>
            )}

            <button type="submit" disabled={loading} className="btn btn-primary w-full py-3">
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <>Entrar <ArrowRight className="h-4 w-4" /></>}
            </button>
          </form>

          <p className="mt-6 text-center text-[13px] text-muted">
            Não tem conta?{' '}
            <Link href="/register" className="text-primary hover:text-primary-hover font-semibold transition-colors">Criar conta</Link>
          </p>
        </div>

        <p className="mt-auto pt-8 text-[11px] text-muted">© 2026 LumaFinance. Projeto pessoal.</p>
      </div>
    </div>
  )
}
