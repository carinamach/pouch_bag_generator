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

  // Unit conversion helpers: base unit internally = cm
  const toCm = (value, unit) => {
    if (unit === 'cm') return value;
    if (unit === 'mm') return value / 10;
    if (unit === 'in') return value * 2.54;
    return value;
  };
  const fromCm = (valueCm, unit) => {
    if (unit === 'cm') return valueCm;
    if (unit === 'mm') return valueCm * 10;
    if (unit === 'in') return valueCm / 2.54;
    return valueCm;
  };

  function buildConversions(cmValue){
    // return HTML with other unit conversions
    const mm = fromCm(cmValue, 'mm');
    const cm = fromCm(cmValue, 'cm');
    const inch = fromCm(cmValue, 'in');
    return `<p>Konverteringar: ${fmt(cm)} cm — ${fmt(mm)} mm — ${fmt(inch)} in</p>`;
  }

  function renderDiagram(fabricWcm, fabricHcm){
    // diagram size in px fixed viewBox 200x200, we map fabric ratio into it
    const svg = document.getElementById('diagram');
    while(svg.firstChild) svg.removeChild(svg.firstChild);

    const maxBox = 180; // leave margin
    const margin = 10;
    const w = fabricWcm;
    const h = fabricHcm;
    // maintain ratio
    const scale = Math.max(w / maxBox, h / maxBox);
    const drawW = (scale > 0) ? Math.min(maxBox, w / scale) : maxBox;
    const drawH = (scale > 0) ? Math.min(maxBox, h / scale) : maxBox;
    const offsetX = (200 - drawW) / 2;
    const offsetY = (200 - drawH) / 2;

    // outer rect (fabric)
    const ns = 'http://www.w3.org/2000/svg';
    const rect = document.createElementNS(ns, 'rect');
    rect.setAttribute('x', offsetX);
    rect.setAttribute('y', offsetY);
    rect.setAttribute('width', drawW);
    rect.setAttribute('height', drawH);
    rect.setAttribute('fill', '#ffffff');
    rect.setAttribute('stroke', '#0f172a');
    rect.setAttribute('stroke-width', '1');
    svg.appendChild(rect);

    // width arrow
    const arrowY = offsetY + drawH + 14;
    const lineW = document.createElementNS(ns, 'line');
    lineW.setAttribute('x1', offsetX);
    lineW.setAttribute('y1', arrowY);
    lineW.setAttribute('x2', offsetX + drawW);
    lineW.setAttribute('y2', arrowY);
    lineW.setAttribute('stroke', '#0f172a');
    svg.appendChild(lineW);
    const leftArrow = document.createElementNS(ns, 'text');
    leftArrow.setAttribute('x', offsetX);
    leftArrow.setAttribute('y', arrowY + 10);
    leftArrow.setAttribute('class', 'diag-label');
    leftArrow.textContent = '';
    svg.appendChild(leftArrow);

    const labelW = document.createElementNS(ns, 'text');
    labelW.setAttribute('x', offsetX + drawW / 2);
    labelW.setAttribute('y', arrowY + 6);
    labelW.setAttribute('text-anchor', 'middle');
    labelW.setAttribute('class', 'diag-label');
    labelW.textContent = `${fmt(w)} cm`;
    svg.appendChild(labelW);

    // height arrow
    const arrowX = offsetX - 14;
    const lineH = document.createElementNS(ns, 'line');
    lineH.setAttribute('x1', arrowX);
    lineH.setAttribute('y1', offsetY);
    lineH.setAttribute('x2', arrowX);
    lineH.setAttribute('y2', offsetY + drawH);
    lineH.setAttribute('stroke', '#0f172a');
    svg.appendChild(lineH);

    const labelH = document.createElementNS(ns, 'text');
    labelH.setAttribute('x', arrowX - 4);
    labelH.setAttribute('y', offsetY + drawH / 2 + 4);
    labelH.setAttribute('text-anchor', 'end');
    labelH.setAttribute('class', 'diag-label');
    labelH.textContent = `${fmt(h)} cm`;
    svg.appendChild(labelH);
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

    // Convert inputs to cm for internal calculation
    const wCm = toCm(w, unit);
    const hCm = toCm(h, unit);
    const dCm = toCm(d, unit);
    const sCm = toCm(s, unit);

    // Enligt formlerna (beräkna i cm)
    const fabricWidthCm = wCm + dCm + 2 * sCm;
    const fabricHeightCm = 2 * hCm + dCm + 2 * sCm;

    // Show inputs in selected units
    inWidth.textContent = `${fmt(w)} ${unit}`;
    inHeight.textContent = `${fmt(h)} ${unit}`;
    inDepth.textContent = `${fmt(d)} ${unit}`;
    inSeam.textContent = `${fmt(s)} ${unit}`;

    // total seam allowance (both sides) in selected unit
    const totalSeamSelected = fromCm(2 * sCm, unit);
    totalSeam.textContent = `${fmt(totalSeamSelected)} ${unit}`;

    // Output in selected unit
    const fabricWidthSelected = fromCm(fabricWidthCm, unit);
    const fabricHeightSelected = fromCm(fabricHeightCm, unit);
    fabricWidthEl.textContent = `${fmt(fabricWidthSelected)} ${unit}`;
    fabricHeightEl.textContent = `${fmt(fabricHeightSelected)} ${unit}`;

    // Conversions (also show cm/mm/in)
    conversions.innerHTML = `
      <p><strong>Primärt (valda enheter):</strong> ${fmt(fabricWidthSelected)} ${unit} × ${fmt(fabricHeightSelected)} ${unit}</p>
      ${buildConversions(fabricWidthCm)}
      `;

    // Render simple diagram using cm values
    renderDiagram(fabricWidthCm, fabricHeightCm);

    results.classList.remove('hidden');
  }

  calculateBtn.addEventListener('click', calculate);

  copyBtn.addEventListener('click', async () => {
    const text = `Tygbredd: ${fabricWidthEl.textContent} — Tyghöjd: ${fabricHeightEl.textContent} (konverteringar: ${conversions.textContent})`;
    try{
      await navigator.clipboard.writeText(text);
      copyBtn.textContent = 'Kopierat!';
      setTimeout(()=> copyBtn.textContent = 'Kopiera resultat', 1500);
    }catch(e){
      alert('Kunde inte kopiera automatiskt. Markera och kopiera manuellt: ' + text);
    }
  });

  // download svg button
  const downloadSvg = document.getElementById('downloadSvg');
  downloadSvg.addEventListener('click', () => {
    const svg = document.getElementById('diagram');
    const serializer = new XMLSerializer();
    const source = serializer.serializeToString(svg);
    const blob = new Blob([source], {type: 'image/svg+xml;charset=utf-8'});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'pouch_diagram.svg';
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  });

});
