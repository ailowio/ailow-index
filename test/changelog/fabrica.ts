import type { Catalogos, EntradaPR } from "../../src/changelog/tipos";

/** Catálogos mínimos e estáveis para os testes de regra (não dependem do catálogo real). */
export const catalogosTeste: Catalogos = {
  ferramentas: [
    { id: "react", nome: "React", categoria: "front" },
    { id: "supabase", nome: "Supabase", categoria: "back" },
    { id: "n8n", nome: "n8n", categoria: "automacao-ia" },
    { id: "docker", nome: "Docker", categoria: "infra", principal: true },
  ],
  softSkills: [
    { id: "discovery", nome: "Discovery com usuário leigo" },
    { id: "diagnostico", nome: "Diagnóstico no chão de fábrica" },
  ],
};

let seq = 0;

/** Cria uma entrada válida e confirmada; o teste sobrescreve só o que importa para a regra. */
export function pr(parcial: Partial<EntradaPR> = {}): EntradaPR {
  seq += 1;
  const numero = parcial.numero ?? seq;
  return {
    id: `${String(numero).padStart(3, "0")}-entrada`,
    numero,
    titulo: "feat(sgi): primeira tela do sistema",
    data: "2025-12",
    estado: "merged",
    ferramentas: [],
    soft_skills: [],
    prova: { privada: "commit inicial no repositório privado" },
    verificacao: "confirmado",
    corpo: "",
    ...parcial,
  };
}
