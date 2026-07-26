import type { Metadata } from "next";
import { AuthScreen } from "../../components/auth-screen";
import { authModeForPath } from "../../lib/auth-mode";

export const metadata: Metadata = {
  title: "Entrar",
  description: "Acesso seguro à plataforma UDK.",
  alternates: { canonical: "/login" },
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const cadastro = params.cadastro === "1" ? "?cadastro=1" : "";
  return <AuthScreen initialMode={authModeForPath(`/login${cadastro}`)} />;
}
