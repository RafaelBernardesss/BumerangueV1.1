export async function enviarNotificacaoPush(pushToken, titulo, corpo, dados = {}) {
  if (!pushToken) return;

  try {
    await fetch("https://exp.host/--/api/v2/push/send", {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        to: pushToken,
        sound: "default",
        title: titulo,
        body: corpo,
        data: dados,
      }),
    });
  } catch (erro) {
    console.error("Erro ao enviar notificação push:", erro);
  }
}