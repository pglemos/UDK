"""Gera os e-mails de autenticação do UDK (Supabase Auth) com a identidade da marca.

Rodar: python3 supabase/templates/build.py  → escreve os .html ao lado.
Os assuntos ficam em subjects.json. Aplicar no projeto com apply.mjs.
Layout em tabelas com estilo inline (Gmail, Outlook, Apple Mail), sem SVG nem webp.
"""
import json, pathlib

SITE = "https://www.ultrasdokart.com.br"
INK, NAVY, NAVY_2, CYAN, CYAN_DEEP = "#14242d", "#081116", "#152731", "#28cce5", "#006577"
MUTED, LINE, PAPER = "#526772", "#d6e0e5", "#f0f5f7"
FONT = "Archivo, 'Helvetica Neue', Helvetica, Arial, sans-serif"

def layout(*, preheader, eyebrow, title, intro, cta, steps, note, hero="udk-hero.jpg"):
    steps_html = "".join(
        f'''<tr><td valign="top" width="36" style="padding:0 0 14px 0;">
<div style="width:28px;height:28px;border-radius:50%;background:{CYAN};color:{NAVY};font:700 14px/28px {FONT};text-align:center;">{i}</div></td>
<td valign="top" style="padding:3px 0 14px 12px;font:400 15px/1.5 {FONT};color:{INK};">{s}</td></tr>'''
        for i, s in enumerate(steps, 1))
    return f'''<!doctype html>
<html lang="pt-BR" xmlns="http://www.w3.org/1999/xhtml">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="color-scheme" content="light only">
<meta name="supported-color-schemes" content="light">
<title>{title}</title>
<style>
@media (max-width:620px){{ .wrap{{width:100%!important}} .px{{padding-left:22px!important;padding-right:22px!important}} .h1{{font-size:26px!important}} .btn a{{display:block!important}} }}
a{{color:{CYAN_DEEP}}}
</style>
</head>
<body style="margin:0;padding:0;background:{PAPER};-webkit-text-size-adjust:100%;">
<div style="display:none;max-height:0;overflow:hidden;opacity:0;color:{PAPER};">{preheader}&#8199;&#65279;&#847;&#8199;&#65279;&#847;&#8199;&#65279;&#847;</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:{PAPER};">
<tr><td align="center" style="padding:28px 12px;">
<table role="presentation" class="wrap" width="600" cellpadding="0" cellspacing="0" border="0" style="width:600px;max-width:600px;background:#ffffff;border:1px solid {LINE};border-radius:10px;overflow:hidden;">

<!-- cabeçalho -->
<tr><td style="background:{NAVY};padding:22px 32px;" class="px">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr>
<td><a href="{SITE}" style="text-decoration:none;"><img src="{SITE}/email/udk-logo.png" width="120" height="24" alt="UDK — Ultras do Kart" style="display:block;border:0;width:120px;height:24px;"></a></td>
<td align="right" style="font:600 11px/1.2 {FONT};letter-spacing:.12em;text-transform:uppercase;color:{CYAN};">Campeonato 2026</td>
</tr></table>
</td></tr>

<!-- foto oficial -->
<tr><td style="background:{NAVY};line-height:0;font-size:0;">
<img src="{SITE}/email/{hero}" width="600" alt="Karts do Ultras do Kart na pista do Kartódromo de Betim" style="display:block;width:100%;max-width:600px;height:auto;border:0;">
</td></tr>
<tr><td style="background:{CYAN};height:4px;line-height:4px;font-size:0;">&nbsp;</td></tr>

<!-- conteúdo -->
<tr><td class="px" style="padding:34px 40px 8px 40px;">
<p style="margin:0 0 10px;font:700 12px/1.2 {FONT};letter-spacing:.12em;text-transform:uppercase;color:{CYAN_DEEP};">{eyebrow}</p>
<h1 class="h1" style="margin:0 0 16px;font:800 30px/1.12 {FONT};letter-spacing:-.02em;color:{INK};">{title}</h1>
<div style="font:400 16px/1.6 {FONT};color:{INK};">{intro}</div>
</td></tr>

<!-- botão -->
<tr><td class="px btn" style="padding:22px 40px 8px 40px;">
<table role="presentation" cellpadding="0" cellspacing="0" border="0"><tr>
<td style="border-radius:6px;background:{CYAN};">
<a href="{{{{ .ConfirmationURL }}}}" style="display:inline-block;padding:16px 30px;font:700 16px/1 {FONT};color:{NAVY};text-decoration:none;border-radius:6px;">{cta} &rarr;</a>
</td></tr></table>
</td></tr>

<!-- passo a passo -->
<tr><td class="px" style="padding:26px 40px 6px 40px;">
<p style="margin:0 0 14px;font:700 15px/1.3 {FONT};color:{INK};">Como funciona</p>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">{steps_html}</table>
</td></tr>

<!-- link alternativo e aviso -->
<tr><td class="px" style="padding:6px 40px 30px 40px;">
<div style="border-top:1px solid {LINE};padding-top:18px;font:400 13px/1.55 {FONT};color:{MUTED};">
{note}<br><br>
Se o botão não abrir, copie e cole este endereço no navegador:<br>
<a href="{{{{ .ConfirmationURL }}}}" style="color:{CYAN_DEEP};word-break:break-all;">{{{{ .ConfirmationURL }}}}</a>
</div>
</td></tr>

<!-- rodapé -->
<tr><td style="background:{NAVY_2};padding:24px 40px;" class="px">
<p style="margin:0 0 6px;font:700 14px/1.3 {FONT};color:#ffffff;">Campeonato Ultras do Kart · 2ª Temporada 2026</p>
<p style="margin:0;font:400 13px/1.55 {FONT};color:#aabdc7;">Kartódromo de Betim · MG<br>
<a href="{SITE}" style="color:{CYAN};text-decoration:none;">ultrasdokart.com.br</a> &nbsp;·&nbsp;
<a href="{SITE}/classificacao" style="color:{CYAN};text-decoration:none;">Classificação</a> &nbsp;·&nbsp;
<a href="{SITE}/calendario" style="color:{CYAN};text-decoration:none;">Calendário</a> &nbsp;·&nbsp;
<a href="{SITE}/regulamento" style="color:{CYAN};text-decoration:none;">Regulamento</a></p>
</td></tr>

</table>
<p style="margin:16px 0 0;font:400 12px/1.5 {FONT};color:{MUTED};text-align:center;">Mensagem automática enviada para {{{{ .Email }}}}. Não responda este e-mail.</p>
</td></tr>
</table>
</body>
</html>
'''

GREETING = "{{ if .Data.full_name }}Olá, {{ .Data.full_name }}.{{ else }}Olá.{{ end }}"

templates = {
  "invite": dict(
    subject="Seu acesso ao painel do Ultras do Kart",
    preheader="A organização liberou seu acesso. Crie sua senha para entrar no painel do UDK.",
    eyebrow="Convite · Painel do campeonato",
    title="Você foi convidado para o painel do UDK",
    intro=f"<p style=\"margin:0 0 12px;\">{GREETING}</p><p style=\"margin:0;\">A organização do Campeonato Ultras do Kart liberou um acesso para você no painel do campeonato: pilotos, etapas, resultados, classificação e o que mais o seu papel permitir. Para começar, crie sua senha.</p>",
    cta="Criar minha senha",
    steps=["Clique em <b>Criar minha senha</b>. O link abre o site do UDK já com o seu convite.",
           "Escolha uma senha com pelo menos 8 caracteres, misturando letras e números.",
           "Pronto: entre em <a href=\"https://www.ultrasdokart.com.br/login\" style=\"color:#006577;\">ultrasdokart.com.br/login</a> com o e-mail <b>{{ .Email }}</b> e a senha que você criou."],
    note="O convite é pessoal e vale por tempo limitado. Se ele expirar, peça um novo à organização do campeonato. Se você não esperava este convite, ignore esta mensagem: nenhum acesso é liberado sem a criação da senha."),
  "recovery": dict(
    subject="Redefina sua senha do Ultras do Kart",
    preheader="Recebemos um pedido para trocar a senha da sua conta UDK.",
    eyebrow="Conta · Nova senha",
    title="Vamos criar uma nova senha",
    intro=f"<p style=\"margin:0 0 12px;\">{GREETING}</p><p style=\"margin:0;\">Recebemos um pedido para redefinir a senha da conta <b>{{{{ .Email }}}}</b> no site do Ultras do Kart. Use o botão abaixo para escolher uma nova senha.</p>",
    cta="Criar nova senha",
    steps=["Clique em <b>Criar nova senha</b>.", "Digite a nova senha duas vezes e salve.", "Entre de novo no site com a senha nova."],
    note="Se não foi você que pediu, ignore este e-mail: sua senha atual continua valendo. O link vale por tempo limitado e funciona uma única vez."),
  "confirmation": dict(
    subject="Confirme seu e-mail no Ultras do Kart",
    preheader="Falta só confirmar o e-mail para ativar seu cadastro no UDK.",
    eyebrow="Cadastro · Confirmação",
    title="Confirme seu e-mail para ativar o cadastro",
    intro=f"<p style=\"margin:0 0 12px;\">{GREETING}</p><p style=\"margin:0;\">Seu cadastro no Campeonato Ultras do Kart foi criado. Confirme que este e-mail é seu para ativar a conta e seguir com a inscrição.</p>",
    cta="Confirmar meu e-mail",
    steps=["Clique em <b>Confirmar meu e-mail</b>.", "Complete seus dados de piloto e aceite o regulamento.", "Acompanhe inscrição, resultados e classificação pelo site."],
    note="Se você não criou uma conta no Ultras do Kart, ignore esta mensagem."),
  "magic_link": dict(
    subject="Seu link de acesso ao Ultras do Kart",
    preheader="Use este link para entrar no site do UDK sem digitar senha.",
    eyebrow="Conta · Acesso",
    title="Seu link para entrar no UDK",
    intro=f"<p style=\"margin:0 0 12px;\">{GREETING}</p><p style=\"margin:0;\">Use o botão abaixo para entrar na sua conta <b>{{{{ .Email }}}}</b> sem digitar a senha.</p>",
    cta="Entrar no UDK",
    steps=["Clique em <b>Entrar no UDK</b> neste mesmo aparelho.", "Você entra direto na sua conta."],
    note="O link funciona uma única vez e expira em pouco tempo. Se não foi você que pediu, ignore este e-mail."),
  "email_change": dict(
    subject="Confirme a troca de e-mail no Ultras do Kart",
    preheader="Confirme o novo endereço de e-mail da sua conta UDK.",
    eyebrow="Conta · Troca de e-mail",
    title="Confirme o seu novo e-mail",
    intro=f"<p style=\"margin:0 0 12px;\">{GREETING}</p><p style=\"margin:0;\">Recebemos um pedido para trocar o e-mail da sua conta de <b>{{{{ .Email }}}}</b> para <b>{{{{ .NewEmail }}}}</b>.</p>",
    cta="Confirmar novo e-mail",
    steps=["Clique em <b>Confirmar novo e-mail</b>.", "A partir daí, entre no site com o endereço novo."],
    note="Se você não pediu esta troca, ignore este e-mail e avise a organização do campeonato."),
}

here = pathlib.Path(__file__).parent
subjects = {}
for key, t in templates.items():
    subjects[key] = t.pop("subject")
    (here / f"{key}.html").write_text(layout(**t), encoding="utf-8")
(here / "subjects.json").write_text(json.dumps(subjects, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
print("ok", list(subjects))
