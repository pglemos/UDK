# Cronometragem → UDK

Ferramentas que leem a cronometragem do Kartódromo de Betim (servidor ORBITS, via `ssh orbits`) para montar os resultados do campeonato. Rodam no Mac, a partir da raiz deste repositório. A saída vai para `output/cronometragem/` (fora do git).

| Script | Para quê |
| --- | --- |
| `soma-etapa.mjs` | Soma das 2 corridas de uma etapa, separada por categoria (Art. 18, 19 e 22). `--hoje` acha as sessões "ULTRAS DO KART I/II" do dia. |
| `acha-bateria.mjs` | Acha a tomada e a corrida da bateria 2 pelo conteúdo das sessões (não pelo nome). |
| `passagens-decoder.mjs` | Relatório de todas as passagens brutas do decoder a partir de um horário (HTML → PDF). |
| `recalculo-decoder.mjs` | Recalcula tomada e corrida só com as passagens brutas do decoder. |

Exemplo:

```bash
node scripts/cronometragem/soma-etapa.mjs --hoje --etapa "5ª ETAPA" --data 08/12/2026
```

Fontes: API da cronometragem em `localhost:4050/api/sessions` no ORBITS; sessões em `C:\repos\KARTODROMO\data\timing\sessions\`; diário bruto do decoder em `data\timing\passagens\<dia>.jsonl`.
