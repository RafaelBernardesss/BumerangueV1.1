import multer from "multer";
import path from "path";
import fs from "fs";

const pastaDestino = path.join("uploads", "anuncios");

// Garante que a pasta existe antes de salvar qualquer arquivo
if (!fs.existsSync(pastaDestino)) {
  fs.mkdirSync(pastaDestino, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, pastaDestino);
  },
  filename: (req, file, cb) => {
    const nomeUnico = `${Date.now()}-${Math.round(Math.random() * 1e9)}${path.extname(file.originalname)}`;
    cb(null, nomeUnico);
  },
});

function filtroArquivo(req, file, cb) {
  const tiposPermitidos = /jpeg|jpg|png|webp/;
  const extensaoValida = tiposPermitidos.test(path.extname(file.originalname).toLowerCase());
  const mimeValido = tiposPermitidos.test(file.mimetype);

  if (extensaoValida && mimeValido) {
    return cb(null, true);
  }

  cb(new Error("Formato de imagem inválido. Envie JPG, PNG ou WEBP."));
}

const uploadFotoAnuncio = multer({
  storage,
  fileFilter: filtroArquivo,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
});

export default uploadFotoAnuncio;