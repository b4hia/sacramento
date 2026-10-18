# Guia de Uso — Sacramento RPG (Foundry VTT)

Este guia explica como configurar o mundo e usar as fichas do sistema no Foundry VTT.

> [!NOTE]
> Este guia mostra **onde clicar e o que a ficha faz**, não **como o jogo funciona**. Para as regras de Sacramento RPG, consulte o livro oficial da [Jambô Editora](https://jamboeditora.com.br/). As diferenças intencionais em relação ao livro estão em [Regras da Casa](./HOUSE_RULES.md).

---

## 1. Configurando o Baralho de Iniciativa

1. No Foundry VTT, acesse a aba **Baralhos de Cartas (Card Stacks)** na barra lateral direita.
2. Clique em **Criar Pilha de Cartas (Create Card Stack)**:
   - **Nome:** `Iniciativa` *(exatamente com esse nome)*
   - **Tipo:** Baralho (Deck), usando a predefinição de 52 cartas de Poker.
3. No **Combat Tracker**, ao rolar a iniciativa de um combatente, o sistema:
   - compra 1 carta do baralho `Iniciativa` (e embaralha automaticamente quando ele acaba);
   - mostra a carta comprada no chat;
   - registra a iniciativa no Combat Tracker. A forma como a ordem e os empates são calculados está em [Regras da Casa](./HOUSE_RULES.md).
4. Se não existir um baralho chamado `Iniciativa` no mundo, o sistema usa uma rolagem de dado no lugar da carta.

---

## 2. Ficha de Personagem

### Cabeçalho e Status
- **Nível e XP:** Ao alterar o nível, a ficha recalcula automaticamente os valores derivados.
- **Painel de Avisos:** Enquanto faltarem ou sobrarem pontos de Atributo, Antecedente ou Habilidade, ou houver excesso de carga, um painel de aviso aparece no topo das abas **Ficha** e **Montaria**.
- **Círculos de Dor e Vida:** Marque os círculos diretamente na ficha. Quando a Dor chega ao fim, a ficha atualiza a Vida sozinha e envia um alerta no chat.
- **Teste de Morte:** Clique no título **TESTE DE MORTE** (ou no ícone de dado ao lado) para rolar. A ficha marca as caixas de Sucesso e Falha automaticamente. O funcionamento desse teste é uma regra da casa, descrita em [Regras da Casa](./HOUSE_RULES.md).

### Mochila, Armas e Munições
- **Equipar itens:** Use as caixas **Coldre?**, **Vestido?** e **Equipado?** na lista de itens. A ficha recalcula os espaços ocupados e avisa quando a mochila passar da capacidade.
- **Atacar:** Clique no nome ou no ícone de uma arma para abrir o diálogo de ataque, onde é possível informar bônus de teste e de dano e escolher o modo de dano. O resultado aparece em um cartão no chat, com a munição já descontada.
- **Recarregar:** Clique no ícone de sincronização (<i class="fas fa-sync"></i>) ao lado das balas para recarregar a arma com munição compatível do inventário.

### Aba Montaria
- Preencha os dados e atributos da montaria. A ficha calcula a Vida da montaria e avisa quando a distribuição de pontos estiver incorreta.
- Marque **A montaria possui Bolsa de Carga?** e/ou **Atrelada a uma Carroça?** para liberar o inventário da montaria.
- Na aba **Mochila**, clique no ícone de cavalo (<i class="fas fa-horse"></i>) em qualquer item para transferi-lo entre a Mochila e a Montaria.

---

## 3. Ficha de NPC

- Informe o **Nível de Canalhice (NdC)** no cabeçalho. A ficha calcula a Vida e as Ações automaticamente.
- Marque **NPC Especial** para que a ficha passe a usar os valores de NPC Especial.

---

## 4. Compêndios

Os compêndios **Armas**, **Armas Especiais**, **Munições e Equipamentos**, **Consumíveis** e **Habilidades** ficam na aba **Compêndios (Compendium Packs)**. Arraste qualquer item para a ficha de um personagem para adicioná-lo.

Com o módulo [Babele](https://foundryvtt.com/packages/babele) ativo e o Foundry em inglês, os compêndios aparecem traduzidos.
