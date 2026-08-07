-- Publish the corrected UDK 2026 second-semester sporting regulation.

update public.terms term
set status = 'superseded', updated_at = now()
from public.seasons season
join public.championships championship on championship.id = season.championship_id
where term.season_id = season.id
  and season.year = 2026
  and championship.slug = 'udk'
  and term.kind = 'regulation'
  and term.status = 'published'
  and term.deleted_at is null;

with season_scope as (
  select season.id
  from public.seasons season
  join public.championships championship on championship.id = season.championship_id
  where season.year = 2026 and championship.slug = 'udk'
), next_version as (
  select
    season_scope.id as season_id,
    coalesce(max(term.version), 0) + 1 as version
  from season_scope
  left join public.terms term
    on term.season_id = season_scope.id
   and term.kind = 'regulation'
  group by season_scope.id
)
insert into public.terms (
  season_id, kind, title, version, content,
  required, status, effective_at
)
select
  next_version.season_id,
  'regulation',
  'Regulamento esportivo UDK 2026 — 2º semestre',
  next_version.version,
  $regulation$
01. FORMATO DA TEMPORADA
O campeonato possui 05 etapas. A 1ª e a 5ª etapas são Endurances de 01 hora em traçado único. As etapas 2, 3 e 4 são regulares e possuem 02 corridas cada: primeiro em sentido horário e depois em sentido anti-horário.

02. RESULTADOS PONTUÁVEIS
A temporada possui 08 resultados pontuáveis: 06 corridas regulares e 02 Endurances.

03. DESCARTES
A classificação final considera os 06 melhores resultados de cada piloto. Os 02 piores resultados entre os 08 eventos pontuáveis são descartados automaticamente. Até o sexto evento concluído não há descarte; após o sétimo evento é descartado o pior resultado; após o oitavo evento são descartados os dois piores resultados.

04. PONTUAÇÃO DAS CORRIDAS REGULARES
P1 50; P2 45; P3 42; P4 40; P5 38; P6 37; P7 36; P8 35; P9 34; P10 33; P11 32; P12 31; P13 30; P14 29; P15 28; P16 27; P17 26; P18 25; P19 24; P20 23; P21 22; P22 21; P23 20; P24 19; P25 18; P26 17; P27 16; P28 15; P29 14; P30 13; P31 12; P32 11; P33 10; P34 9; P35 8; P36 7; P37 6; P38 5; P39 4; P40 3; P41 2; P42 1.
O total informativo da etapa regular é a soma dos pontos obtidos na 1ª e na 2ª corridas. Para efeito de classificação e descarte, cada corrida é um resultado pontuável independente.

05. PONTUAÇÃO ENDURANCE
P1 150; P2 145; P3 142; P4 140; P5 138. A partir do P6, a pontuação cai 01 ponto por posição: P6 137, P7 136 e assim sucessivamente até zero.

06. BÔNUS
Em cada corrida ou Endurance, o piloto recebe 01 ponto adicional pela pole position e 01 ponto adicional pela volta mais rápida.
$regulation$,
  true,
  'published',
  now()
from next_version;
