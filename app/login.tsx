import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  Alert,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { registrarPushToken } from "../services/RegistrarPushToken";

//componenetes
import Flecha from "../components/HeaderFlecha";

export default function Cadastro() {
  const router = useRouter();

  const [menuAberto, setMenuAberto] = useState(false);

  const [cpf, setCpf] = useState("");

  const [senha, setSenha] = useState("");

  const verificarLogin = async () => {
    const idUsuario = await AsyncStorage.getItem("usuarioId");

    if (idUsuario) {
      router.push("/oferecerServicos");
    } else {
      router.push("/login");
    }
  };

  //formatação de cpf
  function formatarCPF(texto = "") {
    let cpf = texto.replace(/\D/g, "");

    cpf = cpf.slice(0, 11);

    cpf = cpf.replace(/(\d{3})(\d)/, "$1.$2");
    cpf = cpf.replace(/(\d{3})(\d)/, "$1.$2");
    cpf = cpf.replace(/(\d{3})(\d{1,2})/, "$1-$2");

    return cpf;
  }

  async function fazerLogin() {
    try {
      const response = await fetch(
        "http://172.30.0.226:3000/usuarios/login",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            cpf,
            senha,
          }),
        }
      );

      const data = await response.json();

      if (response.ok) {
        // Salva o id do usuário (usado pelo Perfil e outras telas) - chave correta: "usuarioId"
        await AsyncStorage.setItem("usuarioId", String(data.usuario.id));
        // Mantém o objeto completo também, caso precise em outras telas
        await AsyncStorage.setItem("usuarioLogado", JSON.stringify(data.usuario));

        // 👇 registra o token de notificação push desse usuário
        await registrarPushToken();

        Alert.alert("Sucesso", "Login realizado!");

        router.replace({
          pathname: "/anuncios",
          params: { name: data.usuario.nome },
        });
      } else {
        Alert.alert("Erro", data.erro);
      }
    } catch (error) {
      console.log(error);
      Alert.alert("Erro", "Não foi possível conectar ao servidor");
    }
  }

  return (
    <SafeAreaView style={styles.container}>

      <View style={styles.header}>
        <Flecha />
      </View>

      <View style={{ zIndex: 1000 }}>

      </View>


      {/* CONTEÚDO */}
      <View style={styles.formContainer}>
        {/* Avatar */}
        <View style={styles.avatarContainer}>
          <View style={styles.avatar}>
            <Ionicons name="person-outline" size={36} color="#fff" />
          </View>
        </View>

        <Text style={styles.title}>Logar</Text>

        <Text style={styles.subtitle}>Conecte a sua conta</Text>

        {/* CPF */}
        <Text style={styles.label}>CPF</Text>

        <TextInput
          style={styles.input}
          placeholder="000.000.000-00"
          placeholderTextColor="#777"
          keyboardType="numeric"
          value={cpf}
          onChangeText={(text) => setCpf(formatarCPF(text))}
        />

        {/* SENHA */}
        <Text style={styles.label}>Senha</Text>

        <TextInput
          style={styles.input}
          placeholder="******"
          placeholderTextColor="#777"
          secureTextEntry
          value={senha}
          onChangeText={setSenha}
        />

        {/* BOTÃO LOGIN */}
        <TouchableOpacity style={styles.botaoPrimario} onPress={fazerLogin}>
          <Text style={styles.botaoTexto}>Entrar</Text>
        </TouchableOpacity>

        {/* IR PARA CADASTRO */}
        <TouchableOpacity
          style={styles.botaoSecundario}
          onPress={() => router.push("/cadastro")}
        >
          <Text style={styles.botaoSecundarioTexto}>
            Não tenho uma conta
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0B0B0B",
  },

  header: {
    paddingHorizontal: 20,
    paddingTop: 10,
    zIndex: 1000,
  },

  formContainer: {
    flex: 1,
    alignItems: "center",
    paddingHorizontal: 24,
    paddingTop: 40,
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
  menuBtn: {
    position: "absolute",
    top: 50,
    left: 20,
    zIndex: 100,
    padding: 10,
    borderRadius: 50,
    backgroundColor: "rgba(62,200,255,0.1)",
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
    backgroundColor: "#1E293B",
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