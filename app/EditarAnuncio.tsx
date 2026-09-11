import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Image,
  Alert,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useFocusEffect } from "@react-navigation/native";
import Header from "../components/HeaderEscolha";

const API_URL = "http://172.30.1.33:3000";

type Categoria = {
  id: number;
  nome: string;
};

export default function EditarServico() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();

  const [carregandoDados, setCarregandoDados] = useState(true);

  const [carregandoCategorias, setCarregandoCategorias] = useState(true);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [categoriaSelecionada, setCategoriaSelecionada] = useState<number | null>(null);

  const [titulo, setTitulo] = useState("");
  const [descricao, setDescricao] = useState("");
  const [preferencia, setPreferencia] = useState("");
  const [disponibilidade, setDisponibilidade] = useState("");

  const [fotoUri, setFotoUri] = useState<string | null>(null); // nova foto escolhida (local)
  const [fotoAtual, setFotoAtual] = useState<string | null>(null); // foto que já está salva no servidor

  const [localizacaoTexto, setLocalizacaoTexto] = useState("");

  const [salvando, setSalvando] = useState(false);

  useFocusEffect(
    useCallback(() => {
      carregarCategorias();
      carregarAnuncio();
    }, [id])
  );

  async function carregarCategorias() {
    try {
      setCarregandoCategorias(true);
      const resposta = await fetch(`${API_URL}/categorias`);
      const dados = await resposta.json();

      if (resposta.ok) {
        setCategorias(dados.categorias);
      }
    } catch (erro) {
      console.log(erro);
    } finally {
      setCarregandoCategorias(false);
    }
  }

  async function carregarAnuncio() {
    try {
      setCarregandoDados(true);
      const resposta = await fetch(`${API_URL}/anuncios/${id}`);
      const dados = await resposta.json();

      if (!resposta.ok) {
        throw new Error(dados.erro || "Não foi possível carregar o anúncio.");
      }

      const anuncio = dados.anuncio;
      setTitulo(anuncio.titulo);
      setDescricao(anuncio.descricao);
      setPreferencia(anuncio.preferencia);
      setDisponibilidade(anuncio.disponibilidade || "");
      setCategoriaSelecionada(anuncio.categoria.id);
      setFotoAtual(anuncio.foto);

      const local =
        anuncio.cidade && anuncio.estado
          ? `${anuncio.cidade} - ${anuncio.estado}`
          : anuncio.cidade || anuncio.estado || "Não informada";
      setLocalizacaoTexto(local);
    } catch (erro: any) {
      Alert.alert("Erro", erro.message || "Não foi possível conectar ao servidor.");
      router.back();
    } finally {
      setCarregandoDados(false);
    }
  }

  async function escolherFoto() {
    const permissao = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permissao.granted) {
      Alert.alert("Permissão necessária", "Permita o acesso às fotos pra continuar.");
      return;
    }

    const resultado = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      quality: 0.8,
    });

    if (!resultado.canceled) {
      setFotoUri(resultado.assets[0].uri);
    }
  }

  async function salvarAlteracoes() {
    if (!titulo.trim() || titulo.trim().length < 3) {
      Alert.alert("Campo obrigatório", "Informe um título com pelo menos 3 caracteres.");
      return;
    }

    if (!descricao.trim() || descricao.trim().length < 5) {
      Alert.alert("Campo obrigatório", "Informe uma descrição com pelo menos 5 caracteres.");
      return;
    }

    if (!preferencia.trim()) {
      Alert.alert("Campo obrigatório", "Informe sua preferência de troca.");
      return;
    }

    if (!categoriaSelecionada) {
      Alert.alert("Categoria obrigatória", "Escolha uma categoria para o serviço.");
      return;
    }

    try {
      setSalvando(true);

      const formData = new FormData();
      formData.append("titulo", titulo.trim());
      formData.append("descricao", descricao.trim());
      formData.append("preferencia", preferencia.trim());
      formData.append("disponibilidade", disponibilidade.trim());
      formData.append("categoriaId", String(categoriaSelecionada));

      if (fotoUri) {
        const nomeArquivo = fotoUri.split("/").pop() || "foto.jpg";
        const extensao = nomeArquivo.split(".").pop();

        formData.append("foto", {
          uri: fotoUri,
          name: nomeArquivo,
          type: `image/${extensao === "jpg" ? "jpeg" : extensao}`,
        } as any);
      }

      const resposta = await fetch(`${API_URL}/anuncios/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "multipart/form-data",
        },
        body: formData,
      });

      const dados = await resposta.json();

      if (!resposta.ok) {
        throw new Error(dados.erro || "Não foi possível salvar as alterações.");
      }

      Alert.alert("Sucesso", "Anúncio atualizado com sucesso!", [
        { text: "OK", onPress: () => router.back() },
      ]);
    } catch (erro: any) {
      Alert.alert("Erro", erro.message || "Não foi possível conectar ao servidor.");
    } finally {
      setSalvando(false);
    }
  }

  if (carregandoDados) {
    return (
      <View style={[styles.container, { justifyContent: "center" }]}>
        <View style={styles.header}>
          <Header></Header>
        </View>
        <ActivityIndicator color="#00AFFF" size="large" style={{ marginTop: 60 }} />
      </View>
    );
  }

  const fotoParaExibir = fotoUri
    ? fotoUri
    : fotoAtual
    ? `${API_URL}/${fotoAtual.replace(/\\/g, "/")}`
    : null;

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Header></Header>
      </View>

      {/* Título */}
      <View style={styles.titleContainer}>
        <Text style={styles.title}>Editar serviço</Text>
        <Text style={styles.subtitle}>
          Atualize as informações do seu anúncio.
        </Text>
      </View>

      {/* Título do serviço */}
      <Text style={styles.label}>Título do serviço</Text>
      <TextInput
        style={styles.input}
        placeholder="Criação de Sites Profissionais"
        placeholderTextColor="#888"
        value={titulo}
        onChangeText={setTitulo}
      />

      {/* Descrição */}
      <Text style={styles.label}>Descrição</Text>
      <TextInput
        style={[styles.input, styles.textArea]}
        multiline
        numberOfLines={5}
        placeholder="Descreva seu serviço..."
        placeholderTextColor="#888"
        value={descricao}
        onChangeText={setDescricao}
      />

      {/* Preferência e Disponibilidade */}
      <View style={styles.row}>
        <View style={styles.half}>
          <Text style={styles.label}>Preferência de troca</Text>
          <TextInput
            style={styles.input}
            placeholder="Ex: Desenvolvedor"
            placeholderTextColor="#888"
            value={preferencia}
            onChangeText={setPreferencia}
          />
        </View>

        <View style={styles.half}>
          <Text style={styles.label}>Disponibilidade</Text>
          <TextInput
            style={styles.input}
            placeholder="Ex: Seg a sex, 8h-18h"
            placeholderTextColor="#888"
            value={disponibilidade}
            onChangeText={setDisponibilidade}
          />
        </View>
      </View>

      {/* Categoria */}
      <Text style={styles.label}>Categoria</Text>

      {carregandoCategorias ? (
        <ActivityIndicator color="#00AFFF" style={{ marginTop: 10 }} />
      ) : categorias.length === 0 ? (
        <Text style={styles.avisoVazio}>
          Nenhuma categoria cadastrada ainda.
        </Text>
      ) : (
        <View style={styles.tagsContainer}>
          {categorias.map((categoria) => {
            const selecionada = categoriaSelecionada === categoria.id;
            return (
              <TouchableOpacity
                key={categoria.id}
                style={[styles.tag, selecionada && styles.tagSelecionada]}
                onPress={() => setCategoriaSelecionada(categoria.id)}
              >
                <Text
                  style={[
                    styles.tagText,
                    selecionada && styles.tagTextSelecionada,
                  ]}
                >
                  {categoria.nome}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      )}

      {/* Upload */}
      <Text style={styles.label}>Foto do serviço</Text>

      <TouchableOpacity style={styles.uploadBox} onPress={escolherFoto}>
        {fotoParaExibir ? (
          <Image source={{ uri: fotoParaExibir }} style={styles.fotoPreview} />
        ) : (
          <>
            <Ionicons name="cloud-upload-outline" size={40} color="#00AFFF" />
            <Text style={styles.uploadText}>Clique para enviar uma imagem</Text>
            <Text style={styles.uploadSub}>PNG ou JPG até 10MB</Text>
          </>
        )}
      </TouchableOpacity>
      {fotoParaExibir && (
        <Text style={styles.uploadSub}>Toque na imagem para trocar a foto.</Text>
      )}

      {/* Localização (somente leitura) */}
      <Text style={styles.label}>Localização</Text>
      <View style={styles.localizacaoBox}>
        <Ionicons name="location-outline" size={18} color="#00AFFF" />
        <Text style={styles.localizacaoTexto}>{localizacaoTexto}</Text>
      </View>
      <Text style={styles.localizacaoAviso}>
        Pra mudar, atualize sua localização na tela de Perfil.
      </Text>

      {/* Botão */}
      <TouchableOpacity
        style={styles.button}
        onPress={salvarAlteracoes}
        disabled={salvando}
      >
        {salvando ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <>
            <Ionicons name="checkmark-done" size={20} color="#fff" />
            <Text style={styles.buttonText}>SALVAR ALTERAÇÕES</Text>
          </>
        )}
      </TouchableOpacity>

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0B0B0B",
    padding: 20,
  },

  header: {
    marginTop: 40,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  titleContainer: {
    alignItems: "center",
    marginVertical: 30,
  },

  title: {
    color: "#fff",
    fontSize: 32,
    fontWeight: "bold",
  },

  subtitle: {
    color: "#9CA3AF",
    marginTop: 8,
    textAlign: "center",
  },

  label: {
    color: "#fff",
    fontSize: 16,
    marginBottom: 8,
    marginTop: 15,
  },

  input: {
    backgroundColor: "#0D1626",
    borderWidth: 1,
    borderColor: "#00AFFF",
    borderRadius: 12,
    padding: 15,
    color: "#fff",
  },

  textArea: {
    height: 120,
    textAlignVertical: "top",
  },

  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
  },

  half: {
    flex: 1,
  },

  tagsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },

  tag: {
    borderWidth: 1,
    borderColor: "#00AFFF",
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 18,
  },

  tagSelecionada: {
    backgroundColor: "#00AFFF",
  },

  tagText: {
    color: "#00AFFF",
  },

  tagTextSelecionada: {
    color: "#0B0B0B",
    fontWeight: "700",
  },

  avisoVazio: {
    color: "#888",
    marginTop: 5,
  },

  uploadBox: {
    borderWidth: 1,
    borderColor: "#00AFFF",
    borderStyle: "dashed",
    borderRadius: 12,
    padding: 30,
    alignItems: "center",
    marginTop: 10,
    overflow: "hidden",
  },

  fotoPreview: {
    width: "100%",
    height: 180,
    borderRadius: 8,
  },

  uploadText: {
    color: "#fff",
    marginTop: 10,
    fontSize: 16,
  },

  uploadSub: {
    color: "#888",
    marginTop: 5,
  },

  localizacaoBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#0D1626",
    borderWidth: 1,
    borderColor: "#1F3C5E",
    borderRadius: 12,
    padding: 15,
  },

  localizacaoTexto: {
    color: "#fff",
    fontSize: 15,
  },

  localizacaoAviso: {
    color: "#888",
    fontSize: 12,
    marginTop: 6,
  },

  button: {
    backgroundColor: "#00AFFF",
    borderRadius: 12,
    padding: 18,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 25,
    gap: 10,
  },

  buttonText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 18,
  },
});