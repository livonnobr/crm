import { useState, type FormEvent } from "react";
import { ArrowRight, LockKeyhole, Mail, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getSupabaseClient, supabase } from "@/lib/supabase";

export function RitmoAuthScreen() {
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [sending, setSending] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!supabase) {
      toast.error("O Supabase não está configurado para este ambiente.");
      return;
    }
    if (password.length < 8) {
      toast.error("Use uma senha com pelo menos 8 caracteres.");
      return;
    }
    setSending(true);
    const client = getSupabaseClient();
    const result = mode === "login"
      ? await client.auth.signInWithPassword({ email: email.trim(), password })
      : await client.auth.signUp({ email: email.trim(), password, options: { data: { name: name.trim() } } });
    setSending(false);
    if (result.error) {
      toast.error(result.error.message);
      return;
    }
    if (mode === "signup" && !result.data.session) {
      toast.success("Conta criada. Confirme seu e-mail para entrar no Ritmo.");
      return;
    }
    toast.success(mode === "login" ? "Bem-vindo ao Ritmo." : "Conta criada com sucesso.");
  }

  return (
    <main className="min-h-screen bg-[#F4F1E9] px-5 py-10 text-[#18201E]">
      <div className="mx-auto grid min-h-[calc(100vh-5rem)] max-w-6xl items-center gap-10 lg:grid-cols-[1.15fr_0.85fr]">
        <section className="hidden rounded-[2.5rem] bg-[#18201E] p-12 text-[#F7F4EC] shadow-[0_24px_80px_rgba(24,32,30,0.16)] lg:block">
          <div className="mb-20 flex items-center gap-3"><div className="grid h-11 w-11 place-items-center rounded-2xl bg-[#10A97A] text-xl font-black">r</div><div><div className="font-display text-2xl font-bold tracking-[-0.05em]">ritmo</div><div className="text-[10px] font-bold uppercase tracking-[0.22em] text-[#AFC8BA]">receita em foco</div></div></div>
          <p className="max-w-md font-display text-5xl font-semibold leading-[0.98] tracking-[-0.06em]">Sua operação comercial, no ritmo certo.</p>
          <p className="mt-6 max-w-sm text-base leading-7 text-[#B6C5BD]">Metas, pipeline, prospecção e financeiro em um workspace conectado ao Supabase.</p>
          <div className="mt-16 flex items-center gap-3 text-sm font-semibold text-[#CFE6DA]"><ShieldCheck size={18} /> Dados separados por usuário e protegidos no servidor.</div>
        </section>
        <section className="mx-auto w-full max-w-md rounded-[2rem] border border-[#DCE5DC] bg-[#FCFCFA] p-7 shadow-[0_20px_60px_rgba(24,32,30,0.08)] sm:p-9">
          <div className="mb-8 lg:hidden"><div className="font-display text-3xl font-bold tracking-[-0.06em]">ritmo</div><div className="text-[10px] font-bold uppercase tracking-[0.22em] text-[#087E5A]">receita em foco</div></div>
          <div className="mb-7"><p className="text-[11px] font-extrabold uppercase tracking-[0.16em] text-[#087E5A]">Workspace comercial</p><h1 className="mt-2 font-display text-3xl font-semibold tracking-[-0.05em]">{mode === "login" ? "Entrar no Ritmo" : "Criar sua conta"}</h1><p className="mt-2 text-sm leading-6 text-[#68766F]">{mode === "login" ? "Acesse seus dados e continue sua operação." : "Seu workspace será criado automaticamente no Supabase."}</p></div>
          <form onSubmit={submit} className="space-y-5">
            {mode === "signup" && <div className="space-y-2"><Label htmlFor="ritmo-name">Nome</Label><Input id="ritmo-name" value={name} onChange={(event) => setName(event.target.value)} placeholder="Seu nome" autoComplete="name" /></div>}
            <div className="space-y-2"><Label htmlFor="ritmo-email">E-mail</Label><div className="relative"><Mail className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#829088]" size={17} /><Input id="ritmo-email" className="pl-10" type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="voce@empresa.com" autoComplete="email" required /></div></div>
            <div className="space-y-2"><Label htmlFor="ritmo-password">Senha</Label><div className="relative"><LockKeyhole className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#829088]" size={17} /><Input id="ritmo-password" className="pl-10" type="password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Mínimo de 8 caracteres" autoComplete={mode === "login" ? "current-password" : "new-password"} required /></div></div>
            <Button type="submit" disabled={sending} className="h-11 w-full justify-center gap-2 rounded-xl bg-[#10A97A] font-extrabold text-white hover:bg-[#087E5A]">{sending ? "Aguarde…" : mode === "login" ? "Entrar no Ritmo" : "Criar conta"}<ArrowRight size={16} /></Button>
          </form>
          <button type="button" onClick={() => setMode(mode === "login" ? "signup" : "login")} className="mt-6 w-full text-center text-sm font-bold text-[#087E5A] hover:underline">{mode === "login" ? "Ainda não tenho uma conta" : "Já tenho uma conta"}</button>
        </section>
      </div>
    </main>
  );
}
