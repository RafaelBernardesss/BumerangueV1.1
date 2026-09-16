import multer from "multer";
import path from "path";
import fs from "fs";


const pastaUploads = path.resolve("uploads", "chat");


if (!fs.existsSync(pastaUploads)) {
  fs.mkdirSync(pastaUploads, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, pastaUploads);
  },
  filename: (req, file, cb) => {
  
    const idRemetente = req.body?.remetenteId || "anonimo";
    const extensao = path.extname(file.originalname);
    const nomeArquivo = `chat_${idRemetente}_${Date.now()}${extensao}`;
    cb(null, nomeArquivo);
  },
});


function filtroArquivo(req, file, cb) {
  const tiposPermitidos = /jpeg|jpg|png|webp/;
  const extensaoValida = tiposPermitidos.test(
    path.extname(file.originalname).toLowerCase()
  );
  const mimeValido = tiposPermitidos.test(file.mimetype);

  if (extensaoValida && mimeValido) {
    cb(null, true);
  } else {
    cb(new Error("Apenas imagens JPEG, JPG, PNG ou WEBP são permitidas."));
  }
}

const uploadFotoChat = multer({
  storage,
  fileFilter: filtroArquivo,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
});

export default uploadFotoChat;