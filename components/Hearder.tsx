import React, { useState } from "react";
import { View, Text, Image, TouchableOpacity, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";

type BumerangueLogoProps = {
  // Quantidade de notificações não lidas. Se não for passado, o sino
  // aparece sem o badge (nenhuma notificação pendente).
  naoLidas?: number;
  // Ação executada ao tocar no sino. Padrão: navega para /NotificacaoScreen.
  onPressNotificacao?: () => void;
};

export default function BumerangueLogo({
  naoLidas = 0,
  onPressNotificacao,
}: BumerangueLogoProps) {
  const router = useRouter();
  const [aberto, setAberto] = useState(false);

  function irPara(rota: string) {
    setAberto(false);
    router.push(rota as any);
  }

  function aoTocarNotificacao() {
    if (onPressNotificacao) {
      onPressNotificacao();
    } else {
      router.push("/NotificacaoScreen");
    }
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

      {/* LOGO + TEXTO */}
      <View style={styles.logoContainer}>
        <Image source={require("../assets/logo.png")} style={styles.logoImage} />
        <Text style={styles.logo} numberOfLines={1} adjustsFontSizeToFit>
          Bumerangue
        </Text>
      </View>

      {/* SINO DE NOTIFICAÇÕES */}
      <TouchableOpacity
        style={styles.notificationButton}
        activeOpacity={0.6}
        onPress={aoTocarNotificacao}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
      >
        <Ionicons name="notifications-outline" size={24} color="#fff" />
        {naoLidas > 0 && (
          <View style={styles.notificationBadge}>
            <Text style={styles.badgeText}>
              {naoLidas > 9 ? "9+" : naoLidas}
            </Text>
          </View>
        )}
      </TouchableOpacity>

      {/* PAINEL LATERAL */}
      {aberto && (
        <View style={styles.painel}>

          <TouchableOpacity
            style={styles.item}
            onPress={() => irPara("/historicoServicos")}
          >
            <Ionicons name="time-outline" size={20} color="#00AFFF" />
            <Text style={styles.itemTexto}>Histórico</Text>
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
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  menuHamburguer: {
    padding: 8,
  },
  logoContainer: {
    flex: 1,
    flexShrink: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginHorizontal: 8, // respiro pra não colar no hambúrguer nem no sino
  },
  logoImage: {
    width: 46,
    height: 46,
    marginRight: 8,
  },
  logo: {
    color: "#00AFFF",
    fontSize: 28,
    fontWeight: "bold",
    flexShrink: 1,
  },
  notificationButton: {
    padding: 6,
    justifyContent: "center",
    alignItems: "center",
  },
  notificationBadge: {
    position: "absolute",
    right: 2,
    top: 2,
    minWidth: 16,
    height: 16,
    paddingHorizontal: 3,
    borderRadius: 8,
    backgroundColor: "#00AFFF",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1.5,
    borderColor: "#0B0B0B",
  },
  badgeText: {
    color: "#fff",
    fontSize: 9,
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