import { defineCollection } from "astro:content";
import { glob } from "astro/loaders";
import { esquemaPR } from "./changelog/esquemas";

// AILOW_PRS_DIR existe só para os testes de build (test/build/) apontarem para fixtures.
const base = process.env.AILOW_PRS_DIR ?? "./src/content/prs";

export const collections = {
  prs: defineCollection({
    loader: glob({ pattern: "*.md", base }),
    schema: esquemaPR,
  }),
};
