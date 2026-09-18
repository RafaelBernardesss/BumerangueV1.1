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
  Alert,
  Modal,
  KeyboardAvoidingView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { SafeAreaView } from "react-native-safe-area-context";
import * as ImagePicker from "expo-image-picker";

const API_URL = "http://192.168.18.7:3000";

type Mensagem = {
  id: number;
  texto: string;
  tipo: "texto" | "foto";
  minha: boolean;
  hora: string;
};

type OutroUsuario = {
  id: number;
  nome: string;
  foto: string | null;
};

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

  const outroUsuarioId = params.id;
  const anuncioId = params.anuncioId;

  const [meuUsuarioId, setMeuUsuarioId] = useState<number | null>(null);
  const [outroUsuario, setOutroUsuario] = useState<OutroUsuario | null>(null);
  const [texto, setTexto] = useState("");
  const [mensagens, setMensagens] = useState<Mensagem[]>([]);
  const [enviandoFoto, setEnviandoFoto] = useState(false);
  const [menuVisivel, setMenuVisivel] = useState(false);
  const flatListRef = useRef<FlatList>(null);

  function irParaUltimaMensagem(animated = true) {
    requestAnimationFrame(() => {
      flatListRef.current?.scrollToEnd({ animated });
    });
  }

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

  useEffect(() => {
    async function carregarOutroUsuario() {
      try {
        const resposta = await fetch(`${API_URL}/usuarios/${outroUsuarioId}`);
        const dados = await resposta.json();
        setOutroUsuario(dados.usuario);
      } catch (erro) {
        console.error("Erro ao carregar dados do contato:", erro);
      }
    }
    if (outroUsuarioId) carregarOutroUsuario();
  }, [outroUsuarioId]);

  useEffect(() => {
    if (!meuUsuarioId || !anuncioId) return;

    async function carregarMensagens() {
      try {
        const resposta = await fetch(
          `${API_URL}/mensagens/${anuncioId}/${meuUsuarioId}/${outroUsuarioId}`
        );
        const dados = await resposta.json();

        const formatadas: Mensagem[] = dados.map((m: any) => ({
          id: m.id,
          texto: m.conteudo,
          tipo: m.tipo === "foto" ? "foto" : "texto",
          minha: m.remetenteId === meuUsuarioId,
          hora: new Date(m.data_hora).toLocaleTimeString("pt-BR", {
            hour: "2-digit",
            minute: "2-digit",
          }),
        }));

        setMensagens((mensagensAtuais) => {
          if (mensagensAtuais.length === formatadas.length) {
            return mensagensAtuais;
          }
          irParaUltimaMensagem(true);
          return formatadas;
        });
      } catch (erro) {
        console.error("Erro ao carregar mensagens:", erro);
      }
    }

    carregarMensagens();
    const interval = setInterval(() => carregarMensagens(), 5000);
    return () => clearInterval(interval);
  }, [meuUsuarioId, outroUsuarioId, anuncioId]);

  async function enviarMensagem() {
    if (!texto.trim() || !meuUsuarioId || !anuncioId) return;

    const conteudo = texto.trim();
    setTexto("");

    try {
      const resposta = await fetch(`${API_URL}/mensagens`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          conteudo,
          tipo: "texto",
          remetenteId: meuUsuarioId,
          destinatarioId: Number(outroUsuarioId),
          anuncioId: Number(anuncioId),
        }),
      });

      const mensagemCriada = await resposta.json();

      const novaMensagem: Mensagem = {
        id: mensagemCriada.id,
        texto: mensagemCriada.conteudo,
        tipo: "texto",
        minha: true,
        hora: new Date(mensagemCriada.data_hora).toLocaleTimeString("pt-BR", {
          hour: "2-digit",
          minute: "2-digit",
        }),
      };

      setMensagens((mensagensAtuais) => [...mensagensAtuais, novaMensagem]);
      irParaUltimaMensagem(true);
    } catch (erro) {
      console.error("Erro ao enviar mensagem:", erro);
    }
  }

  async function escolherEEnviarFoto() {
    const permissao = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permissao.granted) {
      Alert.alert("Permissão necessária", "Precisamos acessar suas fotos para enviar uma imagem.");
      return;
    }

    const resultado = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.7,
    });

    if (resultado.canceled || !meuUsuarioId || !anuncioId) return;

    const foto = resultado.assets[0];

    try {
      setEnviandoFoto(true);

      const formData = new FormData();
      formData.append("remetenteId", String(meuUsuarioId));
      formData.append("destinatarioId", String(outroUsuarioId));
      formData.append("anuncioId", String(anuncioId));
      formData.append("foto", {
        uri: foto.uri,
        name: foto.fileName || "foto.jpg",
        type: "image/jpeg",
      } as any);

      const resposta = await fetch(`${API_URL}/mensagens/foto`, {
        method: "POST",
        headers: { "Content-Type": "multipart/form-data" },
        body: formData,
      });

      const mensagemCriada = await resposta.json();

      const novaMensagem: Mensagem = {
        id: mensagemCriada.id,
        texto: mensagemCriada.conteudo,
        tipo: "foto",
        minha: true,
        hora: new Date(mensagemCriada.data_hora).toLocaleTimeString("pt-BR", {
          hour: "2-digit",
          minute: "2-digit",
        }),
      };

      setMensagens((mensagensAtuais) => [...mensagensAtuais, novaMensagem]);
      irParaUltimaMensagem(true);
    } catch (erro) {
      console.error("Erro ao enviar foto:", erro);
      Alert.alert("Erro", "Não foi possível enviar a foto. Tente novamente.");
    } finally {
      setEnviandoFoto(false);
    }
  }

  async function apagarConversa() {
    setMenuVisivel(false);
    Alert.alert(
      "Apagar conversa",
      "Todas as mensagens desta conversa serão apagadas. Deseja continuar?",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Apagar",
          style: "destructive",
          onPress: async () => {
            try {
              await fetch(
                `${API_URL}/mensagens/${anuncioId}/${meuUsuarioId}/${outroUsuarioId}`,
                { method: "DELETE" }
              );
              setMensagens([]);
            } catch (erro) {
              console.error("Erro ao apagar conversa:", erro);
              Alert.alert("Erro", "Não foi possível apagar a conversa.");
            }
          },
        },
      ]
    );
  }

  function irParaFinalizacao() {
    setMenuVisivel(false);
    router.push({
      pathname: "/finalizacaoTroca",
      params: {
        anuncioId: String(anuncioId),
        usuarioId: String(meuUsuarioId),
        outroUsuarioId: String(outroUsuarioId),
      },
    });
  }

  function renderMensagem({ item }: { item: Mensagem }) {
    return (
      <View
        style={[
          styles.mensagemContainer,
          item.minha ? styles.mensagemMinhaContainer : styles.mensagemOutraContainer,
        ]}
      >
        <View
          style={[
            styles.mensagem,
            item.minha ? styles.mensagemMinha : styles.mensagemOutra,
            item.tipo === "foto" && styles.mensagemFoto,
          ]}
        >
          {item.tipo === "foto" ? (
            <Image source={{ uri: urlFoto(item.texto)! }} style={styles.imagemMensagem} />
          ) : (
            <Text style={styles.mensagemTexto}>{item.texto}</Text>
          )}
          <Text style={styles.hora}>{item.hora}</Text>
        </View>
      </View>
    );
  }

  const fotoContato = urlFoto(outroUsuario?.foto ?? null);

  return (
    <SafeAreaView style={styles.container} edges={["top", "left", "right"]}>
      <KeyboardAvoidingView
        style={styles.inner}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 0}
      >
        <View style={styles.header}>
          <TouchableOpacity style={styles.botaoVoltar} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={26} color="#00AFFF" />
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
            <Text style={styles.nomeUsuario}>{outroUsuario?.nome || "Carregando..."}</Text>
            <Text style={styles.status}>online</Text>
          </View>

          <TouchableOpacity style={styles.menuButton} onPress={() => setMenuVisivel(true)}>
            <Ionicons name="ellipsis-vertical" size={24} color="#00AFFF" />
          </TouchableOpacity>
        </View>

        <FlatList
          style={styles.flatList}
          ref={flatListRef}
          data={mensagens}
          renderItem={renderMensagem}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.listaMensagens}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          onContentSizeChange={() => irParaUltimaMensagem(false)}
        />

        <View style={styles.inputArea}>
          <TouchableOpacity style={styles.anexo} onPress={escolherEEnviarFoto} disabled={enviandoFoto}>
            <Ionicons
              name={enviandoFoto ? "hourglass-outline" : "add-circle-outline"}
              size={27}
              color="#00AFFF"
            />
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
      </KeyboardAvoidingView>

      <Modal
        visible={menuVisivel}
        transparent
        animationType="fade"
        onRequestClose={() => setMenuVisivel(false)}
      >
        <TouchableOpacity
          style={estilosMenu.fundo}
          activeOpacity={1}
          onPress={() => setMenuVisivel(false)}
        >
          <View style={estilosMenu.caixa}>
            <TouchableOpacity style={estilosMenu.opcao} onPress={irParaFinalizacao}>
              <Ionicons name="checkmark-done-outline" size={20} color="#00AFFF" />
              <Text style={estilosMenu.textoOpcao}>Finalizar troca</Text>
            </TouchableOpacity>

            <View style={estilosMenu.divisor} />

            <TouchableOpacity style={estilosMenu.opcao} onPress={apagarConversa}>
              <Ionicons name="trash-outline" size={20} color="#FF5C5C" />
              <Text style={[estilosMenu.textoOpcao, { color: "#FF5C5C" }]}>Apagar mensagens</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0B0B0B" },
  inner: { flex: 1, backgroundColor: "#0B0B0B" },
  header: {
    height: 65,
    paddingHorizontal: 15,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#0D1324",
    borderBottomWidth: 1,
    borderBottomColor: "#1A2235",
  },
  botaoVoltar: { width: 40, height: 40, justifyContent: "center", alignItems: "center", marginRight: 5 },
  avatarContainer: { width: 45, height: 45, position: "relative" },
  avatar: {
    width: 45,
    height: 45,
    borderRadius: 23,
    backgroundColor: "#1E293B",
    justifyContent: "center",
    alignItems: "center",
  },
  avatarTexto: { color: "#00AFFF", fontSize: 15, fontWeight: "bold" },
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
  infoUsuario: { flex: 1, marginLeft: 12 },
  nomeUsuario: { color: "#fff", fontSize: 17, fontWeight: "700" },
  status: { color: "#00AFFF", fontSize: 13, marginTop: 2 },
  menuButton: { width: 40, height: 40, justifyContent: "center", alignItems: "center" },
  flatList: { flex: 1 },
  listaMensagens: { paddingHorizontal: 15, paddingTop: 20, paddingBottom: 12, flexGrow: 1, justifyContent: "flex-end" },
  mensagemContainer: { width: "100%", marginBottom: 10 },
  mensagemMinhaContainer: { alignItems: "flex-end" },
  mensagemOutraContainer: { alignItems: "flex-start" },
  mensagem: { maxWidth: "78%", paddingHorizontal: 15, paddingVertical: 10, borderRadius: 18 },
  mensagemFoto: { padding: 6 },
  mensagemMinha: { backgroundColor: "#00AFFF", borderBottomRightRadius: 5 },
  mensagemOutra: { backgroundColor: "#182033", borderBottomLeftRadius: 5 },
  mensagemTexto: { color: "#fff", fontSize: 15, lineHeight: 21 },
  imagemMensagem: { width: 200, height: 200, borderRadius: 12 },
  hora: { color: "#B8C0CC", fontSize: 10, marginTop: 5, textAlign: "right" },
  inputArea: {
    flexDirection: "row",
    alignItems: "flex-end",
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: "#0D1324",
    borderTopWidth: 1,
    borderTopColor: "#1A2235",
  },
  anexo: { width: 40, height: 48, justifyContent: "center", alignItems: "center" },
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
  input: { color: "#fff", fontSize: 15, paddingTop: 12, paddingBottom: 12 },
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

const estilosMenu = StyleSheet.create({
  fundo: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "flex-start",
    alignItems: "flex-end",
    paddingTop: 60,
    paddingRight: 15,
  },
  caixa: {
    backgroundColor: "#141C2E",
    borderRadius: 12,
    width: 200,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#202B42",
  },
  opcao: { flexDirection: "row", alignItems: "center", gap: 10, paddingVertical: 14, paddingHorizontal: 16 },
  textoOpcao: { color: "#fff", fontSize: 14, fontWeight: "600" },
  divisor: { height: 1, backgroundColor: "#202B42" },
});