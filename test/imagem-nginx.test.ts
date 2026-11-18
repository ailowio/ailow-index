import { spawnSync } from "node:child_process";
import { existsSync, mkdtempSync, readdirSync, readFileSync, rmSync, statSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { confDeHashes, hashesDoDist, scriptsInline, scriptsSemHash } from "../scripts/csp.mjs";

/**
 * S11: trava a imagem de produção e o nginx sem precisar de Docker (o job `imagem` do CI
 * sobe o container de verdade). Lê os arquivos como texto; nada é executado.
 */
const raiz = resolve(import.meta.dirname, "..");
const ler = (rel: string) => readFileSync(join(raiz, rel), "utf8");
const dockerfile = ler("Dockerfile");
const nginxBruto = ler("ops/web/nginx.conf");
// `types { ... }` tem chaves aninhadas dentro do location; sai do texto usado para recortar blocos.
const nginx = nginxBruto.replace(/types\s*\{[^}]*\}/g, "TYPES;");
const seguranca = ler("ops/web/seguranca.conf");

/** Corpo `{ ... }` do primeiro `location` que casa com o cabeçalho dado (chaves não aninham aqui). */
function bloco(cabecalho: string): string {
  const i = nginx.indexOf(`${cabecalho} {`);
  expect(i, `location ausente: ${cabecalho}`).toBeGreaterThan(-1);
  return nginx.slice(nginx.indexOf("{", i), nginx.indexOf("}", i));
}

describe("Dockerfile de produção", () => {
  const linhas = dockerfile.split(/\r?\n/);
  const instrucoes = linhas.filter((l) => l.trim() && !l.trim().startsWith("#"));

  it("termina com USER não-root", () => {
    const users = instrucoes.filter((l) => /^USER\s/i.test(l.trim()));
    expect(users.length).toBeGreaterThan(0);
    const ultimo = users[users.length - 1].trim().split(/\s+/)[1];
    expect(["root", "0", "0:0"]).not.toContain(ultimo);
    expect(ultimo).toMatch(/^\d+$/);
    expect(Number(ultimo)).toBeGreaterThan(0);
  });

  it("expõe a 8080 e não usa porta privilegiada", () => {
    const expose = instrucoes.filter((l) => /^EXPOSE\s/i.test(l.trim()));
    expect(expose.map((l) => l.trim())).toEqual(["EXPOSE 8080"]);
  });

  it("usa imagens com tag exata (nada de latest nem tag solta) e nginx sem privilégio", () => {
    const froms = instrucoes.filter((l) => /^FROM\s/i.test(l.trim()));
    expect(froms.length).toBe(2);
    for (const f of froms) {
      const ref = f.trim().split(/\s+/)[1];
      expect(ref).toMatch(/:\d+\.\d+\.\d+/);
      expect(ref).not.toMatch(/latest/);
    }
    expect(froms[1]).toMatch(/nginxinc\/nginx-unprivileged:\d+\.\d+\.\d+/);
  });

  it("comentários só em linha própria (L-0001)", () => {
    for (const l of instrucoes) {
      expect(l, `comentário na mesma linha da instrução: ${l}`).not.toMatch(/\s#\s/);
    }
  });

  it("não carrega segredo nem ENV obrigatório; copia só o dist para o runtime", () => {
    expect(dockerfile).not.toMatch(/^\s*(ENV|ARG)\s+\S*(SECRET|TOKEN|PASSWORD|KEY)/im);
    expect(dockerfile).toMatch(/COPY --from=build \/site\/dist \/usr\/share\/nginx\/html/);
    expect(dockerfile).not.toMatch(/^\s*COPY\s+\.\s/m);
  });

  it("gera os hashes de CSP a partir do dist no build", () => {
    expect(dockerfile).toMatch(/node scripts\/csp\.mjs dist /);
  });

  it(".dockerignore começa negando tudo (allowlist)", () => {
    const di = ler(".dockerignore").split(/\r?\n/).filter((l) => l.trim() && !l.startsWith("#"));
    expect(di[0]).toBe("*");
    expect(di).not.toContain("!.env");
    expect(di.join("\n")).not.toMatch(/!\.env/);
  });
});

describe("ops/web/nginx.conf", () => {
  it("escuta na 8080, sem versão e sem aceitar corpo", () => {
    expect(nginx).toMatch(/listen\s+8080;/);
    expect(nginx).toMatch(/server_tokens\s+off;/);
    expect(nginx).toMatch(/client_max_body_size\s+1k;/);
    expect(nginx).toMatch(/absolute_redirect\s+off;/);
  });

  it("log de acesso em JSON com request_id no stdout; erro no stderr", () => {
    expect(nginx).toMatch(/log_format\s+ailow_json\s+escape=json/);
    expect(nginx).toContain('"request_id":"$request_id"');
    expect(nginx).toMatch(/access_log\s+\/dev\/stdout\s+ailow_json;/);
    expect(nginx).toMatch(/error_log\s+\/dev\/stderr\s+warn;/);
  });

  it("serve o site estático do Astro (diretórios com index.html) e só GET/HEAD", () => {
    expect(nginx).toMatch(/try_files\s+\$uri\s+\$uri\/\s+=404;/);
    expect(nginx).toMatch(/\$request_method !~ \^\(GET\|HEAD\)\$/);
  });

  it("/health responde 200 em texto simples e sem log", () => {
    const b = bloco("location = /health");
    expect(b).toMatch(/access_log\s+off;/);
    expect(b).toMatch(/default_type\s+text\/plain;/);
    expect(b).toMatch(/return\s+200\b/);
  });

  it("sw.js do cartão nunca fica em cache longo", () => {
    const b = bloco("location = /cartao/sw.js");
    expect(b).toContain('add_header Cache-Control "no-cache" always;');
    expect(b).not.toMatch(/max-age|immutable/);
  });

  it("manifest do cartão com o content-type certo e revalidação", () => {
    const b = bloco("location = /cartao/manifest.webmanifest");
    expect(nginxBruto).toMatch(/types\s*\{\s*application\/manifest\+json\s+webmanifest;\s*\}/);
    expect(b).toContain('add_header Cache-Control "no-cache" always;');
  });

  it("assets com hash do Astro são imutáveis por 1 ano; HTML revalida", () => {
    expect(bloco("location ^~ /_astro/")).toContain('"public, max-age=31536000, immutable"');
    expect(bloco("location /")).toContain('add_header Cache-Control "no-cache" always;');
  });

  it("todo location com add_header inclui os cabeçalhos de segurança (add_header não herda)", () => {
    const locs = [...nginx.matchAll(/location\s+[^{]+\{[^}]*\}/g)].map((m) => m[0]);
    expect(locs.length).toBeGreaterThan(4);
    for (const l of locs) {
      if (/add_header/.test(l)) {
        expect(l, l).toMatch(/include\s+\/etc\/nginx\/ailow\/seguranca\.conf;/);
      }
    }
    const semLocation = nginx.replace(/location\s+[^{]+\{[^}]*\}/g, "");
    expect(semLocation).not.toMatch(/add_header/);
  });

  it("inclui o trecho gerado com os hashes de script", () => {
    expect(nginx).toMatch(/include\s+\/etc\/nginx\/ailow\/csp-hashes\.conf;/);
  });
});

describe("ops/web/seguranca.conf (cabeçalhos)", () => {
  const csp = /add_header Content-Security-Policy "([^"]+)" always;/.exec(seguranca)?.[1] ?? "";

  it("tem os cabeçalhos exigidos", () => {
    expect(seguranca).toContain('add_header X-Content-Type-Options "nosniff" always;');
    expect(seguranca).toContain('add_header Referrer-Policy "strict-origin-when-cross-origin" always;');
    expect(seguranca).toContain('add_header X-Frame-Options "DENY" always;');
    expect(seguranca).toMatch(/add_header Permissions-Policy "[^"]*camera=\(\)[^"]*" always;/);
    expect(seguranca).toContain("add_header X-Request-Id $request_id always;");
  });

  it("CSP estrita: default-src self, scripts só por hash, sem eval, sem terceiros", () => {
    expect(csp).toContain("default-src 'self'");
    const script = csp.split(";").find((d) => d.trim().startsWith("script-src")) ?? "";
    expect(script).toContain("'self'");
    expect(script).toContain("$csp_script_hashes");
    expect(script).not.toMatch(/unsafe-inline|unsafe-eval/);
    expect(csp).toContain("object-src 'none'");
    expect(csp).toContain("base-uri 'self'");
    expect(csp).toContain("frame-ancestors 'none'");
    expect(csp).not.toMatch(/https?:|\*/);
  });

  it("HSTS fica no Traefik, não aqui", () => {
    expect(seguranca).not.toMatch(/Strict-Transport-Security/i);
  });
});

describe("CSP por hash dos scripts inline (dist real)", () => {
  let tmp = "";
  let dist = "";

  beforeAll(() => {
    // Dentro do repositório (o Astro move arquivos de .astro/ e falha entre discos); pasta ignorada pelo git.
    tmp = mkdtempSync(join(raiz, "test", ".tmp-build-csp-"));
    dist = join(tmp, "dist");
    const r = spawnSync(process.execPath, [join(raiz, "scripts", "build-cenario.mjs")], {
      cwd: raiz,
      encoding: "utf8",
      timeout: 120_000,
      env: {
        ...process.env,
        ASTRO_TELEMETRY_DISABLED: "1",
        AILOW_OUT_DIR: dist,
        AILOW_CACHE_DIR: join(tmp, "cache"),
      },
    });
    expect(r.status, `${r.stdout}\n${r.stderr}`).toBe(0);
  }, 150_000);

  afterAll(() => rmSync(tmp, { recursive: true, force: true }));

  function paginas(dir: string): string[] {
    return readdirSync(dir).flatMap((n) => {
      const p = join(dir, n);
      if (statSync(p).isDirectory()) return paginas(p);
      return n.endsWith(".html") ? [p] : [];
    });
  }

  it("todo <script> inline de toda página tem o hash no trecho gerado", () => {
    const hashes = hashesDoDist(dist);
    expect(hashes.length).toBeGreaterThan(3);
    const csp = `script-src 'self' ${hashes.join(" ")}`;
    const arquivos = paginas(dist);
    expect(arquivos.length).toBeGreaterThan(50);
    for (const a of arquivos) {
      expect(scriptsSemHash(readFileSync(a, "utf8"), csp), a).toEqual([]);
    }
    expect(confDeHashes(hashes)).toMatch(/^set \$csp_script_hashes "('sha256-[A-Za-z0-9+/=]+' ?)+";$/m);
  });

  it("o extrator enxerga script clássico e module, e ignora src e JSON de dados", () => {
    const html =
      '<script>a()</script><script type="module">b()</script><script src="/x.js"></script><script type="application/ld+json">{"a":1}</script>';
    expect(scriptsInline(html)).toEqual(["a()", "b()"]);
  });

  it("reprova se 1 byte de um script inline mudar depois de gerado o hash", () => {
    const hashes = hashesDoDist(dist);
    const csp = `script-src 'self' ${hashes.join(" ")}`;
    const html = readFileSync(join(dist, "index.html"), "utf8");
    const [primeiro] = scriptsInline(html);
    const alterado = html.replace(primeiro, `${primeiro};`);
    expect(scriptsSemHash(alterado, csp).length).toBe(1);
  });

  it("não há script externo nem handler inline (on*=) no dist", () => {
    for (const a of paginas(dist)) {
      const html = readFileSync(a, "utf8");
      expect(html, a).not.toMatch(/<script[^>]+src=["']https?:/i);
      expect(html, a).not.toMatch(/\son(click|load|error)=/i);
    }
    expect(existsSync(join(dist, "index.html"))).toBe(true);
    writeFileSync(join(tmp, "ok"), "1");
  });
});
