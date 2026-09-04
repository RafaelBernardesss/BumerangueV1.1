import React, { useState, useRef } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  Platform,
  Image,
} from "react-native";
import { KeyboardAvoidingView } from "react-native-keyboard-controller";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";

type Mensagem = {
  id: number;
  texto: string;
  minha: boolean;
  hora: string;
};

export default function Chat() {
  const router = useRouter();
  const params = useLocalSearchParams();

  const usuarioId = params.id;

  const [texto, setTexto] = useState("");
  const flatListRef = useRef<FlatList>(null);

  const [mensagens, setMensagens] = useState<Mensagem[]>([
    {
      id: 1,
      texto: "Olá! Vi que você oferece desenvolvimento de sites.",
      minha: false,
      hora: "14:20",
    },
    {
      id: 2,
      texto: "Olá! Sim, posso te ajudar com isso.",
      minha: true,
      hora: "14:21",
    },
    {
      id: 3,
      texto: "Podemos conversar sobre a troca de serviços?",
      minha: false,
      hora: "14:22",
    },
    {
      id: 4,
      texto: "Claro! Vamos combinar os detalhes.",
      minha: true,
      hora: "14:23",
    },
  ]);

  function enviarMensagem() {
    if (!texto.trim()) return;

    const novaMensagem: Mensagem = {
      id: Date.now(),
      texto: texto.trim(),
      minha: true,
      hora: new Date().toLocaleTimeString("pt-BR", {
        hour: "2-digit",
        minute: "2-digit",
      }),
    };

    setMensagens((mensagensAtuais) => [...mensagensAtuais, novaMensagem]);
    setTexto("");

    setTimeout(() => {
      flatListRef.current?.scrollToEnd({ animated: true });
    }, 100);
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

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      {/* CABEÇALHO */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.botaoVoltar}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={26} color="#fff" />
        </TouchableOpacity>

        <View style={styles.avatarContainer}>
          <View style={styles.avatar}>
            <Text style={styles.avatarTexto}>JD</Text>
          </View>
          <View style={styles.online} />
        </View>

        <View style={styles.infoUsuario}>
          <Text style={styles.nomeUsuario}>João da Silva</Text>
          <Text style={styles.status}>online</Text>
        </View>

        <TouchableOpacity style={styles.menuButton}>
          <Ionicons name="ellipsis-vertical" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* ÁREA DAS MENSAGENS */}
      <FlatList
        ref={flatListRef}
        data={mensagens}
        renderItem={renderMensagem}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.listaMensagens}
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
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
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
    flexDirection: "row",
    alignItems: "flex-end",
    paddingHorizontal: 12,
    paddingVertical: 10,
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