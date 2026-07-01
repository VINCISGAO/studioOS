const THUMBNAIL_POOL = [
  "https://images.unsplash.com/photo-1590658268037-6bf12165a1df?auto=format&fit=crop&w=160&q=80",
  "https://images.unsplash.com/photo-1571781926291-c477ebfd024b?auto=format&fit=crop&w=160&q=80",
  "https://images.unsplash.com/photo-1541643600914-78b084683601?auto=format&fit=crop&w=160&q=80",
  "https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=160&q=80"
];

function hashIndex(value: string, size: number) {
  let hash = 0;
  for (let i = 0; i < value.length; i += 1) {
    hash = (hash + value.charCodeAt(i) * (i + 1)) % size;
  }
  return hash;
}

export function brandProjectThumbnail(id: string) {
  return THUMBNAIL_POOL[hashIndex(id, THUMBNAIL_POOL.length)] ?? THUMBNAIL_POOL[0];
}
