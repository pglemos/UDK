import type { Metadata } from "next";
import { AuthScreen } from "../../components/auth-screen";

export const metadata: Metadata = {
  title: "Recuperar senha",
  description: "Solicite um link seguro para recuperar sua conta UDK.",
  alternates: { canonical: "/recuperar-senha" },
};

export default function PasswordResetPage() {
  return <AuthScreen initialMode="reset" />;
}
