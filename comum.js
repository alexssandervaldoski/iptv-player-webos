// Código compartilhado entre as páginas.
const CHAVE_FAVORITOS = "xique:favoritos";
const CHAVE_PLAYLISTS = "xique:playlists";
const CHAVE_PLAYLIST_ATIVA = "xique:playlist-ativa";

function lerDados(chave, padrao) {
  try {
    const texto = localStorage.getItem(chave);
    return texto ? JSON.parse(texto) : padrao;
  } catch (erro) {
    return padrao;
  }
}

function gravarDados(chave, valor) {
  try {
    localStorage.setItem(chave, JSON.stringify(valor));
  } catch (erro) {
    console.error("Não foi possível gravar", chave, erro);
  }
}

// Um favorito é { tipo, titulo, grupo, ano }. O tipo é canais, filmes, series...
function lerFavoritos() {
  return lerDados(CHAVE_FAVORITOS, []);
}

function temFavorito(tipo, titulo) {
  return lerFavoritos().some((f) => f.tipo === tipo && f.titulo === titulo);
}

function alternarFavoritoSalvo(item) {
  const lista = lerFavoritos();
  const i = lista.findIndex((f) => f.tipo === item.tipo && f.titulo === item.titulo);
  if (i >= 0) lista.splice(i, 1);
  else lista.push(item);
  gravarDados(CHAVE_FAVORITOS, lista);
}

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

function atualizarRelogio() {
  const agora = new Date();
  document.getElementById("data").textContent = agora.toLocaleDateString("pt-BR");
  document.getElementById("hora").textContent =
    agora.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
}