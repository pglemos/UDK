# Correções da revisão final

Este documento registra os últimos bloqueios corrigidos antes da publicação da aplicação única UDK.

## Interface

- sincronização offline trata rejeições e informa operações em quarentena;
- modal move o foco para o diálogo, prende a navegação por Tab, fecha com Escape e restaura o foco;
- botão de fechamento possui nome acessível;
- o backdrop deixou de simular um botão de tela inteira;
- exportações CSV removem números não finitos.

## Offline

- mutações são serializadas entre abas com `navigator.locks` quando disponível;
- operações têm limite de cinco tentativas;
- falhas esgotadas são armazenadas em quarentena criptografada;
- inserts continuam idempotentes por identificador estável;
- filas permanecem isoladas por usuário e projeto Supabase.

## Banco e autorização

- papéis arquivados não autorizam ações;
- permissões granulares ignoram concessões arquivadas;
- resultados públicos excluem temporadas, campeonatos e categorias arquivados;
- regras de pontuação não duplicam a mesma combinação de escopo, formato e versão;
- views públicas preservam `security_invoker`.

## Contratos automatizados

A suíte contém testes para as correções acima e falha caso workflows temporários de reparo permaneçam na branch.
