fix(checkout): corrige problemas no checkout Mercado Pago e adiciona mensagens de erro em PT-BR

- Corrige problema do CardForm sendo limpo prematuramente quando amount/publicKey mudam
- Adiciona ref (cardFormRef) para manter referência estável do CardForm entre re-renders
- Implementa retry logic para getIdentificationTypes com até 3 tentativas
- Adiciona timeout de segurança para detectar CardForm montado mesmo sem onFormMounted
- Melhora tratamento de erros no CardForm initialization com logs detalhados
- Adiciona validação de chave pública antes de inicializar CardForm
- Implementa aguardo no handleCardSubmit para casos onde CardForm está sendo criado
- Cria arquivo mercado-pago-error-messages.ts com mapeamento completo de erros em PT-BR
- Substitui alert nativo por componente Alert para melhor UX
- Adiciona tratamento de pagamentos rejeitados com mensagens específicas
- Melhora logs de debug em todo o fluxo de pagamento
- Adiciona validação de formato de chave pública no backend

BREAKING CHANGE: Nenhum

Fixes: Erro 500 "error searching public key information"
Fixes: CardForm sendo definido como null após criação
Fixes: Mensagens de erro em inglês para usuários brasileiros

