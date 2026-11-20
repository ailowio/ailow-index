---
numero: 63
titulo: "feat(iot): firmware v1.8 com 25 entradas de sensor"
data: "2026-08"
estado: merged
ferramentas: [esp32, littlefs, mqtt]
soft_skills: [diagnostico-campo]
prova: { privada: "arquivos do firmware v1.8: cabeçalho MQTT de 31/08/2026, binário compilado de 21/10/2026 e documento de passagem de 17/11/2026; conferido na colheita de IoT de 20/11/2026 (IOT-COLHEITA.md linhas 110-113 e 443-452)" }
verificacao: confirmado
---

Firmware v1.8 do gateway: nasceu em 31 de agosto de 2026 com 17 entradas e, em 2 de setembro de 2026, passou a 25 entradas (a entrada nativa do gateway e três módulos de 8), com buffer de cerca de 4 dias sem rede.

A leitura dos módulos usa o protocolo próprio do fabricante deles no barramento. A v1.8 foi gravada em 20 e 21 de outubro de 2026, só no gateway 1; o gateway 2 recebeu a v1.7.
