// Scansiona l'universo di asset e timeframe, tiene le strategie che superano i controlli e scarta il resto.
// Con --if-empty parte solo se non c'è nulla di attivo (e al massimo una volta al giorno).
const fs=require('fs'),path=require('path');
const E=require('./engine'),{klines}=require('./binance');
const CF=path.join(__dirname,'config.json'),cfg=JSON.parse(fs.readFileSync(CF,'utf8'));
const fee=cfg.feePct/100,SLT=[[1,1.5],[1,2],[1.5,2],[1.5,3],[2,3],[2,4],[3,4.5]];
function ev(D,st,a,b,ks,kt,lo,sp,p0){
 const n=D.length,t=D.map(x=>x.t);p0=p0||E.positions(D,st,a,b,lo);
 const sm=E.sim(D,p0,fee,1,ks,kt),r=sm.r,pos=sm.ep;
 const A=E.stats(r,t,1,sp),B=E.stats(r,t,sp,n),T0=E.tstat(E.trades(r,pos,1,sp)),T1=E.tstat(E.trades(r,pos,sp,n));
 // criteri severi: tante combinazioni testate aumentano il rischio di trovare una fortuna del passato
 return{st,a,b,ks,kt,A,B,T0,T1,ok:T0.n>=30&&T1.n>=20&&B.ret>0&&B.sharpe>0&&A.sharpe>0&&T0.avg>0&&T1.avg>0&&T1.t>2};
}
function search(D,lo,sp){
 const res=[];
 for(const [st,a,b] of E.GRID()){const p0=E.positions(D,st,a,b,lo);
  for(const [ks,kt] of SLT){const x=ev(D,st,a,b,ks,kt,lo,sp,p0);if(x.T0.n>=20)res.push(x)}}
 return res.filter(x=>x.ok).sort((x,y)=>Math.min(y.A.sharpe,y.B.sharpe)-Math.min(x.A.sharpe,x.B.sharpe));
}
(async()=>{
 if(process.argv.includes('--if-empty')&&(cfg.watch.some(w=>w.active)||(cfg.scannedAt&&Date.now()-Date.parse(cfg.scannedAt)<864e5))){console.log('scansione non necessaria');return}
 const old=Object.fromEntries(cfg.watch.map(w=>[w.sym+w.tf,w])),found=[];let fetched=0;
 for(const sym of cfg.universe.symbols)for(const tf of cfg.universe.tfs){
  try{
   const D=await klines(sym,tf,1000,6),sp=Math.floor(D.length*.7),o=old[sym+tf];fetched++;
   const cur=o&&o.st?ev(D,o.st,o.a,o.b,o.ks,o.kt,false,sp):null,keep=!!(cur&&cur.ok);
   const best=keep?cur:search(D,false,sp)[0];
   if(best)found.push({best,sym,tf,score:Math.min(best.A.sharpe,best.B.sharpe)+(keep?.5:0)});   // bonus: preferisce non cambiare strategia
  }catch(e){console.log(sym,tf,'errore',e.message)}
 }
 if(!fetched){console.log('nessun dato scaricato: configurazione invariata');return}
 found.sort((x,y)=>y.score-x.score);
 const seen=new Set(),watch=[];
 for(const f of found){
  if(seen.has(f.sym)||watch.length>=cfg.maxActive)continue;seen.add(f.sym);
  const b=f.best;
  watch.push({sym:f.sym,tf:f.tf,st:b.st,a:b.a,b:b.b,ks:b.ks,kt:b.kt,lo:false,active:true,
   bt:{wrTest:+b.T1.wr.toFixed(3),t:+b.T1.t.toFixed(2),n:b.T1.n,sharpeTest:+b.B.sharpe.toFixed(2)},tested:new Date().toISOString()});
 }
 cfg.watch=watch;cfg.scannedAt=new Date().toISOString();
 fs.writeFileSync(CF,JSON.stringify(cfg,null,1));
 console.log(watch.length?'Strategie trovate: '+watch.map(w=>`${w.sym} ${w.tf} ${w.st} ${w.a}/${w.b} SL${w.ks} TP${w.kt}`).join(' | '):'Nessuna strategia robusta trovata: nessun segnale.');
})();
