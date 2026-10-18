# Como Contribuir (Contributing Guide)

Obrigado pelo interesse em contribuir com o sistema **Sacramento RPG** para Foundry VTT! Antes de abrir um Pull Request, leia este guia e as diretrizes arquiteturais em [`CLAUDE.md`](./CLAUDE.md).

---

## Configuração do Ambiente Local

### Pré-requisitos
- **Node.js** `v20+` (recomendado `v22+`)
- **Foundry Virtual Tabletop** `v11+`

### Instalação
1. Clone este repositório diretamente dentro da pasta `Data/systems/sacramento-rpg` do seu Foundry VTT (ou crie um link simbólico para ela):
   ```bash
   git clone https://github.com/b4hia/sacramento.git sacramento-rpg
   cd sacramento-rpg
   ```
2. Instale as dependências (o `postinstall` já compila automaticamente os compêndios em `packs/`):
   ```bash
   npm ci
   ```

---

## Padrões de Código e Arquitetura

1. **Código 100% em Inglês:**
   - Nomes de variáveis, funções, classes, parâmetros e métodos devem ser escritos **sempre em inglês**.
   - Todos os textos exibidos na interface devem usar chaves de internacionalização (`{{localize "SACRAMENTO_RPG...."}}`) presentes tanto em `lang/pt_br.json` quanto em `lang/en.json`.
2. **Responsabilidade Única (SRP) e Strategy Pattern:**
   - Regras matemáticas e de negócio puras devem ficar isoladas em `module/rules/` sem depender da UI do Foundry.
   - Prefira objetos de mapeamento / Strategy Pattern no lugar de cadeias extensas de `if/else` ou `switch`.
3. **Estética Western e Zero Inline CSS:**
   - Todo componente visual deve preservar a identidade Western/Cordel do sistema e usar classes CSS escopadas sob `.sacramento-rpg` (nunca adicione novos atributos `style="..."`).
4. **Comentários no Código:**
   - Adicione comentários **apenas** para regras de negócio muito específicas ou complexas, descrevendo sempre o comportamento esperado.

---

## 🧪 Comandos de Verificação e Build

Antes de enviar qualquer commit ou Pull Request, execute:

```bash
# Verificar formatação e lint (zero avisos permitidos)
npm run lint:warnings

# Executar suíte de testes unitários, validação de schema e paridade de i18n
npm test

# Recompilar compêndios de packs-src/*.json para LevelDB em packs/
npm run build:packs
```

---

## Conventional Commits

Este repositório utiliza **Conventional Commits** validados automaticamente pelo Husky (`.husky/commit-msg`) e pelo **Release Please** para geração automática de versões e `CHANGELOG.md`.

Formato obrigatório:
```text
<type>(<optional-scope>): <description>
```

Tipos aceitos:
- `feat`: Nova funcionalidade
- `fix`: Correção de bug
- `refactor`: Refatoração de código sem mudança de comportamento externo
- `style`: Ajustes de CSS/UI ou formatação
- `test`: Adição ou atualização de testes
- `docs`: Alterações na documentação
- `build` / `ci` / `chore`: Scripts de build, workflows ou manutenção

