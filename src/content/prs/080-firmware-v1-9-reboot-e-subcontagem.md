---
numero: 80
titulo: "fix(iot): firmware v1.9 para subcontagem e reinícios em loop do gateway"
data: "2026-11"
estado: open
ferramentas: [esp32, littlefs, freertos, mqtt]
soft_skills: [diagnostico-campo, honestidade-de-resultado]
prova: { privada: "diagnóstico de 17/11/2026, sketch v1.9 do gateway, relato do Pedro de 18/11/2026 e gravação da v1.9 nos dois gateways" }
verificacao: confirmado
---

O teste de bancada não pegou o problema. Só depois de dias com os gateways no chão de fábrica a contagem ficou abaixo da média que o MVP recebia.

A primeira hipótese foi perda de pulsos antes de chegarem ao gateway. A comparação entre o código anterior e o novo apontou fragilidades dentro do próprio firmware, e o código foi revisado várias vezes. Com quatro ou cinco dias de operação, o gateway entrou em reinício em loop e parou de enviar.

Em 18 de novembro de 2026, no fim do expediente, a v1.9 foi gravada com sucesso nos dois gateways da fábrica. As primeiras leituras voltaram à faixa de antes.

A validação em campo começa em 19 de novembro. Até lá, o item segue aberto.
