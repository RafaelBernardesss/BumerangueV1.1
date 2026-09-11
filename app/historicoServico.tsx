import React, { useCallback, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
} from "react-native";
import { useRouter } from "expo-router";
import { useFocusEffect } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import Header from "../components/Hearder";
import { buscarHistorico, limparHistorico, ItemHistorico } from "../src/utils/historico";

const API_URL = "http://172.30.1.2:3000"; // mesmo IP usado nas outras telas

// Monta a URL completa da foto a partir do caminho relativo salvo no banco
function urlFoto(caminho: string | null) {
  if (!caminho) return null;
  return `${API_URL}/${caminho.replace(/\\/g, "/")}`;
}

// Formata a data "criadoEm" do anúncio (ex: "12 mar 2026")
function formatarData(dataIso: string) {
  const data = new Date(dataIso);
  return data.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export default function HistoricoServico() {
  const router = useRouter();

  const [historico, setHistorico] = useState<ItemHistorico[]>([]);
  const [carregando, setCarregando] = useState(true);

  // Recarrega toda vez que a tela ganha foco, pra refletir cliques recentes
  useFocusEffect(
    useCallback(() => {
      async function carregar() {
        setCarregando(true);
        const dados = await buscarHistorico();
        setHistorico(dados);
        setCarregando(false);
      }

      carregar();
    }, [])
  );

  async function handleLimparHistorico() {
    await limparHistorico();
    setHistorico([]);
  }

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* CABEÇALHO */}
        <View style={styles.headerRow}>
          <Header></Header>
        </View>

        {/* TÍTULO */}
        <View style={styles.titleContainer}>
          <View style={styles.titleRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.title}>Histórico</Text>
              <Text style={styles.subtitle}>
                Anúncios que você visualizou recentemente.
              </Text>
            </View>

            {historico.length > 0 && (
              <TouchableOpacity onPress={handleLimparHistorico}>
                <Text style={styles.limparTexto}>Limpar</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* LISTA DE HISTÓRICO */}
        <View style={styles.listContainer}>
          {carregando ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>Carregando histórico...</Text>
            </View>
          ) : historico.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="time-outline" size={32} color="#444" />
              <Text style={styles.emptyText}>
                Você ainda não visualizou nenhum anúncio
              </Text>
            </View>
          ) : (
            historico.map((item) => {
              const foto = urlFoto(item.foto);

              return (
                <TouchableOpacity
                  key={`${item.id}-${item.visitadoEm}`}
                  style={styles.historicoCard}
                  activeOpacity={0.8}
                  onPress={() => router.push(`/AnuncioScreen?id=${item.id}`)}
                >
                  {foto ? (
                    <Image source={{ uri: foto }} style={styles.foto} />
                  ) : (
                    <View style={[styles.foto, styles.fotoPlaceholder]}>
                      <Ionicons name="image-outline" size={28} color="#444" />
                    </View>
                  )}

                  <View style={styles.info}>
                    <Text style={styles.tituloAnuncio} numberOfLines={1}>
                      {item.titulo}
                    </Text>

                    <Text style={styles.descricao} numberOfLines={2}>
                      {item.descricao}
                    </Text>

                    <View style={styles.rodape}>
                      <View style={styles.rodapeItem}>
                        <Ionicons name="person-outline" size={13} color="#888" />
                        <Text style={styles.rodapeTexto} numberOfLines={1}>
                          {item.usuarioNome}
                        </Text>
                      </View>

                      <View style={styles.rodapeItem}>
                        <Ionicons name="calendar-outline" size={13} color="#888" />
                        <Text style={styles.rodapeTexto}>
                          {formatarData(item.criadoEm)}
                        </Text>
                      </View>
                    </View>
                  </View>
                </TouchableOpacity>
              );
            })
          )}
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* MENU INFERIOR */}
      <View style={styles.bottomBar}>
        <TouchableOpacity onPress={() => router.push("/anuncios")}>
          <Ionicons name="home-outline" size={30} color="#999" />
        </TouchableOpacity>

        <TouchableOpacity onPress={() => router.push("/verAnuncio")}>
          <Ionicons name="search" size={30} color="#999" />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.addButton}
          onPress={() => router.push("/oferecerServicos")}
        >
          <Ionicons name="add" size={36} color="#00AFFF" />
        </TouchableOpacity>

        <TouchableOpacity onPress={() => router.push("/Contatos")}>
          <Ionicons name="chatbubble-outline" size={30} color="#999" />
        </TouchableOpacity>

        <TouchableOpacity onPress={() => router.push("/perfil")}>
          <Ionicons name="person-outline" size={30} color="#999" />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0B0B0B",
    paddingTop: 50,
  },
  headerRow: {
    paddingHorizontal: 0,
  },
  titleContainer: {
    paddingHorizontal: 20,
    marginTop: 20,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "flex-start",
  },
  title: {
    color: "#fff",
    fontSize: 32,
    fontWeight: "bold",
  },
  subtitle: {
    color: "#999",
    fontSize: 16,
    marginTop: 10,
    lineHeight: 24,
  },
  limparTexto: {
    color: "#00AFFF",
    fontSize: 15,
    fontWeight: "600",
    marginTop: 6,
  },
  listContainer: {
    marginTop: 25,
    paddingHorizontal: 20,
    gap: 12,
  },
  historicoCard: {
    flexDirection: "row",
    backgroundColor: "#0D1324",
    borderRadius: 18,
    padding: 12,
    borderWidth: 1,
    borderColor: "#161D2E",
  },
  foto: {
    width: 72,
    height: 72,
    borderRadius: 14,
  },
  fotoPlaceholder: {
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#161D2E",
  },
  info: {
    flex: 1,
    marginLeft: 14,
    justifyContent: "center",
  },
  tituloAnuncio: {
    color: "#fff",
    fontSize: 17,
    fontWeight: "600",
  },
  descricao: {
    color: "#888",
    fontSize: 13,
    marginTop: 4,
    lineHeight: 18,
  },
  rodape: {
    flexDirection: "row",
    marginTop: 8,
    gap: 14,
  },
  rodapeItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    flexShrink: 1,
  },
  rodapeTexto: {
    color: "#888",
    fontSize: 12,
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
  },
  emptyText: {
    color: "#555",
    marginTop: 10,
    textAlign: "center",
    paddingHorizontal: 30,
  },
  bottomBar: {
    position: "absolute",
    bottom: 0,
    width: "100%",
    height: 80,
    backgroundColor: "#0D1324",
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    borderTopWidth: 1,
    borderTopColor: "#222",
  },
  addButton: {
    marginTop: -20,
  },
});