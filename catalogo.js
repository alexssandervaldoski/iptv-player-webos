// Quem tem ano igual ou maior que este conta como "Recentemente"
const ANO_RECENTE = 2025;

// Dados de exemplo inventados. Na semana 4 virão do parser de M3U.
const catalogos = {
  filmes: [
    { titulo: "Aventura no Deserto", grupo: "Lançamentos", ano: 2026 },
    { titulo: "Noite de Estreia", grupo: "Lançamentos", ano: 2026 },
    { titulo: "Rota Final", grupo: "Ação", ano: 2023 },
    { titulo: "Velocidade Máxima", grupo: "Ação", ano: 2025 },
    { titulo: "Operação Aurora", grupo: "Ação", ano: 2021 },
    { titulo: "Riso Solto", grupo: "Comédia", ano: 2024 },
    { titulo: "A Grande Confusão", grupo: "Comédia", ano: 2019 },
    { titulo: "Planeta Azul", grupo: "Documentário", ano: 2022 },
    { titulo: "Vozes da Floresta", grupo: "Documentário", ano: 2025 }
  ],
  series: [
    { titulo: "Cidade Cinza", grupo: "Drama", ano: 2026 },
    { titulo: "Herança de Família", grupo: "Drama", ano: 2022 },
    { titulo: "Segredos do Vale", grupo: "Drama", ano: 2020 },
    { titulo: "Turma da Aventura", grupo: "Kids", ano: 2025 },
    { titulo: "Pequenos Exploradores", grupo: "Kids", ano: 2023 },
    { titulo: "Código Vermelho", grupo: "Suspense", ano: 2024 },
    { titulo: "Linha Tênue", grupo: "Suspense", ano: 2026 },
    { titulo: "Escritório Maluco", grupo: "Comédia", ano: 2021 }
  ],
  desenhos: [
    { titulo: "Robô Amigo", grupo: "Aventura", ano: 2025 },
    { titulo: "Ilha dos Bichos", grupo: "Aventura", ano: 2022 },
    { titulo: "Super Gatinhos", grupo: "Comédia", ano: 2026 },
    { titulo: "Mundo de Cores", grupo: "Educativo", ano: 2024 }
  ]
};

// Lê o tipo pelo endereço (?tipo=filmes). Se vier algo inválido, usa filmes.
const parametros = new URLSearchParams(window.location.search);
const tipoPedido = parametros.get("tipo");
const tipo = catalogos[tipoPedido] ? tipoPedido : "filmes";
const itens = catalogos[tipo];

// Estado da tela
let grupoAtual = "Todos";
let termo = "";

const elGrupos = document.getElementById("grupos");
const elPosters = document.getElementById("posters");
const elBusca = document.getElementById("busca");

function criar(tag, classe, texto) {
  const el = document.createElement(tag);
  if (classe) el.className = classe;
  if (texto !== undefined) el.textContent = texto;
  return el;
}

function matiz(texto) {
  let h = 0;
  for (const letra of texto) h = (h * 31 + letra.charCodeAt(0)) % 360;
  return h;
}

function ehRecente(item) {
  return item.ano >= ANO_RECENTE;
}

function contarPorGrupo() {
  const contagem = {};
  for (const item of itens) {
    contagem[item.grupo] = (contagem[item.grupo] || 0) + 1;
  }
  return contagem;
}

function desenharGrupos() {
  const lista = [
    ["Todos", itens.length],
    ["Favoritos", lerFavoritos().filter((f) => f.tipo === tipo).length],
    ["Recentemente", itens.filter(ehRecente).length],
    ...Object.entries(contarPorGrupo())
  ];

  elGrupos.textContent = "";
  for (const [nome, qtd] of lista) {
    const li = criar("li", "grupo" + (nome === grupoAtual ? " ativo" : ""));
    li.tabIndex = 0;
    li.append(criar("span", "", nome), criar("span", "contador", qtd));

    const escolher = () => {
      grupoAtual = nome;
      atualizar();
    };
    li.addEventListener("click", escolher);
    li.addEventListener("keydown", (e) => {
      if (e.key === "Enter") escolher();
    });
    elGrupos.appendChild(li);
  }
}

// Diz se o item pertence ao grupo escolhido no menu
function noGrupoAtual(item) {
  if (grupoAtual === "Todos") return true;
  if (grupoAtual === "Favoritos") return temFavorito(tipo, item.titulo);
  if (grupoAtual === "Recentemente") return ehRecente(item);
  return item.grupo === grupoAtual;
}

function itensVisiveis() {
  return itens.filter((item) => {
    const naBusca = item.titulo.toLowerCase().includes(termo);
    return noGrupoAtual(item) && naBusca;
  });
}

function alternarFavorito(item) {
     alternarFavoritoSalvo({ tipo, titulo: item.titulo, grupo: item.grupo, ano: item.ano });
     atualizar();
   }

function desenharPosters() {
  const lista = itensVisiveis();
  elPosters.textContent = "";

  if (lista.length === 0) {
    elPosters.appendChild(criar("li", "sem-resultado", "Nenhum título encontrado"));
  }

  for (const item of lista) {
    const ehFavorito = temFavorito(tipo, item.titulo);
    const li = criar("li", "poster");
    li.tabIndex = 0;

    const capa = criar("div", "capa", item.titulo[0]);
    const h = matiz(item.titulo);
    capa.style.background =
      `linear-gradient(160deg, hsl(${h} 70% 45%), hsl(${(h + 40) % 360} 70% 20%))`;

    const coracao = criar("button", "coracao" + (ehFavorito ? " ligado" : ""), ehFavorito ? "♥" : "♡");
    coracao.addEventListener("click", (e) => {
      e.stopPropagation();
      alternarFavorito(item);
    });

    li.append(
      capa,
      criar("span", "titulo-poster", item.titulo),
      criar("span", "ano-poster", item.ano),
      coracao
    );
    elPosters.appendChild(li);
  }

  document.getElementById("qtd-titulos").textContent = lista.length;
}

function atualizar() {
  desenharGrupos();
  desenharPosters();
}

function atualizarRelogio() {
  const agora = new Date();
  document.getElementById("data").textContent = agora.toLocaleDateString("pt-BR");
  document.getElementById("hora").textContent =
    agora.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
}

elBusca.addEventListener("input", () => {
  termo = elBusca.value.toLowerCase();
  desenharPosters();
});

// Início
// O "?." evita o erro quando o tipo não tem uma aba (como "desenhos")
document.getElementById("aba-" + tipo)?.classList.add("ativa");
document.getElementById("qtd-total").textContent = itens.length;
atualizar();
atualizarRelogio();
setInterval(atualizarRelogio, 30000);