import React, { useState } from "react";
import { View, Text, Image, TouchableOpacity, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";

export default function BumerangueLogo() {
  const router = useRouter();
  const [aberto, setAberto] = useState(false);

  function irPara(rota: string) {
    setAberto(false);
    router.push(rota as any);
  }

  return (
    <View style={styles.container}>

      {/* LOGO + TEXTO */}
      <View style={styles.logoContainer}>
        <Image source={require("../assets/logo.png")} style={styles.logoImage} />
        <Text style={styles.logo}>Bumerangue</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  menuHamburguer: {
    padding: 4,
  },
  logoContainer: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  logoImage: {
    width: 50,
    height: 50,
    marginRight: 8,
  },
  logo: {
    color: "#00AFFF",
    fontSize: 30,
    fontWeight: "bold",
  },
  painel: {
    position: "absolute",
    top: 50,
    left: 0,
    width: 220,
    backgroundColor: "#0D1324",
    paddingVertical: 16,
    paddingHorizontal: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#1E2433",
    elevation: 12,
    zIndex: 100,
  },
  item: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 10,
    borderRadius: 10,
  },
  itemTexto: {
    color: "#E5E7EB",
    fontSize: 16,
    marginLeft: 10,
    fontWeight: "500",
  },
});