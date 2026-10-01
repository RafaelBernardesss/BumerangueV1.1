import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect } from "@react-navigation/native";
import { router } from "expo-router";
import React, { useCallback, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    FlatList,
    Image,
    RefreshControl,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import Flecha from "../../components/HeaderFlecha";

const API_URL = "http://192.168.137.173:3000";

type Servico = {
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
  trocaId: number;
  finalizadaEm: string;
  papel: "anunciante" | "solicitante";
  parceiro: {
    id: number;
    nome: string;
    foto: string | null;
  } | null;
};

export default function ServicosRealizados() {
  const [servicos, setServicos] = useState<Servico[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [atualizando, setAtualizando] = useState(false);

  useFocusEffect(
    useCallback(() => {
      carregarServicos();
    }, [])
  );

  async function carregarServicos() {
    try {
      setCarregando(true);
      const usuarioId = await AsyncStorage.getItem("usuarioId");

      if (!usuarioId) {
        Alert.alert("Erro", "Não foi possível identificar o usuário logado.");
        return;
      }

      const resposta = await fetch(
        `${API_URL}/anuncios/servicos-realizados?usuarioId=${usuarioId}`
      );
      const dados = await resposta.json();

      if (resposta.ok) {
        setServicos(dados.servicos as Servico[]);
      } else {
        Alert.alert("Erro", dados.erro || "Não foi possível carregar seu histórico.");
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
    carregarServicos();
  }

  function formatarLocal(item: Servico) {
    if (item.cidade && item.estado) return `${item.cidade} - ${item.estado}`;
    return item.cidade || item.estado || "Localização não informada";
  }

  function formatarData(data: string) {
    const d = new Date(data);
    if (isNaN(d.getTime())) return "";
    return d.toLocaleDateString("pt-BR");
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Flecha></Flecha>
        <View>
          <Text style={styles.headerTitulo}>Serviços realizados</Text>
          {!carregando && servicos.length > 0 && (
            <Text style={styles.headerSub}>
              {servicos.length}{" "}
              {servicos.length === 1 ? "troca concluída" : "trocas concluídas"}
            </Text>
          )}
        </View>
      </View>

      {carregando ? (
        <ActivityIndicator color="#00AFFF" style={{ marginTop: 40 }} size="large" />
      ) : (
        <FlatList
          data={servicos}
          keyExtractor={(item) => String(item.trocaId)}
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
              <Ionicons name="checkmark-done-outline" size={40} color="#444" />
              <Text style={styles.emptyTitulo}>Nenhum serviço realizado</Text>
              <Text style={styles.emptyTexto}>
                Quando uma troca for finalizada, ela vai aparecer aqui.
              </Text>
            </View>
          }
          renderItem={({ item }) => (
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
                  {item.papel === "anunciante" ? "Troca com " : "Anúncio de "}
                  {item.parceiro?.nome ?? "usuário"}
                </Text>
                <Text style={styles.cardInfo} numberOfLines={1}>
                  {formatarLocal(item)}
                </Text>

                <View style={styles.badge}>
                  <Ionicons name="checkmark-circle" size={12} color="#00FF44" />
                  <Text style={styles.badgeTexto}>
                    {item.papel === "solicitante" ? "Você solicitou" : "Você anunciou"}
                    {formatarData(item.finalizadaEm)
                      ? ` • ${formatarData(item.finalizadaEm)}`
                      : ""}
                  </Text>
                </View>
              </View>

              <Ionicons name="chevron-forward" size={20} color="#444" />
            </TouchableOpacity>
          )}
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
  headerSub: {
    color: "#9CA3AF",
    fontSize: 12,
    marginTop: 2,
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
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    marginTop: 6,
    backgroundColor: "#00FF4422",
  },
  badgeTexto: {
    color: "#00FF44",
    fontSize: 11,
    fontWeight: "600",
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