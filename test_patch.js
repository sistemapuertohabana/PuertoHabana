const fetch = require('node-fetch');
(async () => {
  const res = await fetch('http://localhost:3000/api/pedidos/1', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ estado: 'Entregado', metodo_pago: 'Mixto (Yape: 40, Efe: 20)' })
  });
  console.log(await res.text());
})();
