import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

const API_URL = "http://192.168.137.173:3000";

type Props = {
  anuncioId: string;
  meuUsuarioId: string | null;
  outroUsuarioId: string;
};

export default function AvaliarTroca({ anuncioId, meuUsuarioId, outroUsuarioId }: Props) {
  const [nota, setNota] = useState(0);
  const [comentario, setComentario] = useState("");
  const [jaAvaliou, setJaAvaliou] = useState(false);
  const [notaDada, setNotaDada] = useState<number | null>(null);
  const [verificando, setVerificando] = useState(true);
  const [enviando, setEnviando] = useState(false);

  useEffect(() => {
    if (!meuUsuarioId) return;

    async function verificar() {
      try {
        const resposta = await fetch(
          `${API_URL}/avaliacoes/troca/${anuncioId}/${meuUsuarioId}/${outroUsuarioId}`
        );
        if (resposta.ok) {
          const dados = await resposta.json();
          setJaAvaliou(Boolean(dados.avaliada));
          setNotaDada(dados.nota);
        }
      } catch (erro) {
        console.log("Erro ao verificar avaliação:", erro);
      } finally {
        setVerificando(false);
      }
    }

    verificar();
  }, [anuncioId, meuUsuarioId, outroUsuarioId]);

  async function enviar() {
    if (nota < 1) {
      Alert.alert("Escolha uma nota", "Toque nas estrelas para avaliar de 1 a 5.");
      return;
    }

    try {
      setEnviando(true);
      const resposta = await fetch(`${API_URL}/avaliacoes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          anuncioId: Number(anuncioId),
          avaliadorId: Number(meuUsuarioId),
          avaliadoId: Number(outroUsuarioId),
          nota,
          comentario,
        }),
      });

      const dados = await resposta.json();
      if (!resposta.ok) throw new Error(dados.erro || "Não foi possível avaliar.");

      setJaAvaliou(true);
      setNotaDada(nota);
    } catch (erro: any) {
      Alert.alert("Erro", erro.message || "Não foi possível enviar a avaliação.");
    } finally {
      setEnviando(false);
    }
  }

  if (verificando) return <ActivityIndicator color="#00AFFF" />;

  if (jaAvaliou) {
    return (
      <View style={styles.caixa}>
        <Text style={styles.titulo}>Você avaliou esta troca</Text>
        <View style={styles.estrelas}>
          {[1, 2, 3, 4, 5].map((n) => (
            <Ionicons
              key={n}
              name={n <= (notaDada ?? 0) ? "star" : "star-outline"}
              size={28}
              color="#FFB800"
            />
          ))}
        </View>
      </View>
    );
  }

  return (
    <View style={styles.caixa}>
      <Text style={styles.titulo}>Avalie o outro usuário</Text>

      <View style={styles.estrelas}>
        {[1, 2, 3, 4, 5].map((n) => (
          <TouchableOpacity key={n} onPress={() => setNota(n)}>
            <Ionicons name={n <= nota ? "star" : "star-outline"} size={36} color="#FFB800" />
          </TouchableOpacity>
        ))}
      </View>

      <TextInput
        style={styles.input}
        placeholder="Comentário (opcional)"
        placeholderTextColor="#888"
        value={comentario}
        onChangeText={setComentario}
        multiline
        maxLength={300}
      />

      <TouchableOpacity style={styles.botao} onPress={enviar} disabled={enviando}>
        {enviando ? (
          <ActivityIndicator color="#000" size="small" />
        ) : (
          <Text style={styles.botaoTexto}>Enviar avaliação</Text>
        )}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  caixa: {
    width: "100%",
    backgroundColor: "#0D1324",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#161D2E",
    padding: 16,
    marginTop: 20,
    alignItems: "center",
    gap: 12,
  },
  titulo: { color: "#fff", fontSize: 16, fontWeight: "600" },
  estrelas: { flexDirection: "row", gap: 6 },
  input: {
    width: "100%",
    minHeight: 60,
    backgroundColor: "#141C2E",
    borderWidth: 1,
    borderColor: "#202B42",
    borderRadius: 12,
    padding: 10,
    color: "#fff",
    textAlignVertical: "top",
  },
  botao: {
    backgroundColor: "#00AFFF",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 24,
  },
  botaoTexto: { color: "#000", fontWeight: "700" },
});