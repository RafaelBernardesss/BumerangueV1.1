import React, { useCallback, useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ScrollView,
  ActivityIndicator,
  Linking,
  Alert,
  RefreshControl,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter, useLocalSearchParams } from "expo-router";

//components
import Header from "../components/HeaderEscolha";
import Estrelas from "../components/Estrela";
import { buscarResumo, ResumoAvaliacao } from "../src/utils/avaliacoes";

const API_URL = "http://192.168.137.173:3000";

type UsuarioPublico = {
  id?: string | number;
  nome: string;
  telefone?: string | null;
  cidade?: string | null;
  estado?: string | null;
  foto?: string | null;
};

export default function PerfilPublico() {
  const router = useRouter();

  const { id } = useLocalSearchParams<{ id: string }>();

  const [carregando, setCarregando] = useState(true);
  const [atualizando, setAtualizando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [usuario, setUsuario] = useState<UsuarioPublico | null>(null);
  const [ehMeuPerfil, setEhMeuPerfil] = useState(false);
  const [resumo, setResumo] = useState<ResumoAvaliacao | null>(null);

  const carregarResumo = useCallback(async () => {
    if (!id) return;
    try {
      const resumos = await buscarResumo([Number(id)]);
      setResumo(resumos[Number(id)] ?? null);
    } catch (e) {
      console.log("Erro ao buscar avaliação:", e);
    }
  }, [id]);

  const carregarPerfil = useCallback(async () => {
    if (!id) return;

    try {
      setErro(null);

      const meuId = await AsyncStorage.getItem("usuarioId");
      setEhMeuPerfil(meuId !== null && String(meuId) === String(id));

      const resposta = await fetch(`${API_URL}/usuarios/${id}`);
      const dados = await resposta.json();

      if (!resposta.ok) {
        throw new Error(dados.erro || "Erro ao carregar o perfil.");
      }

      // Guarda só os campos que podem aparecer para os outros (sem e-mail nem senha)
      const u = dados.usuario;
      setUsuario({
        id: u.id,
        nome: u.nome,
        telefone: u.telefone,
        cidade: u.cidade,
        estado: u.estado,
        foto: u.foto,
      });

      await carregarResumo();
    } catch (e: any) {
      setErro(e.message || "Não foi possível carregar este perfil.");
    } finally {
      setCarregando(false);
      setAtualizando(false);
    }
  }, [id, carregarResumo]);

  useEffect(() => {
    carregarPerfil();
  }, [carregarPerfil]);

  function aoAtualizar() {
    setAtualizando(true);
    carregarPerfil();
  }

  function abrirWhatsApp() {
    if (!usuario?.telefone) return;

    const numeros = usuario.telefone.replace(/\D/g, "");
    // Adiciona o DDI do Brasil se ainda não tiver
    const completo = numeros.startsWith("55") ? numeros : `55${numeros}`;

    Linking.openURL(`https://wa.me/${completo}`).catch(() =>
      Alert.alert("Erro", "Não foi possível abrir o WhatsApp.")
    );
  }

  function ligar() {
    if (!usuario?.telefone) return;

    const numeros = usuario.telefone.replace(/\D/g, "");
    Linking.openURL(`tel:${numeros}`).catch(() =>
      Alert.alert("Erro", "Não foi possível iniciar a ligação.")
    );
  }

  const fotoUrl = usuario?.foto
    ? `${API_URL}/${usuario.foto.replace(/\\/g, "/")}`
    : null;

  const iniciais = (usuario?.nome || "")
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((n) => n[0]?.toUpperCase())
    .join("");

  const localizacao = [usuario?.cidade, usuario?.estado]
    .filter(Boolean)
    .join(" - ");

  if (carregando) {
    return (
      <SafeAreaView
        style={[s.container, { justifyContent: "center", alignItems: "center" }]}
      >
        <ActivityIndicator color="#00AFFF" size="large" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={s.container}>
      <View style={s.header}>
        <Header></Header>
      </View>

      <ScrollView
        style={s.c}
        contentContainerStyle={{ padding: 20, paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={atualizando}
            onRefresh={aoAtualizar}
            tintColor="#00AFFF"
            colors={["#00AFFF"]}
          />
        }
      >
        {erro || !usuario ? (
          <View style={s.estadoVazio}>
            <Ionicons name="alert-circle-outline" size={48} color="#ff6b6b" />
            <Text style={s.estadoVazioTitulo}>Perfil indisponível</Text>
            <Text style={s.secaoSubtitulo}>
              {erro || "Não encontramos este usuário."}
            </Text>

            <TouchableOpacity style={s.btnSecundario} onPress={carregarPerfil}>
              <Text style={s.btnSecundarioTexto}>Tentar novamente</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            {/* Foto + nome + avaliação */}
            <View style={s.center}>
              {fotoUrl ? (
                <Image source={{ uri: fotoUrl }} style={s.img} />
              ) : (
                <View style={s.imgPlaceholder}>
                  <Text style={s.imgPlaceholderText}>{iniciais || "?"}</Text>
                </View>
              )}

              <Text style={s.nome}>{usuario.nome}</Text>

              <View style={{ marginTop: 6 }}>
                <Estrelas resumo={resumo} />
              </View>

              {localizacao ? (
                <View style={s.linhaLocal}>
                  <Ionicons name="location-outline" size={16} color="#9CA3AF" />
                  <Text style={s.localTexto}>{localizacao}</Text>
                </View>
              ) : null}
            </View>

            {/* Se for o próprio usuário, mostra atalho pra editar */}
            {ehMeuPerfil && (
              <TouchableOpacity
                style={s.btnSecundario}
                onPress={() => router.push("/perfil")}
              >
                <Ionicons name="create-outline" size={18} color="#00AFFF" />
                <Text style={s.btnSecundarioTexto}>Editar meu perfil</Text>
              </TouchableOpacity>
            )}

            {/* Informações */}
            <View style={s.cartao}>
              <Text style={s.secaoTitulo}>Informações</Text>

              <View style={s.linhaInfo}>
                <Ionicons name="person-outline" size={18} color="#00AFFF" />
                <View style={s.infoTextos}>
                  <Text style={s.infoRotulo}>Nome</Text>
                  <Text style={s.infoValor}>{usuario.nome}</Text>
                </View>
              </View>

              <View style={s.linhaInfo}>
                <Ionicons name="location-outline" size={18} color="#00AFFF" />
                <View style={s.infoTextos}>
                  <Text style={s.infoRotulo}>Localização</Text>
                  <Text style={s.infoValor}>
                    {localizacao || "Não informada"}
                  </Text>
                </View>
              </View>

              <View style={s.linhaInfo}>
                <Ionicons name="call-outline" size={18} color="#00AFFF" />
                <View style={s.infoTextos}>
                  <Text style={s.infoRotulo}>Telefone</Text>
                  <Text style={s.infoValor}>
                    {usuario.telefone || "Não informado"}
                  </Text>
                </View>
              </View>

              <View style={s.linhaInfo}>
                <Ionicons name="star-outline" size={18} color="#00AFFF" />
                <View style={s.infoTextos}>
                  <Text style={s.infoRotulo}>Avaliação</Text>
                  <View style={{ marginTop: 2 }}>
                    <Estrelas resumo={resumo} />
                  </View>
                </View>
              </View>
            </View>

            {/* Contato (só aparece se tiver telefone e não for o próprio perfil) */}
            {!ehMeuPerfil && usuario.telefone ? (
              <View style={{ marginTop: 24 }}>
                <Text style={s.secaoTitulo}>Entrar em contato</Text>

                <TouchableOpacity style={s.btn} onPress={abrirWhatsApp}>
                  <View style={s.btnConteudo}>
                    <Ionicons name="logo-whatsapp" size={20} color="#fff" />
                    <Text style={s.btnt}>Chamar no WhatsApp</Text>
                  </View>
                </TouchableOpacity>

                <TouchableOpacity style={s.btnSecundario} onPress={ligar}>
                  <Ionicons name="call-outline" size={18} color="#00AFFF" />
                  <Text style={s.btnSecundarioTexto}>Ligar</Text>
                </TouchableOpacity>
              </View>
            ) : null}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0B0B0B",
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  c: {
    flex: 1,
    backgroundColor: "#0B0B0B",
  },
  center: {
    alignItems: "center",
  },
  img: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: "#222",
  },
  imgPlaceholder: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: "#1E293B",
    alignItems: "center",
    justifyContent: "center",
  },
  imgPlaceholderText: {
    color: "#00AFFF",
    fontSize: 36,
    fontWeight: "700",
  },
  nome: {
    color: "#fff",
    fontSize: 28,
    fontWeight: "700",
    marginTop: 16,
    textAlign: "center",
  },
  linhaLocal: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 6,
  },
  localTexto: {
    color: "#9CA3AF",
    fontSize: 14,
  },
  cartao: {
    backgroundColor: "#0D1324",
    borderWidth: 1,
    borderColor: "#1E293B",
    borderRadius: 12,
    padding: 16,
    marginTop: 24,
  },
  linhaInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginTop: 16,
  },
  infoTextos: {
    flex: 1,
  },
  infoRotulo: {
    color: "#9CA3AF",
    fontSize: 13,
  },
  infoValor: {
    color: "#fff",
    fontSize: 16,
    marginTop: 2,
  },
  secaoTitulo: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "700",
  },
  secaoSubtitulo: {
    color: "#9CA3AF",
    fontSize: 13,
    marginTop: 4,
    textAlign: "center",
  },
  btn: {
    backgroundColor: "#00AFFF",
    padding: 16,
    borderRadius: 12,
    marginTop: 12,
  },
  btnConteudo: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  btnt: {
    color: "#fff",
    fontWeight: "700",
    textAlign: "center",
  },
  btnSecundario: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderWidth: 1,
    borderColor: "#00AFFF",
    borderRadius: 12,
    paddingVertical: 12,
    marginTop: 12,
  },
  btnSecundarioTexto: {
    color: "#00AFFF",
    fontWeight: "600",
  },
  estadoVazio: {
    alignItems: "center",
    marginTop: 60,
    gap: 8,
  },
  estadoVazioTitulo: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "700",
    marginTop: 8,
  },
});