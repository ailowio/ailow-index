---
numero: 76
titulo: "feat(pulse): coletor MQTT para Postgres"
data: "2026-11"
estado: merged
ferramentas: [python, mqtt, postgres, docker, hostinger]
soft_skills: [diagnostico-campo]
prova: { privada: "documento de histórico do Pulse, de 11/11/2026, com o deploy na VPS Hostinger" }
verificacao: confirmado
resumo_dono: "Um programa no servidor guarda num banco de dados o que os aparelhos da fábrica enviam. Foi testado com uma mensagem de teste; falta o teste com os sensores em campo."
---

Coletor que grava as mensagens MQTT dos gateways em Postgres, em dois containers, publicado na VPS Hostinger e testado com uma publicação de teste em 11 de novembro de 2026. Ainda sem validação com os sensores em campo.
