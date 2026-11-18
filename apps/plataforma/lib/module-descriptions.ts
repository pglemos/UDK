// Gerado a partir de lib/module-config.ts: só as descrições, para o painel não
// baixar a configuração inteira dos módulos no carregamento inicial.
// O teste module-descriptions.test.ts garante que as duas listas não se separam.
export const moduleDescriptions: Record<string, string> = {
  "pilotos": "Ficha de cada piloto: contato, foto, peso, saúde e homologação.",
  "inscricoes": "Pedidos de inscrição na temporada e nas etapas, com a categoria pedida.",
  "documentos": "Documentos enviados pelos pilotos para conferência da organização.",
  "financeiro": "Pagamentos de inscrição: comprovantes enviados, análise e aprovação.",
  "creditos": "Créditos que o piloto tem para usar em inscrições futuras.",
  "calendario": "Datas, formato e traçado de cada etapa da temporada.",
  "resultados": "Resultados oficiais de cada tomada e corrida.",
  "entradas-resultado": "Classificação de cada piloto na sessão: posição, voltas, tempo, pole e volta mais rápida.",
  "classificacao": "Classificação vigente por categoria, com os pontos de cada etapa e os descartes.",
  "importacoes": "Arquivos da cronometragem usados para lançar os resultados.",
  "ocorrencias": "Incidentes registrados em pista, com volta, gravidade e artigo do regulamento.",
  "julgamentos": "Penalidades aplicadas, com o código do regulamento e o efeito em tempo ou pontos.",
  "recursos": "Recursos dos pilotos contra penalidades e a decisão da organização.",
  "endurance": "Equipes, categoria, identificação e homologação.",
  "stints": "Sequência, piloto, entrada, saída, voltas e validação.",
  "conteudo": "Notícias do site: texto, capa e publicação.",
  "patrocinadores": "Logos, links e quais marcas aparecem no site.",
  "notificacoes": "Avisos enviados aos pilotos e à equipe pelo painel.",
  "configuracoes": "Categorias da temporada: Ultras Insanos e Ultras Rápidos.",
  "responsaveis": "Responsáveis legais dos pilotos menores de idade.",
  "termos": "Versões do regulamento e dos termos que os pilotos precisam aceitar.",
  "aceites": "Registro de quem aceitou cada versão. O aceite é feito pelo próprio piloto no cadastro.",
  "mudancas-categoria": "Pedidos de troca de categoria e a decisão sobre os pontos.",
  "sessoes": "Treinos, classificação, pole especial, corrida e resistência.",
  "checkin": "Presença de cada piloto em cada etapa da temporada.",
  "karts": "Kart sorteado para cada piloto em cada corrida e a melhor volta feita com ele.",
  "pontuacao": "Pontos por posição e bônus de cada formato, conforme o regulamento.",
  "voltas": "Volta a volta de cada piloto em cada corrida.",
  "evidencias": "Fotos, vídeos e relatos ligados a uma ocorrência.",
  "membros-endurance": "Capitão, titulares, reservas, convites e aprovação.",
  "campanhas": "Ações dos patrocinadores no site, como cupons e ativações.",
  "versoes-conteudo": "Versões anteriores das notícias, para conferir ou restaurar.",
  "usuarios-patrocinador": "Quem de cada patrocinador pode entrar no painel.",
  "permissoes": "Escopo por papel, categoria, etapa, sessão, módulo e ação.",
};

export function hasModuleConfig(key: string): boolean {
  return key in moduleDescriptions;
}
