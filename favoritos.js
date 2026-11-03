const ROTULOS = { canais: "Canais", filmes: "Filmes", series: "Séries", desenhos: "Desenhos" };

let tipoAtual = "todos";
let termo = "";

const elGrupos = document.getElementById("grupos");
const elPosters = document.getElementById("posters");
const elBusca = document.getElementById("busca");

function desenharGrupos() {
  const favoritos = lerFavoritos();
  const contagem = {};
  for (const f of favoritos) contagem[f.tipo] = (contagem[f.tipo] || 0) + 1;

  // Se o tipo escolhido ficou sem itens, volta para "todos"
  if (tipoAtual !== "todos" && !contagem[tipoAtual]) tipoAtual = "todos";

  const lista = [
    { tipo: "todos", rotulo: "Todos", qtd: favoritos.length },
    ...Object.entries(contagem).map(([tipo, qtd]) => ({
      tipo,
      rotulo: ROTULOS[tipo] || tipo,
      qtd
    }))
  ];

  elGrupos.textContent = "";
  for (const g of lista) {
    const li = criar("li", "grupo" + (g.tipo === tipoAtual ? " ativo" : ""));
    li.tabIndex = 0;
    li.append(criar("span", "", g.rotulo), criar("span", "contador", g.qtd));

    const escolher = () => {
      tipoAtual = g.tipo;
      atualizar();
    };
    li.addEventListener("click", escolher);
    li.addEventListener("keydown", (e) => {
      if (e.key === "Enter") escolher();
    });
    elGrupos.appendChild(li);
  }

  document.getElementById("qtd-total").textContent = favoritos.length;
}

function desenharPosters() {
  const todos = lerFavoritos();
  const lista = todos.filter((f) => {
    const noTipo = tipoAtual === "todos" || f.tipo === tipoAtual;
    return noTipo && f.titulo.toLowerCase().includes(termo);
  });

  elPosters.textContent = "";

  if (lista.length === 0) {
    const msg = todos.length === 0
      ? "Você ainda não tem favoritos. Toque no ♡ de um título para guardar aqui."
      : "Nenhum favorito encontrado";
    elPosters.appendChild(criar("li", "sem-resultado", msg));
  }

  for (const item of lista) {
    const li = criar("li", "poster");
    li.tabIndex = 0;

    const capa = criar("div", "capa", item.titulo[0]);
    const h = matiz(item.titulo);
    capa.style.background =
      `linear-gradient(160deg, hsl(${h} 70% 45%), hsl(${(h + 40) % 360} 70% 20%))`;

    const coracao = criar("button", "coracao ligado", "♥");
    coracao.addEventListener("click", (e) => {
      e.stopPropagation();
      alternarFavoritoSalvo(item); // como já é favorito, isto remove
      atualizar();
    });

    const detalhe = (ROTULOS[item.tipo] || item.tipo) + (item.ano ? " · " + item.ano : "");
    li.append(capa, criar("span", "titulo-poster", item.titulo), criar("span", "ano-poster", detalhe), coracao);
    elPosters.appendChild(li);
  }
}

function atualizar() {
  desenharGrupos();
  desenharPosters();
}

elBusca.addEventListener("input", () => {
  termo = elBusca.value.toLowerCase();
  desenharPosters();
});

atualizar();
atualizarRelogio();
setInterval(atualizarRelogio, 30000);