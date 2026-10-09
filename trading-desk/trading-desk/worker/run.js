const fs=require('fs'),path=require('path');
const E=require('./engine'),{klines}=require('./data'),N=require('./news');
const ROOT=path.join(__dirname,'..'),cfg=JSON.parse(fs.readFileSync(path.join(ROOT,'config.json'),'utf8'));
const rd=(f,d)=>{try{return JSON.parse(fs.readFileSync(path.join(ROOT,f),'utf8'))}catch(e){return d}};
const TF={'15m':9e5,'1h':36e5,'4h':144e5,'1d':864e5};
const NM={sma:'Incrocio SMA',rsi:'RSI',brk:'Breakout'};
(async()=>{
 fs.mkdirSync(path.join(ROOT,'data'),{recursive:true});
 const log=rd('data/log.json',[]),H=await N.headlines(),bo=await N.blackout(),sigs=[];
 for(const x of cfg.watch.filter(w=>w.st&&w.active!==false)){
  try{
   const raw=await klines(x.sym,x.tf,500),px=raw[raw.length-1].c,a=raw.filter(k=>k.ct<Date.now());
   const p0=E.positions(a,x.st,x.a,x.b,!!x.lo),sm=E.sim(a,p0,0,1,x.ks,x.kt),S=sm.st,n=a.length;
   let k=n-1;while(k>0&&sm.ep[k-1]===sm.ep[n-1])k--;
   const since=a[k].ct,dir=S.cur>0?'LONG':S.cur<0?'SHORT':'FLAT';
   const news=N.score(x.sym,H),id=`${x.sym}-${x.tf}-${since}`;
   // paper trading: chiude le operazioni aperte (SL, TP o cambio segnale)
   for(const tr of log.filter(t=>t.sym==x.sym&&t.tf==x.tf&&t.status=='open')){
    let res=null;
    for(const c of raw){
     if(c.t<=tr.t0)continue;
     const hs=tr.dir=='LONG'?c.l<=tr.sl:c.h>=tr.sl,ht=tr.dir=='LONG'?c.h>=tr.tp:c.l<=tr.tp;
     if(hs){res=['sl',tr.sl,c.t];break}if(ht){res=['tp',tr.tp,c.t];break}
    }
    if(!res&&dir!==tr.dir)res=['signal',px,Date.now()];
    if(res){const sg=tr.dir=='LONG'?1:-1;tr.status=res[0];tr.exit=res[1];tr.t1=res[2];
     tr.pct=+(sg*(res[1]/tr.entry-1)*100-2*cfg.feePct).toFixed(3);tr.r=+(tr.pct/tr.slPct).toFixed(2)}
   }
   const slPct=S.cur!==0?Math.abs(S.entry-S.sl)/S.entry*100:0;
   // apre un nuovo trade virtuale solo se il segnale è fresco (entro 2 candele)
   if(S.cur!==0&&!log.some(t=>t.id==id)&&Date.now()-since<2*TF[x.tf])
    log.push({id,sym:x.sym,tf:x.tf,dir,entry:S.entry,sl:S.sl,tp:S.tp,slPct:+slPct.toFixed(3),t0:since,status:'open',news:news.score,blackout:!!bo});
   const against=news.score*S.cur<=-2;
   const action=S.cur===0?(S.blocked?'FLAT (SL/TP colpito)':'FLAT'):against?'IN ATTESA (news contrarie)':bo?'IN ATTESA (evento macro)':'ATTIVO';
   sigs.push({sym:x.sym,tf:x.tf,strat:`${NM[x.st]} ${x.a}${x.b?'/'+x.b:''} SL${x.ks}/TP${x.kt} ATR`,dir,action,since,price:px,
    entry:S.cur?S.entry:null,sl:S.cur?S.sl:null,tp:S.cur?S.tp:null,size:slPct?+(cfg.riskPct/slPct*100).toFixed(1):null,news,bt:x.bt||null});
  }catch(e){sigs.push({sym:x.sym,tf:x.tf,dir:'FLAT',action:'ERRORE: '+e.message,news:{score:0,heads:[]}})}
 }
 const closed=log.filter(t=>t.status!=='open'),wins=closed.filter(t=>t.pct>0).length;
 const paper={n:closed.length,wr:closed.length?+(wins/closed.length).toFixed(3):null,
  avgR:closed.length?+(closed.reduce((s,t)=>s+t.r,0)/closed.length).toFixed(2):null,sumPct:+closed.reduce((s,t)=>s+t.pct,0).toFixed(2)};
 const state={updated:Date.now(),riskPct:cfg.riskPct,blackout:bo,signals:sigs,paper,recent:log.slice(-15).reverse()};
 fs.writeFileSync(path.join(ROOT,'data/state.json'),JSON.stringify(state,null,1));
 fs.writeFileSync(path.join(ROOT,'data/log.json'),JSON.stringify(log.slice(-500)));
 console.log('segnali:',sigs.map(s=>s.sym+' '+s.dir+' '+s.action).join(' | ')||'nessuna strategia attiva');
})().catch(e=>{console.error(e);process.exit(1)});
