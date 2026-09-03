import app from "./src/app.js"

app.get("/", (req, res) => {
    res.send("servidor funcionando")
})

app.listen(3000, () => {
    console.log("Servidor rodando na porta 3000")
});