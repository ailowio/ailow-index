---
numero: 56
titulo: "feat(iot): broker MQTT no servidor próprio e firmware v1.6 escrito para MQTT"
data: "2026-07"
estado: merged
ferramentas: [mqtt, mosquitto, hostinger, esp32, vps-linux]
soft_skills: [diagnostico-campo, decisao-documentada]
prova: { privada: "documentação do broker (pasta criada em 11/07/2026), sketch v1.6 de 14/07/2026 e documento de arquitetura do Pulse, que descreve o broker na VPS Hostinger; conferido na colheita de IoT de 20/11/2026 (IOT-COLHEITA.md linhas 105 e 453-455)" }
verificacao: confirmado
---

Broker MQTT (Mosquitto) no servidor próprio, uma VPS Hostinger, em julho de 2026. O firmware v1.6 do gateway foi escrito para deixar o HTTP e publicar por MQTT, mas não chegou a ser gravado em hardware: o primeiro MQTT em equipamento foi a v1.7, em bancada, e em campo a v1.8, em 20 de outubro de 2026.
