import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import type { ResumoAvaliacao } from "../src/utils/avaliacoes";

type Props = {
  resumo?: ResumoAvaliacao | null;
  tamanho?: number;
};

export default function Estrelas({ resumo, tamanho = 14 }: Props) {
  if (!resumo || resumo.total === 0) {
    return (
      <View style={styles.linha}>
        <Ionicons name="star-outline" size={tamanho} color="#666" />
        <Text style={[styles.texto, { fontSize: tamanho - 1, color: "#666" }]}>
          Sem avaliações
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.linha}>
      <Ionicons name="star" size={tamanho} color="#FFB800" />
      <Text style={[styles.texto, { fontSize: tamanho - 1 }]}>
        {resumo.media.toFixed(1)} ({resumo.total})
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  linha: { flexDirection: "row", alignItems: "center", gap: 4, marginTop: 4 },
  texto: { color: "#FFB800", fontWeight: "600" },
});