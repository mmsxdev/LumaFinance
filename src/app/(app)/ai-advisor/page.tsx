'use client'

import { useState, useRef, useEffect } from 'react'
import { cn } from '@/lib/utils'
import { Send, Bot, User, Loader2, Sparkles } from 'lucide-react'

interface Message { role: 'user' | 'assistant'; content: string }

const suggestions = [
  'Como estou financeiramente este mês?',
  'Onde posso cortar gastos?',
  'Dicas para aumentar minha poupança',
  'Quanto preciso investir por mês para minha reserva?',
]

export default function AIAdvisorPage() {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })
  }, [messages])

  const sendMessage = async (text?: string) => {
    const msg = text || input
    if (!msg.trim() || loading) return
    setInput('')
    const userMsg: Message = { role: 'user', content: msg }
    setMessages((prev) => [...prev, userMsg])
    setLoading(true)

    try {
      const res = await fetch('/api/ai/chat', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: msg, history: messages }),
      })
      const data = await res.json()
      setMessages((prev) => [...prev, { role: 'assistant', content: data.response || 'Erro ao gerar resposta.' }])
    } catch {
      setMessages((prev) => [...prev, { role: 'assistant', content: 'Desculpe, ocorreu um erro. Tente novamente.' }])
    } finally { setLoading(false) }
  }

  return (
    <div className="max-w-[900px] mx-auto flex flex-col h-[calc(100vh-128px)]">
      <div className="mb-6">
        <h1 className="text-[22px] font-bold tracking-tight">Consultor IA</h1>
        <p className="text-[13px] text-muted mt-0.5">Converse sobre suas finanças com inteligência artificial</p>
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto rounded-2xl border border-border bg-card p-4 space-y-4 mb-4">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center py-12">
            <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-primary/10 to-accent/10 border border-border flex items-center justify-center mb-4">
              <Sparkles className="h-7 w-7 text-primary" />
            </div>
            <h3 className="text-[15px] font-bold mb-1">Olá, Miguel!</h3>
            <p className="text-[12px] text-muted max-w-sm mb-6">Sou seu consultor financeiro pessoal. Tenho acesso aos seus dados para dar conselhos personalizados.</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 w-full max-w-md">
              {suggestions.map((s) => (
                <button key={s} onClick={() => sendMessage(s)} className="card px-3 py-2.5 text-left text-[12px] text-muted-foreground hover:border-primary/30 hover:text-foreground transition-all">{s}</button>
              ))}
            </div>
          </div>
        )}

        {messages.map((msg, i) => (
          <div key={i} className={cn('flex gap-3', msg.role === 'user' ? 'flex-row-reverse' : '')}>
            <div className={cn('h-8 w-8 rounded-xl shrink-0 flex items-center justify-center', msg.role === 'user' ? 'bg-primary/10' : 'bg-accent/10')}>
              {msg.role === 'user' ? <User className="h-4 w-4 text-primary" /> : <Bot className="h-4 w-4 text-accent" />}
            </div>
            <div className={cn('max-w-[80%] rounded-2xl px-4 py-3 text-[13px] leading-relaxed', msg.role === 'user' ? 'bg-primary/10 text-foreground rounded-tr-sm' : 'bg-card-elevated border border-border rounded-tl-sm')}>
              <p className="whitespace-pre-wrap">{msg.content}</p>
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex gap-3">
            <div className="h-8 w-8 rounded-xl bg-accent/10 flex items-center justify-center"><Bot className="h-4 w-4 text-accent" /></div>
            <div className="bg-card-elevated border border-border rounded-2xl rounded-tl-sm px-4 py-3">
              <Loader2 className="h-4 w-4 animate-spin text-muted" />
            </div>
          </div>
        )}
      </div>

      {/* Input */}
      <div className="flex gap-2">
        <input
          value={input} onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && sendMessage()}
          placeholder="Pergunte sobre suas finanças..."
          className="input flex-1 py-3"
        />
        <button onClick={() => sendMessage()} disabled={!input.trim() || loading} className="btn btn-primary px-4 disabled:opacity-40">
          <Send className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}
