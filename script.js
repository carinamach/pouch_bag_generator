document.addEventListener('DOMContentLoaded', () => {
  const desiredWidth = document.getElementById('desiredWidth');
  const desiredHeight = document.getElementById('desiredHeight');
  const desiredDepth = document.getElementById('desiredDepth');
  const seamAllowance = document.getElementById('seamAllowance');
  const unitSelect = document.getElementById('unit');

  const calculateBtn = document.getElementById('calculate');
  const results = document.getElementById('results');
  const fabricWidthEl = document.getElementById('fabricWidth');
  const fabricHeightEl = document.getElementById('fabricHeight');
  const copyBtn = document.getElementById('copyBtn');

  function showError(msg){
    alert(msg);
  }

  function fmt(n){
    // trim unnecessary decimals
    if (Number.isInteger(n)) return n.toString();
    return parseFloat(n.toFixed(2)).toString();
  }

  function calculate(){
    const unit = unitSelect.value;
    const w = parseFloat(desiredWidth.value);
    const h = parseFloat(desiredHeight.value);
    const d = parseFloat(desiredDepth.value);
    const s = parseFloat(seamAllowance.value);

    if (Number.isNaN(w) || Number.isNaN(h) || Number.isNaN(d) || Number.isNaN(s)){
      showError('Vänligen fyll i alla fält med numeriska värden.');
      return;
    }
    if (w < 0 || h < 0 || d < 0 || s < 0){
      showError('Måtten kan inte vara negativa.');
      return;
    }

    // Enligt formlerna från användaren
    // bredd = önskad bredd + önskad djup + 2 * sömsmån
    // höjd = 2 * önskad höjd + önskad djup + 2 * sömsmån
    const fabricWidth = w + d + 2 * s;
    const fabricHeight = 2 * h + d + 2 * s;

    fabricWidthEl.textContent = `${fmt(fabricWidth)} ${unit}`;
    fabricHeightEl.textContent = `${fmt(fabricHeight)} ${unit}`;
    results.classList.remove('hidden');
  }

  calculateBtn.addEventListener('click', calculate);

  copyBtn.addEventListener('click', async () => {
    const text = `Tygbredd: ${fabricWidthEl.textContent} — Tyghöjd: ${fabricHeightEl.textContent}`;
    try{
      await navigator.clipboard.writeText(text);
      copyBtn.textContent = 'Kopierat!';
      setTimeout(()=> copyBtn.textContent = 'Kopiera resultat', 1500);
    }catch(e){
      alert('Kunde inte kopiera automatiskt. Markera och kopiera manuellt: ' + text);
    }
  });

});
