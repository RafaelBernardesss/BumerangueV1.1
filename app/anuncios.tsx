import React, { useState, useCallback } from "react";

import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
  BackHandler,
} from "react-native";

import { useRouter } from "expo-router";
import { useFocusEffect } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Ionicons } from "@expo/vector-icons";

import Header from "../components/Hearder";

import {
  buscarHistorico,
  ItemHistorico,
} from "../src/utils/historico";

// ======================================================
// CONFIGURAÇÃO
// ======================================================

const API_URL = "http://172.30.1.2:3000";

// ======================================================
// TIPOS
// ======================================================

type Anuncio = {
  id: number;
  titulo: string;
  descricao: string;
  preferencia: string;
  foto: string | null;
  disponibilidade: string | null;
  status: "ativo" | "trocado";
  cidade: string | null;
  estado: string | null;
  criadoEm: string;
  atualizadoEm: string;
  usuarioId: number;
  categoriaId: number;

  usuario?: {
    id: number;
    nome: string;
    foto: string | null;
  };

  categoria?: {
    id: number;
    nome: string;
  };
};

// ======================================================
// CONFIGURAÇÃO DO STATUS
// ======================================================

const CONFIG_STATUS: Record<
  Anuncio["status"],
  {
    label: string;
    cor: string;
  }
> = {
  ativo: {
    label: "ATIVO",
    cor: "#00AFFF",
  },

  trocado: {
    label: "TROCADO",
    cor: "#00FF44",
  },
};

// ======================================================
// CONVERTE CAMINHO DA FOTO EM URL
// ======================================================

function urlFoto(caminho: string | null | undefined) {
  if (!caminho) {
    return null;
  }

  return `${API_URL}/${caminho.replace(/\\/g, "/")}`;
}


export default function Home() {
  const router = useRouter();


  const [name, setName] = useState("");
  const [foto, setFoto] = useState<string | null>(null);

  // ----------------------------------------------------
  // HISTÓRICO
  // ----------------------------------------------------

  const [historicoRecente, setHistoricoRecente] = useState<
    ItemHistorico[]
  >([]);

  const [carregandoHistorico, setCarregandoHistorico] =
    useState(true);

  // ----------------------------------------------------
  // MEUS ANÚNCIOS
  // ----------------------------------------------------

  const [meusAnuncios, setMeusAnuncios] = useState<Anuncio[]>([]);

  const [carregandoAnuncios, setCarregandoAnuncios] =
    useState(true);

  // ====================================================
  // CARREGAR HISTÓRICO
  // ====================================================

  useFocusEffect(
    useCallback(() => {
      let ativo = true;

      async function carregarHistorico() {
        try {
          setCarregandoHistorico(true);

          const dados = await buscarHistorico();

          if (ativo) {
            // Mostra somente os 3 mais recentes
            setHistoricoRecente(dados.slice(0, 3));
          }
        } catch (erro) {
          console.log(
            "Erro ao carregar histórico:",
            erro
          );

          if (ativo) {
            setHistoricoRecente([]);
          }
        } finally {
          if (ativo) {
            setCarregandoHistorico(false);
          }
        }
      }

      carregarHistorico();

      return () => {
        ativo = false;
      };
    }, [])
  );

  // ====================================================
  // CARREGAR MEUS ANÚNCIOS
  // ====================================================

  useFocusEffect(
    useCallback(() => {
      let ativo = true;

      async function buscarMeusAnuncios() {
        try {
          setCarregandoAnuncios(true);

          const id = await AsyncStorage.getItem(
            "usuarioId"
          );

          // Se não houver usuário logado
          if (!id) {
            if (ativo) {
              setMeusAnuncios([]);
              setCarregandoAnuncios(false);
            }

            return;
          }

          console.log(
            "Buscando anúncios do usuário:",
            id
          );

          const resposta = await fetch(
            `${API_URL}/anuncios?status=ativo`
          );

          const dados = await resposta.json();

          console.log(
            "Resposta dos anúncios:",
            dados
          );

          if (!ativo) {
            return;
          }

          if (resposta.ok) {
            // Caso o backend retorne:
            // { anuncios: [...] }

            if (Array.isArray(dados.anuncios)) {
              setMeusAnuncios(dados.anuncios);
            }

            // Caso o backend retorne diretamente:
            // [ ... ]
            else if (Array.isArray(dados)) {
              setMeusAnuncios(dados);
            }

            else {
              console.log(
                "Formato de anúncios não reconhecido:",
                dados
              );

              setMeusAnuncios([]);
            }
          } else {
            console.log(
              "Erro ao buscar anúncios:",
              dados?.erro || dados?.mensagem
            );

            setMeusAnuncios([]);
          }
        } catch (erro) {
          console.log(
            "Erro ao buscar meus anúncios:",
            erro
          );

          if (ativo) {
            setMeusAnuncios([]);
          }
        } finally {
          if (ativo) {
            setCarregandoAnuncios(false);
          }
        }
      }

      buscarMeusAnuncios();

      return () => {
        ativo = false;
      };
    }, [])
  );

  // ====================================================
  // ATUALIZAR USUÁRIO
  // ====================================================

  useFocusEffect(
    useCallback(() => {
      let ativo = true;

      async function atualizarUsuario() {
        try {
          // ----------------------------------------------
          // PRIMEIRO: dados salvos no celular
          // ----------------------------------------------

          const usuarioSalvo =
            await AsyncStorage.getItem(
              "usuarioLogado"
            );

          if (usuarioSalvo) {
            try {
              const usuario =
                JSON.parse(usuarioSalvo);

              if (ativo) {
                setName(usuario?.nome || "");

                if (usuario?.foto) {
                  setFoto(urlFoto(usuario.foto));
                } else {
                  setFoto(null);
                }
              }
            } catch (erro) {
              console.log(
                "Erro ao ler usuarioLogado:",
                erro
              );
            }
          }

          // ----------------------------------------------
          // DEPOIS: busca usuário atualizado no backend
          // ----------------------------------------------

          const id =
            await AsyncStorage.getItem("usuarioId");

          if (!id) {
            return;
          }

          const resposta = await fetch(
            `${API_URL}/usuarios/${id}`
          );

          const dados = await resposta.json();

          console.log(
            "Resposta do usuário:",
            dados
          );

          if (
            resposta.ok &&
            dados?.usuario &&
            ativo
          ) {
            const usuario = dados.usuario;

            setName(usuario.nome || "");

            setFoto(
              usuario.foto
                ? urlFoto(usuario.foto)
                : null
            );

            // Atualiza o usuário salvo
            await AsyncStorage.setItem(
              "usuarioLogado",
              JSON.stringify(usuario)
            );
          }
        } catch (erro) {
          console.log(
            "Erro ao atualizar usuário:",
            erro
          );
        }
      }

      atualizarUsuario();

      return () => {
        ativo = false;
      };
    }, [])
  );

  // ====================================================
  // BOTÃO VOLTAR DO ANDROID
  // ====================================================

  useFocusEffect(
    useCallback(() => {
      const onBackPress = () => {
        Alert.alert(
          "Sair do app",
          "Deseja sair do aplicativo?",
          [
            {
              text: "Cancelar",
              style: "cancel",
            },

            {
              text: "Sair",
              style: "destructive",
              onPress: () =>
                BackHandler.exitApp(),
            },
          ]
        );

        return true;
      };

      const subscription =
        BackHandler.addEventListener(
          "hardwareBackPress",
          onBackPress
        );

      return () => subscription.remove();
    }, [])
  );

  // ====================================================
  // INICIAIS DO USUÁRIO
  // ====================================================

  const iniciais = (name || "")
    .toString()
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((n) => n[0]?.toUpperCase())
    .join("");

  // ====================================================
  // RENDER
  // ====================================================

  return (
    <View style={styles.container}>

      {/* =================================================
          HEADER
      ================================================= */}

      <View style={styles.headerRow}>
        <Header />
      </View>

      {/* =================================================
          CONTEÚDO
      ================================================= */}

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >

        {/* =================================================
            BOAS-VINDAS
        ================================================= */}

        <View style={styles.welcomeContainer}>

          <View style={styles.welcomeText}>

            <Text
              style={styles.title}
              numberOfLines={1}
              adjustsFontSizeToFit
            >
              Olá, {name || "Usuário"}
            </Text>

            <Text style={styles.subtitle}>
              Bem-vindo de volta! Encontre serviços
              incríveis ou ofereça sua ajuda.
            </Text>

          </View>

          {/* FOTO DE PERFIL */}

          <TouchableOpacity
            style={styles.avatarWrapper}
            onPress={() =>
              router.push("/perfil")
            }
          >

            {foto ? (

              <Image
                source={{ uri: foto }}
                style={styles.avatar}
              />

            ) : (

              <View
                style={styles.avatarPlaceholder}
              >

                <Text
                  style={
                    styles.avatarPlaceholderText
                  }
                >
                  {iniciais || "?"}
                </Text>

              </View>
            )}

            <View style={styles.online} />

          </TouchableOpacity>

        </View>

        {/* =================================================
            AÇÕES
        ================================================= */}

        <View style={styles.actions}>

          {/* SERVIÇOS ATIVOS */}

          <TouchableOpacity
            style={styles.actionCard}
            activeOpacity={0.7}
            onPress={() =>
              router.push(
                "/FuncoesAnuncios/ServicoAtivo"
              )
            }
          >

            <View
              style={[
                styles.circle,
                {
                  backgroundColor: "#00AFFF",
                },
              ]}
            >

              <Ionicons
                name="briefcase-outline"
                size={26}
                color="#000"
              />

            </View>

            <Text style={styles.actionTitle}>
              Serviços{"\n"}Ativos
            </Text>

            <Text style={styles.actionSubtitle}>
              Ver todos seus serviços
            </Text>

          </TouchableOpacity>

          {/* SERVIÇOS REALIZADOS */}

          <TouchableOpacity
            style={styles.actionCard}
            activeOpacity={0.7}
            onPress={() =>
              router.push(
                "/historicoServico"
              )
            }
          >

            <View
              style={[
                styles.circle,
                {
                  backgroundColor: "#9B4DFF",
                },
              ]}
            >

              <Ionicons
                name="checkmark-done-outline"
                size={26}
                color="#000"
              />

            </View>

            <Text style={styles.actionTitle}>
              Serviços{"\n"}Realizados
            </Text>

            <Text style={styles.actionSubtitle}>
              Todos os serviços realizados
            </Text>

          </TouchableOpacity>

          {/* USUÁRIO FAVORITO */}

          <TouchableOpacity
            style={styles.actionCard}
            activeOpacity={0.7}
            onPress={() =>
              router.push(
                "/oferecerServicos"
              )
            }
          >

            <View
              style={[
                styles.circle,
                {
                  backgroundColor: "#00FF44",
                },
              ]}
            >

              <Ionicons
                name="star-outline"
                size={26}
                color="#000"
              />

            </View>

            <Text style={styles.actionTitle}>
              Usuário{"\n"}Favorito
            </Text>

            <Text style={styles.actionSubtitle}>
              Ver os melhores usuários
            </Text>

          </TouchableOpacity>

        </View>

        {/* =================================================
            SEUS DESTAQUES
        ================================================= */}

        <View style={styles.sectionHeader}>

          <Text
            style={styles.sectionTitle}
            numberOfLines={1}
          >
            Seus Destaques
          </Text>

          <TouchableOpacity
            style={styles.linkButton}
            onPress={() =>
              router.push("/verAnuncio")
            }
          >

            <Text style={styles.link}>
              Ver todos
            </Text>

          </TouchableOpacity>

        </View>

        {/* =================================================
            LISTA DE ANÚNCIOS
        ================================================= */}

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={
            styles.horizontalContent
          }
        >

          {carregandoAnuncios ? (

            <View style={styles.emptyState}>

              <Text style={styles.emptyText}>
                Carregando seus anúncios...
              </Text>

            </View>

          ) : meusAnuncios.length === 0 ? (

            <View style={styles.emptyState}>

              <Ionicons
                name="pricetag-outline"
                size={32}
                color="#444"
              />

              <Text style={styles.emptyText}>
                Não encontramos nenhum anúncio
              </Text>

            </View>

          ) : (

            meusAnuncios.map((item) => {

              const status =
                CONFIG_STATUS[item.status] ||
                CONFIG_STATUS.ativo;

              const fotoAnuncio =
                urlFoto(item.foto);

              return (

                <TouchableOpacity
                  key={item.id}
                  style={styles.serviceCard}
                  activeOpacity={0.8}
                  onPress={() =>
                    router.push(
                      `/AnuncioScreen?id=${item.id}`
                    )
                  }
                >

                  {/* FOTO */}

                  {fotoAnuncio ? (

                    <Image
                      source={{
                        uri: fotoAnuncio,
                      }}
                      style={styles.serviceImage}
                    />

                  ) : (

                    <View
                      style={[
                        styles.serviceImage,
                        styles.serviceImagePlaceholder,
                      ]}
                    >

                      <Ionicons
                        name="image-outline"
                        size={36}
                        color="#444"
                      />

                    </View>
                  )}

                  {/* STATUS */}

                  <View
                    style={[
                      styles.tag,
                      {
                        backgroundColor:
                          status.cor,
                      },
                    ]}
                  >

                    <Text style={styles.tagText}>
                      {status.label}
                    </Text>

                  </View>

                  {/* INFORMAÇÕES */}

                  <View style={styles.serviceInfo}>

                    <Text
                      style={styles.serviceTitle}
                      numberOfLines={1}
                    >
                      {item.titulo}
                    </Text>

                    <Text
                      style={styles.rating}
                      numberOfLines={1}
                    >
                      {item.categoria?.nome ||
                        "Sem categoria"}
                    </Text>

                    {item.cidade ? (

                      <Text
                        style={styles.location}
                        numberOfLines={1}
                      >
                        📍 {item.cidade}
                        {item.estado
                          ? ` - ${item.estado}`
                          : ""}
                      </Text>

                    ) : null}

                  </View>

                </TouchableOpacity>
              );
            })
          )}

        </ScrollView>

        {/* =================================================
            HISTÓRICO
        ================================================= */}

        <View style={styles.sectionHeader}>

          <Text
            style={styles.sectionTitle}
            numberOfLines={1}
          >
            Seu histórico recente
          </Text>

          <TouchableOpacity
            style={styles.linkButton}
            onPress={() =>
              router.push(
                "/historicoServico"
              )
            }
          >

            <Text style={styles.link}>
              Ver todos
            </Text>

          </TouchableOpacity>

        </View>

        {/* =================================================
            CARD DO HISTÓRICO
        ================================================= */}

        <View style={styles.historyCard}>

          {carregandoHistorico ? (

            <View style={styles.historyEmpty}>

              <Text
                style={styles.historyEmptyText}
              >
                Carregando histórico...
              </Text>

            </View>

          ) : historicoRecente.length === 0 ? (

            <View style={styles.historyEmpty}>

              <Ionicons
                name="time-outline"
                size={32}
                color="#444"
              />

              <Text
                style={styles.historyEmptyText}
              >
                Você ainda não visualizou
                nenhum anúncio.
              </Text>

            </View>

          ) : (

            historicoRecente.map(
              (item, index) => {

                const fotoHistorico =
                  urlFoto(item.foto);

                return (

                  <TouchableOpacity
                    key={`${item.id}-${item.visitadoEm}`}
                    style={[
                      styles.historyItem,

                      index ===
                        historicoRecente.length - 1
                        ? styles.lastHistoryItem
                        : null,
                    ]}
                    activeOpacity={0.8}
                    onPress={() =>
                      router.push(
                        `/AnuncioScreen?id=${item.id}`
                      )
                    }
                  >

                    {/* FOTO */}

                    {fotoHistorico ? (

                      <Image
                        source={{
                          uri: fotoHistorico,
                        }}
                        style={
                          styles.historyImage
                        }
                      />

                    ) : (

                      <View
                        style={
                          styles.historyImagePlaceholder
                        }
                      >

                        <Ionicons
                          name="image-outline"
                          size={24}
                          color="#444"
                        />

                      </View>
                    )}

                    {/* INFORMAÇÕES */}

                    <View
                      style={styles.historyInfo}
                    >

                      <Text
                        style={
                          styles.historyTitle
                        }
                        numberOfLines={1}
                      >
                        {item.titulo}
                      </Text>

                      <Text
                        style={
                          styles.historySubtitle
                        }
                        numberOfLines={1}
                      >
                        {item.usuarioNome}
                      </Text>

                      <Text
                        style={
                          styles.historyDate
                        }
                      >
                        Visualizado recentemente
                      </Text>

                    </View>

                    {/* SETA */}

                    <Ionicons
                      name="chevron-forward"
                      size={22}
                      color="#555"
                    />

                  </TouchableOpacity>
                );
              }
            )
          )}

        </View>

      </ScrollView>

      {/* =================================================
          MENU INFERIOR
      ================================================= */}

      <View style={styles.bottomBar}>

        {/* HOME */}

        <TouchableOpacity
          onPress={() =>
            router.replace("/")
          }
        >

          <Ionicons
            name="home"
            size={30}
            color="#00AFFF"
          />

        </TouchableOpacity>

        {/* BUSCAR */}

        <TouchableOpacity
          onPress={() =>
            router.push("/verAnuncio")
          }
        >

          <Ionicons
            name="search"
            size={30}
            color="#999"
          />

        </TouchableOpacity>

        {/* ADICIONAR */}

        <TouchableOpacity
          style={styles.addButton}
          onPress={() =>
            router.push(
              "/oferecerServicos"
            )
          }
        >

          <Ionicons
            name="add"
            size={36}
            color="#00AFFF"
          />

        </TouchableOpacity>

        {/* CHAT */}

        <TouchableOpacity
          onPress={() =>
            router.push("/Contatos")
          }
        >

          <Ionicons
            name="chatbubble-outline"
            size={30}
            color="#999"
          />

        </TouchableOpacity>

        {/* PERFIL */}

        <TouchableOpacity
          onPress={() =>
            router.push("/perfil")
          }
        >

          <Ionicons
            name="person-outline"
            size={30}
            color="#999"
          />

        </TouchableOpacity>

      </View>

    </View>
  );
}

// ======================================================
// ESTILOS
// ======================================================

const styles = StyleSheet.create({

  container: {
    flex: 1,
    backgroundColor: "#0B0B0B",
  },

  scrollContent: {
    paddingTop: 10,
    paddingBottom: 110,
  },

  headerRow: {
    paddingHorizontal: 0,
    paddingTop: 50,
  },

  // ====================================================
  // BOAS-VINDAS
  // ====================================================

  welcomeContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    marginTop: 20,
  },

  welcomeText: {
    flex: 1,
    paddingRight: 16,
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

  avatarWrapper: {
    width: 80,
    height: 80,
  },

  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
  },

  avatarPlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#1E293B",
    justifyContent: "center",
    alignItems: "center",
  },

  avatarPlaceholderText: {
    color: "#00AFFF",
    fontSize: 26,
    fontWeight: "700",
  },

  online: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: "#00FF44",
    position: "absolute",
    bottom: 4,
    right: 2,
    borderWidth: 2,
    borderColor: "#050B18",
  },

  // ====================================================
  // AÇÕES
  // ====================================================

  actions: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    marginTop: 25,
  },

  actionCard: {
    width: "31%",
    backgroundColor: "#0D1324",
    borderRadius: 18,
    paddingVertical: 15,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: "#161D2E",
  },

  circle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
  },

  actionTitle: {
    color: "#fff",
    fontSize: 14,
    marginTop: 15,
    fontWeight: "600",
    lineHeight: 18,
    letterSpacing: -0.3,
  },

  actionSubtitle: {
    color: "#888",
    marginTop: 8,
    fontSize: 11,
    lineHeight: 15,
  },

  // ====================================================
  // SEÇÕES
  // ====================================================

  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    marginTop: 30,
    marginBottom: 15,
  },

  sectionTitle: {
    flex: 1,
    color: "#fff",
    fontSize: 24,
    fontWeight: "bold",
    marginRight: 12,
  },

  linkButton: {
    paddingLeft: 12,
  },

  link: {
    color: "#00AFFF",
    fontSize: 18,
  },

  // ====================================================
  // ANÚNCIOS
  // ====================================================

  horizontalContent: {
    paddingRight: 20,
  },

  serviceCard: {
    width: 260,
    marginLeft: 20,
    backgroundColor: "#0D1324",
    borderRadius: 20,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#161D2E",
  },

  serviceImage: {
    width: "100%",
    height: 170,
  },

  serviceImagePlaceholder: {
    backgroundColor: "#161D2E",
    justifyContent: "center",
    alignItems: "center",
  },

  tag: {
    position: "absolute",
    top: 10,
    left: 10,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
  },

  tagText: {
    color: "#000",
    fontWeight: "bold",
  },

  serviceInfo: {
    padding: 15,
  },

  serviceTitle: {
    color: "#fff",
    fontSize: 24,
    fontWeight: "600",
  },

  rating: {
    color: "#fff",
    marginTop: 10,
  },

  location: {
    color: "#888",
    marginTop: 10,
  },

  emptyState: {
    width: 260,
    marginLeft: 20,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 40,
  },

  emptyText: {
    color: "#555",
    marginTop: 10,
    textAlign: "center",
  },

  // ====================================================
  // HISTÓRICO
  // ====================================================

  historyCard: {
    backgroundColor: "#0D1324",
    marginHorizontal: 20,
    borderRadius: 20,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#161D2E",
  },

  historyItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 18,
    borderBottomWidth: 1,
    borderBottomColor: "#222",
  },

  lastHistoryItem: {
    borderBottomWidth: 0,
  },

  historyImage: {
    width: 65,
    height: 65,
    borderRadius: 12,
  },

  historyImagePlaceholder: {
    width: 65,
    height: 65,
    borderRadius: 12,
    backgroundColor: "#161D2E",
    justifyContent: "center",
    alignItems: "center",
  },

  historyInfo: {
    flex: 1,
    marginLeft: 12,
    marginRight: 8,
  },

  historyTitle: {
    color: "#fff",
    fontSize: 18,
  },

  historySubtitle: {
    color: "#888",
    marginTop: 5,
  },

  historyDate: {
    color: "#555",
    fontSize: 11,
    marginTop: 4,
  },

  historyEmpty: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 35,
  },

  historyEmptyText: {
    color: "#555",
    marginTop: 8,
    textAlign: "center",
    paddingHorizontal: 20,
  },

  // ====================================================
  // MENU INFERIOR
  // ====================================================

  bottomBar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
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