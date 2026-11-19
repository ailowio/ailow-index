import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join, resolve } from "node:path";
import { describe, expect, it } from "vitest";

/**
 * S12: trava a stack do Swarm e os arquivos de deploy sem precisar de Docker nem de servidor
 * (scripts/deploy-test.sh cobre o comportamento dos scripts). Lê como texto; nada é executado.
 */
const raiz = resolve(import.meta.dirname, "..");
const ler = (rel: string) => readFileSync(join(raiz, rel), "utf8");
const stack = ler("ops/stack/index.yaml");
const linhasStack = stack.split(/\r?\n/);
const semComentarios = linhasStack.filter((l) => !l.trim().startsWith("#")).join("\n");

function arquivos(dir: string): string[] {
  return readdirSync(dir).flatMap((nome) => {
    const caminho = join(dir, nome);
    return statSync(caminho).isDirectory() ? arquivos(caminho) : [caminho];
  });
}

describe("stack ops/stack/index.yaml", () => {
  it("imagem da tag, obrigatória (sem latest nem default)", () => {
    expect(semComentarios).toMatch(/image: \$\{REGISTRY:-ghcr\.io\/ailowio\}\/ailow-index-web:\$\{TAG:\?/);
    expect(semComentarios).not.toMatch(/:latest/);
  });

  it("o serviço se chama site (não web: o nome curto vira alias de DNS na rede do proxy, compartilhada com o web do Cloud)", () => {
    expect(semComentarios).toMatch(/^services:\n {2}site:\n/m);
    expect(semComentarios).not.toMatch(/^ {2}web:/m);
    expect(ler("ops/deploy/deploy.sh")).toMatch(/^SVC="\$\{STACK\}_site"$/m);
  });

  it("só na rede externa do proxy, com nome vindo de PROXY_NETWORK obrigatório", () => {
    expect(semComentarios).toMatch(/networks:\n\s+- proxy\n/);
    expect(semComentarios).toMatch(/proxy:\n\s+external: true\n\s+name: \$\{PROXY_NETWORK:\?/);
    expect(semComentarios).not.toMatch(/driver: overlay/);
  });

  it("endurecimento: somente leitura, cap_drop ALL, tmpfs em /tmp, limites", () => {
    expect(semComentarios).toMatch(/read_only: true/);
    expect(semComentarios).toMatch(/cap_drop: \[ALL\]/);
    expect(semComentarios).toMatch(/type: tmpfs\n\s+target: \/tmp/);
    expect(semComentarios).toMatch(/memory: \$\{WEB_MEM:-64M\}/);
    expect(semComentarios).toMatch(/cpus: "\$\{WEB_CPUS:-0\.25\}"/);
    expect(semComentarios).not.toMatch(/privileged|network_mode: host|ports:/);
  });

  it("atualização start-first com reversão automática e healthcheck em /health", () => {
    expect(semComentarios).toMatch(/update_config:\n\s+order: start-first\n\s+failure_action: rollback/);
    expect(semComentarios).toMatch(/rollback_config:\n\s+order: start-first/);
    expect(semComentarios).toMatch(/http:\/\/127\.0\.0\.1:8080\/health/);
  });

  it("variáveis obrigatórias com :? (TAG, CERT_RESOLVER, PROXY_NETWORK)", () => {
    for (const nome of ["TAG", "CERT_RESOLVER", "PROXY_NETWORK"]) {
      expect(semComentarios, nome).toMatch(new RegExp(`\\$\\{${nome}:\\?`));
    }
  });

  it("labels: Host do apex e do www, TLS com certresolver, porta 8080", () => {
    expect(semComentarios).toContain("traefik.http.routers.ailow-index.rule=Host(`ailow.com.br`)");
    expect(semComentarios).toContain("traefik.http.routers.ailow-index-www.rule=Host(`www.ailow.com.br`)");
    for (const r of ["ailow-index", "ailow-index-www"]) {
      expect(semComentarios).toContain(`traefik.http.routers.${r}.tls=true`);
      expect(semComentarios).toMatch(new RegExp(`routers\\.${r}\\.tls\\.certresolver=\\$\\{CERT_RESOLVER:\\?`));
    }
    expect(semComentarios).toContain("traefik.http.services.ailow-index.loadbalancer.server.port=8080");
  });

  it("HSTS de 1 ano nos dois hosts", () => {
    expect(semComentarios).toContain("traefik.http.middlewares.ailow-index-hsts.headers.stsSeconds=31536000");
    expect(semComentarios).toContain("traefik.http.routers.ailow-index.middlewares=ailow-index-hsts");
    expect(semComentarios).toMatch(/routers\.ailow-index-www\.middlewares=ailow-index-www-redirect,ailow-index-hsts/);
  });

  it("www redireciona permanente para o apex preservando o caminho ($$ escapa o $ do Compose)", () => {
    expect(semComentarios).toContain("redirectregex.regex=^https://www\\.ailow\\.com\\.br(.*)");
    expect(semComentarios).toContain("redirectregex.replacement=https://ailow.com.br$${1}");
    expect(semComentarios).toContain("redirectregex.permanent=true");
  });

  it("nenhum router/middleware/service colide com o Cloud (ailow-web, ailow-hsts) e todos têm o prefixo ailow-index", () => {
    const nomes = [...semComentarios.matchAll(/traefik\.http\.(?:routers|middlewares|services)\.([a-z0-9-]+)\./g)].map((m) => m[1]);
    expect(nomes.length).toBeGreaterThan(0);
    for (const nome of nomes) {
      expect(nome, nome).toMatch(/^ailow-index(-|$)/);
      expect(nome, nome).not.toMatch(/^ailow-(web|hsts)/);
    }
  });

  it("o exemplo de variáveis só tem nomes e valores não secretos", () => {
    const exemplo = ler("ops/stack/index.env.example");
    const atribuicoes = exemplo.split(/\r?\n/).filter((l) => /^[A-Z_]+=/.test(l));
    expect(atribuicoes.map((l) => l.split("=")[0])).toEqual(["CERT_RESOLVER", "PROXY_NETWORK", "REGISTRY", "ENTRYPOINT", "WEB_MEM", "WEB_CPUS"]);
    expect(exemplo).not.toMatch(/^TAG=/m);
  });
});

describe("arquivos de ops/ e do pipeline", () => {
  it("nenhum IP em ops/** (o repositório é público; o servidor chega por secrets)", () => {
    const ips: string[] = [];
    for (const arq of arquivos(join(raiz, "ops"))) {
      const achados = readFileSync(arq, "utf8").match(/\b(?:\d{1,3}\.){3}\d{1,3}\b/g) ?? [];
      for (const ip of achados) if (ip !== "127.0.0.1") ips.push(`${arq}: ${ip}`);
    }
    expect(ips).toEqual([]);
  });

  it("scripts de shell com terminação LF e set -euo pipefail (scripts/deploy-test.sh usa set -uo por desenho)", () => {
    for (const rel of ["ops/deploy/deploy.sh", "ops/deploy/ssh-entrada.sh", "scripts/deploy-test.sh"]) {
      const txt = ler(rel);
      expect(txt, rel).not.toContain("\r");
      expect(txt.startsWith("#!/usr/bin/env bash\n"), rel).toBe(true);
    }
    for (const rel of ["ops/deploy/deploy.sh", "ops/deploy/ssh-entrada.sh"]) expect(ler(rel), rel).toContain("set -euo pipefail");
    expect(ler(".gitattributes")).toMatch(/\*\.sh text eol=lf/);
  });

  it("comentário em linha própria nos scripts de shell (L-0001)", () => {
    for (const rel of ["ops/deploy/deploy.sh", "ops/deploy/ssh-entrada.sh"]) {
      for (const l of ler(rel).split("\n")) {
        if (l.trim().startsWith("#") || !l.includes(" # ")) continue;
        // `# shellcheck` e `#` dentro de string/regex não contam; qualquer outro comentário no fim da linha falha.
        expect(l, `${rel}: comentário na mesma linha`).toMatch(/["'].*#.*["']|\$#|\$\{#/);
      }
    }
  });

  it("ssh-entrada.sh aceita só deploy vX.Y.Z (regex ancorada) e usa flock", () => {
    const txt = ler("ops/deploy/ssh-entrada.sh");
    expect(txt).toContain("^deploy\\ (v[0-9]+\\.[0-9]+\\.[0-9]+)$");
    expect(txt).toContain("flock -n 9");
    expect(txt).toContain("/var/lock/ailow-index-deploy.lock");
  });

  it("workflows: toda action de terceiros fixada por SHA de 40 hex", () => {
    for (const rel of [".github/workflows/publicar.yml", ".github/workflows/deploy.yml", ".github/workflows/ci.yml"]) {
      const usos = [...ler(rel).matchAll(/^\s*- uses: (\S+)/gm)].map((m) => m[1]);
      expect(usos.length, rel).toBeGreaterThan(0);
      for (const uso of usos) expect(uso, `${rel}: ${uso}`).toMatch(/@[0-9a-f]{40}$/);
    }
  });

  it("deploy.yml: aprovação no Environment producao, sem IP, usuário ou host fixos", () => {
    const deploy = ler(".github/workflows/deploy.yml");
    expect(deploy).toMatch(/name: implantar em producao/);
    expect(deploy).toMatch(/environment: producao/);
    for (const s of ["DEPLOY_SSH_KEY", "DEPLOY_HOST_KEY", "DEPLOY_HOST", "DEPLOY_USER"]) expect(deploy).toContain(`secrets.${s}`);
    expect(deploy).toMatch(/StrictHostKeyChecking=yes/);
    expect(deploy).toMatch(/IdentitiesOnly=yes/);
    expect(deploy).toMatch(/BatchMode=yes/);
    expect(deploy).toMatch(/group: deploy-producao/);
    expect(deploy).not.toMatch(/\b(?:\d{1,3}\.){3}\d{1,3}\b/);
  });

  it("publicar.yml: só em tag vX.Y.Z, escopo mínimo e label de origem", () => {
    const publicar = ler(".github/workflows/publicar.yml");
    expect(publicar).toContain('tags: ["v[0-9]+.[0-9]+.[0-9]+"]');
    expect(publicar).toMatch(/permissions:\n\s+contents: read\n\s+packages: write/);
    expect(publicar).toContain("org.opencontainers.image.source=https://github.com/ailowio/ailow-index");
    expect(existsSync(join(raiz, "Dockerfile"))).toBe(true);
  });
});
