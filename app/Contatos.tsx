import React, { useCallback, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  TextInput,
} from "react-native";
import { useRouter } from "expo-router";
import { useFocusEffect } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Ionicons } from "@expo/vector-icons";
import Header from "../components/Hearder";


const API_URL = "http://192.168.137.138:3000";

type Contato = {
  id: number;
  nome: string;
  foto: string | null;
  ultimaMensagem: string | null;
  horaUltimaMensagem: string | null;
  naoLidas: number;
  online: boolean;
  favorito: boolean;
};

// Monta a URL completa da foto a partir do caminho relativo salvo no banco
function urlFoto(caminho: string | null) {
  if (!caminho) return null;
  return `${API_URL}/${caminho.replace(/\\/g, "/")}`;
}

type Filtro = "todos" | "favoritos" | "naoLidos";

export default function Contatos() {
  const router = useRouter();

  const [busca, setBusca] = useState("");
  const [filtro, setFiltro] = useState<Filtro>("todos");
  const [contatos, setContatos] = useState<Contato[]>([]);
  const [carregando, setCarregando] = useState(true);

  // GET /contatos (ou /usuarios/:id/contatos, ajuste conforme a rota real do backend)
  useFocusEffect(
    useCallback(() => {
      async function buscarContatos() {
        try {
          setCarregando(true);

          const id = await AsyncStorage.getItem("usuarioId");
          if (!id) return;

          const resposta = await fetch(`${API_URL}/usuarios/${id}/contatos`);
          const dados = await resposta.json();

          if (resposta.ok) {
            setContatos(dados.contatos || []);
          } else {
            console.log(dados.erro);
          }
        } catch (erro) {
          console.log(erro);
        } finally {
          setCarregando(false);
        }
      }

      buscarContatos();
    }, [])
  );

  const contatosFiltrados = contatos
    .filter((c) => c.nome.toLowerCase().includes(busca.toLowerCase()))
    .filter((c) => {
      if (filtro === "favoritos") return c.favorito;
      if (filtro === "naoLidos") return c.naoLidas > 0;
      return true;
    });

  // Iniciais pra usar como fallback quando não há foto
  function iniciaisDe(nome: string) {
    return nome
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((n) => n[0]?.toUpperCase())
      .join("");
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
          <Text style={styles.title}>Contatos</Text>
          <Text style={styles.subtitle}>
            Converse com quem já trocou serviços com você.
          </Text>
        </View>

        {/* BUSCA */}
        <View style={styles.searchRow}>
          <View style={styles.searchBox}>
            <Ionicons name="search" size={20} color="#666" />
            <TextInput
              style={styles.input}
              placeholder="Buscar contato..."
              placeholderTextColor="#666"
              value={busca}
              onChangeText={setBusca}
            />
          </View>
        </View>

        {/* FILTROS */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.filtrosRow}
          contentContainerStyle={{ paddingHorizontal: 20, gap: 10 }}
        >
          <TouchableOpacity
            style={[styles.filtroChip, filtro === "todos" && styles.filtroChipAtivo]}
            onPress={() => setFiltro("todos")}
          >
            <Text
              style={[
                styles.filtroText,
                filtro === "todos" && styles.filtroTextAtivo,
              ]}
            >
              Todos
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.filtroChip,
              filtro === "naoLidos" && styles.filtroChipAtivo,
            ]}
            onPress={() => setFiltro("naoLidos")}
          >
            <Text
              style={[
                styles.filtroText,
                filtro === "naoLidos" && styles.filtroTextAtivo,
              ]}
            >
              Não lidos
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.filtroChip,
              filtro === "favoritos" && styles.filtroChipAtivo,
            ]}
            onPress={() => setFiltro("favoritos")}
          >
            <Text
              style={[
                styles.filtroText,
                filtro === "favoritos" && styles.filtroTextAtivo,
              ]}
            >
              Favoritos
            </Text>
          </TouchableOpacity>
        </ScrollView>

        {/* LISTA DE CONTATOS */}
        <View style={styles.listContainer}>
          {carregando ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>Carregando contatos...</Text>
            </View>
          ) : contatosFiltrados.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="people-outline" size={32} color="#444" />
              <Text style={styles.emptyText}>Nenhum contato encontrado</Text>
            </View>
          ) : (
            contatosFiltrados.map((item) => {
              const foto = urlFoto(item.foto);

              return (
                <TouchableOpacity
                  key={item.id}
                  style={styles.contatoCard}
                  activeOpacity={0.8}
                  onPress={() => router.push(`/Chat?id=${item.id}`)}
                >
                  <View style={styles.avatarWrapper}>
                    {foto ? (
                      <Image source={{ uri: foto }} style={styles.avatar} />
                    ) : (
                      <View style={styles.avatarPlaceholder}>
                        <Text style={styles.avatarPlaceholderText}>
                          {iniciaisDe(item.nome) || "?"}
                        </Text>
                      </View>
                    )}
                    {item.online && <View style={styles.online} />}
                  </View>

                  <View style={styles.contatoInfo}>
                    <View style={styles.contatoTopRow}>
                      <Text style={styles.contatoNome} numberOfLines={1}>
                        {item.nome}
                      </Text>
                      {item.horaUltimaMensagem && (
                        <Text style={styles.contatoHora}>
                          {item.horaUltimaMensagem}
                        </Text>
                      )}
                    </View>

                    <View style={styles.contatoBottomRow}>
                      <Text
                        style={[
                          styles.contatoMensagem,
                          item.naoLidas > 0 && styles.contatoMensagemNaoLida,
                        ]}
                        numberOfLines={1}
                      >
                        {item.ultimaMensagem || "Diga olá e comece a conversar"}
                      </Text>

                      {item.naoLidas > 0 && (
                        <View style={styles.badge}>
                          <Text style={styles.badgeText}>
                            {item.naoLidas > 9 ? "9+" : item.naoLidas}
                          </Text>
                        </View>
                      )}

                      {item.favorito && (
                        <Ionicons
                          name="star"
                          size={16}
                          color="#FFB800"
                          style={{ marginLeft: 6 }}
                        />
                      )}
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

        <TouchableOpacity onPress={() => router.push("/Chat")}>
          <Ionicons name="chatbubble" size={30} color="#00AFFF" />
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
  searchRow: {
    flexDirection: "row",
    paddingHorizontal: 20,
    marginTop: 20,
    gap: 10,
  },
  searchBox: {
    flex: 1,
    height: 60,
    borderWidth: 1,
    borderColor: "#222",
    borderRadius: 15,
    paddingHorizontal: 15,
    alignItems: "center",
    flexDirection: "row",
    backgroundColor: "#0D1324",
  },
  input: {
    flex: 1,
    color: "#fff",
    marginLeft: 10,
  },
  filtrosRow: {
    marginTop: 20,
  },
  filtroChip: {
    borderWidth: 1,
    borderColor: "#222",
    borderRadius: 20,
    paddingVertical: 10,
    paddingHorizontal: 18,
    backgroundColor: "#0D1324",
  },
  filtroChipAtivo: {
    backgroundColor: "#00AFFF",
    borderColor: "#00AFFF",
  },
  filtroText: {
    color: "#999",
    fontWeight: "600",
  },
  filtroTextAtivo: {
    color: "#000",
  },
  listContainer: {
    marginTop: 25,
    paddingHorizontal: 20,
    gap: 12,
  },
  contatoCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#0D1324",
    borderRadius: 18,
    padding: 14,
    borderWidth: 1,
    borderColor: "#161D2E",
  },
  avatarWrapper: {
    width: 56,
    height: 56,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
  },
  avatarPlaceholder: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#1E293B",
    justifyContent: "center",
    alignItems: "center",
  },
  avatarPlaceholderText: {
    color: "#00AFFF",
    fontSize: 18,
    fontWeight: "700",
  },
  online: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: "#00FF44",
    position: "absolute",
    bottom: 0,
    right: 0,
    borderWidth: 2,
    borderColor: "#0D1324",
  },
  contatoInfo: {
    flex: 1,
    marginLeft: 14,
  },
  contatoTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  contatoNome: {
    color: "#fff",
    fontSize: 17,
    fontWeight: "600",
    flex: 1,
    marginRight: 8,
  },
  contatoHora: {
    color: "#666",
    fontSize: 12,
  },
  contatoBottomRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 6,
  },
  contatoMensagem: {
    color: "#888",
    fontSize: 14,
    flex: 1,
  },
  contatoMensagemNaoLida: {
    color: "#ccc",
    fontWeight: "600",
  },
  badge: {
    backgroundColor: "#00AFFF",
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    paddingHorizontal: 5,
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 8,
  },
  badgeText: {
    color: "#000",
    fontSize: 11,
    fontWeight: "bold",
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
  },
  emptyText: {
    color: "#555",
    marginTop: 10,
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