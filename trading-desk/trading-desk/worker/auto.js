// Cerca (e ogni settimana ricontrolla) la strategia di ogni asset. Se nessuna regge, l'asset viene disattivato.
const fs=require('fs'),path=require('path');
const E=require('./engine'),{klines}=require('./data');
const CF=path.join(__dirname,'..','config.json'),cfg=JSON.parse(fs.readFileSync(CF,'utf8'));
const fee=cfg.feePct/100,SLT=[[1,1.5],[1,2],[1.5,2],[1.5,3],[2,3],[2,4],[3,4.5]];
function ev(D,st,a,b,ks,kt,lo,sp,p0){
 const n=D.length,t=D.map(x=>x.t);p0=p0||E.positions(D,st,a,b,lo);
 const sm=E.sim(D,p0,fee,1,ks,kt),r=sm.r,pos=sm.ep;
 const A=E.stats(r,t,1,sp),B=E.stats(r,t,sp,n),T0=E.tstat(E.trades(r,pos,1,sp)),T1=E.tstat(E.trades(r,pos,sp,n));
 return{st,a,b,ks,kt,A,B,T0,T1,ok:T0.n>=20&&T1.n>=20&&B.ret>0&&B.sharpe>0&&A.sharpe>0&&T0.avg>0&&T1.avg>0&&T1.t>1.5};
}
function search(D,lo,sp){
 const res=[];
 for(const [st,a,b] of E.GRID()){const p0=E.positions(D,st,a,b,lo);
  for(const [ks,kt] of SLT){const x=ev(D,st,a,b,ks,kt,lo,sp,p0);if(x.T0.n>=20)res.push(x)}}
 return res.filter(x=>x.ok).sort((x,y)=>Math.min(y.A.sharpe,y.B.sharpe)-Math.min(x.A.sharpe,x.B.sharpe));
}
(async()=>{
 for(const x of cfg.watch){
  try{
   const D=await klines(x.sym,x.tf,1000,6),sp=Math.floor(D.length*.7),lo=!!x.lo;
   const cur=x.st?ev(D,x.st,x.a,x.b,x.ks,x.kt,lo,sp):null;
   const best=cur&&cur.ok?cur:search(D,lo,sp)[0];   // tiene la strategia attuale finché regge: meno cambi, meno overfitting
   if(best){Object.assign(x,{st:best.st,a:best.a,b:best.b,ks:best.ks,kt:best.kt,active:true,
     bt:{wrTest:+best.T1.wr.toFixed(3),t:+best.T1.t.toFixed(2),n:best.T1.n,sharpeTest:+best.B.sharpe.toFixed(2)}});
    console.log(x.sym,x.tf,'->',best.st,best.a,best.b,'SL/TP',best.ks,best.kt,cur&&cur.ok?'(confermata)':'(nuova)')}
   else{x.active=false;delete x.bt;console.log(x.sym,x.tf,'-> nessuna strategia robusta: disattivato')}
   x.tested=new Date().toISOString();
  }catch(e){console.log(x.sym,'errore',e.message)}
 }
 fs.writeFileSync(CF,JSON.stringify(cfg,null,1));
})();
