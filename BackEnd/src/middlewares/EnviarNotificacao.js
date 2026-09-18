export async function enviarNotificacaoPush(pushToken, titulo, corpo, dados = {}) {
  if (!pushToken) {
    console.log("Push não enviado: token ausente");
    return;
  }

  try {
    const resposta = await fetch("https://exp.host/--/api/v2/push/send", {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Accept-encoding": "gzip, deflate",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        to: pushToken,
        sound: "default",
        title: titulo,
        body: corpo,
        data: dados,
        channelId: "default",
        priority: "high",
      }),
    });

    const resultado = await resposta.json();
    console.log("Resposta Expo Push:", JSON.stringify(resultado));

    if (resultado.data?.status === "error") {
      console.error(
        "Erro no ticket Expo:",
        resultado.data.message,
        resultado.data.details
      );
    }

    return resultado;
  } catch (erro) {
    console.error("Erro ao enviar notificação push:", erro);
  }
}


export const enviarPushNotification = enviarNotificacaoPush;