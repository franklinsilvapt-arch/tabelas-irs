global.window={}; global.document={readyState:'complete',getElementById:()=>null};
global.LFK={calc:()=>{}};
require('../tabelas-irs/licenca-parental.js');
const S=window.__lfLpSimular, DAY=864e5;
// oracle independente
const TAB={old:{'120|none':1,'150|none':.8,'150|share':1,'180|share':.83,'180|pai60':.9},
           neu:{'150|any':1,'180|none':.83,'180|share':1,'210|share':.86,'210|pai60':.9}};
let n=0,err=[];
const rnd=a=>a[Math.floor(Math.random()*a.length)], ri=(a,b)=>a+Math.floor(Math.random()*(b-a+1));
for(let i=0;i<3000;i++){
  const y=rnd([2026,2027]), m=ri(0,11), dd=ri(1,28);
  const parto=Date.UTC(y,m,dd), antes=ri(0,30), bebes=ri(1,3);
  const mae=rnd([0,400,500,537,600,920,1200,1500,2500,6000]), pai=rnd([0,450,920,1800,4000]);
  const r=S({parto,antes,bebes,mae,pai}); n++;
  const ini=parto-antes*DAY, neu=ini>=Date.UTC(2027,0,1);
  if(r.novo!==neu) err.push(['regime',parto,antes]);
  const tab=neu?TAB.neu:TAB.old, keys=Object.keys(tab);
  if(r.opcoes.length!==keys.length) err.push('len');
  keys.forEach((k,j)=>{const [dias,]=k.split('|'),p=tab[k],o=r.opcoes[j];
    const D=+dias+30*(bebes-1);
    if(o.dias!==D||o.p!==p) err.push(['opt',k,o]);
    const fimEsp=new Date(ini); fimEsp.setUTCDate(fimEsp.getUTCDate()+D-1);
    if(o.fim!==fimEsp.getTime()) err.push(['fim',k]);
    const mm=s=>s>0?Math.round(Math.max(Math.round(s/30*p*100)/100,14.32)*30*100)/100:null;
    if(o.mae!==mm(mae)||o.pai!==mm(pai)) err.push(['val',k,mae,pai,o.mae,o.pai,mm(mae),mm(pai)]);
  });
  const f42=new Date(parto); f42.setUTCDate(f42.getUTCDate()+41);
  if(r.fimMae!==f42.getTime()) err.push('42');
}
console.log(n,'testes',err.length,'erros',JSON.stringify(err.slice(0,5)));
// exemplos fixos
const ex=S({parto:Date.UTC(2027,1,10),antes:0,bebes:1,mae:1500,pai:1200});
console.log(ex.novo, ex.opcoes.map(o=>[o.dias,o.p,new Date(o.fim).toISOString().slice(0,10),o.mae,o.pai]));
const ex2=S({parto:Date.UTC(2027,0,10),antes:15,bebes:1,mae:1500,pai:0}); console.log(ex2.novo, new Date(ex2.inicio).toISOString().slice(0,10));
