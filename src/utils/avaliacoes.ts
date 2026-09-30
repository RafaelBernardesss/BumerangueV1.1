const API_URL = "http://192.168.137.173:3000";

export type ResumoAvaliacao = { media: number; total: number };

// Busca a média de vários usuários em uma única chamada
export async function buscarResumo(
  ids: number[]
): Promise<Record<number, ResumoAvaliacao>> {
  const unicos = Array.from(new Set(ids.filter(Boolean)));
  if (unicos.length === 0) return {};

  try {
    const resposta = await fetch(`${API_URL}/avaliacoes/resumo?ids=${unicos.join(",")}`);
    if (!resposta.ok) return {};
    const dados = await resposta.json();
    return dados.resumo ?? {};
  } catch (erro) {
    console.log("Erro ao buscar avaliações:", erro);
    return {};
  }
}