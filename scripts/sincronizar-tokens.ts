// Atualiza src/styles/pulso-tokens.json a partir do tokens.json da bancada (passo manual, ADR 008 item 4).
// Uso: npm run tokens:sincronizar -- [caminho/tokens.json]   (padrão: D:/videos/design-system-pulso/tokens.json, só leitura)
// Depois: npm test (o teste de deriva diz o que o tokens.css precisa acompanhar) e abrir PR.
import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { reduzirTokens } from "../src/styles/pulso-deriva.ts";

const origem = process.argv[2] ?? "D:/videos/design-system-pulso/tokens.json";
const copia = { ...reduzirTokens(JSON.parse(readFileSync(origem, "utf8"))), sincronizado_em: new Date().toISOString().slice(0, 10) };
const destino = resolve("src/styles/pulso-tokens.json");
writeFileSync(destino, `${JSON.stringify(copia, null, 2)}\n`);
console.log(`cópia atualizada: ${destino}`);
