# Sacramento RPG — Sistema para Foundry VTT

[![CI](https://github.com/b4hia/sacramento/actions/workflows/ci.yml/badge.svg)](https://github.com/b4hia/sacramento/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](./LICENSE.txt)
[![Foundry VTT](https://img.shields.io/badge/Foundry%20VTT-v11%2B-orange)](https://foundryvtt.com/)

> **[Read in English (README.md)](./README.md)**

Integração **não oficial**, feita por fãs, para jogar **Sacramento RPG**, publicado pela **Jambô Editora**, no [Foundry Virtual Tabletop](https://foundryvtt.com/).

> [!IMPORTANT]
> **Este projeto não é um livro de regras.** Ele não apresenta, ensina nem reproduz as regras, o cenário ou a ambientação de Sacramento RPG. Ele apenas oferece fichas e automações para que um grupo que já conhece o jogo possa jogá-lo no Foundry VTT.
>
> Para conhecer e entender as regras, **é preciso adquirir o livro oficial**, disponível no site da [Jambô Editora](https://jamboeditora.com.br/).
>
> **Sacramento RPG**, suas regras, cenário, textos e artes são propriedade intelectual da **Jambô Editora** e de seus autores. Este repositório não possui vínculo nem endosso da Jambô Editora.

---

## O que este sistema oferece

- **Fichas de Personagem e NPC** com tema visual Western / Cordel.
- **Valores derivados automáticos:** a ficha preenche os valores que o livro calcula a partir de outros campos, para você não precisar fazer as contas à mão.
- **Avisos na ficha** durante a criação e a evolução do personagem, quando faltam ou sobram pontos ou quando o inventário passa da capacidade.
- **Aba de Montaria** na ficha do personagem, com inventário próprio.
- **Iniciativa por cartas** usando uma Pilha de Cartas (Card Stack) do Foundry VTT.
- **Cartões de chat** para ataques, críticos, recarga e Teste de Morte.
- **Compêndios** de armas, equipamentos, consumíveis e habilidades, como referência rápida para uso na mesa.
- **Interface bilíngue** (Português e Inglês), com tradução dos compêndios para inglês pelo módulo [Babele](https://foundryvtt.com/packages/babele).

O sistema diverge de propósito do livro impresso em alguns pontos. Todas as diferenças estão listadas em **[Regras da Casa (`docs/HOUSE_RULES.md`)](./docs/HOUSE_RULES.md)**.

---

## Instalação

### Pela URL do Manifesto no Foundry VTT (Recomendado)
1. Abra o **Foundry VTT** e acesse a aba **Sistemas de Jogo (Game Systems)**.
2. Clique em **Instalar Sistema (Install System)**.
3. Cole a URL abaixo no campo **Manifest URL**:
   ```text
   https://github.com/b4hia/sacramento/releases/latest/download/system.json
   ```
4. Clique em **Instalar (Install)**.

---

## Documentação

- **[Guia de Uso (`docs/GUIDE.md`)](./docs/GUIDE.md):** Como configurar o mundo e usar as fichas no Foundry VTT.
- **[Regras da Casa (`docs/HOUSE_RULES.md`)](./docs/HOUSE_RULES.md):** O que este sistema muda em relação ao livro impresso.
- **[Como Contribuir (`CONTRIBUTING.md`)](./CONTRIBUTING.md):** Configuração do ambiente de desenvolvimento, testes e padrões de código.
- **[Créditos e Licenças (`CREDITS.md`)](./CREDITS.md):** Atribuições e avisos de propriedade intelectual.
