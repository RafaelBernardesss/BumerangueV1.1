import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";

const API_URL = "http://172.30.0.226:3000";

type Usuario = {
  id: number;
  nome: string;
  cpf: string;
  email: string;
};

type Categoria = {
  id: number;
  nome: string;
};

export default function Admin() {
  const router = useRouter();

  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [atualizando, setAtualizando] = useState(false);

  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [carregandoCategorias, setCarregandoCategorias] = useState(true);
  const [novaCategoria, setNovaCategoria] = useState("");
  const [criandoCategoria, setCriandoCategoria] = useState(false);

  async function buscarUsuarios() {
    try {
      const response = await fetch(
        "http://172.30.1.33:3000/usuarios/listar"
      );
      const data = await response.json();

      if (response.ok) {
        setUsuarios(data.usuarios);
      } else {
        Alert.alert("Erro", "Não foi possível carregar os usuários.");
      }
    } catch (error) {
      console.log(error);
      Alert.alert("Erro", "Não foi possível conectar ao servidor.");
    } finally {
      setCarregando(false);
      setAtualizando(false);
    }
  }

  const buscarCategorias = useCallback(async () => {
    try {
      setCarregandoCategorias(true);
      const resposta = await fetch(`${API_URL}/categorias`);
      const dados = await resposta.json();

      if (resposta.ok) {
        setCategorias(dados.categorias);
      }
    } catch (erro) {
      console.log(erro);
    } finally {
      setCarregandoCategorias(false);
    }
  }, []);

  useEffect(() => {
    buscarUsuarios();
    buscarCategorias();
  }, [buscarCategorias]);

  function confirmarExclusao(id: number, nome: string) {
    Alert.alert(
      "Remover conta",
      `Tem certeza que deseja remover a conta de ${nome}?`,
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Remover",
          style: "destructive",
          onPress: () => deletarUsuario(id),
        },
      ]
    );
  }

  async function deletarUsuario(id: number) {
    try {
      const response = await fetch(
        `http://172.30.1.33:3000/usuarios/deletar/${id}`,
        { method: "DELETE" }
      );

      if (response.ok) {
        setUsuarios((prev) => prev.filter((u) => u.id !== id));
      } else {
        Alert.alert("Erro", "Não foi possível remover essa conta.");
      }
    } catch (error) {
      console.log(error);
      Alert.alert("Erro", "Não foi possível conectar ao servidor.");
    }
  }

  async function adicionarCategoria() {
    if (!novaCategoria.trim() || novaCategoria.trim().length < 2) {
      Alert.alert("Nome inválido", "Digite um nome com pelo menos 2 caracteres.");
      return;
    }

    try {
      setCriandoCategoria(true);
      const resposta = await fetch(`${API_URL}/categorias`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nome: novaCategoria.trim() }),
      });

      const dados = await resposta.json();

      if (!resposta.ok) {
        throw new Error(dados.erro || "Não foi possível criar a categoria.");
      }

      setCategorias((prev) =>
        [...prev, dados.categoria].sort((a, b) => a.nome.localeCompare(b.nome))
      );
      setNovaCategoria("");
    } catch (erro: any) {
      Alert.alert("Erro", erro.message || "Não foi possível conectar ao servidor.");
    } finally {
      setCriandoCategoria(false);
    }
  }

  function confirmarExclusaoCategoria(id: number, nome: string) {
    Alert.alert(
      "Remover categoria",
      `Tem certeza que deseja remover "${nome}"?`,
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Remover",
          style: "destructive",
          onPress: () => deletarCategoria(id),
        },
      ]
    );
  }

  async function deletarCategoria(id: number) {
    try {
      const resposta = await fetch(`${API_URL}/categorias/${id}`, {
        method: "DELETE",
      });

      const dados = await resposta.json();

      if (!resposta.ok) {
        throw new Error(dados.erro || "Não foi possível remover essa categoria.");
      }

      setCategorias((prev) => prev.filter((c) => c.id !== id));
    } catch (erro: any) {
      Alert.alert("Erro", erro.message || "Não foi possível conectar ao servidor.");
    }
  }

  function onRefresh() {
    setAtualizando(true);
    buscarUsuarios();
    buscarCategorias();
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.push("/menu")}>
          <Ionicons name="arrow-back" size={26} color="#00AFFF" />
        </TouchableOpacity>

        <Text style={styles.titulo}>Gerenciar Contas</Text>
      </View>

      {carregando ? (
        <ActivityIndicator
          size="large"
          color="#00AFFF"
          style={{ marginTop: 40 }}
        />
      ) : (
        <FlatList
          data={usuarios}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={styles.lista}
          refreshControl={
            <RefreshControl
              refreshing={atualizando}
              onRefresh={onRefresh}
              tintColor="#00AFFF"
            />
          }
          ListHeaderComponent={
            <View style={styles.secaoCategorias}>
              <Text style={styles.subtitulo}>Categorias</Text>

              <View style={styles.novaCategoriaRow}>
                <TextInput
                  style={styles.inputCategoria}
                  placeholder="Nome da categoria"
                  placeholderTextColor="#666"
                  value={novaCategoria}
                  onChangeText={setNovaCategoria}
                  onSubmitEditing={adicionarCategoria}
                />
                <TouchableOpacity
                  style={styles.botaoAdicionar}
                  onPress={adicionarCategoria}
                  disabled={criandoCategoria}
                >
                  {criandoCategoria ? (
                    <ActivityIndicator color="#000" size="small" />
                  ) : (
                    <Ionicons name="add" size={24} color="#000" />
                  )}
                </TouchableOpacity>
              </View>

              {carregandoCategorias ? (
                <ActivityIndicator color="#00AFFF" style={{ marginTop: 16 }} />
              ) : categorias.length === 0 ? (
                <Text style={styles.vazioCategoria}>
                  Nenhuma categoria cadastrada ainda.
                </Text>
              ) : (
                <View style={styles.categoriasContainer}>
                  {categorias.map((categoria) => (
                    <View key={categoria.id} style={styles.categoriaChip}>
                      <Text style={styles.categoriaChipTexto}>{categoria.nome}</Text>
                      <TouchableOpacity
                        onPress={() =>
                          confirmarExclusaoCategoria(categoria.id, categoria.nome)
                        }
                        hitSlop={8}
                      >
                        <Ionicons name="close-circle" size={18} color="#FF6B6B" />
                      </TouchableOpacity>
                    </View>
                  ))}
                </View>
              )}

              <Text style={[styles.subtitulo, { marginTop: 28 }]}>Contas</Text>
            </View>
          }
          ListEmptyComponent={
            <Text style={styles.vazio}>Nenhuma conta encontrada.</Text>
          }
          renderItem={({ item }) => (
            <View style={styles.card}>
              <View style={{ flex: 1 }}>
                <Text style={styles.nome}>{item.nome}</Text>
                <Text style={styles.detalhe}>CPF: {item.cpf}</Text>
                <Text style={styles.detalhe}>Email: {item.email}</Text>
              </View>

              <TouchableOpacity
                style={styles.botaoDeletar}
                onPress={() => confirmarExclusao(item.id, item.nome)}
              >
                <Ionicons name="trash-outline" size={22} color="#fff" />
              </TouchableOpacity>
            </View>
          )}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0B0B0B",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 16,
    gap: 14,
  },
  titulo: {
    color: "#FFFFFF",
    fontSize: 22,
    fontWeight: "700",
  },
  subtitulo: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 12,
  },
  lista: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  secaoCategorias: {
    marginBottom: 8,
  },
  novaCategoriaRow: {
    flexDirection: "row",
    gap: 10,
  },
  inputCategoria: {
    flex: 1,
    backgroundColor: "#1E1E1E",
    borderWidth: 1,
    borderColor: "#2A2A2A",
    borderRadius: 12,
    paddingHorizontal: 14,
    height: 46,
    color: "#FFFFFF",
  },
  botaoAdicionar: {
    width: 46,
    height: 46,
    borderRadius: 12,
    backgroundColor: "#00AFFF",
    justifyContent: "center",
    alignItems: "center",
  },
  vazioCategoria: {
    color: "#666",
    marginTop: 14,
  },
  categoriasContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 14,
  },
  categoriaChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#1E1E1E",
    borderWidth: 1,
    borderColor: "#2A2A2A",
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  categoriaChipTexto: {
    color: "#FFFFFF",
    fontSize: 13,
  },
  vazio: {
    color: "#888",
    textAlign: "center",
    marginTop: 40,
  },
  card: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1E1E1E",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#2A2A2A",
    padding: 16,
    marginBottom: 12,
  },
  nome: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 4,
  },
  detalhe: {
    color: "#A1A1AA",
    fontSize: 13,
  },
  botaoDeletar: {
    backgroundColor: "#FF3B3B",
    padding: 10,
    borderRadius: 10,
    marginLeft: 12,
  },
});