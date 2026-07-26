import type { Metadata } from "next";
import { AuthScreen } from "../../components/auth-screen";

export const metadata: Metadata = {
  title: "Nova senha",
  description: "Defina uma nova senha para sua conta UDK.",
  robots: { index: false, follow: false },
};

export default function NewPasswordPage() {
  return <AuthScreen initialMode="recovery" />;
}
