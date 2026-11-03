// Dados de exemplo inventados. Na semana 4 virão do parser de M3U.
const canais = [
  { nome: "Notícias 24h", grupo: "Notícias" },
  { nome: "Jornal da Manhã", grupo: "Notícias" },
  { nome: "Mundo em Foco", grupo: "Notícias" },
  { nome: "Esportes Play", grupo: "Esportes" },
  { nome: "Futebol Ao Vivo", grupo: "Esportes" },
  { nome: "Arena Motor", grupo: "Esportes" },
  { nome: "Cine Clássicos", grupo: "Filmes" },
  { nome: "Filmes Max", grupo: "Filmes" },
  { nome: "Ação Total", grupo: "Filmes" },
  { nome: "Kids Day", grupo: "Infantil" },
  { nome: "Desenhos 24h", grupo: "Infantil" },
  { nome: "Música Hits", grupo: "Música" }
];

// Estado da tela
let grupoAtual = "Todos";
let termo = "";


const elGrupos = document.getElementById("grupos");
const elCanais = document.getElementById("canais-lista");
const elBusca = document.getElementById("busca");

// Cria um elemento já com classe e texto
function criar(tag, classe, texto) {
  const el = document.createElement(tag);
  if (classe) el.className = classe;
  if (texto !== undefined) el.textContent = texto;
  return el;
}

// Conta quantos canais existem em cada grupo
function contarPorGrupo() {
  const contagem = {};
  for (const canal of canais) {
    contagem[canal.grupo] = (contagem[canal.grupo] || 0) + 1;
  }
  return contagem;
}

function escolherGrupo(nome) {
  grupoAtual = nome;
  atualizar();
}

function desenharGrupos() {
  const itens = [
    ["Todos", canais.length],
    ["Favoritos", lerFavoritos().filter((f) => f.tipo === "canais").length],
    ...Object.entries(contarPorGrupo())
  ];

  elGrupos.textContent = "";
  for (const [nome, qtd] of itens) {
    const li = criar("li", "grupo" + (nome === grupoAtual ? " ativo" : ""));
    li.tabIndex = 0;
    li.append(criar("span", "", nome), criar("span", "contador", qtd));
    li.addEventListener("click", () => escolherGrupo(nome));
    li.addEventListener("keydown", (e) => {
      if (e.key === "Enter") escolherGrupo(nome);
    });
    elGrupos.appendChild(li);
  }
}

// Aplica o grupo escolhido e o texto da busca
function canaisVisiveis() {
  return canais.filter((canal) => {
    let noGrupo = true;
    if (grupoAtual === "Favoritos") noGrupo = temFavorito("canais", canal.nome);
    else if (grupoAtual !== "Todos") noGrupo = canal.grupo === grupoAtual;

    const naBusca = canal.nome.toLowerCase().includes(termo);
    return noGrupo && naBusca;
  });
}

function desenharCanais() {
  const lista = canaisVisiveis();
  elCanais.textContent = "";

  for (const canal of lista) {
    const ehFavorito = temFavorito("canais", canal.nome);
    const li = criar("li", "canal");
    li.tabIndex = 0;

    const logo = criar("div", "mini-logo", canal.nome[0]);
    const nome = criar("span", "canal-nome", canal.nome);
    const coracao = criar("button", "coracao" + (ehFavorito ? " ligado" : ""), ehFavorito ? "♥" : "♡");

    coracao.addEventListener("click", (e) => {
      e.stopPropagation(); // não selecionar o canal ao favoritar
      alternarFavorito(canal);
    });

    li.append(logo, nome, coracao);
    li.addEventListener("click", () => selecionarCanal(canal));
    li.addEventListener("keydown", (e) => {
      if (e.key === "Enter" && e.target === li) selecionarCanal(canal);
    });
    elCanais.appendChild(li);
  }

  document.getElementById("qtd-canais").textContent = lista.length;
}

function selecionarCanal(canal) {
  document.getElementById("titulo-player").textContent = canal.nome;
  document.getElementById("dica-player").textContent = "O vídeo entra na semana 5";
  document.getElementById("det-nome").textContent = canal.nome;
  document.getElementById("det-grupo").textContent = canal.grupo;
}

function alternarFavorito(canal) {
     alternarFavoritoSalvo({ tipo: "canais", titulo: canal.nome, grupo: canal.grupo });
     atualizar();
   }

function atualizar() {
  desenharGrupos();
  desenharCanais();
}

function atualizarRelogio() {
  const agora = new Date();
  document.getElementById("data").textContent = agora.toLocaleDateString("pt-BR");
  document.getElementById("hora").textContent =
    agora.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
}

elBusca.addEventListener("input", () => {
  termo = elBusca.value.toLowerCase();
  desenharCanais();
});

// Início
document.getElementById("qtd-total").textContent = canais.length;
atualizar();
atualizarRelogio();
setInterval(atualizarRelogio, 30000);