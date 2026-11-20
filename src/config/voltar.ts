/**
 * Trava do Voltar (ADR 003, item 4; UXM-03). Desde a F0 (2026-11-20) vale só no cartão instalado:
 * saiu da home para quem chega por link conseguir voltar à origem (exceção EX-03, docs/excecoes.md).
 * O navegador ignora pushState sem gesto do usuário, então a entrada de reserva nasce no 1º toque/tecla.
 * Se o Voltar pousar na entrada anterior (sem a marca `t`), avança de novo. Limitação conhecida (igual ao Ailow Cloud):
 * sem nenhum gesto, o navegador pode sair do site. Também trata a volta por back_forward que recarrega a entrada 0.
 */
export const scriptVoltar = `(function(){var h=history,a=0;function t(){return h.state&&h.state.t}function f(){if(!t())h.forward()}function k(){if(a)return;a=1;if(!t())h.pushState({t:1},"")}addEventListener("pointerdown",k,{capture:true,once:true});addEventListener("keydown",k,{capture:true,once:true});addEventListener("popstate",f);try{var n=performance.getEntriesByType("navigation")[0];if(n&&n.type==="back_forward")f()}catch(e){}})()`;
