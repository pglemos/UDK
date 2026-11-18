"""Gera o manual de onboarding do painel UDK (HTML → PDF com Chrome headless)."""
import html, pathlib, subprocess

HERE = pathlib.Path(__file__).parent
SHOTS = HERE / "shots"

def esc(s): return html.escape(s, quote=False)

# ---------- conteúdo das telas ----------
# (id do print, seção, aba, para que serve, [passos na ordem dos números], dica opcional)
SCREENS = [
 ("Início", [
  ("00-visao-geral", "Início", "Visão geral",
   "É a primeira tela depois do login. Mostra se o campeonato está todo configurado, os números do momento, a próxima etapa e o que está esperando alguém resolver.",
   ["<b>Menu lateral.</b> As 10 áreas do painel. O número ao lado (ex.: 46 em Pilotos) é o total da área; em âmbar ou vermelho, são itens esperando ação.",
    "<b>Campeonato configurado.</b> Lista de 8 itens de configuração. Quando está tudo pronto ela fica recolhida; clique para ver os detalhes.",
    "<b>Números do momento.</b> Pilotos homologados, inscrições em andamento, comprovantes e resultados esperando análise. Clique em um cartão para ir direto à área.",
    "<b>Próxima etapa.</b> Data, horário e traçado, com atalhos para configurar a etapa e revisar as inscrições.",
    "<b>Pendências.</b> Documentos, pagamentos e resultados aguardando alguém. Quando zera, aparece “Tudo em dia”."],
   "Comece o dia de trabalho sempre por aqui: o que estiver em âmbar ou vermelho é o que precisa de você."),
  ("00b-roteiro", "Início", "Roteiro de cada etapa",
   "No fim do Início fica o roteiro da etapa, em três momentos. Cada item é um link para a tela onde a tarefa é feita.",
   ["<b>Antes, no dia e depois da prova.</b> Conferir inscrições e pagamentos → marcar presença, sorteio de karts e ocorrências → publicar resultados, penalidades, classificação e a notícia."],
   None),
 ]),
 ("Pilotos", [
  ("01-pilotos", "Pilotos", "Cadastro",
   "Ficha de cada piloto: contato, foto, peso, saúde e homologação. É a base de inscrições, resultados e classificação.",
   ["<b>Abas da área.</b> Cadastro, Inscrições, Documentos, Mudança de categoria e Responsáveis.",
    "<b>Busca.</b> Procura por nome, cidade, CPF ou WhatsApp. Atalho: tecla <kbd>/</kbd>.",
    "<b>Novo piloto.</b> Abre a ficha em branco. Atalho: tecla <kbd>N</kbd>.",
    "<b>Mostrar arquivados.</b> Pilotos arquivados ficam fora da lista; marque para vê-los.",
    "<b>Ordenar.</b> Clique no nome da coluna (Piloto, Cidade/UF, Dados físicos, Situação) para ordenar; clique de novo para inverter.",
    "<b>Editar e Arquivar.</b> Arquivar tira o piloto das listas, mas o histórico de corridas e pontos continua guardado."],
   "A lista mostra 25 pilotos por vez; use “Mostrar mais” no fim da página."),
  ("01b-piloto-form", "Pilotos", "Ficha do piloto",
   "A ficha abre na própria página, dividida em blocos: identificação e foto, dados do piloto, dados físicos, segurança e saúde, confirmações obrigatórias e publicação.",
   ["<b>Título da ficha.</b> “Novo piloto” ou “Editar piloto”. Feche com Cancelar para descartar.",
    "<b>Blocos da ficha.</b> Campos com * são obrigatórios. Se faltar algo ao salvar, o campo fica em vermelho e o cursor vai até ele. A idade é calculada pela data de nascimento."],
   "Peso com equipamento é o que vale para a regra de lastro. Dados de saúde só a equipe vê."),
  ("02-inscricoes", "Pilotos", "Inscrições",
   "Pedidos de inscrição na temporada e nas etapas, com a categoria pedida e a categoria aprovada.",
   ["<b>Busca</b> em todas as colunas da lista.",
    "<b>Situação.</b> Filtra por situação (enviada, em análise, homologada…).",
    "<b>Nova inscrição.</b> Cadastro manual feito pela organização.",
    "<b>Atalhos.</b> <kbd>/</kbd> vai para a busca e <kbd>N</kbd> abre um cadastro novo, em qualquer lista.",
    "<b>Seleção em lote.</b> Marque várias linhas (ou todas) para arquivar de uma vez. Depois de arquivar aparece “Desfazer”.",
    "<b>Ações da linha.</b> Editar abre o formulário; Arquivar pede confirmação."],
   "Listas grandes mostram 50 registros por vez; “Mostrar mais” carrega o resto."),
  ("03-documentos", "Pilotos", "Documentos",
   "Documentos que os pilotos enviam pelo próprio cadastro para a organização conferir.",
   ["<b>Lista vazia.</b> Quando não há nada, a tela explica de onde os registros vêm. Ao chegar um documento, analise e mude a situação para Aprovado ou Correção pedida."],
   None),
  ("04-categoria", "Pilotos", "Mudança de categoria",
   "Pedidos de troca entre Ultras Insanos e Ultras Rápidos e a decisão sobre os pontos já conquistados.",
   ["<b>Nova mudança de categoria.</b> Registre o pedido, a etapa a partir da qual vale e o que acontece com os pontos."], None),
  ("05-responsaveis", "Pilotos", "Responsáveis",
   "Responsáveis legais dos pilotos menores de idade, que autorizam a participação.",
   ["<b>Novo responsável.</b> Vincula o responsável ao piloto menor e registra a homologação."], None),
 ]),
 ("Etapas", [
  ("06-etapas", "Etapas", "Calendário",
   "Datas, formato e traçado de cada etapa da temporada. É daqui que saem a próxima etapa do Início e o calendário do site.",
   ["<b>Nova etapa.</b> Título, formato (regular ou Endurance), traçado, data e hora.",
    "<b>Colunas ordenáveis.</b> Clique no nome da coluna para ordenar."], None),
  ("07-credenciamento", "Etapas", "Credenciamento",
   "Presença de cada piloto em cada etapa, organizada por categoria.",
   ["<b>Filtro de categoria</b> e busca por piloto.",
    "<b>Legenda.</b> Presente, Faltou, Justificada e A marcar.",
    "<b>Todos presentes.</b> Marca presente quem ainda está sem registro na etapa. Pede confirmação mostrando quantos pilotos serão marcados e oferece Desfazer.",
    "<b>Célula de presença.</b> Cada clique troca o estado: presente → faltou → justificada → limpar. Etapas futuras aparecem como “Em breve”.",
    "<b>Grupo da categoria.</b> Clique para recolher ou abrir o grupo."],
   "No celular, cada piloto vira um cartão com as etapas em grade, prático para usar no pit."),
  ("08-karts", "Etapas", "Karts",
   "Desempenho de cada kart: melhor volta e ritmo, no campeonato inteiro ou em uma corrida.",
   ["<b>Filtros.</b> Ver por kart ou por corrida, e escolher campeonato ou uma etapa.",
    "<b>O que significa cada coluna?</b> Abre o glossário da tela (Ritmo, Ritmo médio, Pior corrida).",
    "<b>Ordenar.</b> Clique no nome da coluna. Ritmo menor é melhor."], None),
 ]),
 ("Resultados", [
  ("09-resultados", "Resultados", "Resultados",
   "Cada tomada de tempo e corrida, por etapa, com o resultado oficial e o volta a volta em PDF no padrão da cronometragem.",
   ["<b>Linha da sessão.</b> Tipo (Tomada ou Corrida), pilotos, melhor volta e situação.",
    "<b>PDFs e voltas.</b> PDF do resultado, PDF volta a volta e o atalho Ver voltas.",
    "<b>Corrigir um resultado à mão.</b> Abre o formulário de edição para casos raros."],
   "Tomada de tempo não pontua: ela aparece para consulta e PDF."),
  ("10-posicoes", "Resultados", "Posições",
   "Pontos de cada piloto em cada corrida, pela chegada geral, em forma de tabela.",
   ["<b>Filtros.</b> Categoria e Pontos/Posição.",
    "<b>O que significa cada coluna?</b> Explica P, MV, −10, Provas e Total.",
    "<b>Legenda</b> junto da tabela.",
    "<b>Cabeçalho.</b> Clique para ordenar por qualquer corrida ou pelo total. O nome do piloto fica fixo ao rolar para o lado."],
   "Total aqui é sem descartes; os pontos válidos estão em Classificação."),
  ("11-voltas", "Resultados", "Voltas",
   "Volta a volta de cada piloto em cada tomada e corrida.",
   ["<b>Etapa e sessão.</b> Escolha a etapa e depois a tomada ou corrida.",
    "<b>PDFs da sessão.</b> Resultado oficial e volta a volta de todos os pilotos.",
    "<b>Pilotos da sessão.</b> Clique em um piloto para ver as voltas dele. Melhor volta da sessão em destaque.",
    "<b>Voltas do piloto.</b> Tempo, diferença para a melhor volta, acumulado e situação. O botão “PDF deste piloto” gera o volta a volta só dele."], None),
  ("12-importacoes", "Resultados", "Importações",
   "Arquivos da cronometragem usados para lançar os resultados, com origem e situação.",
   ["<b>Lista de arquivos.</b> Importado = os resultados desse arquivo já estão no sistema."], None),
 ]),
 ("Classificação", [
  ("13-classificacao", "Classificação", "Classificação",
   "Classificação vigente de cada categoria, com pontos por etapa e descartes (Art. 20).",
   ["<b>Categoria</b> e busca por piloto.",
    "<b>O que significa cada coluna?</b> Brutos, Descartes, Válidos e critérios de desempate.",
    "<b>Versão e regra.</b> Mostra a versão e quando foi recalculada.",
    "<b>Pódio.</b> 1º, 2º e 3º em ouro, prata e bronze."],
   "A classificação recalcula sozinha quando um resultado é publicado ou corrigido."),
  ("14-pontuacao", "Classificação", "Regras de pontuação",
   "Pontos por posição e bônus de cada formato, conforme o regulamento.",
   ["<b>Tabela em vigor</b> da etapa regular e da Endurance, com bônus (pole, melhor volta).",
    "<b>Editar a tabela de pontos.</b> Só para mudança aprovada no regulamento."], None),
 ]),
 ("Disciplina", [
  ("15-penalidades", "Disciplina", "Penalidades",
   "Penalidades aplicadas, com o código do regulamento e o efeito em tempo ou pontos.",
   ["<b>Nova penalidade.</b>",
    "<b>Colunas.</b> Etapa, piloto, penalidade (código e nome), efeito e situação.",
    "<b>Editar e Arquivar.</b> Arquivar uma penalidade homologada avisa que não recalcula a classificação."], None),
  ("15b-penalidade-form", "Disciplina", "Lançar uma penalidade",
   "O formulário puxa o texto do regulamento para você não digitar à mão.",
   ["<b>Penalidade (regulamento).</b> Escolha da lista (ex.: BW-01 Bandeira preta e branca). Resumo e efeito são preenchidos sozinhos.",
    "<b>Efeito.</b> Vem do código; altere só se a decisão for diferente.",
    "<b>Situação.</b> Homologada = decisão final, já vale para resultado e classificação."],
   "Salvar com campo obrigatório vazio marca o campo em vermelho e lista o que falta."),
  ("16-ocorrencias", "Disciplina", "Ocorrências",
   "Incidentes registrados em pista, com volta, gravidade e artigo do regulamento.",
   ["<b>Nova ocorrência.</b> Escolha o tipo da lista: artigo e gravidade vêm preenchidos."], None),
  ("17-evidencias", "Disciplina", "Evidências",
   "Fotos, vídeos e relatos ligados a uma ocorrência.",
   ["<b>Como usar.</b> Registre primeiro a ocorrência e depois use “Nova evidência” para anexar o material."], None),
  ("18-recursos", "Disciplina", "Recursos",
   "Recursos dos pilotos contra penalidades e a decisão da organização.",
   ["<b>Novo recurso.</b> Escolha a penalidade contestada; o piloto é preenchido a partir dela."], None),
 ]),
 ("Financeiro", [
  ("19-pagamentos", "Financeiro", "Pagamentos",
   "Pagamentos de inscrição: comprovantes enviados, análise e aprovação.",
   ["<b>Novo pagamento.</b> Lançamento manual.",
    "<b>Lista.</b> Confirme o pagamento só depois de conferir o comprovante."], None),
  ("20-creditos", "Financeiro", "Créditos",
   "Créditos que o piloto tem para usar em inscrições futuras.",
   ["<b>Novo crédito.</b> Valor em reais, origem e validade."], None),
 ]),
 ("Site", [
  ("21-noticias", "Site", "Notícias",
   "Notícias publicadas na home e na página de notícias.",
   ["<b>Nova notícia.</b> Título, texto, capa e publicação.",
    "<b>Notícia na lista.</b> Capa, título, data e resumo.",
    "<b>Ações.</b> Ver no site, Editar e Arquivar."], None),
  ("22-patrocinadores", "Site", "Patrocinadores",
   "Logos, links e quais marcas aparecem no site.",
   ["<b>Novo patrocinador.</b>",
    "<b>Logo.</b> Pré-visualização em fundo escuro e claro, para conferir como aparece no site.",
    "<b>Ações.</b> Editar e Arquivar (a marca sai do site na hora)."], None),
  ("23-acesso-patrocinadores", "Site", "Acesso de patrocinadores",
   "Quem de cada patrocinador pode entrar no painel para ver as próprias campanhas.",
   ["<b>Novo usuário de patrocinador.</b>"], None),
  ("24-campanhas", "Site", "Campanhas",
   "Ações dos patrocinadores no site, como cupons e ativações.",
   ["<b>Nova campanha.</b>"], None),
  ("25-avisos", "Site", "Avisos",
   "Avisos enviados aos pilotos e à equipe pelo painel.",
   ["<b>Novo aviso.</b> Escolha o destinatário, o tipo (Aviso geral, Prazo, Pagamento…) e a mensagem."], None),
 ]),
 ("Configurações", [
  ("26-campeonato", "Configurações", "Campeonato e temporada",
   "Nome, cor, temporada e situação do campeonato.",
   ["<b>Formulário.</b> Campeonato (nome, descrição, cor, situação) e temporada (nome, ano, datas, situação).",
    "<b>Salvar configurações.</b> Fica fixo no rodapé do formulário.",
    "<b>Também faz parte da configuração.</b> Atalhos para categorias, etapas, regulamento, pontuação, patrocinadores e equipe."], None),
  ("27-categorias", "Configurações", "Categorias",
   "Categorias da temporada: Ultras Insanos e Ultras Rápidos.",
   ["<b>Cor.</b> Amostra da cor usada no site.",
    "<b>Editar.</b> Nome, endereço (URL), cor e situação."], None),
  ("28-regulamento", "Configurações", "Regulamento e termos",
   "Regulamento e termos em vigor, e quem já aceitou.",
   ["<b>Versões.</b> Tipo, título, versão, situação e vigência.",
    "<b>Aceites dos pilotos.</b> Só leitura: o aceite é feito pelo piloto no cadastro."], None),
  ("29-exportar", "Configurações", "Exportar dados",
   "Baixe os dados do campeonato em planilha (CSV).",
   ["<b>Cartão de cada área.</b> O que vem no arquivo.",
    "<b>Exportar CSV.</b> Baixa o arquivo na hora."], None),
 ]),
 ("Equipe e acessos", [
  ("30-pessoas", "Equipe e acessos", "Pessoas",
   "Quem acessa o painel e com qual papel.",
   ["<b>Filtro.</b> Equipe, pilotos e responsáveis, ou todos.",
    "<b>Dar acesso.</b> Digite o e-mail e escolha o papel. A pessoa recebe o convite “Seu acesso ao painel do Ultras do Kart” e cria a própria senha.",
    "<b>Gerenciar.</b> Adicionar ou tirar papéis, definir validade e exceções de permissão."],
   "Só um Administrador pode dar acesso de Administrador."),
  ("31-papeis", "Equipe e acessos", "Papéis e permissões",
   "O que cada papel pode ver e alterar em cada área.",
   ["<b>Cartões dos papéis.</b> Descrição de cada um.",
    "<b>Legenda.</b> Edita, Só vê e Sem acesso.",
    "<b>Matriz.</b> Área por papel. Para liberar algo só para uma pessoa, use uma exceção em Pessoas."], None),
 ]),
]

ROLES = [
 ("Administrador", "Acesso total, inclusive dar e tirar acesso de administradores."),
 ("Organização", "Comissão organizadora: opera todo o campeonato e gerencia a equipe, exceto administradores."),
 ("Comissão julgadora", "Analisa lances, aplica penalidades e homologa resultados (Art. 4º e 23)."),
 ("Direção de prova", "Conduz a etapa: credenciamento, sorteio de karts e registro de ocorrências."),
 ("Financeiro", "Confere pagamentos de inscrição e de etapa e lança créditos."),
 ("Editor do site", "Publica notícias e cuida dos patrocinadores no site."),
 ("Patrocinador", "Vê as próprias campanhas e os acessos da sua marca."),
 ("Piloto", "Vê os próprios dados, inscrições, resultados e pode abrir recurso."),
 ("Responsável legal", "Acompanha e autoriza a participação do piloto menor de idade."),
]

GLOSSARY = [
 ("Homologado", "Aprovado pela organização. Inscrição, resultado ou penalidade homologada passa a valer."),
 ("Provisório", "Resultado ainda em análise; não entra na classificação."),
 ("Arquivar", "Tira da lista sem apagar. O histórico fica guardado e dá para desfazer logo depois."),
 ("Tomada de tempo", "Sessão que define o grid. Não pontua."),
 ("P", "Pole position da Super Pole: +1 ponto."),
 ("MV", "Melhor volta da corrida: +1 ponto."),
 ("Brutos / Descartes / Válidos", "Soma de tudo / os 2 piores resultados regulares que saem da conta (Art. 20) / o que define a posição."),
 ("Ritmo", "Quanto a melhor volta de um kart ficou acima da volta mais rápida da corrida. Menor é melhor."),
 ("BW-01, PIT-INVALID…", "Códigos das penalidades do regulamento, sempre mostrados com o nome."),
]

FAQ = [
 ("Não recebi o convite.", "Olhe o spam. O remetente é “Ultras do Kart &lt;nao-responda@ultrasdokart.com.br&gt;”. Se não estiver lá, peça a um administrador para reenviar em Equipe e acessos › Pessoas."),
 ("O link do e-mail expirou.", "Em ultrasdokart.com.br/login, use “Esqueci minha senha”. Chega o e-mail “Redefina sua senha do Ultras do Kart” com um link novo."),
 ("Não vejo uma área no menu.", "O menu mostra só o que o seu papel permite. Peça ao administrador para ajustar o papel ou criar uma exceção."),
 ("Arquivei sem querer.", "Use “Desfazer” no aviso que aparece logo depois. Passado o aviso, peça a um administrador para restaurar."),
 ("A classificação não mudou.", "Ela só considera resultados publicados ou homologados. Confira a situação do resultado em Resultados."),
 ("Preciso dos dados em planilha.", "Configurações › Exportar dados › Exportar CSV."),
]

# ---------- montagem ----------
def screen_page(num, shot, section, tab, what, steps, tip):
    items = "".join(f'<li><span class="n">{i}</span><div>{s}</div></li>' for i, s in enumerate(steps, 1))
    tip_html = f'<div class="tip"><b>Dica</b>{esc(tip)}</div>' if tip else ""
    return f'''<section class="page screen">
<header class="crumb"><span>{esc(section)}</span><i>›</i><b>{esc(tab)}</b><em>{num:02d}</em></header>
<h2>{esc(tab)}</h2>
<p class="lede">{esc(what)}</p>
<figure><img src="shots/{shot}.png" alt="Tela {esc(tab)}"></figure>
<ol class="steps">{items}</ol>
{tip_html}
</section>'''

def build():
    pages, toc, n = [], [], 0
    for section, screens in SCREENS:
        toc.append(f'<li><b>{esc(section)}</b><span>{" · ".join(esc(s[2]) for s in screens)}</span></li>')
        pages.append(f'<section class="page divider"><p class="kicker">Área do painel</p><h1>{esc(section)}</h1><ul>{"".join(f"<li>{esc(s[2])}</li>" for s in screens)}</ul></section>')
        for shot, sec, tab, what, steps, tip in screens:
            n += 1
            pages.append(screen_page(n, shot, sec, tab, what, steps, tip))

    roles = "".join(f"<tr><th>{esc(r)}</th><td>{esc(d)}</td></tr>" for r, d in ROLES)
    gloss = "".join(f"<div><dt>{esc(t)}</dt><dd>{esc(d)}</dd></div>" for t, d in GLOSSARY)
    faq = "".join(f"<div><dt>{esc(q)}</dt><dd>{a}</dd></div>" for q, a in FAQ)

    doc = f'''<!doctype html><html lang="pt-BR"><head><meta charset="utf-8">
<title>Manual do Painel UDK</title>
<link href="https://fonts.googleapis.com/css2?family=Archivo:wght@400;500;600;700;800;900&display=swap" rel="stylesheet">
<style>
@page {{ size: A4; margin: 0; }}
:root {{ --navy:#081116; --navy2:#152731; --ink:#14242d; --cyan:#28cce5; --deep:#006577; --muted:#526772; --line:#d6e0e5; --paper:#f0f5f7; }}
* {{ box-sizing: border-box; }}
html, body {{ margin:0; font-family: Archivo, Arial, sans-serif; color: var(--ink); -webkit-print-color-adjust: exact; print-color-adjust: exact; }}
.page {{ width:210mm; height:297mm; padding:16mm 16mm 14mm; position:relative; page-break-after:always; overflow:hidden; background:#fff; }}
.page::after {{ content:"Manual do Painel UDK · Campeonato Ultras do Kart 2026"; position:absolute; left:16mm; bottom:7mm; font-size:8pt; color:var(--muted); }}
h1, h2, h3 {{ margin:0; letter-spacing:-.02em; }}
kbd {{ display:inline-block; min-width:18px; padding:0 5px; border:1px solid var(--line); border-bottom-width:2px; border-radius:4px; font:700 9pt Archivo; text-align:center; background:#fff; }}
/* capa */
.cover {{ background:var(--navy); color:#fff; padding:0; }}
.cover::after {{ color:#aabdc7; }}
.cover .photo {{ height:150mm; background:url('shots/../hero.jpg') center/cover; position:relative; }}
.cover .photo::after {{ content:""; position:absolute; inset:0; background:linear-gradient(180deg, rgba(8,17,22,.15), rgba(8,17,22,.95)); }}
.cover .bar {{ height:4px; background:var(--cyan); }}
.cover .inner {{ padding:12mm 16mm; }}
.cover img.logo {{ position:absolute; top:14mm; left:16mm; width:46mm; z-index:2; }}
.cover .kicker {{ color:var(--cyan); font:700 10pt Archivo; letter-spacing:.14em; text-transform:uppercase; margin:0 0 5mm; }}
.cover h1 {{ font:900 40pt/1.02 Archivo; letter-spacing:-.03em; }}
.cover p.sub {{ color:#d2dce1; font-size:13pt; line-height:1.5; max-width:150mm; margin:6mm 0 0; }}
.cover .meta {{ position:absolute; left:16mm; right:16mm; bottom:16mm; display:flex; justify-content:space-between; color:#aabdc7; font-size:10pt; border-top:1px solid rgba(255,255,255,.15); padding-top:5mm; }}
/* sumário e textos */
.kicker {{ color:var(--deep); font:700 9pt Archivo; letter-spacing:.14em; text-transform:uppercase; margin:0 0 3mm; }}
.page > h1 {{ font:800 26pt/1.1 Archivo; margin-bottom:6mm; }}
.toc {{ list-style:none; margin:0; padding:0; display:grid; gap:3mm; }}
.toc li {{ display:grid; grid-template-columns:52mm 1fr; gap:4mm; padding:3mm 0; border-bottom:1px solid var(--line); font-size:10.5pt; }}
.toc li span {{ color:var(--muted); }}
.prose p {{ font-size:11pt; line-height:1.6; margin:0 0 4mm; }}
.cards {{ display:grid; grid-template-columns:1fr 1fr; gap:4mm; margin-top:4mm; }}
.card {{ border:1px solid var(--line); border-radius:8px; padding:5mm; }}
.card h3 {{ font:700 12pt Archivo; margin-bottom:2mm; }}
.card p, .card li {{ font-size:10pt; line-height:1.5; color:var(--ink); margin:0; }}
.card ol {{ margin:2mm 0 0 4mm; padding:0; }}
.num {{ display:inline-grid; place-items:center; width:7mm; height:7mm; border-radius:50%; background:var(--navy); color:var(--cyan); font:800 10pt Archivo; border:1.5px solid var(--cyan); margin-right:2mm; }}
/* divisor de área */
.divider {{ background:var(--navy); color:#fff; display:flex; flex-direction:column; justify-content:center; }}
.divider::after {{ color:#aabdc7; }}
.divider .kicker {{ color:var(--cyan); }}
.divider h1 {{ font:900 44pt/1 Archivo; margin:0 0 8mm; }}
.divider ul {{ list-style:none; padding:0; margin:0; border-top:3px solid var(--cyan); }}
.divider li {{ padding:4mm 0; border-bottom:1px solid rgba(255,255,255,.14); font-size:14pt; color:#d2dce1; }}
/* telas */
.crumb {{ display:flex; align-items:center; gap:2mm; font-size:9pt; color:var(--muted); margin-bottom:4mm; }}
.crumb i {{ font-style:normal; }}
.crumb b {{ color:var(--deep); }}
.crumb em {{ margin-left:auto; font:800 9pt Archivo; font-style:normal; color:var(--navy); background:var(--cyan); border-radius:999px; padding:1mm 3mm; }}
.screen h2 {{ font:800 22pt/1.1 Archivo; margin-bottom:2mm; }}
.screen .lede {{ font-size:10.5pt; line-height:1.5; color:var(--muted); margin:0 0 4mm; }}
.screen figure {{ margin:0 0 5mm; border:1px solid var(--line); border-radius:8px; overflow:hidden; box-shadow:0 1mm 4mm rgba(20,36,45,.08); }}
.screen figure img {{ display:block; width:100%; }}
.steps {{ list-style:none; margin:0; padding:0; display:grid; gap:2.5mm; }}
.steps li {{ display:grid; grid-template-columns:8mm 1fr; gap:3mm; font-size:10pt; line-height:1.45; }}
.steps .n {{ width:7mm; height:7mm; border-radius:50%; background:var(--navy); color:var(--cyan); border:1.5px solid var(--cyan); display:grid; place-items:center; font:800 9.5pt Archivo; }}
.tip {{ margin-top:4mm; border-left:3px solid var(--cyan); background:#e3f6f9; padding:3mm 4mm; font-size:9.5pt; line-height:1.5; border-radius:0 6px 6px 0; }}
.tip b {{ display:block; color:var(--deep); font-size:8.5pt; letter-spacing:.1em; text-transform:uppercase; margin-bottom:1mm; }}
table.roles {{ width:100%; border-collapse:collapse; font-size:10pt; }}
table.roles th, table.roles td {{ text-align:left; padding:3mm 2mm; border-bottom:1px solid var(--line); vertical-align:top; }}
table.roles th {{ width:46mm; color:var(--deep); }}
dl.gloss {{ margin:0; display:grid; gap:3mm; }}
dl.gloss div {{ border-bottom:1px solid var(--line); padding-bottom:3mm; }}
dt {{ font-weight:700; font-size:10.5pt; }}
dd {{ margin:1mm 0 0; font-size:10pt; line-height:1.5; color:var(--ink); }}
.mobile {{ display:grid; grid-template-columns:1fr 1fr; gap:8mm; align-items:start; }}
.mobile img {{ width:100%; border-radius:10px; border:1px solid var(--line); }}
.mobile p {{ font-size:10pt; line-height:1.5; }}
.back {{ background:var(--navy); color:#fff; display:flex; flex-direction:column; justify-content:flex-end; }}
.back::after {{ content:""; }}
.back img {{ width:60mm; margin-bottom:8mm; }}
.back p {{ color:#aabdc7; font-size:11pt; line-height:1.6; margin:0; }}
.back a {{ color:var(--cyan); text-decoration:none; }}
</style></head><body>

<section class="page cover">
  <img class="logo" src="udk-wordmark-white.svg" alt="UDK">
  <div class="photo"></div><div class="bar"></div>
  <div class="inner">
    <p class="kicker">Manual de onboarding · Administradores</p>
    <h1>Painel do Ultras do Kart, tela por tela</h1>
    <p class="sub">Como entrar, onde fica cada coisa e o passo a passo de todas as 31 telas do painel, da inscrição do piloto à classificação.</p>
  </div>
  <div class="meta"><span>Campeonato Ultras do Kart · 2ª Temporada 2026</span><span>ultrasdokart.com.br/painel</span></div>
</section>

<section class="page">
  <p class="kicker">Sumário</p><h1>O que tem neste manual</h1>
  <ul class="toc">
    <li><b>Primeiros passos</b><span>Convite, criar senha, entrar e conhecer a tela</span></li>
    {"".join(toc)}
    <li><b>Rotina da etapa</b><span>Antes, no dia e depois da prova</span></li>
    <li><b>Papéis e permissões</b><span>O que cada perfil pode fazer</span></li>
    <li><b>Celular e atalhos</b><span>Uso no pit e teclado</span></li>
    <li><b>Glossário e dúvidas</b><span>Termos do campeonato e perguntas frequentes</span></li>
  </ul>
</section>

<section class="page prose">
  <p class="kicker">Primeiros passos</p><h1>Como entrar no painel</h1>
  <div class="cards">
    <div class="card"><h3><span class="num">1</span>Receba o convite</h3><p>Um administrador libera seu acesso em Equipe e acessos. Chega o e-mail <b>“Seu acesso ao painel do Ultras do Kart”</b>, de <b>nao-responda@ultrasdokart.com.br</b>. Se não aparecer, olhe o spam.</p></div>
    <div class="card"><h3><span class="num">2</span>Crie sua senha</h3><p>Clique em <b>Criar minha senha</b>. A tela “Nova senha” abre no site com o link validado. Digite a senha duas vezes (mínimo 8 caracteres) e clique em <b>Salvar nova senha</b>.</p></div>
    <div class="card"><h3><span class="num">3</span>Entre</h3><p>Acesse <b>ultrasdokart.com.br/login</b> com seu e-mail e a senha criada. Você cai no <b>Início</b> do painel.</p></div>
    <div class="card"><h3><span class="num">4</span>Esqueceu a senha?</h3><p>Na tela de login, use <b>Esqueci minha senha</b>. Chega o e-mail “Redefina sua senha do Ultras do Kart” com um link novo.</p></div>
  </div>
  <h3 style="margin:9mm 0 3mm;font:800 15pt Archivo">Como a tela é organizada</h3>
  <p>À esquerda fica o <b>menu</b> com as 10 áreas. No alto de cada área há <b>abas</b> com as telas daquela área. Toda lista segue o mesmo padrão: <b>busca</b>, filtros, botão de <b>cadastro novo</b>, colunas que se ordenam com um clique e as ações <b>Editar</b> e <b>Arquivar</b> em cada linha.</p>
  <p>Nas imagens deste manual, os <b>círculos numerados</b> apontam cada parte da tela. O texto abaixo da imagem explica cada número. E-mails e telefones dos pilotos aparecem como •••, de propósito.</p>
</section>

{"".join(pages)}

<section class="page prose">
  <p class="kicker">Rotina da etapa</p><h1>O que fazer em cada etapa</h1>
  <figure style="margin:0 0 6mm;border:1px solid var(--line);border-radius:8px;overflow:hidden"><img src="shots/00b-roteiro.png" style="width:100%;display:block"></figure>
  <div class="cards" style="grid-template-columns:1fr 1fr 1fr">
    <div class="card"><h3>Antes da etapa</h3><ol><li>Conferir as inscrições da etapa (Pilotos › Inscrições).</li><li>Confirmar os pagamentos (Financeiro › Pagamentos, Art. 10).</li><li>Revisar horário e traçado (Etapas › Calendário).</li></ol></div>
    <div class="card"><h3>No dia</h3><ol><li>Marcar a presença (Etapas › Credenciamento).</li><li>Registrar o sorteio de karts (Etapas › Karts).</li><li>Anotar ocorrências de pista (Disciplina › Ocorrências).</li></ol></div>
    <div class="card"><h3>Depois da prova</h3><ol><li>Publicar os resultados (Resultados).</li><li>Lançar penalidades e julgar recursos (Disciplina).</li><li>Conferir a classificação.</li><li>Publicar a notícia da etapa (Site › Notícias).</li></ol></div>
  </div>
</section>

<section class="page">
  <p class="kicker">Papéis e permissões</p><h1>Quem pode fazer o quê</h1>
  <table class="roles">{roles}</table>
  <div class="tip" style="margin-top:6mm"><b>Exceções</b>Para liberar ou bloquear uma área só para uma pessoa, abra Equipe e acessos › Pessoas › Gerenciar e crie uma exceção. A matriz completa fica em Papéis e permissões.</div>
</section>

<section class="page prose">
  <p class="kicker">Celular e atalhos</p><h1>No pit, pelo celular</h1>
  <div class="mobile">
    <figure style="margin:0"><img src="shots/m1-celular-inicio.png"><figcaption style="font-size:9pt;color:var(--muted);margin-top:2mm"><span class="num">1</span>Botão do menu</figcaption></figure>
    <figure style="margin:0"><img src="shots/m2-celular-credenciamento.png"><figcaption style="font-size:9pt;color:var(--muted);margin-top:2mm"><span class="num">1</span>Grupo da categoria · <span class="num">2</span>Presença da etapa</figcaption></figure>
  </div>
  <p style="margin-top:6mm">No celular o menu fica atrás do botão ☰. Listas viram cartões, com o nome de cada campo acima do valor e botões grandes. O credenciamento mostra um cartão por piloto com as etapas em grade.</p>
  <h3 style="margin:6mm 0 3mm;font:800 14pt Archivo">Atalhos de teclado (computador)</h3>
  <p><kbd>/</kbd> vai para a busca da tela · <kbd>N</kbd> abre um cadastro novo · <kbd>Esc</kbd> fecha janelas e confirmações.</p>
</section>

<section class="page">
  <p class="kicker">Glossário</p><h1>Termos do campeonato</h1>
  <dl class="gloss">{gloss}</dl>
</section>

<section class="page">
  <p class="kicker">Dúvidas frequentes</p><h1>Quando algo não sai como esperado</h1>
  <dl class="gloss">{faq}</dl>
</section>

<section class="page back">
  <img src="udk-wordmark-white.svg" alt="UDK">
  <p><b style="color:#fff">Campeonato Ultras do Kart · 2ª Temporada 2026</b><br>Kartódromo de Betim · MG<br><a href="https://www.ultrasdokart.com.br">ultrasdokart.com.br</a> · painel em <a href="https://www.ultrasdokart.com.br/painel">ultrasdokart.com.br/painel</a></p>
</section>
</body></html>'''
    (HERE / "manual.html").write_text(doc, encoding="utf-8")

build()
print("html ok")
