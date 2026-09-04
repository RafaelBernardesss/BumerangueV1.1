import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import { router } from "expo-router";
import React, { useCallback, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Image,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import Header from "../components/HeaderEscolha";

const API_URL = "http://172.30.1.37:3000";

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
  usuario: {
    id: number;
    nome: string;
    foto: string | null;
  };
  categoria: {
    id: number;
    nome: string;
  };
};

type Categoria = {
  id: number;
  nome: string;
};

export default function AnunciosDisponiveis() {
  console.log("TELA DE ANUNCIO MONTADA");
  const [categoriaAtiva, setCategoriaAtiva] = useState<number | "Todos">("Todos");
  const [busca, setBusca] = useState("");

  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [anuncios, setAnuncios] = useState<Anuncio[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [atualizando, setAtualizando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  const carregarAnuncios = useCallback(async () => {
    try {
      // Só traz os anúncios prontos pra troca (status "ativo")
      const resposta = await fetch(`${API_URL}/anuncios?status=ativo`);
      const dados = await resposta.json();

      if (!resposta.ok) {
        throw new Error(dados.erro || "Não foi possível carregar os anúncios.");
      }

      setAnuncios(Array.isArray(dados.anuncios) ? dados.anuncios : []);
    } catch (erro) {
      console.log("Erro ao buscar anúncios:", erro);
      setAnuncios([]);
      setErro("Não foi possível carregar os anúncios. Tente novamente.");
    }
  }, []);

  const carregarCategorias = useCallback(async () => {
    try {
      const resposta = await fetch(`${API_URL}/categorias`);
      const dados = await resposta.json();

      if (resposta.ok) {
        setCategorias(Array.isArray(dados.categorias) ? dados.categorias : []);
      }
    } catch (erro) {
      console.log(erro);
    }
  }, []);

  const carregarDados = useCallback(async () => {
    try {
      setCarregando(true);
      setErro(null);
      await Promise.all([carregarAnuncios(), carregarCategorias()]);
    } finally {
      setCarregando(false);
    }
  }, [carregarAnuncios, carregarCategorias]);

  useFocusEffect(
    useCallback(() => {
      carregarDados();
    }, [carregarDados])
  );

  async function aoAtualizar() {
    setAtualizando(true);
    await carregarDados();
    setAtualizando(false);
  }

  const anunciosFiltrados = anuncios.filter((item) => {
    const bateCategoria =
      categoriaAtiva === "Todos" || item.categoria.id === categoriaAtiva;

    const termo = busca.toLowerCase();
    const bateBusca =
      item.titulo.toLowerCase().includes(termo) ||
      item.usuario.nome.toLowerCase().includes(termo);

    return bateCategoria && bateBusca;
  });

  function formatarLocal(item: Anuncio) {
    if (item.cidade && item.estado) return `${item.cidade} - ${item.estado}`;
    return item.cidade || item.estado || "Localização não informada";
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Header></Header>
      </View>

      <FlatList
        data={anunciosFiltrados}
        keyExtractor={(item) => String(item.id)}
        refreshControl={
          <RefreshControl
            refreshing={atualizando}
            onRefresh={aoAtualizar}
            tintColor="#00AFFF"
          />
        }
        ListHeaderComponent={
          <>
            <View style={styles.titleContainer}>
              <Text style={styles.title}>Serviços disponíveis</Text>
              <Text style={styles.subtitle}>
                Encontre profissionais para o que você precisa.
              </Text>
            </View>

            <View style={styles.searchBox}>
              <Ionicons name="search-outline" size={20} color="#888" />
              <TextInput
                style={styles.searchInput}
                placeholder="Buscar serviço ou profissional..."
                placeholderTextColor="#888"
                value={busca}
                onChangeText={setBusca}
              />
            </View>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.categoriasScroll}
              contentContainerStyle={styles.categoriasContainer}
            >
              <TouchableOpacity
                style={[
                  styles.categoriaTag,
                  categoriaAtiva === "Todos" && styles.categoriaTagAtiva,
                ]}
                onPress={() => setCategoriaAtiva("Todos")}
              >
                <Text
                  style={[
                    styles.categoriaTagText,
                    categoriaAtiva === "Todos" && styles.categoriaTagTextAtiva,
                  ]}
                >
                  Todos
                </Text>
              </TouchableOpacity>

              {categorias.map((cat) => {
                const ativa = cat.id === categoriaAtiva;
                return (
                  <TouchableOpacity
                    key={cat.id}
                    style={[styles.categoriaTag, ativa && styles.categoriaTagAtiva]}
                    onPress={() => setCategoriaAtiva(cat.id)}
                  >
                    <Text
                      style={[
                        styles.categoriaTagText,
                        ativa && styles.categoriaTagTextAtiva,
                      ]}
                    >
                      {cat.nome}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            {carregando ? (
              <ActivityIndicator color="#00AFFF" style={{ marginTop: 30 }} />
            ) : erro ? (
              <Text style={styles.erro}>{erro}</Text>
            ) : (
              <Text style={styles.resultados}>
                {anunciosFiltrados.length} serviço(s) encontrado(s)
              </Text>
            )}
          </>
        }
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.card}
            onPress={() =>
              router.push({ pathname: "/AnuncioScreen", params: { id: String(item.id) } })
            }
          >
            {item.usuario.foto ? (
              <Image
                source={{ uri: `${API_URL}/${item.usuario.foto.replace(/\\/g, "/")}` }}
                style={styles.avatar}
              />
            ) : (
              <View style={styles.avatar} />
            )}

            <View style={{ flex: 1 }}>
              <Text style={styles.userName}>{item.usuario.nome}</Text>

              <Text style={styles.serviceTitle}>{item.titulo}</Text>

              <View style={styles.categoriaChip}>
                <Text style={styles.categoriaChipText}>{item.categoria.nome}</Text>
              </View>

              <Text style={styles.info}>
                {item.disponibilidade ? `${item.disponibilidade} • ` : ""}
                {formatarLocal(item)}
              </Text>

              <Text style={styles.preferencia}>Troca por: {item.preferencia}</Text>
            </View>
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          !carregando && !erro ? (
            <View style={styles.vazioContainer}>
              <Ionicons name="search-outline" size={40} color="#444" />
              <Text style={styles.vazioTexto}>Nenhum serviço encontrado</Text>
            </View>
          ) : null
        }
        contentContainerStyle={{ padding: 20, paddingBottom: 40 }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0B0B0B",
  },

  header: {
    marginTop: 40,
    paddingHorizontal: 20,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  titleContainer: {
    alignItems: "center",
    marginVertical: 30,
  },

  title: {
    color: "#fff",
    fontSize: 32,
    fontWeight: "bold",
  },

  subtitle: {
    color: "#9CA3AF",
    marginTop: 8,
    textAlign: "center",
  },

  searchBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#0D1626",
    borderWidth: 1,
    borderColor: "#1F3C5E",
    borderRadius: 12,
    paddingHorizontal: 15,
    paddingVertical: 12,
    gap: 10,
  },

  searchInput: {
    flex: 1,
    color: "#fff",
    fontSize: 15,
  },

  categoriasScroll: {
    marginTop: 20,
  },

  categoriasContainer: {
    gap: 10,
    paddingRight: 20,
  },

  categoriaTag: {
    borderWidth: 1,
    borderColor: "#00AFFF",
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 18,
  },

  categoriaTagAtiva: {
    backgroundColor: "#00AFFF",
  },

  categoriaTagText: {
    color: "#00AFFF",
  },

  categoriaTagTextAtiva: {
    color: "#fff",
    fontWeight: "bold",
  },

  resultados: {
    color: "#9CA3AF",
    marginTop: 20,
    marginBottom: 10,
  },

  erro: {
    color: "#FF6B6B",
    textAlign: "center",
    marginTop: 20,
    marginBottom: 10,
  },

  card: {
    backgroundColor: "#0D1626",
    borderWidth: 1,
    borderColor: "#1F3C5E",
    borderRadius: 16,
    padding: 15,
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 15,
  },

  avatar: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: "#333",
    marginRight: 15,
  },

  userName: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
  },

  serviceTitle: {
    color: "#00AFFF",
    fontSize: 16,
    fontWeight: "bold",
    marginTop: 4,
  },

  categoriaChip: {
    alignSelf: "flex-start",
    backgroundColor: "#161D2E",
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
    marginTop: 6,
  },

  categoriaChipText: {
    color: "#9CA3AF",
    fontSize: 11,
  },

  info: {
    color: "#9CA3AF",
    marginTop: 6,
  },

  preferencia: {
    color: "#666",
    fontSize: 12,
    marginTop: 4,
  },

  vazioContainer: {
    alignItems: "center",
    marginTop: 60,
    gap: 10,
  },

  vazioTexto: {
    color: "#666",
    fontSize: 16,
  },
});