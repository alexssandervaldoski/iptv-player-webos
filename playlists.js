let playlists = lerDados(CHAVE_PLAYLISTS, []);
let ativaId = lerDados(CHAVE_PLAYLIST_ATIVA, null);
let selecionadaId = null; // a playlist da janela de opções
let editandoId = null;    // null significa "nova playlist"

const elLista = document.getElementById("lista-playlists");
const dlgOpcoes = document.getElementById("dlg-opcoes");
const dlgForm = document.getElementById("dlg-form");
const form = document.getElementById("form-playlist");

function salvar() {
  gravarDados(CHAVE_PLAYLISTS, playlists);
  gravarDados(CHAVE_PLAYLIST_ATIVA, ativaId);
}

function desenhar() {
  elLista.textContent = "";

  if (playlists.length === 0) {
    elLista.appendChild(criar("li", "vazio", "Nenhuma playlist salva. Use \"Nova playlist\"."));
  }

  for (const p of playlists) {
    const li = criar("li", "item-playlist");
    li.tabIndex = 0;

    const info = criar("div", "info-lista");
    info.appendChild(criar("strong", "", p.nome));
    if (p.id === ativaId) info.appendChild(criar("span", "selo", "Conectada"));

    li.append(criar("div", "icone-lista", "📋"), info);

    const abrir = () => abrirOpcoes(p.id);
    li.addEventListener("click", abrir);
    li.addEventListener("keydown", (e) => {
      if (e.key === "Enter") abrir();
    });
    elLista.appendChild(li);
  }

  document.getElementById("qtd-listas").textContent =
    playlists.length + (playlists.length === 1 ? " lista" : " listas");
}

// Janela de opções
function abrirOpcoes(id) {
  selecionadaId = id;
  const p = playlists.find((x) => x.id === id);
  document.getElementById("opcoes-nome").textContent = p.nome;
  dlgOpcoes.showModal();
}

document.getElementById("op-conectar").addEventListener("click", () => {
  ativaId = selecionadaId;
  salvar();
  dlgOpcoes.close();
  desenhar();
});

document.getElementById("op-editar").addEventListener("click", () => {
  dlgOpcoes.close();
  abrirForm(selecionadaId);
});

document.getElementById("op-apagar").addEventListener("click", () => {
  const p = playlists.find((x) => x.id === selecionadaId);
  if (!confirm(`Apagar a playlist "${p.nome}"?`)) return;

  playlists = playlists.filter((x) => x.id !== selecionadaId);
  if (ativaId === selecionadaId) ativaId = null;
  salvar();
  dlgOpcoes.close();
  desenhar();
});

document.getElementById("op-voltar").addEventListener("click", () => dlgOpcoes.close());

// Janela do formulário (nova ou edição)
function abrirForm(id) {
  editandoId = id;
  const p = id
    ? playlists.find((x) => x.id === id)
    : { nome: "", url: "", usuario: "", senha: "" };

  document.getElementById("form-titulo").textContent =
    id ? "Atualize os dados da playlist" : "Nova playlist";
  form.elements.nome.value = p.nome;
  form.elements.url.value = p.url;
  form.elements.usuario.value = p.usuario;
  form.elements.senha.value = p.senha;
  dlgForm.showModal();
}

document.getElementById("btn-nova").addEventListener("click", () => abrirForm(null));
document.getElementById("form-cancelar").addEventListener("click", () => dlgForm.close());

form.addEventListener("submit", (e) => {
  e.preventDefault(); // não recarregar a página
  const dados = {
    nome: form.elements.nome.value.trim(),
    url: form.elements.url.value.trim(),
    usuario: form.elements.usuario.value.trim(),
    senha: form.elements.senha.value
  };

  if (editandoId) {
    Object.assign(playlists.find((x) => x.id === editandoId), dados);
  } else {
    const nova = { id: Date.now().toString(), ...dados };
    playlists.push(nova);
    if (!ativaId) ativaId = nova.id; // a primeira já fica conectada
  }

  salvar();
  dlgForm.close();
  desenhar();
});

desenhar();