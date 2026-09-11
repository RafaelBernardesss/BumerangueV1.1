import AsyncStorage from "@react-native-async-storage/async-storage";

const CHAVE_HISTORICO = "historicoAnuncios";
const LIMITE_HISTORICO = 50; // evita o histórico crescer indefinidamente

export type ItemHistorico = {
  id: number;
  titulo: string;
  descricao: string;
  foto: string | null;
  criadoEm: string;
  usuarioNome: string;
  visitadoEm: string; // quando o usuário clicou no anúncio
};

// Tipo mínimo de anúncio necessário para registrar no histórico.
// Bate com o formato que já vem do backend (SELECT_ANUNCIO_COMPLETO).
type AnuncioParaHistorico = {
  id: number;
  titulo: string;
  descricao: string;
  foto: string | null;
  criadoEm: string;
  usuario: { nome: string };
};

// Chame essa função no onPress de qualquer card de anúncio, antes de navegar.
export async function adicionarAoHistorico(anuncio: AnuncioParaHistorico) {
  try {
    const historicoAtual = await buscarHistorico();

    // Remove uma entrada anterior do mesmo anúncio, se existir,
    // pra ele subir pro topo da lista em vez de duplicar
    const semDuplicata = historicoAtual.filter((item) => item.id !== anuncio.id);

    const novoItem: ItemHistorico = {
      id: anuncio.id,
      titulo: anuncio.titulo,
      descricao: anuncio.descricao,
      foto: anuncio.foto,
      criadoEm: anuncio.criadoEm,
      usuarioNome: anuncio.usuario?.nome ?? "Usuário",
      visitadoEm: new Date().toISOString(),
    };

    const novoHistorico = [novoItem, ...semDuplicata].slice(0, LIMITE_HISTORICO);

    await AsyncStorage.setItem(CHAVE_HISTORICO, JSON.stringify(novoHistorico));
  } catch (erro) {
    console.error("Erro ao adicionar ao histórico:", erro);
  }
}

export async function buscarHistorico(): Promise<ItemHistorico[]> {
  try {
    const salvo = await AsyncStorage.getItem(CHAVE_HISTORICO);
    return salvo ? JSON.parse(salvo) : [];
  } catch (erro) {
    console.error("Erro ao buscar histórico:", erro);
    return [];
  }
}

export async function limparHistorico() {
  try {
    await AsyncStorage.removeItem(CHAVE_HISTORICO);
  } catch (erro) {
    console.error("Erro ao limpar histórico:", erro);
  }
}