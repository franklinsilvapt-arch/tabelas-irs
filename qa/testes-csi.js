/* Testes do CSI contra um calculo independente das regras do DR 3/2006 (art. 8.o a 11.o). */
global.window={}; global.document={readyState:'complete',getElementById:()=>null};
global.LFK={calc:()=>{}};
require('../tabelas-irs/complemento-solidario-idosos.js');
const S=window.__lfCsiSimular;
const r2=v=>Math.round(v*100)/100, rnd=a=>a[Math.floor(Math.random()*a.length)];
let n=0,err=[];
for(let i=0;i<5000;i++){
  const ano=rnd([2026,2027]), casal=Math.random()<.5, ambos=casal&&Math.random()<.5;
  const p1=rnd([0,150,262.4,300,400,450,500,574.33,600,700,900]), p2=casal?rnd([0,200,300,400,600,800,1100]):0;
  const outros=rnd([0,0,0,500,1200,3000]), poup=rnd([0,0,5000,20000,60000,150000]), imo=rnd([0,0,30000,90000]);
  const r=S({ano,casal,ambos,p1,p2,outros,poup,imo}); n++;
  // oraculo
  const VR=ano===2027?720*12:670*12, VRc=VR*7/4, sh=outros+poup/20+imo/20;
  let e1,e2=null;
  if(!casal){ const R=p1*14+sh; e1=R<VR?VR-R:0; }
  else { const Y1=p1*14+sh/2, Y2=p2*14+sh/2, T=Y1+Y2;
    const one=(Ya)=> (Ya<VR&&T<VRc)?Math.min(VR-Ya,VRc-T):0;
    if(!ambos){ e1=one(Y1); }
    else if(Y1<VR&&Y2<VR&&T<VRc){ const tot=VRc-T, w=(VR-Y1)/((VR-Y1)+(VR-Y2)); e1=tot*w; e2=tot*(1-w); }
    else if(Y1<VR){ e1=one(Y1); e2=0; } else if(Y2<VR){ e1=0; e2=one(Y2);} else {e1=0;e2=0;}
  }
  const bad=Math.abs(r.c1-e1)>0.02 || (e2===null? r.c2!==null : Math.abs(r.c2-e2)>0.02) || Math.abs(r.m1-r2(r.c1/12))>0.001;
  if(bad) err.push({ano,casal,ambos,p1,p2,outros,poup,imo,got:[r.c1,r.c2],exp:[e1,e2]});
  if(casal&&ambos&&r.c2!==null&&e2>0&&e1>0&&Math.abs((r.c1+r.c2)-(VRc-(p1*14+p2*14+sh)))>0.02) err.push('soma');
}
console.log(n,'testes',err.length,'erros',JSON.stringify(err.slice(0,3)));
// exemplos
console.log(JSON.stringify(S({ano:2026,casal:false,p1:400,outros:0,poup:0,imo:0})));
console.log(JSON.stringify(S({ano:2026,casal:true,ambos:true,p1:300,p2:500,outros:0,poup:10000,imo:0})));
process.exit(0);
