import React, { useEffect, useState } from "react";
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

const API_URL = "http://172.30.1.72:3000";

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
  const [finalizada, setFinalizada] = useState(false);
  const [carregando, setCarregando] = useState(true);
  const [enviando, setEnviando] = useState(false);

  useEffect(() => {

    if(!meuUsuarioId) return;

    async function carregarStatus() {
      try {
        const resposta = await fetch(
          `${API_URL}/trocas/${anuncioId}/${meuUsuarioId}/${outroUsuarioId}`
        );
        const dados = await resposta.json();

        setFinalizada(dados.finalizada);
        setMinhaFoto(dados.minhaFoto);
        setFotoDoOutro(dados.fotoDoOutro);
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

      const resposta = await fetch(`${API_URL}/trocas/enviar-foto`, {
        method: "POST",
        headers: { "Content-Type": "multipart/form-data" },
        body: formData,
      });

      const dados = await resposta.json();
      setMinhaFoto(foto.uri); // mostra local imediatamente

      if (dados.finalizada) {
        setFinalizada(true);
      }
    } catch (erro) {
      console.error("Erro ao enviar foto do serviço:", erro);
      Alert.alert("Erro", "Não foi possível enviar a foto. Tente novamente.");
    } finally {
      setEnviando(false);
    }
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
          <Text style={styles.tituloFinalizado}>Serviço finalizado!</Text>
          <Text style={styles.subtitulo}>O anúncio foi concluído e removido.</Text>
          <TouchableOpacity style={styles.botaoVoltarInicio} onPress={() => router.replace("/")}>
            <Text style={styles.textoBotao}>Voltar ao início</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

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