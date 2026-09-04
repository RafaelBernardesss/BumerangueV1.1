import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Image, Alert, ScrollView, ActivityIndicator, KeyboardAvoidingView, Platform } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import * as Location from "expo-location";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import { useNavigation } from "@react-navigation/native";

//components
import Header from "../components/HeaderEscolha";

const API_URL = "http://172.30.1.37:3000";

// Mapa de nome completo do estado -> sigla (UF), pra converter o que o GPS retorna
const ESTADOS_UF: Record<string, string> = {
  "acre": "AC",
  "alagoas": "AL",
  "amapá": "AP",
  "amapa": "AP",
  "amazonas": "AM",
  "bahia": "BA",
  "ceará": "CE",
  "ceara": "CE",
  "distrito federal": "DF",
  "espírito santo": "ES",
  "espirito santo": "ES",
  "goiás": "GO",
  "goias": "GO",
  "maranhão": "MA",
  "maranhao": "MA",
  "mato grosso": "MT",
  "mato grosso do sul": "MS",
  "minas gerais": "MG",
  "pará": "PA",
  "para": "PA",
  "paraíba": "PB",
  "paraiba": "PB",
  "paraná": "PR",
  "parana": "PR",
  "pernambuco": "PE",
  "piauí": "PI",
  "piaui": "PI",
  "rio de janeiro": "RJ",
  "rio grande do norte": "RN",
  "rio grande do sul": "RS",
  "rondônia": "RO",
  "rondonia": "RO",
  "roraima": "RR",
  "santa catarina": "SC",
  "são paulo": "SP",
  "sao paulo": "SP",
  "sergipe": "SE",
  "tocantins": "TO",
};

function converterParaSiglaUF(nomeEstado: string): string {
  if (!nomeEstado) return "";

  // Se já vier como sigla (2 letras), só normaliza pra maiúsculo
  const semAcento = nomeEstado
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();

  if (nomeEstado.trim().length === 2) {
    return nomeEstado.trim().toUpperCase();
  }

  return ESTADOS_UF[semAcento] || nomeEstado;
}

export default function Perfil() {
  const router = useRouter();
  const navigation = useNavigation();

  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);

  const [idUsuario, setIdUsuario] = useState<string | null>(null);
  const [foto, setFoto] = useState<string | null>(null); // o que é exibido na tela
  const [novaFotoUri, setNovaFotoUri] = useState<string | null>(null); // foto local escolhida, ainda não enviada
  const [fotoRemovidaPendente, setFotoRemovidaPendente] = useState(false); // usuário pediu pra remover, ainda não confirmado

  const [nome, setNome] = useState("");
  const [nomeOriginal, setNomeOriginal] = useState("");

  const [email, setEmail] = useState("");

  const [telefone, setTelefone] = useState("");
  const [telefoneOriginal, setTelefoneOriginal] = useState("");

  const [cidade, setCidade] = useState("");
  const [cidadeOriginal, setCidadeOriginal] = useState("");
  const [estado, setEstado] = useState("");
  const [estadoOriginal, setEstadoOriginal] = useState("");
  const [buscandoLocalizacao, setBuscandoLocalizacao] = useState(false);

  const [senhaAtual, setSenhaAtual] = useState("");
  const [novaSenha, setNovaSenha] = useState("");
  const [confirmarNovaSenha, setConfirmarNovaSenha] = useState("");

  useEffect(() => {
    carregarUsuario();
  }, []);

  async function carregarUsuario() {
    try {
    
      const id = await AsyncStorage.getItem("usuarioId");

      if (!id) {
        Alert.alert("Sessão expirada", "Faça login novamente.");
        router.replace("/login");
        return;
      }

      setIdUsuario(id);

      const resposta = await fetch(`${API_URL}/usuarios/${id}`);
      const dados = await resposta.json();

      if (!resposta.ok) {
        throw new Error(dados.erro || "Erro ao carregar os dados do usuário.");
      }

      setNome(dados.usuario.nome);
      setNomeOriginal(dados.usuario.nome);
      setEmail(dados.usuario.email);
      setTelefone(dados.usuario.telefone || "");
      setTelefoneOriginal(dados.usuario.telefone || "");

      setCidade(dados.usuario.cidade || "");
      setCidadeOriginal(dados.usuario.cidade || "");
      setEstado(dados.usuario.estado || "");
      setEstadoOriginal(dados.usuario.estado || "");

      if (dados.usuario.foto) {
        setFoto(`${API_URL}/${dados.usuario.foto.replace(/\\/g, "/")}`);
      }
    } catch (erro: any) {
      Alert.alert("Erro", erro.message || "Não foi possível carregar seu perfil.");
    } finally {
      setCarregando(false);
    }
  }

  async function escolherFoto() {
    const p = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!p.granted) return Alert.alert("Permissão necessária");
    const r = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      quality: 1,
    });
    if (!r.canceled) {
      // Só guarda localmente por enquanto; o envio de verdade acontece ao clicar em Salvar
      setFoto(r.assets[0].uri);
      setNovaFotoUri(r.assets[0].uri);
      setFotoRemovidaPendente(false);
    }
  }

  async function usarLocalizacaoAtual() {
    try {
      setBuscandoLocalizacao(true);

      const permissao = await Location.requestForegroundPermissionsAsync();
      if (!permissao.granted) {
        Alert.alert(
          "Permissão necessária",
          "Permita o acesso à localização para preencher automaticamente."
        );
        return;
      }

      const posicao = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      const [endereco] = await Location.reverseGeocodeAsync({
        latitude: posicao.coords.latitude,
        longitude: posicao.coords.longitude,
      });

      if (!endereco) {
        Alert.alert("Erro", "Não foi possível identificar sua cidade.");
        return;
      }

      // Só preenche os campos por enquanto; o envio ao backend
      // acontece ao clicar em "Salvar Alterações", igual aos outros campos
      setCidade(endereco.city || endereco.subregion || "");
      setEstado(converterParaSiglaUF(endereco.region || ""));
    } catch (erro: any) {
      Alert.alert(
        "Erro",
        erro.message || "Não foi possível obter sua localização."
      );
    } finally {
      setBuscandoLocalizacao(false);
    }
  }

  function removerFoto() {
    // Só marca como pendente; a remoção de verdade no backend acontece ao clicar em Salvar
    setFoto(null);
    setNovaFotoUri(null);
    setFotoRemovidaPendente(true);
  }

  // Envia a foto nova escolhida para o backend (chamado só dentro de salvar())
  async function salvarFoto() {
    if (!idUsuario) return;

    if (novaFotoUri) {
      const formData = new FormData();
      const nomeArquivo = novaFotoUri.split("/").pop() || "foto.jpg";
      const extensao = nomeArquivo.split(".").pop();

      formData.append("foto", {
        uri: novaFotoUri,
        name: nomeArquivo,
        type: `image/${extensao === "jpg" ? "jpeg" : extensao}`,
      } as any);

      const resposta = await fetch(`${API_URL}/usuarios/${idUsuario}/foto`, {
        method: "PUT",
        body: formData,
      });

      const dados = await resposta.json();

      if (!resposta.ok) {
        throw new Error(dados.erro || "Erro ao enviar a foto.");
      }

      setNovaFotoUri(null);
      return;
    }

    if (fotoRemovidaPendente) {
      const resposta = await fetch(`${API_URL}/usuarios/${idUsuario}/foto`, {
        method: "DELETE",
      });

      const dados = await resposta.json();

      if (!resposta.ok) {
        throw new Error(dados.erro || "Erro ao remover a foto.");
      }

      setFotoRemovidaPendente(false);
    }
  }

  // Atualiza o nome de usuário no backend (só chama se o nome mudou)
  async function salvarNome() {
    if (nome === nomeOriginal) return;
    if (!idUsuario) return;

    const resposta = await fetch(`${API_URL}/usuarios/${idUsuario}/nome`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nome }),
    });

    const dados = await resposta.json();

    if (!resposta.ok) {
      throw new Error(dados.erro || "Erro ao atualizar o nome.");
    }

    setNomeOriginal(nome);
  }

  // Atualiza o telefone no backend (só chama se mudou)
  async function salvarTelefone() {
    if (telefone === telefoneOriginal) return;
    if (!idUsuario) return;

    const resposta = await fetch(`${API_URL}/usuarios/${idUsuario}/telefone`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ telefone }),
    });

    const dados = await resposta.json();

    if (!resposta.ok) {
      throw new Error(dados.erro || "Erro ao atualizar o telefone.");
    }

    setTelefoneOriginal(telefone);
  }

  // Atualiza cidade/estado no backend (só chama se algum dos dois mudou)
  async function salvarLocalizacao() {
    if (cidade === cidadeOriginal && estado === estadoOriginal) return;
    if (!idUsuario) return;

    const resposta = await fetch(`${API_URL}/usuarios/${idUsuario}/localizacao`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ cidade, estado }),
    });

    const dados = await resposta.json();

    if (!resposta.ok) {
      throw new Error(dados.erro || "Erro ao atualizar a localização.");
    }

    setCidadeOriginal(cidade);
    setEstadoOriginal(estado);
  }

  // Redefine a senha no backend (só chama se os campos de senha foram preenchidos)
  async function salvarSenha() {
    if (!senhaAtual && !novaSenha && !confirmarNovaSenha) return;
    if (!idUsuario) return;

    if (!senhaAtual || !novaSenha || !confirmarNovaSenha) {
      throw new Error("Preencha a senha atual, a nova senha e a confirmação para trocar a senha.");
    }

    const resposta = await fetch(`${API_URL}/usuarios/${idUsuario}/senha`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ senhaAtual, novaSenha, confirmarNovaSenha }),
    });

    const dados = await resposta.json();

    if (!resposta.ok) {
      throw new Error(dados.erro || "Erro ao redefinir a senha.");
    }

    setSenhaAtual("");
    setNovaSenha("");
    setConfirmarNovaSenha("");
  }

  async function salvar() {
    setSalvando(true);
    try {
      await salvarFoto();
      await salvarNome();
      await salvarTelefone();
      await salvarLocalizacao();
      await salvarSenha();
      Alert.alert("Sucesso", "Alterações salvas.");
    } catch (erro: any) {
      Alert.alert("Erro", erro.message || "Não foi possível salvar as alterações.");
    } finally {
      setSalvando(false);
    }
  }

  function excluir() {
    Alert.alert("Excluir conta", "Deseja excluir sua conta? Essa ação não pode ser desfeita.", [
      { text: "Cancelar", style: "cancel" },
      { text: "Excluir", style: "destructive", onPress: confirmarExclusao },
    ]);
  }

  async function confirmarExclusao() {
    if (!idUsuario) return;

    try {
      setSalvando(true);
      const resposta = await fetch(`${API_URL}/usuarios/${idUsuario}`, {
        method: "DELETE",
      });

      const dados = await resposta.json();

      if (!resposta.ok) {
        throw new Error(dados.erro || "Erro ao excluir a conta.");
      }

      await AsyncStorage.removeItem("usuarioId");
      await AsyncStorage.removeItem("usuarioLogado");
      Alert.alert("Conta excluída", "Sua conta foi excluída com sucesso.");
      router.replace("/login");
    } catch (erro: any) {
      Alert.alert("Erro", erro.message || "Não foi possível excluir a conta.");
    } finally {
      setSalvando(false);
    }
  }

  // Considera que há alteração pendente se nome, telefone, senha ou a foto mudaram
  const temAlteracaoPendente =
    nome !== nomeOriginal ||
    telefone !== telefoneOriginal ||
    cidade !== cidadeOriginal ||
    estado !== estadoOriginal ||
    senhaAtual !== "" ||
    novaSenha !== "" ||
    confirmarNovaSenha !== "" ||
    novaFotoUri !== null ||
    fotoRemovidaPendente;

  // Intercepta a tentativa de sair da tela (voltar, trocar de aba, etc.)
  useEffect(() => {
    const unsubscribe = navigation.addListener("beforeRemove", (e: any) => {
      if (!temAlteracaoPendente || salvando) {
        // Sem alteração pendente, deixa sair normalmente
        return;
      }

      // Bloqueia a saída por enquanto
      e.preventDefault();

      Alert.alert(
        "Sair sem salvar?",
        "Você tem alterações que ainda não foram salvas.",
        [
          {
            text: "Sair sem salvar",
            style: "destructive",
            onPress: () => navigation.dispatch(e.data.action),
          },
          {
            text: "Salvar e sair",
            onPress: async () => {
              await salvar();
              navigation.dispatch(e.data.action);
            },
          },
        ]
      );
    });

    return unsubscribe;
  }, [navigation, temAlteracaoPendente, nome, telefone, cidade, estado, senhaAtual, novaSenha, confirmarNovaSenha, novaFotoUri, fotoRemovidaPendente, salvando]);

  const iniciais = nome
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((n) => n[0]?.toUpperCase())
    .join("");

  // Formata o telefone conforme o usuário digita: (11) 99999-9999
  function formatarTelefone(texto = "") {
    let numeros = texto.replace(/\D/g, "");
    numeros = numeros.slice(0, 11);

    if (numeros.length <= 10) {
      // Fixo ou celular sem o 9: (11) 9999-9999
      numeros = numeros.replace(/(\d{2})(\d)/, "($1) $2");
      numeros = numeros.replace(/(\d{4})(\d)/, "$1-$2");
    } else {
      // Celular com 9 dígitos: (11) 99999-9999
      numeros = numeros.replace(/(\d{2})(\d)/, "($1) $2");
      numeros = numeros.replace(/(\d{5})(\d)/, "$1-$2");
    }

    return numeros;
  }

  if (carregando) {
    return (
      <SafeAreaView style={[s.container, { justifyContent: "center", alignItems: "center" }]}>
        <ActivityIndicator color="#00AFFF" size="large" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={s.container}>
      <View style={s.header}>
        <Header></Header>
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 60 : 0}
      >
        <ScrollView
          style={s.c}
          contentContainerStyle={{ padding: 20, paddingBottom: 40 }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Text style={s.t}>Meu Perfil</Text>

          <TouchableOpacity onPress={escolherFoto} style={s.center}>
            {foto ? (
              <Image source={{ uri: foto }} style={s.img} />
            ) : (
              <View style={s.imgPlaceholder}>
                <Text style={s.imgPlaceholderText}>{iniciais || "?"}</Text>
              </View>
            )}
            <Text style={s.link}>Alterar foto</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={removerFoto}>
            <Text style={s.rem}>Remover foto</Text>
          </TouchableOpacity>

          {/* Nome: editável */}
          <View style={{ marginTop: 16 }}>
            <Text style={s.lbl}>Nome</Text>
            <TextInput value={nome} onChangeText={setNome} style={s.i} />
          </View>

          {/* E-mail: somente leitura, veio do cadastro */}
          <View style={{ marginTop: 16 }}>
            <Text style={s.lbl}>E-mail</Text>
            <TextInput value={email} editable={false} style={[s.i, s.iDesabilitado]} />
          </View>

          {/* Telefone: só é preenchido aqui, depois do login */}
          <View style={{ marginTop: 16 }}>
            <Text style={s.lbl}>Telefone</Text>
            <TextInput
              value={telefone}
              onChangeText={(texto) => setTelefone(formatarTelefone(texto))}
              style={s.i}
              placeholder="(11) 99999-9999"
              placeholderTextColor="#666"
              keyboardType="phone-pad"
            />
          </View>

          {/* Localização: detectada por GPS ou digitada manualmente */}
        <View style={{ marginTop: 24 }}>
          <Text style={s.secaoTitulo}>Localização</Text>
          <Text style={s.secaoSubtitulo}>
            Usada pra mostrar serviços perto de você.
          </Text>

          <TouchableOpacity
            style={s.btnLocalizacao}
            onPress={usarLocalizacaoAtual}
            disabled={buscandoLocalizacao}
          >
            {buscandoLocalizacao ? (
              <ActivityIndicator color="#00AFFF" />
            ) : (
              <>
                <Ionicons name="locate-outline" size={18} color="#00AFFF" />
                <Text style={s.btnLocalizacaoTexto}>
                  Usar minha localização atual
                </Text>
              </>
            )}
          </TouchableOpacity>

          <View style={{ flexDirection: "row", gap: 12, marginTop: 12 }}>
            <View style={{ flex: 2 }}>
              <Text style={s.lbl}>Cidade</Text>
              <TextInput
                value={cidade}
                onChangeText={setCidade}
                style={s.i}
                placeholder="Sua cidade"
                placeholderTextColor="#666"
              />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={s.lbl}>Estado</Text>
              <TextInput
                value={estado}
                onChangeText={setEstado}
                style={s.i}
                placeholder="UF"
                placeholderTextColor="#666"
                autoCapitalize="characters"
                maxLength={2}
              />
            </View>
          </View>
        </View>

        <View style={{ marginTop: 24 }}>
            <Text style={s.secaoTitulo}>Trocar senha</Text>
            <Text style={s.secaoSubtitulo}>Preencha os três campos abaixo apenas se quiser trocar sua senha.</Text>

            <View style={{ marginTop: 12 }}>
              <Text style={s.lbl}>Senha atual</Text>
              <TextInput value={senhaAtual} onChangeText={setSenhaAtual} style={s.i} secureTextEntry />
            </View>

            <View style={{ marginTop: 12 }}>
              <Text style={s.lbl}>Nova senha</Text>
              <TextInput value={novaSenha} onChangeText={setNovaSenha} style={s.i} secureTextEntry />
            </View>

            <View style={{ marginTop: 12 }}>
              <Text style={s.lbl}>Confirmar nova senha</Text>
              <TextInput value={confirmarNovaSenha} onChangeText={setConfirmarNovaSenha} style={s.i} secureTextEntry />
            </View>
          </View>

          <TouchableOpacity style={s.btn} onPress={salvar} disabled={salvando}>
            {salvando ? <ActivityIndicator color="#fff" /> : <Text style={s.btnt}>Salvar Alterações</Text>}
          </TouchableOpacity>
          <TouchableOpacity style={s.del} onPress={excluir} disabled={salvando}>
            <Text style={s.btnt}>Excluir Conta</Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0B0B0B"
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 10
  },
  c: {
    flex: 1,
    backgroundColor: "#0B0B0B"
  },
  t: {
    color: "#fff",
    fontSize: 28,
    fontWeight: "700",
    marginBottom: 20
  },
  center: {
    alignItems: "center"
  },
  img: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: "#222"
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
    fontWeight: "700"
  },
  link: {
    color: "#00AFFF",
    marginTop: 10
  },
  rem: {
    color: "#ff6b6b",
    textAlign: "center",
    marginTop: 8
  },
  lbl: {
    color: "#fff",
    marginBottom: 6
  },
  i: {
    backgroundColor: "#0D1324",
    borderWidth: 1,
    borderColor: "#1E293B",
    borderRadius: 12,
    color: "#fff",
    padding: 12
  },
  iDesabilitado: {
    opacity: 0.5,
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
  },
  btnLocalizacao: {
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
  btnLocalizacaoTexto: {
    color: "#00AFFF",
    fontWeight: "600",
  },
  btn: {
    backgroundColor: "#00AFFF",
    padding: 16,
    borderRadius: 12,
    marginTop: 24
  },
  del: {
    backgroundColor: "#D32F2F",
    padding: 16,
    borderRadius: 12,
    marginTop: 12
  },
  btnt: {
    color: "#fff",
    fontWeight: "700",
    textAlign: "center"
  },
});