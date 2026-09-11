import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  Image,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useFocusEffect } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Flecha from "../../components/HeaderFlecha";

const API_URL = "http://172.30.1.33:3000";

type Anuncio = {
  id: number;
  titulo: string;
  descricao: string;
  preferencia: string;
  foto: string | null;
  disponibilidade: string | null;
  status: string;
  cidade: string | null;
  estado: string | null;
  categoria: {
    id: number;
    nome: string;
  };
};

const STATUS_LABEL: Record<string, { label: string; cor: string }> = {
  ativo: { label: "Ativo", cor: "#00FF44" },
  pausado: { label: "Pausado", cor: "#FFB800" },
  vendido: { label: "Concluído", cor: "#888" },
};

export default function MeusAnuncios() {
  const [anuncios, setAnuncios] = useState<Anuncio[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [atualizando, setAtualizando] = useState(false);

  useFocusEffect(
    useCallback(() => {
      carregarMeusAnuncios();
    }, [])
  );

  async function carregarMeusAnuncios() {
    try {
      setCarregando(true);
      const usuarioId = await AsyncStorage.getItem("usuarioId");

      if (!usuarioId) {
        Alert.alert("Erro", "Não foi possível identificar o usuário logado.");
        return;
      }

      const resposta = await fetch(`${API_URL}/anuncios?usuarioId=${usuarioId}`);
      const dados = await resposta.json();

      if (resposta.ok) {
        // Anúncios "em_andamento" (proposta aceita) não aparecem mais aqui
        setAnuncios(
          (dados.anuncios as Anuncio[]).filter((a) => a.status !== "em_andamento")
        );
      } else {
        Alert.alert("Erro", "Não foi possível carregar seus anúncios.");
      }
    } catch (erro) {
      console.log(erro);
      Alert.alert("Erro", "Não foi possível conectar ao servidor.");
    } finally {
      setCarregando(false);
      setAtualizando(false);
    }
  }

  function aoAtualizar() {
    setAtualizando(true);
    carregarMeusAnuncios();
  }

  function confirmarExclusao(id: number, titulo: string) {
    Alert.alert(
      "Excluir anúncio",
      `Tem certeza que deseja excluir "${titulo}"?`,
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Excluir",
          style: "destructive",
          onPress: () => excluirAnuncio(id),
        },
      ]
    );
  }

  async function excluirAnuncio(id: number) {
    try {
      const resposta = await fetch(`${API_URL}/anuncios/${id}`, {
        method: "DELETE",
      });

      if (resposta.ok) {
        setAnuncios((prev) => prev.filter((a) => a.id !== id));
      } else {
        Alert.alert("Erro", "Não foi possível excluir o anúncio.");
      }
    } catch (erro) {
      console.log(erro);
      Alert.alert("Erro", "Não foi possível conectar ao servidor.");
    }
  }

  function formatarLocal(item: Anuncio) {
    if (item.cidade && item.estado) return `${item.cidade} - ${item.estado}`;
    return item.cidade || item.estado || "Localização não informada";
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Flecha></Flecha>
        <Text style={styles.headerTitulo}>Meus Anúncios</Text>
      </View>

      {carregando ? (
        <ActivityIndicator color="#00AFFF" style={{ marginTop: 40 }} size="large" />
      ) : (
        <FlatList
          data={anuncios}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={styles.lista}
          refreshControl={
            <RefreshControl
              refreshing={atualizando}
              onRefresh={aoAtualizar}
              tintColor="#00AFFF"
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Ionicons name="pricetags-outline" size={40} color="#444" />
              <Text style={styles.emptyTitulo}>Nenhum anúncio ainda</Text>
              <Text style={styles.emptyTexto}>
                Os anúncios que você criar vão aparecer aqui.
              </Text>
            </View>
          }
          renderItem={({ item }) => {
            const statusInfo = STATUS_LABEL[item.status] || {
              label: item.status,
              cor: "#888",
            };

            return (
              <TouchableOpacity
                style={styles.card}
                activeOpacity={0.7}
                onPress={() =>
                  router.push({ pathname: "/AnuncioScreen", params: { id: String(item.id) } })
                }
              >
                {item.foto ? (
                  <Image
                    source={{ uri: `${API_URL}/${item.foto.replace(/\\/g, "/")}` }}
                    style={styles.thumb}
                  />
                ) : (
                  <View style={styles.thumb} />
                )}

                <View style={{ flex: 1 }}>
                  <Text style={styles.cardTitulo} numberOfLines={1}>
                    {item.titulo}
                  </Text>
                  <Text style={styles.cardCategoria}>{item.categoria.nome}</Text>
                  <Text style={styles.cardInfo} numberOfLines={1}>
                    {formatarLocal(item)}
                  </Text>

                  <View style={[styles.badge, { backgroundColor: `${statusInfo.cor}22` }]}>
                    <Text style={[styles.badgeTexto, { color: statusInfo.cor }]}>
                      {statusInfo.label}
                    </Text>
                  </View>
                </View>

                <View style={styles.botoesAcao}>
                  <TouchableOpacity
                    style={styles.botaoEditar}
                    onPress={() =>
                      router.push({ pathname: "/EditarAnuncio", params: { id: String(item.id) } })
                    }
                    hitSlop={8}
                  >
                    <Ionicons name="create-outline" size={20} color="#fff" />
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.botaoExcluir}
                    onPress={() => confirmarExclusao(item.id, item.titulo)}
                    hitSlop={8}
                  >
                    <Ionicons name="trash-outline" size={20} color="#fff" />
                  </TouchableOpacity>
                </View>
              </TouchableOpacity>
            );
          }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0B0B0B",
    paddingTop: 50,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingBottom: 20,
    gap: 14,
  },
  headerTitulo: {
    color: "#fff",
    fontSize: 22,
    fontWeight: "bold",
  },
  lista: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  card: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#0D1324",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#161D2E",
    padding: 12,
    marginBottom: 12,
  },
  thumb: {
    width: 60,
    height: 60,
    borderRadius: 12,
    backgroundColor: "#1E1E1E",
    marginRight: 12,
  },
  cardTitulo: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  cardCategoria: {
    color: "#00AFFF",
    fontSize: 12,
    marginTop: 3,
  },
  cardInfo: {
    color: "#9CA3AF",
    fontSize: 12,
    marginTop: 3,
  },
  badge: {
    alignSelf: "flex-start",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    marginTop: 6,
  },
  badgeTexto: {
    fontSize: 11,
    fontWeight: "600",
  },
  botoesAcao: {
    gap: 8,
    marginLeft: 8,
  },
  botaoEditar: {
    backgroundColor: "#00AFFF",
    padding: 8,
    borderRadius: 10,
  },
  botaoExcluir: {
    backgroundColor: "#FF3B3B",
    padding: 8,
    borderRadius: 10,
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 100,
  },
  emptyTitulo: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "600",
    marginTop: 16,
  },
  emptyTexto: {
    color: "#666",
    fontSize: 14,
    textAlign: "center",
    marginTop: 8,
    paddingHorizontal: 40,
  },
});