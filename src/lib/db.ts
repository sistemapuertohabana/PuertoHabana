export function subscribeInventario(collection: string, callback: (data: any[]) => void) {
  console.log(`Subscribing to ${collection}...`);
  callback([]);
  return () => {
    console.log(`Unsubscribing from ${collection}...`);
  };
}

export async function addInventarioItem(collection: string, item: any) {
  console.log(`Adding to ${collection}:`, item);
}

export async function updateInventarioItem(collection: string, id: string, item: any) {
  console.log(`Updating ${collection} [${id}]:`, item);
}

export async function deleteInventarioItem(collection: string, id: string) {
  console.log(`Deleting from ${collection} [${id}]`);
}
