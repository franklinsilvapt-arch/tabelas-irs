/* Testes do simulador do aumento das pensoes contra um calculo independente (Lei 53-B/2006 art. 6.o e minimos da portaria). */
global.window={}; global.document={readyState:'complete',getElementById:()=>null};
global.LFK={calc:()=>{}};
require('../tabelas-irs/aumento-pensoes.js');
const S=window.__lfPensoesSimular;
const r2=v=>Math.round(v*100)/100;
const IAS=537.13*1.033, IASr=r2(IAS);  // 554.86
let n=0,err=[];
function oraculo(p){
  const L2=r2(2*IASr),L6=r2(6*IASr),L12=r2(12*IASr);
  let a;
  if(p<=L2) a=r2(p*0.033);
  else if(p<=L6) a=Math.max(r2(p*0.0279), r2(L2*0.033));
  else if(p<=L12) a=Math.max(r2(p*0.0254), r2(L6*0.0279));
  else a=0;
  const sup = p<=537.13?200 : p<=1074.26?150 : p<=1611.39?100 : 0;
  return {a,sup};
}
const casos=[];
for(let i=0;i<20000;i++) casos.push(r2(Math.random()*9000));
[0.01,100,262.40,341.08,493.52,537.13,537.14,1074.26,1074.27,1109.72,1109.73,1611.39,1611.40,3329.16,3329.17,6658.32,6658.33,10000].forEach(x=>casos.push(x));
for(const p of casos){
  const r=S(p), o=oraculo(p); n++;
  if(Math.abs(r.aumento-o.a)>0.001 || r.sup!==o.sup || Math.abs(r.nova-r2(p+o.a))>0.001 || Math.abs(r.ano-r2(o.a*14))>0.001 || !isFinite(r.pct)) err.push({p,got:[r.aumento,r.sup],exp:[o.a,o.sup]});
}
// monotonia: a pensao nova nunca desce quando a pensao sobe (exceto no corte legal acima de 12 IAS)
let prev=0, mono=0;
for(let p=1;p<=6658.32;p=r2(p+0.37)){ const nv=S(p).nova; if(nv+1e-9<prev) mono++; prev=nv; }
console.log(n,'casos',err.length,'erros','| quebras de monotonia ate 12 IAS:',mono, JSON.stringify(err.slice(0,3)));
// exemplos do artigo
for(const p of [400,800,1100,1150,1500,3000,4000,7000]){ const r=S(p); console.log(p, r.aumento, r.nova, r.sup); }
process.exit(0);
