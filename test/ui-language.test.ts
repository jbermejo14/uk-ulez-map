import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";

// La web es para público británico: ningún texto visible puede estar en español.

// npm test se ejecuta desde la raíz del proyecto.
const PROJECT_ROOT = process.cwd();
const SCANNED_DIRECTORIES = ["app", "components"];
const SCANNED_FILES = ["lib/compliance.ts"];
const SOURCE_EXTENSIONS = [".ts", ".tsx"];

// Palabras típicas del español que no existen (o no se usan) en inglés británico.
const SPANISH_WORDS = [
  "comprobador",
  "matr[ií]cula",
  "matriculaci[oó]n",
  "combustible",
  "verificado",
  "fuente",
  "aviso",
  "turismo",
  "furgoneta",
  "gasolina",
  "diésel",
  "estimaci[oó]n",
  "certeza",
  "pendientes",
];

const LETTER = "A-Za-zÀ-ÿ";
const SPANISH_WORD_PATTERN = new RegExp(
  `(?<![${LETTER}])(${SPANISH_WORDS.join("|")})(?![${LETTER}])`,
  "i"
);
const SPANISH_PUNCTUATION_PATTERN = /[¿¡]/;

function uiLanguageCollectSources(directory: string): string[] {
  return readdirSync(directory).flatMap((entry) => {
    const fullPath = path.join(directory, entry);
    if (statSync(fullPath).isDirectory()) return uiLanguageCollectSources(fullPath);
    return SOURCE_EXTENSIONS.includes(path.extname(fullPath)) ? [fullPath] : [];
  });
}

// Quita comentarios de bloque y de línea; el "//" de una URL ("https://") se respeta.
function uiLanguageStripComments(source: string): string {
  return source.replace(/\/\*[\s\S]*?\*\//g, "").replace(/(?<!:)\/\/.*$/gm, "");
}

function uiLanguageFindSpanish(source: string): string[] {
  return uiLanguageStripComments(source)
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => SPANISH_WORD_PATTERN.test(line) || SPANISH_PUNCTUATION_PATTERN.test(line));
}

describe("UI language", () => {
  test("detector flags Spanish text and ignores Spanish comments", () => {
    assert.equal(uiLanguageFindSpanish("<p>Comprobador de Emisiones</p>").length, 1);
    assert.equal(uiLanguageFindSpanish('const m = "¿Vehículo con tarifas?";').length, 1);
    assert.equal(uiLanguageFindSpanish("// Comprobador de la matrícula\nconst a = 1;").length, 0);
    assert.equal(uiLanguageFindSpanish("/* Fuente Oficial */ const a = 1;").length, 0);
    assert.equal(uiLanguageFindSpanish("<p>Check your diesel car</p>").length, 0);
  });

  test("components, pages, API routes and compliance messages contain no Spanish text", () => {
    const files = [
      ...SCANNED_DIRECTORIES.flatMap((dir) => uiLanguageCollectSources(path.join(PROJECT_ROOT, dir))),
      ...SCANNED_FILES.map((file) => path.join(PROJECT_ROOT, file)),
    ];
    assert.ok(files.length > 0, "No source files were found to scan");

    const offences = files.flatMap((file) =>
      uiLanguageFindSpanish(readFileSync(file, "utf8")).map(
        (line) => `${path.relative(PROJECT_ROOT, file)}: ${line}`
      )
    );
    assert.deepEqual(offences, [], `Spanish text found in UI sources:\n${offences.join("\n")}`);
  });
});
