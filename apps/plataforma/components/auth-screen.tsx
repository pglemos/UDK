"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  CheckCircle2,
  Eye,
  EyeOff,
  LoaderCircle,
  LockKeyhole,
  Mail,
  UserRound,
} from "lucide-react";
import { useEffect, useState } from "react";
import { passwordRecoveryRedirect, type AuthMode } from "../lib/auth-mode";
import { isSupabaseConfigured, supabase } from "../lib/supabase";
import { OfficialLogo } from "./race/official-logo";

export function AuthScreen({ initialMode }: { initialMode: AuthMode }) {
  const router = useRouter();
  const [mode, setMode] = useState<AuthMode>(initialMode);
  const [fullName, setFullName] = useState("");
  const [sportName, setSportName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirmation, setPasswordConfirmation] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  useEffect(() => {
    const client = supabase();
    if (!client) return;

    let active = true;
    const recoveryRequested =
      initialMode === "recovery" || window.location.hash.includes("type=recovery");

    if (new URLSearchParams(window.location.search).get("senha") === "alterada") {
      setNotice("Senha alterada. Entre novamente com a nova senha.");
    }

    void client.auth.getSession().then(({ data, error: sessionError }) => {
      if (!active || sessionError) return;
      if (data.session && recoveryRequested) {
        setMode("recovery");
        return;
      }
      if (data.session) router.replace("/painel");
    });

    const { data: subscription } = client.auth.onAuthStateChange((event) => {
      if (!active) return;
      if (event === "PASSWORD_RECOVERY") {
        setMode("recovery");
        setError("");
        setNotice("Link validado. Defina uma nova senha para concluir a recuperação.");
        if (window.location.pathname !== "/nova-senha") router.replace("/nova-senha");
      }
    });

    return () => {
      active = false;
      subscription.subscription.unsubscribe();
    };
  }, [initialMode, router]);

  function changeMode(nextMode: AuthMode) {
    setMode(nextMode);
    setPassword("");
    setPasswordConfirmation("");
    setError("");
    setNotice("");
    setShowPassword(false);
  }

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setNotice("");

    const client = supabase();
    if (!client) {
      setError("A plataforma está temporariamente indisponível. Tente novamente em instantes.");
      return;
    }

    setLoading(true);

    try {
      if (mode === "recovery") {
        if (password !== passwordConfirmation) {
          setError("As senhas não coincidem.");
          return;
        }

        const { error: updateError } = await client.auth.updateUser({ password });
        if (updateError) {
          setError(updateError.message);
          return;
        }

        await client.auth.signOut();
        router.replace("/login?senha=alterada");
        return;
      }

      if (mode === "reset") {
        const redirectTo = passwordRecoveryRedirect(window.location.origin);
        const { error: resetError } = await client.auth.resetPasswordForEmail(email, { redirectTo });
        if (resetError) setError(resetError.message);
        else setNotice("E-mail de recuperação enviado. Verifique sua caixa de entrada.");
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
        return;
      }

      const { error: signinError } = await client.auth.signInWithPassword({ email, password });
      if (signinError) setError("E-mail ou senha inválidos.");
      else router.replace("/painel");
    } finally {
      setLoading(false);
    }
  }

  const configured = isSupabaseConfigured();
  const title =
    mode === "signin"
      ? "Entrar"
      : mode === "signup"
        ? "Criar conta"
        : mode === "reset"
          ? "Recuperar senha"
          : "Nova senha";
  const submitLabel =
    mode === "signin"
      ? "Entrar na plataforma"
      : mode === "signup"
        ? "Criar conta"
        : mode === "reset"
          ? "Enviar link"
          : "Salvar nova senha";

  return (
    <main className="race-auth">
      <section className="race-auth-visual">
        <Link href="/" aria-label="Voltar para o portal UDK">
          <OfficialLogo variant="negative" width={190} priority />
        </Link>

        <div className="race-auth-copy">
          <span className="race-kicker">Plataforma oficial • 2026</span>
          <h1>
            Sua temporada{" "}
            <em>começa aqui.</em>
          </h1>
          <p>
            Acompanhe sua inscrição, documentos, etapas e resultados dentro do ambiente oficial
            do campeonato.
          </p>
        </div>

        <div className="race-auth-features">
          <span><CheckCircle2 aria-hidden="true" /> Inscrição acompanhada</span>
          <span><CheckCircle2 aria-hidden="true" /> Documentos organizados</span>
          <span><CheckCircle2 aria-hidden="true" /> Resultados oficiais</span>
        </div>
      </section>

      <section className="race-auth-panel">
        <form className="race-auth-form" onSubmit={submit}>
          <span className="race-kicker">Acesso UDK</span>
          <h2>{title}</h2>
          <p>
            {mode === "signin"
              ? "Use sua conta para acompanhar sua participação no campeonato."
              : mode === "signup"
                ? "Crie sua conta para iniciar a inscrição e entrar no grid."
                : mode === "reset"
                  ? "Enviaremos um link seguro para o e-mail cadastrado."
                  : "Defina uma nova senha com pelo menos oito caracteres."}
          </p>

          {!configured ? (
            <div className="race-alert race-alert-warning" role="status">
              O acesso está temporariamente indisponível porque a conexão da plataforma não foi configurada.
            </div>
          ) : null}
          {error ? <div className="race-alert race-alert-error" role="alert">{error}</div> : null}
          {notice ? <div className="race-alert race-alert-success" role="status">{notice}</div> : null}

          <div className={`race-form-grid${mode === "signup" ? " is-two" : ""}`}>
            {mode === "signup" ? (
              <>
                <label className="race-field">
                  <span>Nome completo</span>
                  <div className="race-field-control">
                    <UserRound aria-hidden="true" />
                    <input
                      type="text"
                      value={fullName}
                      onChange={(event) => setFullName(event.target.value)}
                      autoComplete="name"
                      required
                    />
                  </div>
                </label>
                <label className="race-field">
                  <span>Nome esportivo</span>
                  <div className="race-field-control">
                    <UserRound aria-hidden="true" />
                    <input
                      type="text"
                      value={sportName}
                      onChange={(event) => setSportName(event.target.value)}
                      autoComplete="nickname"
                    />
                  </div>
                </label>
              </>
            ) : null}

            {mode !== "recovery" ? (
              <label className="race-field">
                <span>E-mail</span>
                <div className="race-field-control">
                  <Mail aria-hidden="true" />
                  <input
                    type="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    autoComplete="email"
                    required
                  />
                </div>
              </label>
            ) : null}

            {mode !== "reset" ? (
              <label className="race-field">
                <span>{mode === "recovery" ? "Nova senha" : "Senha"}</span>
                <div className="race-field-control">
                  <LockKeyhole aria-hidden="true" />
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    autoComplete={mode === "signin" ? "current-password" : "new-password"}
                    minLength={8}
                    required
                  />
                  <button
                    className="race-password-toggle"
                    type="button"
                    aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
                    onClick={() => setShowPassword((current) => !current)}
                  >
                    {showPassword ? <EyeOff aria-hidden="true" /> : <Eye aria-hidden="true" />}
                  </button>
                </div>
              </label>
            ) : null}

            {mode === "recovery" ? (
              <label className="race-field">
                <span>Confirmar nova senha</span>
                <div className="race-field-control">
                  <LockKeyhole aria-hidden="true" />
                  <input
                    type={showPassword ? "text" : "password"}
                    value={passwordConfirmation}
                    onChange={(event) => setPasswordConfirmation(event.target.value)}
                    autoComplete="new-password"
                    minLength={8}
                    required
                  />
                </div>
              </label>
            ) : null}
          </div>

          <button
            className="race-button race-button-primary race-auth-submit"
            type="submit"
            disabled={loading || !configured}
          >
            {loading ? <LoaderCircle className="spin" aria-hidden="true" /> : <ArrowRight aria-hidden="true" />}
            {submitLabel}
          </button>

          <div className="race-auth-links">
            {mode !== "signin" ? (
              <button type="button" onClick={() => changeMode("signin")}>Voltar para o login</button>
            ) : (
              <>
                <button type="button" onClick={() => changeMode("signup")}>Criar conta</button>
                <button type="button" onClick={() => changeMode("reset")}>Esqueci a senha</button>
              </>
            )}
            <Link href="/">Voltar ao portal</Link>
          </div>
        </form>
      </section>
    </main>
  );
}
