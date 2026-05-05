# 🚀 LumaFinance — Guia de Deploy na Vercel

## Passo 1: Subir o código para o GitHub

Abra o terminal na pasta do projeto (`d:\Projects\LumaFinance`) e rode:

```bash
git add .
git commit -m "LumaFinance v1.0 - Pronto para Producao"
```

Agora vá ao [github.com/new](https://github.com/new) e crie um repositório **privado** chamado `LumaFinance`.

**Não** marque nenhuma opção (sem README, sem .gitignore). Depois de criar, o GitHub vai te mostrar comandos. Copie o link e rode:

```bash
git remote add origin https://github.com/SEU_USUARIO/LumaFinance.git
git branch -M main
git push -u origin main
```

---

## Passo 2: Deploy na Vercel

1. Acesse [vercel.com](https://vercel.com) e faça login com sua conta do GitHub.
2. Clique em **"Add New..." → "Project"**.
3. Encontre o repositório `LumaFinance` e clique em **"Import"**.

---

## Passo 3: Configurar Variáveis de Ambiente (OBRIGATÓRIO)

Antes de clicar em "Deploy", abra a seção **"Environment Variables"**.

Copie e cole **cada uma** das variáveis abaixo (pegue os valores do seu arquivo `.env.local`):

| Variável | Onde pegar |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase → Settings → API → URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase → Settings → API → anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase → Settings → API → service_role key |
| `DATABASE_URL` | Supabase → Settings → Database → Connection Pooling URI |
| `DIRECT_URL` | Supabase → Settings → Database → Direct URI |
| `GEMINI_API_KEY` | [aistudio.google.com](https://aistudio.google.com/apikey) |

> ⚠️ **IMPORTANTE:** Nunca coloque essas chaves direto no código. Sempre use as variáveis da Vercel!

---

## Passo 4: Deploy!

Clique no botão **"Deploy"**. A Vercel vai:
1. Instalar as dependências (`npm install`)
2. Rodar o build (`next build`)
3. Publicar o app

Em ~1 minuto você terá um link como: `https://lumafinance.vercel.app`

Acesse de qualquer dispositivo — computador, celular ou tablet!

---

## Depois do Deploy: Domínio Personalizado (Opcional)

Se quiser um domínio tipo `lumafinance.com.br`:
1. Na Vercel → Settings → Domains
2. Adicione seu domínio
3. Configure o DNS conforme as instruções da Vercel

---

## Comandos Úteis

```bash
# Rodar localmente
npm run dev

# Build de produção (testar antes de deploy)
npm run build

# Abrir o Prisma Studio (ver banco de dados)
npm run db:studio
```
