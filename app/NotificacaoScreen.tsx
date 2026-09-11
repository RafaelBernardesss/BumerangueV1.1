import React, { useCallback, useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Image,
} from "react-native";
import { useRouter } from "expo-router";
import { useFocusEffect } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Notifications from "expo-notifications";
import { Ionicons } from "@expo/vector-icons";
import Flecha from "../components/HeaderFlecha";

const API_URL = "http://172.30.1.2:3000";

type PropostaRecebida = {
  id: number;
  mensagem: string;
  status: "pendente" | "aceita" | "recusada";
  criadoEm: string;
  anuncio: { id: number; titulo: string };
  usuario: { id: number; nome: string; foto: string | null };
};

type PropostaEnviada = {
  id: number;
  mensagem: string;
  status: "pendente" | "aceita" | "recusada";
  criadoEm: string;
  anuncio: {
    id: number;
    titulo: string;
    usuario: { id: number; nome: string; foto: string | null };
  };
};

function formatarTempoRelativo(dataISO: string) {
  const agora = new Date();
  const data = new Date(dataISO);
  const diffMs = agora.getTime() - data.getTime();
  const diffMin = Math.floor(diffMs / 60000);

  if (diffMin < 1) return "Agora";
  if (diffMin < 60) return `${diffMin} min atrás`;

  const diffHoras = Math.floor(diffMin / 60);
  if (diffHoras < 24) return `${diffHoras}h atrás`;

  const diffDias = Math.floor(diffHoras / 24);
  if (diffDias === 1) return "Ontem";
  return `${diffDias} dias atrás`;
}

const STATUS_INFO: Record<string, { label: string; cor: string }> = {
  pendente: { label: "Pendente", cor: "#FFB800" },
  aceita: { label: "Aceita", cor: "#00FF44" },
  recusada: { label: "Recusada", cor: "#FF3B3B" },
};

export default function Notificacoes() {
  const router = useRouter();
  const [aba, setAba] = useState<"recebidas" | "enviadas">("recebidas");

  const [recebidas, setRecebidas] = useState<PropostaRecebida[]>([]);
  const [enviadas, setEnviadas] = useState<PropostaEnviada[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [respondendo, setRespondendo] = useState<number | null>(null);

  useFocusEffect(
    useCallback(() => {
      carregarTudo();
    }, [])
  );

  useEffect(() => {
    const listener = Notifications.addNotificationReceivedListener(() => {
      carregarTudo();
    });
    return () => listener.remove();
  }, []);

  async function carregarTudo() {
    try {
      setCarregando(true);
      const usuarioId = await AsyncStorage.getItem("usuarioId");
      if (!usuarioId) return;

      const [respRecebidas, respEnviadas] = await Promise.all([
        fetch(`${API_URL}/propostas/recebidas?usuarioId=${usuarioId}`),
        fetch(`${API_URL}/propostas/enviadas?usuarioId=${usuarioId}`),
      ]);

      const dadosRecebidas = await respRecebidas.json();
      const dadosEnviadas = await respEnviadas.json();

      if (respRecebidas.ok) setRecebidas(dadosRecebidas.propostas);
      if (respEnviadas.ok) setEnviadas(dadosEnviadas.propostas);
    } catch (erro) {
      console.log(erro);
    } finally {
      setCarregando(false);
    }
  }

  async function responder(id: number, status: "aceita" | "recusada") {
    try {
      setRespondendo(id);
      const resposta = await fetch(`${API_URL}/propostas/${id}/responder`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });

      if (!resposta.ok) {
        throw new Error("Não foi possível responder a proposta.");
      }

      setRecebidas((prev) => prev.map((p) => (p.id === id ? { ...p, status } : p)));
    } catch (erro: any) {
      Alert.alert("Erro", erro.message || "Não foi possível conectar ao servidor.");
    } finally {
      setRespondendo(null);
    }
  }

  function confirmarResposta(id: number, status: "aceita" | "recusada", nome: string) {
    const acao = status === "aceita" ? "aceitar" : "recusar";
    Alert.alert(
      `${acao === "aceitar" ? "Aceitar" : "Recusar"} proposta`,
      `Tem certeza que deseja ${acao} a proposta de ${nome}?`,
      [
        { text: "Cancelar", style: "cancel" },
        { text: "Confirmar", onPress: () => responder(id, status) },
      ]
    );
  }

  const pendentesRecebidas = recebidas.filter((p) => p.status === "pendente");
  const respondidasRecebidas = recebidas.filter((p) => p.status !== "pendente");

  function renderRecebida(item: PropostaRecebida) {
    return (
      <View key={item.id} style={[styles.card, item.status === "pendente" && styles.cardNaoLida]}>
        <View style={styles.cardTopoLinha}>
          {item.usuario.foto ? (
            <Image
              source={{ uri: `${API_URL}/${item.usuario.foto.replace(/\\/g, "/")}` }}
              style={styles.avatar}
            />
          ) : (
            <View style={styles.avatar} />
          )}

          <View style={styles.cardTexto}>
            <View style={styles.cardTopo}>
              <Text style={styles.cardTitulo} numberOfLines={1}>
                Proposta de {item.usuario.nome}
              </Text>
              {item.status === "pendente" && <View style={styles.dot} />}
            </View>
            <Text style={styles.cardDescricao} numberOfLines={2}>
              Sobre "{item.anuncio.titulo}": {item.mensagem}
            </Text>
            <Text style={styles.cardData}>{formatarTempoRelativo(item.criadoEm)}</Text>
          </View>
        </View>

        {item.status === "pendente" ? (
          <View style={styles.acoes}>
            <TouchableOpacity
              style={[styles.botao, styles.botaoRecusar]}
              onPress={() => confirmarResposta(item.id, "recusada", item.usuario.nome)}
              disabled={respondendo === item.id}
            >
              <Text style={styles.botaoTexto}>Recusar</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.botao, styles.botaoAceitar]}
              onPress={() => confirmarResposta(item.id, "aceita", item.usuario.nome)}
              disabled={respondendo === item.id}
            >
              {respondendo === item.id ? (
                <ActivityIndicator color="#000" size="small" />
              ) : (
                <Text style={[styles.botaoTexto, { color: "#000" }]}>Aceitar</Text>
              )}
            </TouchableOpacity>
          </View>
        ) : (
          <View style={[styles.badgeStatus, { backgroundColor: `${STATUS_INFO[item.status].cor}22` }]}>
            <Text style={{ color: STATUS_INFO[item.status].cor, fontWeight: "600", fontSize: 13 }}>
              {item.status === "aceita" ? "Proposta aceita" : "Proposta recusada"}
            </Text>
          </View>
        )}
      </View>
    );
  }

  function renderEnviada(item: PropostaEnviada) {
    const statusInfo = STATUS_INFO[item.status];

    return (
      <View key={item.id} style={styles.card}>
        <View style={styles.cardTopoLinha}>
          {item.anuncio.usuario.foto ? (
            <Image
              source={{ uri: `${API_URL}/${item.anuncio.usuario.foto.replace(/\\/g, "/")}` }}
              style={styles.avatar}
            />
          ) : (
            <View style={styles.avatar} />
          )}

          <View style={styles.cardTexto}>
            <Text style={styles.cardTitulo} numberOfLines={1}>
              Proposta para {item.anuncio.usuario.nome}
            </Text>
            <Text style={styles.cardDescricao} numberOfLines={2}>
              Sobre "{item.anuncio.titulo}": {item.mensagem}
            </Text>
            <Text style={styles.cardData}>{formatarTempoRelativo(item.criadoEm)}</Text>
          </View>
        </View>

        <View style={[styles.badgeStatus, { backgroundColor: `${statusInfo.cor}22` }]}>
          <Text style={{ color: statusInfo.cor, fontWeight: "600", fontSize: 13 }}>
            {statusInfo.label}
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* CABEÇALHO */}
      <View style={styles.header}>
        <Flecha></Flecha>
        <View style={styles.headerTextWrapper}>
          <Text style={styles.headerTitulo}>Notificações</Text>
          {pendentesRecebidas.length > 0 && (
            <Text style={styles.headerSubtitulo}>
              {pendentesRecebidas.length} pendente{pendentesRecebidas.length === 1 ? "" : "s"}
            </Text>
          )}
        </View>
      </View>

      {/* ABAS */}
      <View style={styles.tabs}>
        <TouchableOpacity
          style={[styles.tab, aba === "recebidas" && styles.tabAtiva]}
          onPress={() => setAba("recebidas")}
        >
          <Text style={[styles.tabTexto, aba === "recebidas" && styles.tabTextoAtivo]}>
            Recebidas
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, aba === "enviadas" && styles.tabAtiva]}
          onPress={() => setAba("enviadas")}
        >
          <Text style={[styles.tabTexto, aba === "enviadas" && styles.tabTextoAtivo]}>
            Enviadas
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {carregando ? (
          <ActivityIndicator color="#00AFFF" style={{ marginTop: 60 }} size="large" />
        ) : aba === "recebidas" ? (
          recebidas.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="notifications-off-outline" size={40} color="#444" />
              <Text style={styles.emptyTitulo}>Nenhuma proposta recebida</Text>
              <Text style={styles.emptyTexto}>
                As propostas que você receber vão aparecer aqui.
              </Text>
            </View>
          ) : (
            <>
              {pendentesRecebidas.length > 0 && (
                <>
                  <Text style={styles.sectionLabel}>Pendentes</Text>
                  {pendentesRecebidas.map(renderRecebida)}
                </>
              )}
              {respondidasRecebidas.length > 0 && (
                <>
                  <Text style={styles.sectionLabel}>Anteriores</Text>
                  {respondidasRecebidas.map(renderRecebida)}
                </>
              )}
            </>
          )
        ) : enviadas.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="paper-plane-outline" size={40} color="#444" />
            <Text style={styles.emptyTitulo}>Nenhuma proposta enviada</Text>
            <Text style={styles.emptyTexto}>
              As propostas que você enviar vão aparecer aqui.
            </Text>
          </View>
        ) : (
          enviadas.map(renderEnviada)
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
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
    paddingBottom: 16,
  },
  headerTextWrapper: {
    flex: 1,
    marginLeft: 14,
  },
  headerTitulo: {
    color: "#fff",
    fontSize: 22,
    fontWeight: "bold",
  },
  headerSubtitulo: {
    color: "#00AFFF",
    fontSize: 13,
    marginTop: 2,
  },
  tabs: {
    flexDirection: "row",
    paddingHorizontal: 20,
    gap: 10,
    marginBottom: 10,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#1F3C5E",
    alignItems: "center",
  },
  tabAtiva: {
    backgroundColor: "#00AFFF",
    borderColor: "#00AFFF",
  },
  tabTexto: {
    color: "#9CA3AF",
    fontWeight: "600",
  },
  tabTextoAtivo: {
    color: "#000",
  },
  scrollContent: {
    paddingHorizontal: 20,
  },
  sectionLabel: {
    color: "#888",
    fontSize: 13,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginTop: 20,
    marginBottom: 12,
  },
  card: {
    backgroundColor: "#0D1324",
    borderRadius: 18,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#161D2E",
  },
  cardNaoLida: {
    borderColor: "#00AFFF44",
  },
  cardTopoLinha: {
    flexDirection: "row",
    alignItems: "flex-start",
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#333",
    marginRight: 12,
  },
  cardTexto: {
    flex: 1,
  },
  cardTopo: {
    flexDirection: "row",
    alignItems: "center",
  },
  cardTitulo: {
    flex: 1,
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#00AFFF",
    marginLeft: 8,
  },
  cardDescricao: {
    color: "#999",
    fontSize: 13,
    lineHeight: 18,
    marginTop: 4,
  },
  cardData: {
    color: "#555",
    fontSize: 12,
    marginTop: 8,
  },
  acoes: {
    flexDirection: "row",
    gap: 10,
    marginTop: 14,
  },
  botao: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  botaoRecusar: {
    backgroundColor: "#1E1E1E",
    borderWidth: 1,
    borderColor: "#FF3B3B",
  },
  botaoAceitar: {
    backgroundColor: "#00FF44",
  },
  botaoTexto: {
    color: "#FF3B3B",
    fontWeight: "600",
  },
  badgeStatus: {
    alignSelf: "flex-start",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
    marginTop: 14,
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