# 📦 Nomenclatura dos Pacotes no Monorepo

## Como funciona o `@white-label`

O `@white-label` é um **namespace** (escopo) escolhido para organizar os pacotes internos do monorepo. Ele **não está relacionado** ao nome do repositório.

### Estrutura Atual

```
white-label-ecommerce/          ← Nome do repositório (pode ser qualquer um)
├── package.json                ← name: "white-label-ecommerce"
├── packages/
│   ├── db/
│   │   └── package.json        ← name: "@white-label/db"
│   ├── types/
│   │   └── package.json        ← name: "@white-label/types"
│   └── shared/
│       └── package.json        ← name: "@white-label/shared"
└── apps/
    ├── api/
    │   └── package.json        ← name: "@white-label/api"
    ├── web/
    │   └── package.json        ← name: "@white-label/web"
    └── admin/
        └── package.json        ← name: "@white-label/admin"
```

### Por que `@white-label`?

1. **Namespace de NPM**: O `@` no início indica um escopo/namespace no NPM
2. **Organização**: Todos os pacotes do projeto compartilham o mesmo namespace
3. **Prevenção de conflitos**: Evita colisões com pacotes públicos do NPM
4. **Identificação**: Facilita identificar que são pacotes internos do projeto

### Onde é definido?

Cada `package.json` dentro de `packages/` e `apps/` tem o campo `name`:

```json
{
  "name": "@white-label/db",
  "version": "0.1.0",
  "private": true
}
```

### Como funciona o Workspace?

No `pnpm-workspace.yaml`:

```yaml
packages:
  - 'apps/*'
  - 'packages/*'
```

E nas dependências, você usa:

```json
{
  "dependencies": {
    "@white-label/db": "workspace:*"
  }
}
```

O `workspace:*` diz ao pnpm: "use a versão local deste pacote do workspace".

### Posso mudar?

**Sim!** Você pode escolher qualquer namespace. Exemplos:

- `@white-label/*` (atual)
- `@ecommerce/*`
- `@myapp/*`
- `@company-name/*`

**Importante**: Se mudar, precisa atualizar todos os `package.json` que referenciam esses pacotes.

### Exemplo de Mudança

Se quiser mudar para `@ecommerce`:

1. **Alterar cada `package.json`**:
   ```json
   // packages/db/package.json
   {
     "name": "@ecommerce/db"  // era "@white-label/db"
   }
   ```

2. **Atualizar todas as importações**:
   ```typescript
   // Era:
   import { db } from '@white-label/db'
   
   // Fica:
   import { db } from '@ecommerce/db'
   ```

3. **Atualizar scripts que filtram pacotes**:
   ```json
   // package.json (raiz)
   {
     "scripts": {
       "db:generate": "turbo run db:generate --filter=@ecommerce/db"
     }
   }
   ```

### Resumo

- ✅ `@white-label` é um namespace escolhido, não vem do nome do repositório
- ✅ O nome do repositório (`white-label-ecommerce`) pode ser diferente
- ✅ O namespace está definido no campo `name` de cada `package.json`
- ✅ É usado para organizar e referenciar pacotes internos
- ✅ Pode ser mudado, mas requer atualizar todos os arquivos relacionados

### Boas Práticas

1. **Escolha um namespace curto e descritivo**
2. **Use o mesmo namespace para todos os pacotes do projeto**
3. **Mantenha consistência**: se mudar um, mude todos
4. **Use `private: true`** para pacotes internos (eles nunca serão publicados no NPM)

