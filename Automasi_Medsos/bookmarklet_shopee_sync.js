/**
 * =============================================================================
 * ⚡ 1-CLICK SHOPEE VARIANT PRICE & UNIT COST AUTO-SYNC BOOKMARKLET
 * =============================================================================
 * Bookmarklet untuk Chrome. Otomatis mengeklik semua varian produk Shopee (200g, 250g, 350g, 440g),
 * membaca harganya, menghitung harga per kg (Rp/kg), dan mengirim hasilnya ke Server Bridge & CSV.
 * =============================================================================
 */

(async function syncShopeeVariants() {
  console.clear();
  console.log("%c ⚡ AUTO-SYNC VARIAN HARGA SHOPEE JURAGAN ⚡", "color: #ff5722; font-size: 16px; font-weight: bold;");
  console.log("=========================================================================");

  // 1. Ambil Nama Toko & Nama Produk dari Halaman Shopee
  const shopNameElem = document.querySelector('.V9hB+w, ._3L2H7L, a[href*="/shop/"]');
  const shopName = shopNameElem ? shopNameElem.innerText.trim() : "Shopee Competitor";
  const productTitleElem = document.querySelector('h1, ._44qWwb, .product-briefing span');
  const productTitle = productTitleElem ? productTitleElem.innerText.trim() : document.title;

  // 2. Cari Semua Tombol Varian Berat (200g, 250g, 350g, 440g, dst)
  const buttons = Array.from(document.querySelectorAll('button')).filter(b => /\d+\s*(gram|g|kg)/i.test(b.innerText));
  
  if (buttons.length === 0) {
    alert("⚠️ Tidak ditemukan tombol varian berat (gram/kg) di halaman produk ini.");
    return;
  }

  const results = [];
  
  for (let btn of buttons) {
    btn.click();
    await new Promise(r => setTimeout(r, 900)); // Delay 0.9s agar DOM harga Shopee ter-update

    const variantName = btn.innerText.trim();
    const gMatch = variantName.match(/(\d+)/);
    let weightG = gMatch ? parseInt(gMatch[1]) : 250;
    if (/kg/i.test(variantName) && weightG < 100) weightG *= 1000;

    // Ambil harga dari elemen DOM Shopee
    let priceRp = 0;
    const priceElem = document.querySelector('.pq7PQU, ._1d6c8K, div[style*="font-size: 1.875rem"], div[class*="price"]');
    if (priceElem) {
      const match = priceElem.innerText.match(/Rp\s*([\d\.]+)/);
      if (match) priceRp = parseInt(match[1].replace(/\./g, ''));
    }
    
    if (!priceRp) {
      const match = document.body.innerText.match(/Rp\s*([\d\.]+)/);
      if (match) priceRp = parseInt(match[1].replace(/\./g, ''));
    }

    const priceG = (priceRp / weightG).toFixed(2);
    const priceKg = Math.round((priceRp / weightG) * 1000);

    results.push({
      toko: shopName,
      nama_produk: `${productTitle} [${variantName}]`,
      varian_berat: variantName,
      harga_rp: priceRp,
      berat_gram: weightG,
      harga_per_gram: parseFloat(priceG),
      harga_per_kg: priceKg,
      link_shopee: window.location.href
    });

    console.log(
      `%c📌 Varian: %c${variantName.padEnd(12)} %c| Harga: %cRp ${priceRp.toLocaleString('id-ID').padEnd(10)} %c| Unit Cost: %c🏆 Rp ${priceKg.toLocaleString('id-ID')}/kg`,
      "color: #888", "color: #2196f3; font-weight: bold",
      "color: #888", "color: #ff9800; font-weight: bold",
      "color: #888", "color: #4caf50; font-weight: bold"
    );
  }

  console.log("=========================================================================");

  // 3. Kirim Hasil ke Local Server Bridge
  try {
    const resp = await fetch('http://localhost:5000/api/sync-kompetitor', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ items: results })
    });
    const resData = await resp.json();
    if (resData.status === "success") {
      alert(`✅ BERHASIL SYNC!\n\n${results.length} varian harga berhasil dikirim & disimpan ke kompetitor_shopee.csv!`);
      return;
    }
  } catch (err) {
    console.log("⚠️ Server bridge offline, mengunduh file CSV langsung dari browser...");
  }

  // 4. Fallback Download File CSV Langsung jika server bridge offline
  let csvContent = "data:text/csv;charset=utf-8,toko,nama_produk,varian_berat,harga_rp,berat_gram,harga_per_gram,harga_per_kg,link_shopee\n";
  results.forEach(r => {
    csvContent += `"${r.toko}","${r.nama_produk}","${r.varian_berat}",${r.harga_rp},${r.berat_gram},${r.harga_per_gram},${r.harga_per_kg},"${r.link_shopee}"\n`;
  });
  
  const encodedUri = encodeURI(csvContent);
  const link = document.createElement("a");
  link.setAttribute("href", encodedUri);
  link.setAttribute("download", `sync_shopee_${Date.now()}.csv`);
  document.body.appendChild(link);
  link.click();
  alert(`✅ BERHASIL!\n\n${results.length} varian harga berhasil dihitung & didownload sebagai file CSV!`);
})();
