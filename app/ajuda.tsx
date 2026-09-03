import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";

export default function Ajuda() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>

        {/* Cabeçalho */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={28} color="#00AFFF" />
          </TouchableOpacity>

          <Text style={styles.title}>Central de Ajuda</Text>

          <View style={{ width: 28 }} />
        </View>

        {/* Banner */}
        <View style={styles.banner}>
          <Ionicons
            name="help-circle"
            size={70}
            color="#00AFFF"
          />

          <Text style={styles.bannerTitle}>
            Como podemos ajudar?
          </Text>

          <Text style={styles.bannerText}>
            Encontre respostas para as dúvidas mais frequentes sobre o
            funcionamento do aplicativo.
          </Text>
        </View>

        {/* Perguntas */}

        <Text style={styles.sectionTitle}>
          Perguntas Frequentes
        </Text>

        <HelpCard
          icon="person-add-outline"
          title="Como criar uma conta?"
          description="Escolha a opção 'Cadastrar', informe seus dados e confirme seu e-mail."
        />

        <HelpCard
          icon="swap-horizontal-outline"
          title="Como funciona a troca de serviços?"
          description="Você oferece um serviço e pode solicitar outro em troca, sem utilizar dinheiro."
        />

        <HelpCard
          icon="chatbubbles-outline"
          title="Como conversar com outro usuário?"
          description="Após aceitar uma troca, um chat será disponibilizado para combinar os detalhes."
        />

        <HelpCard
          icon="shield-checkmark-outline"
          title="Minha conta é segura?"
          description="Sim. Seus dados são protegidos e apenas informações necessárias são compartilhadas."
        />

      </ScrollView>
    </SafeAreaView>
  );
}

function HelpCard({
  icon,
  title,
  description,
}: any) {
  return (
    <TouchableOpacity style={styles.card}>

      <Ionicons
        name={icon}
        size={30}
        color="#00AFFF"
      />

      <View style={{ flex: 1, marginLeft: 15 }}>
        <Text style={styles.cardTitle}>
          {title}
        </Text>

        <Text style={styles.cardDescription}>
          {description}
        </Text>
      </View>

      <Ionicons
        name="chevron-forward"
        size={22}
        color="#666"
      />

    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({

  container: {
    flex: 1,
    backgroundColor: "#0B0B0B",
  },

  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 20,
  },

  title: {
    color: "#fff",
    fontSize: 24,
    fontWeight: "bold",
  },

  banner: {
    backgroundColor: "#0D1324",
    marginHorizontal: 20,
    borderRadius: 20,
    padding: 25,
    alignItems: "center",
  },

  bannerTitle: {
    color: "#fff",
    fontSize: 28,
    fontWeight: "bold",
    marginTop: 15,
    textAlign: 'center'
  },

  bannerText: {
    color: "#999",
    textAlign: "center",
    marginTop: 10,
    fontSize: 16,
    lineHeight: 24,
  },

  sectionTitle: {
    color: "#fff",
    fontSize: 24,
    fontWeight: "bold",
    marginHorizontal: 20,
    marginTop: 30,
    marginBottom: 15,
  },

  card: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#0D1324",
    marginHorizontal: 20,
    marginBottom: 15,
    padding: 18,
    borderRadius: 18,
  },

  cardTitle: {
    color: "#fff",
    fontSize: 17,
    fontWeight: "bold",
  },

  cardDescription: {
    color: "#888",
    marginTop: 5,
    lineHeight: 20,
  },

  contactCard: {
    backgroundColor: "#0D1324",
    marginHorizontal: 20,
    borderRadius: 20,
    padding: 25,
    alignItems: "center",
  },

  contactTitle: {
    color: "#fff",
    fontSize: 22,
    fontWeight: "bold",
    marginTop: 15,
  },

  contactText: {
    color: "#00AFFF",
    fontSize: 17,
    marginTop: 10,
  },

  button: {
    backgroundColor: "#00AFFF",
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 15,
    marginTop: 25,
  },

  buttonText: {
    color: "#000",
    fontWeight: "bold",
    fontSize: 16,
  },

});