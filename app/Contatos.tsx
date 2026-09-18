import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect } from "@react-navigation/native";
import { useRouter } from "expo-router";
import React, { useCallback, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Image,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import Header from "../components/Hearder";

const API_URL = "http://172.30.1.72:3000";

type Contato = {
  id: number;
  anuncioId: number;
  nome: string;
  foto: string | null;
  online: boolean;
  ultimaMensagem: string | null;
  horaUltimaMensagem: string | null;
  naoLidas: number;
};

// Monta a URL completa da foto a partir do caminho relativo salvo no banco
function urlFoto(caminho: string | null) {
  if (!caminho) return null;
  return `${API_URL}/${caminho.replace(/\\/g, "/")}`;
}

export default function Contatos() {
  const router = useRouter();

  const [contatos, setContatos] = useState<Contato[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [busca, setBusca] = useState("");

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
            console.log("CONTATOS RECEBIDOS:", dados.contatos); // TEMP - remover depois
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

  const contatosFiltrados = contatos.filter((c) =>
    c.nome.toLowerCase().includes(busca.toLowerCase())
  );

  function renderIniciais(nome: string) {
    return nome
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((n) => n[0]?.toUpperCase())
      .join("");
  }

  function abrirChat(item: Contato) {
    if (!item.anuncioId) {
      console.warn(
        "Contato sem anuncioId — verifique o backend /usuarios/:id/contatos",
        item
      );
      return;
    }

    router.push({
      pathname: "/Chat",
      params: {
        id: String(item.id),
        anuncioId: String(item.anuncioId),
        nome: item.nome,
        foto: item.foto ?? "",
      },
    });
  }

  return (
    <View style={styles.container}>
      {/* CABEÇALHO */}
      <View style={styles.headerRow}>
        <Header></Header>
      </View>

      {/* TÍTULO */}
      <View style={styles.titleContainer}>
        <Text style={styles.title}>Contatos</Text>
        <Text style={styles.subtitle}>
          Converse com quem já negociou serviços com você.
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

      {/* LISTA DE CONTATOS */}
      {carregando ? (
        <View style={styles.emptyState}>
          <ActivityIndicator color="#00AFFF" />
          <Text style={styles.emptyText}>Carregando seus contatos...</Text>
        </View>
      ) : contatosFiltrados.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="people-outline" size={32} color="#444" />
          <Text style={styles.emptyText}>
            {busca
              ? "Nenhum contato encontrado"
              : "Você ainda não tem contatos"}
          </Text>
        </View>
      ) : (
        <FlatList
          data={contatosFiltrados}
          keyExtractor={(item) => item.id.toString()}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 100 }}
          renderItem={({ item }) => {
            const foto = urlFoto(item.foto);

            return (
              <TouchableOpacity
                style={styles.contactCard}
                activeOpacity={0.8}
                onPress={() => abrirChat(item)}
              >
                <View style={styles.avatarWrapper}>
                  {foto ? (
                    <Image source={{ uri: foto }} style={styles.avatar} />
                  ) : (
                    <View style={styles.avatarPlaceholder}>
                      <Text style={styles.avatarPlaceholderText}>
                        {renderIniciais(item.nome) || "?"}
                      </Text>
                    </View>
                  )}
                  {item.online && <View style={styles.online} />}
                </View>

                <View style={styles.contactInfo}>
                  <View style={styles.contactTopRow}>
                    <Text style={styles.contactName} numberOfLines={1}>
                      {item.nome}
                    </Text>
                    {item.horaUltimaMensagem && (
                      <Text style={styles.contactTime}>
                        {item.horaUltimaMensagem}
                      </Text>
                    )}
                  </View>
                  <Text style={styles.contactMessage} numberOfLines={1}>
                    {item.ultimaMensagem || "Diga olá e comece a negociar!"}
                  </Text>
                </View>

                {item.naoLidas > 0 && (
                  <View style={styles.badge}>
                    <Text style={styles.badgeText}>{item.naoLidas}</Text>
                  </View>
                )}
              </TouchableOpacity>
            );
          }}
        />
      )}

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
    marginBottom: 10,
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
  },
  input: {
    flex: 1,
    color: "#fff",
    marginLeft: 10,
  },
  contactCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#0D1324",
    borderRadius: 18,
    padding: 14,
    marginTop: 12,
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
  contactInfo: {
    flex: 1,
    marginLeft: 14,
  },
  contactTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  contactName: {
    color: "#fff",
    fontSize: 17,
    fontWeight: "600",
    flexShrink: 1,
    marginRight: 8,
  },
  contactTime: {
    color: "#666",
    fontSize: 12,
  },
  contactMessage: {
    color: "#888",
    marginTop: 4,
    fontSize: 14,
  },
  badge: {
    backgroundColor: "#00AFFF",
    minWidth: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 6,
    marginLeft: 8,
  },
  badgeText: {
    color: "#000",
    fontSize: 12,
    fontWeight: "bold",
  },
  emptyState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
    gap: 10,
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