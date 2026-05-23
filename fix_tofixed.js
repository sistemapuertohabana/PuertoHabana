const fs = require('fs');
const path = require('path');

const filesToFix = [
  'src/app/admin/dashboard/page.tsx',
  'src/app/admin/inventario/page.tsx',
  'src/app/admin/gastos/page.tsx',
  'src/app/mozo/page.tsx',
  'src/app/mozo/historial/page.tsx',
  'src/app/cocina/perfil/page.tsx',
  'src/app/cocina/historial/page.tsx',
  'src/app/mozo/perfil/page.tsx',
  'src/app/admin/personal/page.tsx'
];

filesToFix.forEach(file => {
  const fullPath = path.resolve(file);
  if (fs.existsSync(fullPath)) {
    let content = fs.readFileSync(fullPath, 'utf8');
    
    // Convert foo.toFixed to Number(foo).toFixed
    content = content.replace(/(?<!Number\()([a-zA-Z0-9_.]+)\.toFixed\(/g, 'Number($1).toFixed(');
    
    // Fix specific expressions like (pedido.precio * pedido.cantidad).toFixed(2)
    content = content.replace(/\((pedido\.precio \* pedido\.cantidad)\)\.toFixed\(/g, '(Number(pedido.precio) * Number(pedido.cantidad)).toFixed(');
    content = content.replace(/\((item\.precio \* item\.cantidad)\)\.toFixed\(/g, '(Number(item.precio) * Number(item.cantidad)).toFixed(');
    content = content.replace(/\(p\.precio \* p\.cantidad\)\.toFixed\(/g, '(Number(p.precio) * Number(p.cantidad)).toFixed(');
    content = content.replace(/\(totalVentas - totalInsumosLoss - totalStaffPayments\)\.toFixed\(/g, '(Number(totalVentas) - Number(totalInsumosLoss) - Number(totalStaffPayments)).toFixed(');
    
    fs.writeFileSync(fullPath, content);
    console.log('Fixed:', file);
  }
});
