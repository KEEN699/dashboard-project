let rawData = [];
let pieChart, barChart;

AOS.init();

document.addEventListener('DOMContentLoaded', () => {
  ['filter-gender','filter-subscription','filter-season','filter-payment'].forEach(id => {
    document.getElementById(id).addEventListener('change', () => renderDashboard(applyFilters()));
  });

  fetch('shopping_trends_updated.csv')
    .then(res => res.text())
    .then(csv => {
      Papa.parse(csv, { header: true, skipEmptyLines: true, complete: r => {
        rawData = r.data;
        populateDropdown('filter-payment', 'Payment Method');
        renderDashboard(applyFilters());
      }});
    });
});

function toggleTheme() {
  document.documentElement.classList.toggle('dark');
  document.body.classList.toggle('bg-gray-900');
}

function populateDropdown(id, key) {
  const unique = Array.from(new Set(rawData.map(d => d[key]).filter(Boolean))).sort();
  const sel = document.getElementById(id);
  unique.forEach(v => {
    const opt = document.createElement('option');
    opt.value = v; opt.textContent = v;
    sel.appendChild(opt);
  });
}

function applyFilters() {
  return rawData.filter(d =>
    (!document.getElementById('filter-gender').value || d.Gender === document.getElementById('filter-gender').value) &&
    (!document.getElementById('filter-subscription').value || d['Subscription Status'] === document.getElementById('filter-subscription').value) &&
    (!document.getElementById('filter-season').value || d.Season === document.getElementById('filter-season').value) &&
    (!document.getElementById('filter-payment').value || d['Payment Method'] === document.getElementById('filter-payment').value)
  );
}

function renderDashboard(data) {
  const cards = document.getElementById('dashboard-cards');
  cards.innerHTML = '';

  const avgPurchase = (data.reduce((s,d)=>s+parseFloat(d['Purchase Amount (USD)']||0),0)/data.length)||0;
  const avgRating = (data.reduce((s,d)=>s+parseFloat(d['Review Rating']||0),0)/data.length)||0;
  const promoRate = (data.filter(d=>d['Promo Code Used']==='Yes').length/data.length*100)||0;
  const repeatRate = (data.filter(d=>parseInt(d['Previous Purchases'])>0).length/data.length*100)||0;
  const payCount = {};
  data.forEach(d => payCount[d['Payment Method']] = (payCount[d['Payment Method']]||0)+1);
  const topPay = Object.entries(payCount).sort((a,b)=>b[1]-a[1])[0]?.[0]||'-';

  [
    {title:"Average Purchase",value:`$${avgPurchase.toFixed(2)}`,color:'text-green-600'},
    {title:"Avg Review Rating",value:`${avgRating.toFixed(1)} / 5`,color:'text-yellow-600'},
    {title:"Promo Usage Rate",value:`${promoRate.toFixed(1)}%`,color:'text-blue-600'},
    {title:"Repeat Purchase Rate",value:`${repeatRate.toFixed(1)}%`,color:'text-purple-600'},
    {title:"Top Payment Method",value:topPay,color:'text-gray-700'}
  ].forEach(kpi=>{
    const c=document.createElement('div');
    c.className='glass-card text-center';
    c.innerHTML=`<h3 class="text-lg font-medium mb-1">${kpi.title}</h3><div class="text-3xl font-bold ${kpi.color}">${kpi.value}</div>`;
    cards.appendChild(c);
  });

  updateCharts(data);
}

function updateCharts(data) {
  const used = data.filter(d=>d['Promo Code Used']==='Yes').length;
  const not = data.length - used;
  if(pieChart) pieChart.destroy();
  pieChart = new Chart(document.getElementById('pieChart'), {
    type:'doughnut',
    data:{labels:['Used Promo','No Promo'],datasets:[{data:[used,not],backgroundColor:['#3b82f6','#d1d5db']}]},
    options:{plugins:{legend:{position:'bottom'}},responsive:true}
  });

  const payCount = {};
  data.forEach(d=>payCount[d['Payment Method']] = (payCount[d['Payment Method']]||0)+1);
  const top5 = Object.entries(payCount).sort((a,b)=>b[1]-a[1]).slice(0,5);
  if(barChart) barChart.destroy();
  barChart = new Chart(document.getElementById('barChart'), {
    type:'bar',
    data:{labels:top5.map(e=>e[0]),datasets:[{label:'จำนวนผู้ใช้',data:top5.map(e=>e[1]),backgroundColor:'#10b981'}]},
    options:{indexAxis:'y',responsive:true,plugins:{legend:{display:false}}}
  });
}
