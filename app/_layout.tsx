import { useEffect } from "react";
import { Stack, useRouter } from "expo-router";
import * as Notifications from "expo-notifications";
import { registrarPushToken } from "@/services/RegistrarPushToken";


Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export default function RootLayout() {
  const router = useRouter();

 
  useEffect(() => {
    registrarPushToken();
  }, []);

 
  const ultimaResposta = Notifications.useLastNotificationResponse();

  useEffect(() => {
    if (!ultimaResposta) return;

    const dados = ultimaResposta.notification.request.content.data as {
      tipo?: "proposta" | "troca";
      anuncioId?: number;
      outroUsuarioId?: number;
    };

    
    if (dados?.tipo === "troca" && dados.anuncioId && dados.outroUsuarioId) {
      router.push({
        pathname: "/finalizacaoTroca",
        params: {
          anuncioId: String(dados.anuncioId),
          outroUsuarioId: String(dados.outroUsuarioId),
        },
      });
    } else {
      router.push("/notificacoes");
    }
  }, [ultimaResposta]);

  return <Stack screenOptions={{ headerShown: false }} />;
}