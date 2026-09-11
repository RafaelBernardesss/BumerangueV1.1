import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
  Image,
  ActivityIndicator,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useFocusEffect } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import Header from "../components/HeaderEscolha";

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

// Mock dos serviços do próprio usuário logado, que podem ser oferecidos em troca.
// TODO: substituir por dados reais vindos da API/perfil do usuário.
const MEUS_SERVICOS = [
  { id: "m1", nome: "Edição de Vídeos Curtos" },
  { id: "m2", nome: "Criação de Posts para Instagram" },
  { id: "m3", nome: "Aulas de Inglês Online" },
];

export default function AnuncioScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();

  const [anuncio, setAnuncio] = useState<Anuncio | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState(false);

  const [servicoEscolhido, setServicoEscolhido] = useState<string | null>(null);
  const [propostaTexto, setPropostaTexto] = useState("");
  const [mensagem, setMensagem] = useState("");
  const [enviando, setEnviando] = useState(false);

  useFocusEffect(
    useCallback(() => {
      buscarAnuncio();
    }, [id])
  );

  async function buscarAnuncio() {
    try {
      setCarregando(true);
      setErro(false);

      const resposta = await fetch(`${API_URL}/anuncios/${id}`);
      const dados = await resposta.json();

      if (resposta.ok) {
        setAnuncio(dados.anuncio);
      } else {
        setErro(true);
      }
    } catch (e) {
      console.log(e);
      setErro(true);
    } finally {
      setCarregando(false);
    }
  }

  function formatarLocal(item: Anuncio) {
    if (item.cidade && item.estado) return `${item.cidade} - ${item.estado}`;
    return item.cidade || item.estado || "Localização não informada";
  }

 async function enviarProposta() {
  
  if (!propostaTexto.trim()) {
    Alert.alert("Escreva sua proposta", "Digite os detalhes da sua proposta de troca.");
    return;
  }

  if (!anuncio) return;

  try {
    setEnviando(true);

    const propostoPor = await AsyncStorage.getItem("usuarioId");
    if (!propostoPor) {
      Alert.alert("Sessão expirada", "Faça login novamente.");
      return;
    }

    const resposta = await fetch(`${API_URL}/propostas`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        anuncioId: anuncio.id,
        propostoPor: Number(propostoPor),
        mensagem: propostaTexto.trim(),
      }),
    });

    const dados = await resposta.json();

    if (!resposta.ok) {
      throw new Error(dados.erro || "Não foi possível enviar a proposta.");
    }

    Alert.alert("Proposta enviada", "Sua proposta foi enviada com sucesso!", [
      { text: "OK", onPress: () => router.back() },
    ]);
  } catch (erro: any) {
    Alert.alert("Erro", erro.message || "Não foi possível conectar ao servidor.");
  } finally {
    setEnviando(false);
  }
}

  if (carregando) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Header></Header>
        </View>
        <ActivityIndicator color="#27A7FF" style={{ marginTop: 60 }} size="large" />
      </View>
    );
  }

  if (erro || !anuncio) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Header></Header>
        </View>
        <View style={styles.vazioContainer}>
          <Ionicons name="alert-circle-outline" size={40} color="#444" />
          <Text style={styles.vazioTexto}>Anúncio não encontrado</Text>
          <TouchableOpacity onPress={() => router.back()} style={{ marginTop: 20 }}>
            <Text style={{ color: "#27A7FF" }}>Voltar</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Header></Header>
      </View>

      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 60 }}>
        {/* Banner do anúncio */}
        {anuncio.foto ? (
          <Image
            source={{ uri: `${API_URL}/${anuncio.foto.replace(/\\/g, "/")}` }}
            style={styles.banner}
            resizeMode="cover"
          />
        ) : (
          <View style={styles.banner} />
        )}

        {/* Card do anunciante */}
        <View style={styles.card}>
          {anuncio.usuario.foto ? (
            <Image
              source={{ uri: `${API_URL}/${anuncio.usuario.foto.replace(/\\/g, "/")}` }}
              style={styles.avatar}
            />
          ) : (
            <View style={styles.avatar} />
          )}
          <View style={{ flex: 1 }}>
            <Text style={styles.userName}>{anuncio.usuario.nome}</Text>
            <Text style={styles.info}>{formatarLocal(anuncio)}</Text>
          </View>
        </View>

        {/* Detalhes do serviço */}
        <Text style={styles.servicoTitulo}>{anuncio.titulo}</Text>

        <View style={styles.tagsLinha}>
          <View style={styles.tagInfo}>
            <Ionicons name="pricetag-outline" size={14} color="#27A7FF" />
            <Text style={styles.tagInfoTexto}>{anuncio.categoria.nome}</Text>
          </View>
          {anuncio.disponibilidade && (
            <View style={styles.tagInfo}>
              <Ionicons name="time-outline" size={14} color="#27A7FF" />
              <Text style={styles.tagInfoTexto}>{anuncio.disponibilidade}</Text>
            </View>
          )}
        </View>

        <Text style={styles.descricao}>{anuncio.descricao}</Text>

        <View style={styles.priceBox}>
          <Text style={styles.priceLabel}>Preferência de Troca</Text>
          <Text style={styles.price}>{anuncio.preferencia}</Text>
        </View>

        <Text style={styles.label}>Sua proposta</Text>
        <TextInput
          style={[styles.input, styles.textAreaPequeno]}
          multiline
          numberOfLines={2}
          placeholder="Escreva sua proposta"
          placeholderTextColor="#888"
          value={propostaTexto}
          onChangeText={setPropostaTexto}
        />

        <Text style={styles.label}>Mensagem (opcional)</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          multiline
          numberOfLines={4}
          placeholder="Explique por que sua troca é uma boa proposta..."
          placeholderTextColor="#888"
          value={mensagem}
          onChangeText={setMensagem}
        />

        <TouchableOpacity style={styles.button} onPress={enviarProposta} disabled={enviando}>
          {enviando ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <>
              <Ionicons name="swap-horizontal" size={20} color="#fff" />
              <Text style={styles.buttonText}>ENVIAR PROPOSTA DE TROCA</Text>
            </>
          )}
        </TouchableOpacity>
      </ScrollView>
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

  banner: {
    width: "100%",
    height: 200,
    borderRadius: 16,
    backgroundColor: "#1E1E1E",
    marginBottom: 20,
  },

  card: {
    backgroundColor: "#0D1626",
    borderWidth: 1,
    borderColor: "#1F3C5E",
    borderRadius: 16,
    padding: 15,
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
  },

  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "#333",
    marginRight: 15,
  },

  userName: {
    color: "#fff",
    fontSize: 17,
    fontWeight: "bold",
  },

  info: {
    color: "#9CA3AF",
    marginTop: 5,
  },

  servicoTitulo: {
    color: "#fff",
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 12,
  },

  tagsLinha: {
    flexDirection: "row",
    gap: 15,
    marginBottom: 15,
  },

  tagInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },

  tagInfoTexto: {
    color: "#27A7FF",
    fontSize: 13,
  },

  descricao: {
    color: "#9CA3AF",
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 20,
  },

  priceBox: {
    backgroundColor: "#0D1626",
    borderWidth: 1,
    borderColor: "#1F3C5E",
    borderRadius: 12,
    padding: 15,
    marginBottom: 10,
  },

  priceLabel: {
    color: "#9CA3AF",
    fontSize: 13,
    marginBottom: 4,
  },

  price: {
    color: "#27A7FF",
    fontSize: 22,
    fontWeight: "bold",
  },

  separador: {
    height: 1,
    backgroundColor: "#1F3C5E",
    marginVertical: 25,
  },

  secaoTitulo: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 6,
  },

  secaoSubtitulo: {
    color: "#9CA3AF",
    fontSize: 14,
    marginBottom: 18,
  },

  opcaoServico: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: "#0D1626",
    borderWidth: 1,
    borderColor: "#1F3C5E",
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
  },

  opcaoServicoAtiva: {
    borderColor: "#27A7FF",
  },

  opcaoServicoTexto: {
    color: "#9CA3AF",
    fontSize: 15,
  },

  opcaoServicoTextoAtivo: {
    color: "#fff",
    fontWeight: "600",
  },

  label: {
    color: "#fff",
    fontSize: 16,
    marginBottom: 8,
    marginTop: 20,
  },

  input: {
    backgroundColor: "#0D1626",
    borderWidth: 1,
    borderColor: "#1F3C5E",
    borderRadius: 12,
    padding: 10,
    color: "#fff",
  },

  textArea: {
    height: 100,
    textAlignVertical: "top",
  },

  textAreaPequeno: {
    height: 60,
    textAlignVertical: "top",
  },

  button: {
    backgroundColor: "#27A7FF",
    borderRadius: 12,
    padding: 18,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 25,
    gap: 10,
  },

  buttonText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16,
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