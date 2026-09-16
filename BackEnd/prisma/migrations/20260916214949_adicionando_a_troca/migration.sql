/*
  Warnings:

  - Added the required column `anuncioId` to the `Mensagem` table without a default value. This is not possible if the table is not empty.

*/
-- CreateTable
CREATE TABLE "Troca" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "anuncioId" INTEGER NOT NULL,
    "usuarioAId" INTEGER NOT NULL,
    "usuarioBId" INTEGER NOT NULL,
    "usuarioAFoto" TEXT,
    "usuarioBFoto" TEXT,
    "finalizada" BOOLEAN NOT NULL DEFAULT false,
    "criadoEm" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" DATETIME NOT NULL,
    CONSTRAINT "Troca_anuncioId_fkey" FOREIGN KEY ("anuncioId") REFERENCES "Anuncio" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Mensagem" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "conteudo" TEXT NOT NULL,
    "tipo" TEXT NOT NULL DEFAULT 'texto',
    "data_hora" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "remetenteId" INTEGER NOT NULL,
    "destinatarioId" INTEGER NOT NULL,
    "anuncioId" INTEGER NOT NULL,
    CONSTRAINT "Mensagem_remetenteId_fkey" FOREIGN KEY ("remetenteId") REFERENCES "Usuario" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Mensagem_destinatarioId_fkey" FOREIGN KEY ("destinatarioId") REFERENCES "Usuario" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Mensagem_anuncioId_fkey" FOREIGN KEY ("anuncioId") REFERENCES "Anuncio" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Mensagem" ("conteudo", "data_hora", "destinatarioId", "id", "remetenteId") SELECT "conteudo", "data_hora", "destinatarioId", "id", "remetenteId" FROM "Mensagem";
DROP TABLE "Mensagem";
ALTER TABLE "new_Mensagem" RENAME TO "Mensagem";
CREATE TABLE "new_Proposta" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "mensagem" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pendente',
    "criadoEm" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "anuncioId" INTEGER NOT NULL,
    "propostoPor" INTEGER NOT NULL,
    CONSTRAINT "Proposta_anuncioId_fkey" FOREIGN KEY ("anuncioId") REFERENCES "Anuncio" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Proposta_propostoPor_fkey" FOREIGN KEY ("propostoPor") REFERENCES "Usuario" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Proposta" ("anuncioId", "criadoEm", "id", "mensagem", "propostoPor", "status") SELECT "anuncioId", "criadoEm", "id", "mensagem", "propostoPor", "status" FROM "Proposta";
DROP TABLE "Proposta";
ALTER TABLE "new_Proposta" RENAME TO "Proposta";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "Troca_anuncioId_usuarioBId_key" ON "Troca"("anuncioId", "usuarioBId");
