/* Testes da PSU contra um calculo independente do DL 166/2026 (art. 7.o, 8.o, 10.o a 14.o, 24.o a 28.o). */
global.window={}; global.document={readyState:'complete',getElementById:()=>null};
global.LFK={calc:()=>{}};
require('../tabelas-irs/prestacao-social-unica.js');
const S=window.__lfPsuSimular;
const rnd=a=>a[Math.floor(Math.random()*a.length)];
const IAS=537.13, V=Math.round(IAS*50)/100; // 268,57
let n=0,err=[];
function oraculo(o){
  // pessoas e escala de equivalencia
  const pesos=[1].concat(Array(o.adultos).fill(0.7),Array(o.menores).fill(0.5));
  const base=V*pesos.reduce((a,b)=>a+b,0);
  // rendimentos mensais
  const trab=o.trab*o.meses/12;
  const pens=o.pens*14/12;
  const juros=o.poup>15*IAS? o.poup*Math.max(0.03,0.03225+0.01)/12 : 0;
  const pred=o.imo*0.05/12;
  const R=trab+pens+o.outros+juros+pred;
  if(o.poup>60*IAS||o.moveis>60*IAS||!(R<base)) return 0;
  const cit= trab<=0.2*IAS ? trab : 0.2*IAS+(trab-0.2*IAS)/2;
  let g=base+cit-R, m=0;
  if(o.maj==='desemprego') m=Math.max(0,0.8*IAS-g);
  if(o.maj==='par-tu') m=0.8*IAS-1*V;
  if(o.maj==='par-outro'&&o.adultos>0) m=0.8*IAS-0.7*V;
  let t=Math.min(g+m,6*IAS);
  return t<10?0:t;
}
for(let i=0;i<5000;i++){
  const o={adultos:rnd([0,0,1,1,2,3,5]),menores:rnd([0,0,1,2,3,6]),trab:rnd([0,0,0,100,107.43,200,300,450,600,870,1200,2000]),
    meses:rnd([12,14]),pens:rnd([0,0,0,150,262.4,400,700]),outros:rnd([0,0,0,50,120,300]),
    poup:rnd([0,0,3000,8056,8060,20000,32227,32228,50000]),imo:rnd([0,0,20000,80000]),moveis:rnd([0,0,5000,32227.8,40000]),
    maj:rnd(['nenhuma','nenhuma','desemprego','par-tu','par-outro'])};
  const r=S(o); n++;
  const e=oraculo(o);
  if(Math.abs(r.psu-e)>0.03) err.push({o,got:r.psu,exp:e});
}
console.log(n,'testes',err.length,'erros',JSON.stringify(err.slice(0,3)));
// exemplos conhecidos (Calculadora Capital, ago 2026)
const ex=[
  [{adultos:0,menores:0,trab:268.56,meses:12,pens:0,outros:0,poup:0,imo:0,moveis:0,maj:'nenhuma'},188.00],
  [{adultos:0,menores:0,trab:268.58,meses:12,pens:0,outros:0,poup:0,imo:0,moveis:0,maj:'nenhuma'},0],
  [{adultos:0,menores:2,trab:300,meses:12,pens:0,outros:0,poup:0,imo:0,moveis:0,maj:'nenhuma'},440.86],
  [{adultos:1,menores:2,trab:0,meses:12,pens:0,outros:0,poup:0,imo:0,moveis:0,maj:'nenhuma'},725.14],
  [{adultos:0,menores:0,trab:0,meses:12,pens:0,outros:0,poup:0,imo:0,moveis:0,maj:'desemprego'},429.70],
];
for(const [o,v] of ex){ const r=S(o); console.log(JSON.stringify(o.trab)+' '+o.adultos+'/'+o.menores+' '+o.maj+' ->',r.psu,'esperado',v, Math.abs(r.psu-v)<=0.02?'OK':'FALHA'); }
process.exit(0);
