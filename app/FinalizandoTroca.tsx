import React, { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import AsyncStorage from "@react-native-async-storage/async-storage";

const API_URL = "http://192.168.137.173:3000";

function urlFoto(caminho: string | null) {
  if (!caminho) return null;
  return `${API_URL}/${caminho.replace(/\\/g, "/")}`;
}

export default function FinalizacaoTroca() {
  const router = useRouter();
  const params = useLocalSearchParams();

  const anuncioId = params.anuncioId as string;
  const outroUsuarioId = params.outroUsuarioId as string;

  const [meuUsuarioId, setMeuUsuarioId] = useState<string | null>(null);

  useEffect(()=>{
    async function CarregarUsuarioLogado() {
      try{

        const id = await AsyncStorage.getItem("usuarioId");
        if(id) setMeuUsuarioId(id);
      }catch(error){
        console.log("Erro ao carregr usuario logado :", error)
      }
    }
    CarregarUsuarioLogado();
  }, []);

  const [minhaFoto, setMinhaFoto] = useState<string | null>(null);
  const [fotoDoOutro, setFotoDoOutro] = useState<string | null>(null);
  const [minhaConfirmou, setMinhaConfirmou] = useState(false);
  const [outroConfirmou, setOutroConfirmou] = useState(false);
  const [euSouUltimo, setEuSouUltimo] = useState(false);
  const [minhaVez, setMinhaVez] = useState(false);
  const [finalizada, setFinalizada] = useState(false);
  const [carregando, setCarregando] = useState(true);
  const [enviando, setEnviando] = useState(false);
  const [processando, setProcessando] = useState(false);

  // Guarda se na última checagem as duas fotos já estavam enviadas
  // (serve para avisar quando o OUTRO usuário cancelar)
  const tinhaAmbasFotosRef = useRef(false);

  useEffect(() => {

    if(!meuUsuarioId) return;

    async function carregarStatus() {
      try {
        const resposta = await fetch(
          `${API_URL}/troca/${anuncioId}/${meuUsuarioId}/${outroUsuarioId}`
        );

        if(!resposta.ok) {
          const texto = await resposta.text();
          throw new Error(`Erro ${resposta.status}: ${texto}`)
        }

        const dados = await resposta.json();

        // Se antes tinha as duas fotos e agora não tem nenhuma, o outro cancelou
        if (
          tinhaAmbasFotosRef.current &&
          !dados.minhaFoto &&
          !dados.fotoDoOutro &&
          !dados.finalizada
        ) {
          Alert.alert(
            "Troca cancelada",
            "O outro usuário cancelou a finalização. Enviem as fotos novamente."
          );
        }
        tinhaAmbasFotosRef.current = Boolean(dados.minhaFoto && dados.fotoDoOutro);

        setFinalizada(dados.finalizada);
        setMinhaFoto(dados.minhaFoto);
        setFotoDoOutro(dados.fotoDoOutro);
        setMinhaConfirmou(Boolean(dados.minhaConfirmou));
        setOutroConfirmou(Boolean(dados.outroConfirmou));
        setEuSouUltimo(Boolean(dados.euSouUltimo));
        setMinhaVez(Boolean(dados.minhaVez));
        
      } catch (erro) {
        console.error("Erro ao carregar status da finalização:", erro);
      } finally {
        setCarregando(false);
      }
    }

    carregarStatus();
    const interval = setInterval(carregarStatus, 4000);
    return () => clearInterval(interval);
  }, [anuncioId, meuUsuarioId, outroUsuarioId]);

  async function enviarFotoServico() {
    const permissao = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permissao.granted) {
      Alert.alert("Permissão necessária", "Precisamos acessar suas fotos.");
      return;
    }

    const resultado = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.7,
    });

    if (resultado.canceled) return;

    const foto = resultado.assets[0];

    try {
      setEnviando(true);
      const formData = new FormData();
      formData.append("foto", {
        uri: foto.uri,
        name: foto.fileName || "servico.jpg",
        type: "image/jpeg",
      } as any);
      formData.append("anuncioId", String(anuncioId));
      formData.append("usuarioId", String(meuUsuarioId));
      formData.append("outroUsuarioId", String(outroUsuarioId));

      const resposta = await fetch(`${API_URL}/troca/enviar-foto`, {
        method: "POST",
        body: formData,
      });

      const dados = await resposta.json();
      if (!resposta.ok) throw new Error(dados.erro || "Erro ao enviar foto.");

      setMinhaFoto(foto.uri); // mostra local imediatamente
    } catch (erro) {
      console.error("Erro ao enviar foto do serviço:", erro);
      Alert.alert("Erro", "Não foi possível enviar a foto. Tente novamente.");
    } finally {
      setEnviando(false);
    }
  }

  async function chamarTroca(rota: "confirmar" | "cancelar") {
    const resposta = await fetch(`${API_URL}/troca/${rota}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        anuncioId: Number(anuncioId),
        usuarioId: Number(meuUsuarioId),
        outroUsuarioId: Number(outroUsuarioId),
      }),
    });

    const dados = await resposta.json();
    if (!resposta.ok) throw new Error(dados.erro || "Erro na requisição.");
    return dados;
  }

  async function confirmarTroca() {
    try {
      setProcessando(true);
      const dados = await chamarTroca("confirmar");
      if (dados.finalizada) {
        setFinalizada(true);
      } else {
        setMinhaConfirmou(true);
        setMinhaVez(false);
      }
    } catch (erro: any) {
      Alert.alert("Erro", erro.message || "Não foi possível confirmar a troca.");
    } finally {
      setProcessando(false);
    }
  }

  async function cancelarTroca() {
    try {
      setProcessando(true);
      tinhaAmbasFotosRef.current = false; // evita o aviso para quem cancelou
      await chamarTroca("cancelar");
      setMinhaFoto(null);
      setFotoDoOutro(null);
      setMinhaConfirmou(false);
      setOutroConfirmou(false);
      setEuSouUltimo(false);
      setMinhaVez(false);
      Alert.alert("Troca cancelada", "Vocês precisarão enviar as fotos novamente.");
    } catch (erro: any) {
      Alert.alert("Erro", erro.message || "Não foi possível cancelar a troca.");
    } finally {
      setProcessando(false);
    }
  }

  function perguntarConfirmar() {
    Alert.alert("Confirmar troca", "Tem certeza que deseja confirmar a troca?", [
      { text: "Voltar", style: "cancel" },
      { text: "Confirmar", onPress: confirmarTroca },
    ]);
  }

  function perguntarCancelar() {
    Alert.alert(
      "Cancelar troca",
      "Ao cancelar, as fotos de ambos serão apagadas e será preciso refazer a finalização. Deseja continuar?",
      [
        { text: "Voltar", style: "cancel" },
        { text: "Cancelar troca", style: "destructive", onPress: cancelarTroca },
      ]
    );
  }

  if (carregando) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centro}>
          <ActivityIndicator color="#00AFFF" size="large" />
        </View>
      </SafeAreaView>
    );
  }

  if (finalizada) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centro}>
          <Ionicons name="checkmark-circle" size={72} color="#1DB954" />
          <Text style={styles.tituloFinalizado}>Troca finalizada!</Text>
          <Text style={styles.subtitulo}>O anúncio foi concluído e removido.</Text>
          <TouchableOpacity style={styles.botaoVoltarInicio} onPress={() => router.replace("/anuncios")}>
            <Text style={styles.textoBotao}>Voltar ao início</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const ambasFotos = Boolean(minhaFoto && fotoDoOutro);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={26} color="#00AFFF" />
        </TouchableOpacity>
        <Text style={styles.tituloHeader}>Finalizar troca</Text>
        <View style={{ width: 26 }} />
      </View>

      <View style={styles.conteudo}>
        <View style={styles.blocoFoto}>
          <Text style={styles.label}>Foto do outro usuário</Text>
          {fotoDoOutro ? (
            <Image source={{ uri: urlFoto(fotoDoOutro)! }} style={styles.foto} />
          ) : (
            <View style={styles.fotoVazia}>
              <Text style={styles.textoFotoVazia}>Aguardando...</Text>
            </View>
          )}
        </View>

        <View style={styles.blocoFoto}>
          <Text style={styles.label}>Sua foto</Text>
          {minhaFoto ? (
            <Image
              source={{ uri: minhaFoto.startsWith("http") || minhaFoto.startsWith("file") ? minhaFoto : urlFoto(minhaFoto)! }}
              style={styles.foto}
            />
          ) : (
            <TouchableOpacity style={styles.fotoVazia} onPress={enviarFotoServico} disabled={enviando}>
              {enviando ? (
                <ActivityIndicator color="#00AFFF" />
              ) : (
                <>
                  <Ionicons name="camera-outline" size={32} color="#00AFFF" />
                  <Text style={styles.textoFotoVazia}>Enviar foto do serviço</Text>
                </>
              )}
            </TouchableOpacity>
          )}
        </View>

        {minhaFoto && !fotoDoOutro && (
          <Text style={styles.aviso}>
            Aguardando o outro usuário enviar a foto dele para finalizar.
          </Text>
        )}

        {/* CONFIRMAR / CANCELAR: só aparece para quem está na vez */}
        {ambasFotos && (
          <View style={styles.blocoConfirmacao}>
            {minhaVez && euSouUltimo && (
              <Text style={styles.aviso}>
                As duas fotos foram enviadas. Confirme ou cancele a troca.
              </Text>
            )}

            {minhaVez && !euSouUltimo && (
              <Text style={styles.avisoDestaque}>
                O outro usuário confirmou a troca! Aguardando você confirmar ou cancelar.
              </Text>
            )}

            {!minhaVez && minhaConfirmou && (
              <Text style={styles.aviso}>
                Você confirmou. Aguardando o outro usuário confirmar ou cancelar.
              </Text>
            )}

            {!minhaVez && !minhaConfirmou && !outroConfirmou && (
              <Text style={styles.aviso}>
                As duas fotos foram enviadas. Aguardando o outro usuário confirmar ou cancelar.
              </Text>
            )}

            {minhaVez && (
              <View style={styles.acoes}>
                <TouchableOpacity
                  style={[styles.botao, styles.botaoCancelar]}
                  onPress={perguntarCancelar}
                  disabled={processando}
                >
                  <Text style={styles.textoCancelar}>Cancelar</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.botao, styles.botaoConfirmar]}
                  onPress={perguntarConfirmar}
                  disabled={processando}
                >
                  {processando ? (
                    <ActivityIndicator color="#000" size="small" />
                  ) : (
                    <Text style={styles.textoBotao}>Confirmar</Text>
                  )}
                </TouchableOpacity>
              </View>
            )}
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0B0B0B" },
  header: {
    height: 60,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#1A2235",
  },
  tituloHeader: { color: "#fff", fontSize: 17, fontWeight: "700" },
  conteudo: { flex: 1, padding: 20, gap: 20 },
  blocoFoto: { gap: 8 },
  label: { color: "#B8C0CC", fontSize: 13 },
  foto: { width: "100%", height: 220, borderRadius: 12 },
  fotoVazia: {
    width: "100%",
    height: 220,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#202B42",
    backgroundColor: "#141C2E",
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
  },
  textoFotoVazia: { color: "#B8C0CC", fontSize: 13 },
  aviso: { color: "#B8C0CC", fontSize: 13, textAlign: "center", marginTop: 10 },
  avisoDestaque: { color: "#00FF44", fontSize: 14, fontWeight: "600", textAlign: "center" },
  blocoConfirmacao: { gap: 12 },
  acoes: { flexDirection: "row", gap: 10 },
  botao: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  botaoConfirmar: { backgroundColor: "#00FF44" },
  botaoCancelar: {
    backgroundColor: "#1E1E1E",
    borderWidth: 1,
    borderColor: "#FF3B3B",
  },
  textoCancelar: { color: "#FF3B3B", fontWeight: "700" },
  centro: { flex: 1, justifyContent: "center", alignItems: "center", gap: 10, padding: 20 },
  tituloFinalizado: { color: "#fff", fontSize: 20, fontWeight: "700", marginTop: 10 },
  subtitulo: { color: "#B8C0CC", fontSize: 14, textAlign: "center" },
  botaoVoltarInicio: {
    marginTop: 20,
    backgroundColor: "#00AFFF",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 24,
  },
  textoBotao: { color: "#000", fontWeight: "700" },
});