import React, { useState } from "react";
import { useRouter } from "expo-router";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
  KeyboardAvoidingView,
  ScrollView,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import ValidarCpf from "../services/ValidarCpf";
import Flecha from "../components/HeaderFlecha"

export default function Cadastro() {
  const router = useRouter();

  const [menuAberto, setMenuAberto] = useState(false);

  const [nome, setNome] = useState("");
  const [cpf, setCpf] = useState("");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");

  //formatar o cpf
  function formatarCPF(texto ="") {
  let cpf = texto.replace(/\D/g, "");

  cpf = cpf.slice(0, 11);

  cpf = cpf.replace(/(\d{3})(\d)/, "$1.$2");
  cpf = cpf.replace(/(\d{3})(\d)/, "$1.$2");
  cpf = cpf.replace(/(\d{3})(\d{1,2})/, "$1-$2");

  return cpf;
}

// função para cadastrar
  async function cadastrar() {
    // Verifica se todos os campos foram preenchidos
    if (!nome || !cpf || !email || !senha) {
      Alert.alert(
        "Campos obrigatórios",
        "Preencha todos os campos."
      );
      return;
    }

    // Valida o CPF
    if (!ValidarCpf(cpf)) {
      Alert.alert(
        "CPF inválido",
        "Por favor, insira um CPF válido."
      );
      return;
    }

    try {
      const response = await fetch(
        "http://192.168.18.7:3000/usuarios/cadastro",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            nome,
            cpf,
            email,
            senha,
          }),
        }
      );

      const data = await response.json();

      if (response.ok) {
        Alert.alert(
          "Sucesso",
          "Conta criada com sucesso!"
        );

        // Limpa os campos
        setNome("");
        setCpf("");
        setEmail("");
        setSenha("");

        // Vai para a tela de login (replace = não deixa voltar pro cadastro)
        router.replace("/login");
      } else {
        Alert.alert(
          "Erro",
          data.erro || "Não foi possível criar a conta."
        );
      }
    } catch (error) {
      console.log(error);

      Alert.alert(
        "Erro",
        "Não foi possível conectar ao servidor."
      );
    }
  }

  return (
    <SafeAreaView style={styles.container}>

      <View style={styles.header}>
        <Flecha/>
      </View>

      {/* CONTEÚDO */}
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 60 : 0}
      >
        <ScrollView
          contentContainerStyle={styles.formContainer}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Avatar */}
          <View style={styles.avatarContainer}>
            <View style={styles.avatar}>
              <Ionicons
                name="person-outline"
                size={36}
                color="#fff"
              />
            </View>
          </View>

          <Text style={styles.title}>
            Cadastre-se
          </Text>

          <Text style={styles.subtitle}>
            Crie sua conta e faça parte da
            nossa comunidade
          </Text>

          {/* INPUTS */}
          <Text style={styles.label}>
            Nome Completo
          </Text>

          <TextInput
            style={styles.input}
            placeholder="Digite seu nome"
            placeholderTextColor="#777"
            value={nome}
            onChangeText={setNome}
          />

          <Text style={styles.label}>
            CPF
          </Text>

          <TextInput
            style={styles.input}
            placeholder="000.000.000-00"
            placeholderTextColor="#777"
            keyboardType="numeric"
            value={cpf}
            onChangeText={(text) => setCpf(formatarCPF(text))}
          />

          <Text style={styles.label}>
            Email
          </Text>

          <TextInput
            style={styles.input}
            placeholder="exemplo@gmail.com"
            placeholderTextColor="#777"
            keyboardType="email-address"
            autoCapitalize="none"
            value={email}
            onChangeText={setEmail}
          />

          <Text style={styles.label}>
            Senha
          </Text>

          <TextInput
            style={styles.input}
            placeholder="******"
            placeholderTextColor="#777"
            secureTextEntry
            value={senha}
            onChangeText={setSenha}
          />

          {/* BOTÃO */}
          <TouchableOpacity
            style={styles.botaoPrimario}
            onPress={cadastrar}
          >
            <Text style={styles.botaoTexto}>
              Criar conta
            </Text>
          </TouchableOpacity>

          {/* LOGIN */}
          <TouchableOpacity
            style={styles.botaoSecundario}
            onPress={() =>
              router.push("/login")
            }
          >
            <Text
              style={
                styles.botaoSecundarioTexto
              }
            >
              Já tenho uma conta
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0B0B0B",
  },

   header:{
  paddingHorizontal: 20,
  paddingTop: 10,
  zIndex: 1000,
  },

  formContainer: {
    flexGrow: 1,
    alignItems: "center",
    paddingHorizontal: 24,
    paddingTop: 40,
    paddingBottom: 40,
  },

  avatarContainer: {
    alignItems: "center",
    marginBottom: 20,
  },

  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: "#00AFFF",
    justifyContent: "center",
    alignItems: "center",
    elevation: 10,
  },

  title: {
    color: "#FFFFFF",
    fontSize: 28,
    fontWeight: "700",
    marginBottom: 8,
    textAlign: "center",
  },

  subtitle: {
    color: "#A1A1AA",
    fontSize: 14,
    marginBottom: 20,
    textAlign: "center",
  },

  label: {
    alignSelf: "flex-start",
    color: "#E5E7EB",
    fontSize: 14,
    fontWeight: "500",
    marginBottom: 6,
    marginTop: 10,
  },

  input: {
    width: "100%",
    height: 48,
    backgroundColor: "#1E1E1E",
    borderRadius: 12,
    paddingHorizontal: 14,
    color: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#2A2A2A",
    marginBottom: 10,
  },

  botaoPrimario: {
    width: "100%",
    height: 50,
    backgroundColor: "#00AFFF",
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 10,
  },

  botaoTexto: {
    color: "#000",
    fontSize: 16,
    fontWeight: "600",
  },

  botaoSecundario: {
    width: "100%",
    height: 48,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#2A2A2A",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 10,
  },

  botaoSecundarioTexto: {
    color: "#00AFFF",
    fontSize: 14,
    fontWeight: "500",
  },
});