let tvWidget;
let multiWidgets = [];
let currentSymbol = "BINANCE:BTCUSDT";
let currentInterval = "60";
let alerts = JSON.parse(localStorage.getItem("alerts")||"[]");

// --------- Chart ----------
function loadChart(symbol){
  currentSymbol = symbol;
  const chartContainer = document.getElementById("chart");
  chartContainer.innerHTML="";
  if(tvWidget) try{tvWidget.remove()}catch(e){}
  tvWidget = new TradingView.widget({
    container_id:"chart",
    autosize:true,
    symbol:symbol,
    interval:currentInterval,
    timezone:"Etc/UTC",
    theme:"dark",
    style:"1",
    locale:"en",
    allow_symbol_change:true,
    hide_side_toolbar:false,
    details:true
  });
}
function setIntervalChart(i){currentInterval=i; loadChart(currentSymbol);}

// --------- Multi Chart ----------
function enableMultiChart(){
  document.getElementById("multiCharts").style.display="grid";
  document.getElementById("chart").style.display="none";
  const symbols=[currentSymbol,"BINANCE:ETHUSDT","BINANCE:SOLUSDT","BINANCE:BNBUSDT"];
  multiWidgets.forEach(w=>{try{w.remove()}catch(e){}});
  multiWidgets=[];
  symbols.forEach((s,i)=>{
    const widget = new TradingView.widget({
      container_id:"chart"+(i+1),
      autosize:true,
      symbol:s,
      interval:currentInterval,
      timezone:"Etc/UTC",
      theme:"dark",
      style:"1",
      locale:"en",
      hide_side_toolbar:true
    });
    multiWidgets.push(widget);
  });
}
function disableMultiChart(){document.getElementById("multiCharts").style.display="none"; document.getElementById("chart").style.display="block"; loadChart(currentSymbol);}

// --------- Watchlist ----------
function addToWatchlist(symbol){
  let list = JSON.parse(localStorage.getItem("watchlist")||"[]");
  if(!list.includes(symbol)) list.push(symbol);
  localStorage.setItem("watchlist",JSON.stringify(list));
  renderWatchlist();
}
function renderWatchlist(){
  const container=document.getElementById("watchlist");
  container.innerHTML="";
  let list=JSON.parse(localStorage.getItem("watchlist")||"[]");
  list.forEach(symbol=>{
    const div=document.createElement("div");
    div.className="watch-item";
    div.innerText=symbol;
    div.onclick=()=>loadChart(symbol);
    container.appendChild(div);
  });
}
renderWatchlist();

// --------- Alerts ----------
function addAlert(){
  const coin = prompt("Enter coin (BTCUSDT, ETHUSDT, SOLUSDT, BNBUSDT):").toUpperCase();
  const price = parseFloat(prompt("Enter alert price:"));
  if(!coin || !price) return;
  alerts.push({coin,price});
  localStorage.setItem("alerts",JSON.stringify(alerts));
  alert("Alert added for "+coin+" at $"+price);
}
function checkAlerts(){
  if(alerts.length===0) return;
  fetch("https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum,solana,binancecoin&vs_currencies=usd")
  .then(r=>r.json())
  .then(data=>{
    alerts.forEach((a,i)=>{
      let price=0;
      switch(a.coin){
        case "BTCUSDT": price=data.bitcoin.usd; break;
        case "ETHUSDT": price=data.ethereum.usd; break;
        case "SOLUSDT": price=data.solana.usd; break;
        case "BNBUSDT": price=data.binancecoin.usd; break;
      }
      if(price>=a.price){ alert(a.coin+" reached $"+price); alerts.splice(i,1);}
    });
    localStorage.setItem("alerts",JSON.stringify(alerts));
  });
}
setInterval(checkAlerts,20000);

// --------- Global Scanner & Heatmap ----------
async function loadGlobalScanner(){
  const res = await fetch("https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=volume_desc&per_page=16&page=1");
  const data = await res.json();
  const container=document.getElementById("globalScanner");
  container.innerHTML="";
  const heat=document.getElementById("heatmap");
  heat.innerHTML="";
  data.forEach(c=>{
    const div=document.createElement("div");
    div.className="coin";
    const change=(c.price_change_percentage_24h||0).toFixed(2);
    div.innerHTML=`<span>${c.symbol.toUpperCase()} $${c.current_price}</span><span>${change}%</span>`;
    div.onclick=()=>loadChart("BINANCE:"+c.symbol.toUpperCase()+"USDT");
    container.appendChild(div);

    const box=document.createElement("div");
    box.style.background=change>0?"#0f5132":"#5a1a1a";
    box.innerHTML=`${c.symbol.toUpperCase()}<br>${change}%`;
    box.onclick=()=>loadChart("BINANCE:"+c.symbol.toUpperCase()+"USDT");
    heat.appendChild(box);
  });
}
loadGlobalScanner();
setInterval(loadGlobalScanner,45000);

// --------- Live Coin Search ----------
let allCoins = [];
fetch("https://api.coingecko.com/api/v3/coins/list")
.then(r=>r.json())
.then(data=>allCoins=data);

function liveSearch(query){
  const suggestionBox=document.getElementById("suggestions");
  suggestionBox.innerHTML="";
  if(query.length<1) return;
  const filtered = allCoins.filter(c=>c.symbol.toLowerCase().includes(query.toLowerCase())).slice(0,8);
  filtered.forEach(c=>{
    const div=document.createElement("div");
    div.innerText=c.symbol.toUpperCase() + " - " + c.name;
    div.onclick=()=>{
      const symbol="BINANCE:"+c.symbol.toUpperCase()+"USDT";
      loadChart(symbol);
      suggestionBox.innerHTML="";
      addToWatchlist(symbol);
      document.getElementById("coinSearch").value="";
    };
    suggestionBox.appendChild(div);
  });
}

// --------- Init ----------
window.addEventListener("load",()=>loadChart(currentSymbol));