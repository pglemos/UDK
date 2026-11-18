# Manual do Painel UDK (PDF de onboarding)

Gera o manual de administradores com prints reais do painel, marcadores numerados e o passo a passo de cada tela.

1. Numa pasta de trabalho (ex.: `output/manual`), copie estes arquivos e rode `npm i playwright-core @supabase/supabase-js`.
2. Copie `apps/plataforma/public/brand/udk-wordmark-white.svg` e gere `hero.jpg` (foto oficial da etapa).
3. Capture: `SUPABASE_ACCESS_TOKEN=sbp_... node capture.mjs shots.json` — entra com um link de acesso único (sem senha), esconde e-mails/telefones/CPF e desenha os marcadores definidos em `shots.json`.
4. Monte e imprima: `python3 build.py` e depois o Chrome headless com `--print-to-pdf=Manual-Painel-UDK.pdf manual.html`.

O texto de cada tela fica em `SCREENS` dentro de `build.py`; os números dos passos seguem a ordem dos marcadores em `shots.json`.
