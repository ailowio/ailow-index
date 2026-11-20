---
numero: 80
titulo: "fix(iot): firmware v1.9 para subcontagem e reinícios em loop do gateway"
data: "2026-11"
estado: open
ferramentas: [esp32, littlefs, freertos, mqtt]
soft_skills: [diagnostico-campo, honestidade-de-resultado]
prova: { privada: "diagnóstico de 17/11/2026, sketch v1.9 do gateway, relato do Pedro de 18/11/2026 e gravação da v1.9 nos dois gateways; conferido na colheita de IoT de 20/11/2026 (IOT-COLHEITA.md linhas 460-463)" }
verificacao: confirmado
resumo_dono: "Depois de dias na fábrica, a contagem caiu e os aparelhos reiniciavam sem parar. Uma versão nova do programa deles foi gravada em 18 de novembro de 2026 e está em validação."
status_fato: testando
---

O teste de bancada não pegou o problema. Só depois de dias com os gateways no chão de fábrica a contagem ficou abaixo da média que o MVP recebia.

A primeira hipótese foi perda de pulsos antes de chegarem ao gateway. A comparação entre o código anterior e o novo apontou fragilidades dentro do próprio firmware, e o código foi revisado várias vezes. Com quatro ou cinco dias de operação, o gateway entrou em reinício em loop e parou de enviar.

Em 18 de novembro de 2026, no fim do expediente, a v1.9 foi gravada com sucesso nos dois gateways da fábrica. As primeiras leituras apontaram para a faixa de antes, com apoio parcial.

A validação em campo começa em 19 de novembro. A conferência formal da v1.9, contando à mão e comparando com o banco, segue pendente; até lá, o item segue aberto.
