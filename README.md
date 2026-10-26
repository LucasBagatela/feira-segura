# Feira Consciente

Jogo educativo que roda direto no navegador, feito só com HTML, CSS e JavaScript. O jogador controla um personagem que compra alimentos no mercado com um orçamento limitado, volta para casa, higieniza cada alimento e recebe uma nota com os detalhes da jornada.

O objetivo é ensinar práticas de higienização de frutas e verduras e deixar claro que **lavar ajuda na higiene, mas não garante a remoção de resíduos de agrotóxicos**.

## Como jogar

1. **Mercado:** toque nas barracas de pepino, laranja e couve. O personagem anda até a barraca e coloca o item na cesta que carrega. O saldo e o resumo da cesta são atualizados na hora. Depois, toque no **Caixa** para pagar.
2. **Casa:** toque na **Pia** para abrir o painel de higienização. Escolha um alimento e responda ao minigame de 3 perguntas sorteadas. Os erros não tiram pontos.
3. **Final:** com todos os alimentos higienizados, toque na **Mesa** (ou em "Ver resultado") para receber a nota da jornada, que pode ser impressa.

### Controles

- **Celular ou mouse:** toque ou clique no objeto; o personagem anda até ele e a ação acontece ao chegar.
- **Computador:** use as setas (ou W, A, S, D) para andar livremente e **E** (ou Enter) para usar o objeto mais próximo. Perto de um objeto aparece o aviso "Pressione E", que também pode ser clicado.
- **Teclado e leitores de tela:** os objetos da cena também são botões com nome e podem ser acessados com Tab.

## Regras do jogo

- Orçamento inicial de R$ 20,00 (valor fictício e didático).
- Preços: pepino R$ 4,00, laranja R$ 3,00 e couve R$ 5,00, com no máximo 3 unidades de cada. Não dá para comprar tudo.
- Não é possível comprar acima do saldo, e é preciso comprar pelo menos um alimento para avançar.
- Cada alimento comprado precisa ser higienizado por completo antes de o jogo terminar.
- Pontos: compra dentro do orçamento, respostas corretas, correção de erros após a explicação e conclusão de cada alimento. A pontuação mede o aprendizado e **não indica se um alimento é seguro ou inseguro**.

## Minigames de higienização

Na pia, cada alimento tem um banco de 6 perguntas (couve, laranja e pepino) e a cada partida são sorteadas 3 delas, em ordem aleatória, de múltipla escolha e com as opções embaralhadas e um feedback a cada acerto. O alimento só é considerado higienizado ao concluir o minigame. O número sorteado fica em `PERGUNTAS_POR_ALIMENTO`. As perguntas ficam em `MINIGAMES`, no `script.js`: a resposta certa é sempre a primeira da lista, e o jogo a embaralha na tela.

## Estrutura do projeto

```
index.html   Estrutura das telas (mercado, casa, nota, orientações)
style.css    Visual, cenas, personagem, animações e nota
script.js    Regras do jogo, cenas, personagem e ilustrações SVG
```

Não há imagens externas, bibliotecas ou servidor: tudo é desenhado em SVG e CSS.

## Como executar localmente

1. Salve os três arquivos na mesma pasta.
2. Abra o `index.html` em um navegador moderno (Chrome, Firefox, Edge ou Safari).

## Como publicar no GitHub Pages

1. Crie um repositório público no GitHub e envie os três arquivos para a raiz.
2. Vá em **Settings > Pages**.
3. Em **Build and deployment**, escolha **Deploy from a branch**, a branch `main` e a pasta `/ (root)`.
4. Aguarde alguns minutos e acesse o endereço que o GitHub mostrar.

## Como personalizar

No `script.js`:

- `ORCAMENTO` e `LIMITE_UNID`: orçamento inicial e limite de unidades por alimento.
- `MINIGAMES`: as perguntas, as opções e os feedbacks de cada alimento (a resposta certa é sempre a primeira da lista).
- `ALIMENTOS`: nome, preço, cor e dica de cada alimento.

Para adicionar um alimento novo, inclua uma entrada em `ALIMENTOS` e em `MINIGAMES`, uma ilustração em `arte()` e a cor da barraca em `svgBarraca()`. Se ele tiver mais de 3 unidades possíveis, ajuste também as posições em `atualizarCesta()`.

## Limitações e avisos

- **Base científica:** esta versão foi feita sem materiais de referência anexados. O jogo não afirma que pepino, laranja e couve são os alimentos com mais agrotóxicos: eles são apenas os três escolhidos para o projeto.
- **Orientações sanitárias:** o conteúdo dos minigames vem do material do projeto e deve ser conferido nas fontes oficiais antes de uso em atividades de ensino.
- **Referências:** a janela "Orientações" lista Anvisa (Programa de Análise de Resíduos de Agrotóxicos em Alimentos e orientações de higienização) e o Guia Alimentar para a População Brasileira, do Ministério da Saúde. Os links apontam para os portais das instituições e podem ser trocados pelos links diretos dos documentos.
- **Risco à saúde:** a presença de resíduo não significa, por si só, dano à saúde. O risco depende da substância, da concentração e da exposição.
- **Preços:** são fictícios, apenas para a mecânica do jogo.
- **Higienização:** cada tipo de alimento é higienizado uma vez, independentemente da quantidade comprada.
- **Privacidade:** o jogo não pede cadastro, não usa login e não envia nenhum dado.

## Ideias para próximas versões

- Mais alimentos, com diferentes orçamentos e níveis de dificuldade.
- Movimento livre do personagem com as setas do teclado.
- Sons e animações de lavagem na pia.
- Referências com links diretos e dados dos materiais do projeto.
