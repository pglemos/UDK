"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, CheckCircle2, LoaderCircle, LockKeyhole, Mail, UserRound } from "lucide-react";
import { isSupabaseConfigured, supabase } from "../lib/supabase";

type AuthMode = "signin" | "signup" | "reset";

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<AuthMode>("signin");
  const [fullName, setFullName] = useState("");
  const [sportName, setSportName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  useEffect(() => {
    const client = supabase();
    if (!client) return;
    client.auth.getSession().then(({ data }) => {
      if (data.session) router.replace("/painel");
    });
  }, [router]);

  function changeMode(nextMode: AuthMode) {
    setMode(nextMode);
    setError("");
    setNotice("");
  }

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setNotice("");

    const client = supabase();
    if (!client) {
      setError(
        "Supabase ainda não conectado. Configure NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY.",
      );
      return;
    }

    setLoading(true);

    if (mode === "reset") {
      const redirectTo = `${window.location.origin}/`;
      const { error: resetError } = await client.auth.resetPasswordForEmail(email, { redirectTo });
      if (resetError) setError(resetError.message);
      else setNotice("E-mail de recuperação enviado. Verifique sua caixa de entrada.");
      setLoading(false);
      return;
    }

    if (mode === "signup") {
      const { data, error: signupError } = await client.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
            sport_name: sportName || fullName,
          },
          emailRedirectTo: `${window.location.origin}/painel`,
        },
      });

      if (signupError) setError(signupError.message);
      else if (data.session) router.replace("/painel");
      else {
        setNotice("Conta criada. Confirme seu e-mail antes de entrar.");
        setMode("signin");
      }
      setLoading(false);
      return;
    }

    const { error: signinError } = await client.auth.signInWithPassword({ email, password });
    if (signinError) setError("E-mail ou senha inválidos.");
    else router.replace("/painel");
    setLoading(false);
  }

  const configured = isSupabaseConfigured();

  return (
    <main className="login">
      <section className="login-visual">
        <img src="/udk.svg" alt="UDK" />
        <div>
          <span className="login-kicker">Plataforma oficial • Temporada 2026</span>
          <h1>
            Controle
            <br />
            <b>de prova</b>
          </h1>
          <p>
            Pilotos, inscrições, pagamentos, resultados, julgamento, Endurance e conteúdo em uma
            operação auditável.
          </p>
        </div>
        <div className="login-features">
          <span><CheckCircle2 /> Dados protegidos por RLS</span>
          <span><CheckCircle2 /> Operação offline sincronizável</span>
          <span><CheckCircle2 /> Resultados versionados</span>
        </div>
      </section>

      <section className="login-panel">
        <form onSubmit={submit}>
          <span className="eyebrow">Acesso seguro</span>
          <h2>
            {mode === "signin" ? "Entrar" : mode === "signup" ? "Criar conta" : "Recuperar senha"}
          </h2>
          <p className="form-intro">
            {mode === "signin"
              ? "Use sua conta única para acessar todos os papéis autorizados."
              : mode === "signup"
                ? "O perfil inicial será criado como piloto e poderá receber outros papéis."
                : "Enviaremos um link de recuperação para o e-mail cadastrado."}
          </p>

          {!configured ? (
            <div className="alert alert-warning">
              A interface está pronta, mas as variáveis do Supabase ainda não foram cadastradas.
            </div>
          ) : null}
          {error ? <div className="alert alert-error">{error}</div> : null}
          {notice ? <div className="alert alert-success">{notice}</div> : null}

          {mode === "signup" ? (
            <div className="auth-grid">
              <label>
                <span>Nome completo</span>
                <div className="input-with-icon">
                  <UserRound size={18} />
                  <input
                    type="text"
                    value={fullName}
                    onChange={(event) => setFullName(event.target.value)}
                    autoComplete="name"
                    required
                  />
                </div>
              </label>
              <label>
                <span>Nome esportivo</span>
                <div className="input-with-icon">
                  <UserRound size={18} />
                  <input
                    type="text"
                    value={sportName}
                    onChange={(event) => setSportName(event.target.value)}
                    autoComplete="nickname"
                  />
                </div>
              </label>
            </div>
          ) : null}

          <label>
            <span>E-mail</span>
            <div className="input-with-icon">
              <Mail size={18} />
              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                autoComplete="email"
                required
              />
            </div>
          </label>

          {mode !== "reset" ? (
            <label>
              <span>Senha</span>
              <div className="input-with-icon">
                <LockKeyhole size={18} />
                <input
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  autoComplete={mode === "signup" ? "new-password" : "current-password"}
                  minLength={8}
                  required
                />
              </div>
            </label>
          ) : null}

          <button className="login-submit" type="submit" disabled={loading || !configured}>
            {loading ? <LoaderCircle className="spin" /> : <ArrowRight />}
            {mode === "signin" ? "Entrar" : mode === "signup" ? "Criar conta" : "Enviar link"}
          </button>

          <div className="auth-links">
            {mode !== "signin" ? (
              <button type="button" onClick={() => changeMode("signin")}>
                Voltar para o login
              </button>
            ) : (
              <>
                <button type="button" onClick={() => changeMode("signup")}>
                  Criar conta
                </button>
                <button type="button" onClick={() => changeMode("reset")}>
                  Esqueci a senha
                </button>
              </>
            )}
          </div>
        </form>
      </section>
    </main>
  );
}
