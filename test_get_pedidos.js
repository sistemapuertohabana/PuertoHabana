(async () => {
  const res = await fetch('http://localhost:3000/api/pedidos?fecha=2026-05-19');
  const text = await res.text();
  console.log(text);
})();
