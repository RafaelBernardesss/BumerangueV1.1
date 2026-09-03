import React, { useState } from "react";
import { useRouter } from "expo-router";
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
} from "react-native";

import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";

//components
import Header from "../components/HeaderEscolha";

export default function Escolha() {
    const router = useRouter();
    const [menuAberto, setMenuAberto] = useState(false);

    return (
        <SafeAreaView style={styles.container}>

            <View style={styles.hearder}>
               <Header></Header>
            </View>
            

             <View style={styles.avatarContainer}>
                      <View style={styles.avatar}>
                        <Ionicons name="person-outline" size={36} color="#fff" />
                      </View>
                    </View>

            {/* BOTÕES CENTRALIZADOS */}
            <View style={styles.centerContainer}>

                <TouchableOpacity style={styles.botaoPrimario} onPress={() => router.push("/login")}>
                    <Text style={styles.botaoTexto}>
                        Já tenho uma conta
                    </Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.botaoSegundario} onPress={() => router.push("/cadastro")}>
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
        flex:1,
        backgroundColor: "#0B0B0B",
    },

    hearder:{
        paddingHorizontal: 20,
        paddingVertical: 10,
    },

    // CENTRALIZAÇÃO
    centerContainer: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        paddingHorizontal: 24,
    },

    // BOTÕES
    botaoPrimario: {
        width: 280,
        height: 50,
        backgroundColor: "#00AFFF",
        borderRadius: 12,
        justifyContent: "center",
        alignItems: "center",
        marginBottom: 15,
    },

    botaoTexto: {
        color: "#000",
        fontSize: 16,
        fontWeight: "600",
    },

    botaoSegundario: {
        width: 280,
        height: 48,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: "#2A2A2A",
        justifyContent: "center",
        alignItems: "center",
    },

    botaoSecundarioTexto: {
        color: "#00AFFF",
        fontSize: 14,
        fontWeight: "500",
    },

    //AVATAR
     avatarContainer: {
    alignItems:"center",
    justifyContent:"center",
    position: "absolute",
    top: 230,
    left: 140,
    marginBottom: 20,
  },

  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "#00AFFF",
    justifyContent: "center",
    alignItems: "center",
    elevation: 10,
  },

});