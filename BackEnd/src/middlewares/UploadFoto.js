import multer from "multer";
import path from "path";
import fs from "fs";

// Pasta onde as fotos de perfil serão salvas
const pastaUploads = path.resolve("uploads", "perfil");

// Garante que a pasta exista
if (!fs.existsSync(pastaUploads)) {
  fs.mkdirSync(pastaUploads, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, pastaUploads);
  },
  filename: (req, file, cb) => {
    // Nome único: userId + timestamp + extensão original
    const idUsuario = req.user?.id || req.params?.id || "anonimo";
    const extensao = path.extname(file.originalname);
    const nomeArquivo = `usuario_${idUsuario}_${Date.now()}${extensao}`;
    cb(null, nomeArquivo);
  },
});

// Filtro: aceita apenas imagens
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

const uploadFoto = multer({
  storage,
  fileFilter: filtroArquivo,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
});

export default uploadFoto;