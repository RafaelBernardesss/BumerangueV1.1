import React, { useState,  } from "react";
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
      {/* BOTÃO HAMBÚRGUER */}
      <TouchableOpacity
        style={styles.menuHamburguer}
        onPress={() => setAberto(!aberto)}
      >
        <Ionicons name="menu" size={30} color="#fff" />
      </TouchableOpacity>

      {/* espaçador pra equilibrar visualmente o ícone da esquerda */}
      <View style={{ width: 30 }} />

      {/* PAINEL LATERAL */}
      {aberto && (
        <View style={styles.painel}>
          <TouchableOpacity style={styles.item} onPress={() => irPara("/perfil")}>
            <Ionicons name="person-outline" size={20} color="#00AFFF" />
            <Text style={styles.itemTexto}>Perfil</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.item} onPress={() => irPara("/menu")}>
            <Ionicons name="home-outline" size={20} color="#00AFFF" />
            <Text style={styles.itemTexto}>Menu</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.item} onPress={() => irPara("/ajuda")}>
            <Ionicons name="help-circle-outline" size={20} color="#00AFFF" />
            <Text style={styles.itemTexto}>Ajuda</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.item} onPress={() => setAberto(false)}>
            <Ionicons name="close-outline" size={20} color="#00AFFF" />
            <Text style={styles.itemTexto}>Fechar</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
  position: "absolute",
  top: 18,
  left: 24,
  zIndex: 999,
  },
  
  menuHamburguer: {
    padding: 4,
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