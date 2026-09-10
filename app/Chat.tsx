import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  Platform,
  Image,
  KeyboardAvoidingView,
  Keyboard,
  TouchableWithoutFeedback,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";

const API_URL = "http://172.30.0.226:3000"; // mesmo IP usado na tela de Contatos

type Mensagem = {
  id: number;
  texto: string;
  minha: boolean;
  hora: string;
};

type OutroUsuario = {
  id: number;
  nome: string;
  foto: string | null;
};

// Monta a URL completa da foto a partir do caminho relativo salvo no banco
function urlFoto(caminho: string | null) {
  if (!caminho) return null;
  return `${API_URL}/${caminho.replace(/\\/g, "/")}`;
}

function iniciaisDe(nome: string) {
  return nome
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((n) => n[0]?.toUpperCase())
    .join("");
}

export default function Chat() {
  const router = useRouter();
  const params = useLocalSearchParams();

  const outroUsuarioId = params.id; // id da pessoa com quem estou conversando

  const [meuUsuarioId, setMeuUsuarioId] = useState<number | null>(null);
  const [outroUsuario, setOutroUsuario] = useState<OutroUsuario | null>(null);
  const [texto, setTexto] = useState("");
  const [mensagens, setMensagens] = useState<Mensagem[]>([]);
  const flatListRef = useRef<FlatList>(null);

  // Passo A: buscar o usuário logado no AsyncStorage
  // (mesma chave "usuarioId" usada na tela de Contatos)
  useEffect(() => {
    async function carregarUsuarioLogado() {
      try {
        const id = await AsyncStorage.getItem("usuarioId");
        if (id) setMeuUsuarioId(Number(id));
      } catch (erro) {
        console.error("Erro ao carregar usuário logado:", erro);
      }
    }

    carregarUsuarioLogado();
  }, []);

  // Passo A2: buscar os dados reais do contato (nome, foto) pelo outroUsuarioId
  useEffect(() => {
    async function carregarOutroUsuario() {
      try {
        const resposta = await fetch(`${API_URL}/usuarios/${outroUsuarioId}`);
        const dados = await resposta.json();
        setOutroUsuario(dados.usuario); // o backend devolve { usuario: {...} }
      } catch (erro) {
        console.error("Erro ao carregar dados do contato:", erro);
      }
    }

    if (outroUsuarioId) carregarOutroUsuario();
  }, [outroUsuarioId]);

  // Passo B: buscar a conversa, só depois que soubermos quem sou eu
  useEffect(() => {
    if (!meuUsuarioId) return; // espera o AsyncStorage carregar

    async function carregarMensagens() {
      try {
        const resposta = await fetch(
          `${API_URL}/mensagens/${meuUsuarioId}/${outroUsuarioId}`
        );
        const dados = await resposta.json();

        const formatadas: Mensagem[] = dados.map((m: any) => ({
          id: m.id,
          texto: m.conteudo,
          minha: m.remetenteId === meuUsuarioId,
          hora: new Date(m.data_hora).toLocaleTimeString("pt-BR", {
            hour: "2-digit",
            minute: "2-digit",
          }),
        }));

        setMensagens(formatadas);

        setTimeout(() => {
          flatListRef.current?.scrollToEnd({ animated: false });
        }, 100);
      } catch (erro) {
        console.error("Erro ao carregar mensagens:", erro);
      }
    }

    carregarMensagens();
  }, [meuUsuarioId, outroUsuarioId]);

  // Passo C: enviar mensagem
  async function enviarMensagem() {
    if (!texto.trim() || !meuUsuarioId) return;

    const conteudo = texto.trim();
    setTexto("");

    try {
      const resposta = await fetch(`${API_URL}/mensagens`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          conteudo,
          remetenteId: meuUsuarioId,
          destinatarioId: Number(outroUsuarioId),
        }),
      });

      const mensagemCriada = await resposta.json();

      const novaMensagem: Mensagem = {
        id: mensagemCriada.id,
        texto: mensagemCriada.conteudo,
        minha: true,
        hora: new Date(mensagemCriada.data_hora).toLocaleTimeString("pt-BR", {
          hour: "2-digit",
          minute: "2-digit",
        }),
      };

      setMensagens((mensagensAtuais) => [...mensagensAtuais, novaMensagem]);

      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    } catch (erro) {
      console.error("Erro ao enviar mensagem:", erro);
    }
  }

  function renderMensagem({ item }: { item: Mensagem }) {
    return (
      <View
        style={[
          styles.mensagemContainer,
          item.minha
            ? styles.mensagemMinhaContainer
            : styles.mensagemOutraContainer,
        ]}
      >
        <View
          style={[
            styles.mensagem,
            item.minha ? styles.mensagemMinha : styles.mensagemOutra,
          ]}
        >
          <Text style={styles.mensagemTexto}>{item.texto}</Text>
          <Text style={styles.hora}>{item.hora}</Text>
        </View>
      </View>
    );
  }

  const fotoContato = urlFoto(outroUsuario?.foto ?? null);

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior="padding"
      keyboardVerticalOffset={85}
    >
      <TouchableWithoutFeedback onPress={() => Keyboard.dismiss()}>
        <View style={styles.inner}>
          {/* CABEÇALHO */}
          <View style={styles.header}>
            <TouchableOpacity
              style={styles.botaoVoltar}
              onPress={() => router.back()}
            >
              <Ionicons name="arrow-back" size={26} color="#fff" />
            </TouchableOpacity>

            <View style={styles.avatarContainer}>
              {fotoContato ? (
                <Image source={{ uri: fotoContato }} style={styles.avatar} />
              ) : (
                <View style={styles.avatar}>
                  <Text style={styles.avatarTexto}>
                    {outroUsuario?.nome ? iniciaisDe(outroUsuario.nome) : "?"}
                  </Text>
                </View>
              )}
              <View style={styles.online} />
            </View>

            <View style={styles.infoUsuario}>
              <Text style={styles.nomeUsuario}>
                {outroUsuario?.nome || "Carregando..."}
              </Text>
              <Text style={styles.status}>online</Text>
            </View>

            <TouchableOpacity style={styles.menuButton}>
              <Ionicons name="ellipsis-vertical" size={24} color="#fff" />
            </TouchableOpacity>
          </View>

          {/* ÁREA DAS MENSAGENS */}
          <FlatList
            style={styles.flatList}
            ref={flatListRef}
            data={mensagens}
            renderItem={renderMensagem}
            keyExtractor={(item) => item.id.toString()}
            contentContainerStyle={[
              styles.listaMensagens,
              { paddingBottom: 110 },
            ]}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
            onContentSizeChange={() =>
              flatListRef.current?.scrollToEnd({ animated: false })
            }
          />

          {/* ÁREA DE DIGITAÇÃO */}
          <View style={styles.inputArea}>
            <TouchableOpacity style={styles.anexo}>
              <Ionicons name="add-circle-outline" size={27} color="#00AFFF" />
            </TouchableOpacity>

            <View style={styles.inputContainer}>
              <TextInput
                style={styles.input}
                placeholder="Digite uma mensagem..."
                placeholderTextColor="#666"
                value={texto}
                onChangeText={setTexto}
                multiline
              />
            </View>

            <TouchableOpacity style={styles.enviar} onPress={enviarMensagem}>
              <Ionicons name="send" size={21} color="#000" />
            </TouchableOpacity>
          </View>
        </View>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#050B18",
  },

  inner: {
    flex: 1,
    backgroundColor: "#050B18",
  },

  header: {
    height: 85,
    paddingTop: 35,
    paddingHorizontal: 15,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#0D1324",
    borderBottomWidth: 1,
    borderBottomColor: "#1A2235",
  },

  botaoVoltar: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 5,
  },

  avatarContainer: {
    width: 45,
    height: 45,
    position: "relative",
  },

  avatar: {
    width: 45,
    height: 45,
    borderRadius: 23,
    backgroundColor: "#1E293B",
    justifyContent: "center",
    alignItems: "center",
  },

  avatarTexto: {
    color: "#00AFFF",
    fontSize: 15,
    fontWeight: "bold",
  },

  online: {
    position: "absolute",
    width: 13,
    height: 13,
    borderRadius: 7,
    backgroundColor: "#00FF44",
    right: -1,
    bottom: 0,
    borderWidth: 2,
    borderColor: "#0D1324",
  },

  infoUsuario: {
    flex: 1,
    marginLeft: 12,
  },

  nomeUsuario: {
    color: "#fff",
    fontSize: 17,
    fontWeight: "700",
  },

  status: {
    color: "#00AFFF",
    fontSize: 13,
    marginTop: 2,
  },

  menuButton: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
  },

  listaMensagens: {
    paddingHorizontal: 15,
    paddingTop: 20,
    paddingBottom: 20,
  },

  flatList: {
    flex: 1,
  },

  mensagemContainer: {
    width: "100%",
    marginBottom: 10,
  },

  mensagemMinhaContainer: {
    alignItems: "flex-end",
  },

  mensagemOutraContainer: {
    alignItems: "flex-start",
  },

  mensagem: {
    maxWidth: "78%",
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderRadius: 18,
  },

  mensagemMinha: {
    backgroundColor: "#00AFFF",
    borderBottomRightRadius: 5,
  },

  mensagemOutra: {
    backgroundColor: "#182033",
    borderBottomLeftRadius: 5,
  },

  mensagemTexto: {
    color: "#fff",
    fontSize: 15,
    lineHeight: 21,
  },

  hora: {
    color: "#B8C0CC",
    fontSize: 10,
    marginTop: 5,
    textAlign: "right",
  },

  inputArea: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: "row",
    alignItems: "flex-end",
    paddingHorizontal: 12,
    paddingVertical: 10,
    height: 78,
    backgroundColor: "#0D1324",
    borderTopWidth: 1,
    borderTopColor: "#1A2235",
  },

  anexo: {
    width: 40,
    height: 48,
    justifyContent: "center",
    alignItems: "center",
  },

  inputContainer: {
    flex: 1,
    minHeight: 48,
    maxHeight: 120,
    backgroundColor: "#141C2E",
    borderRadius: 24,
    paddingHorizontal: 17,
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#202B42",
  },

  input: {
    color: "#fff",
    fontSize: 15,
    paddingTop: 12,
    paddingBottom: 12,
  },

  enviar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#00AFFF",
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 8,
  },
});