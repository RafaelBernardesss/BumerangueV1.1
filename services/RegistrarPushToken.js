import AsyncStorage from "@react-native-async-storage/async-storage";
import Constants from "expo-constants";
import * as Device from "expo-device";
import * as Notifications from "expo-notifications";
import { Platform } from "react-native";

const API_URL = "http://192.168.18.7:3000";

export async function registrarPushToken() {
  try {
    if (!Device.isDevice) {
      console.log("Notificações push só funcionam em dispositivo físico.");
      return;
    }

    const { status: statusExistente } = await Notifications.getPermissionsAsync();
    let statusFinal = statusExistente;

    if (statusExistente !== "granted") {
      const { status } = await Notifications.requestPermissionsAsync();
      statusFinal = status;
    }

    if (statusFinal !== "granted") {
      console.log("Permissão de notificação negada.");
      return;
    }

    const projectId = Constants.expoConfig?.extra?.eas?.projectId;

    const tokenResposta = await Notifications.getExpoPushTokenAsync({
      projectId,
    });
    const pushToken = tokenResposta.data;

    if (Platform.OS === "android") {
      await Notifications.setNotificationChannelAsync("default", {
        name: "default",
        importance: Notifications.AndroidImportance.MAX,
      });
    }

    const usuarioId = await AsyncStorage.getItem("usuarioId");
    if (!usuarioId) return;

    await fetch(`${API_URL}/usuarios/${usuarioId}/push-token`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ pushToken }),
    });

    console.log("Push token registrado com sucesso.");
  } catch (erro) {
    console.log("Erro ao registrar push token:", erro);
  }
}