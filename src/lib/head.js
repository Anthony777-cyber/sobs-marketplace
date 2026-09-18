// Injects the listing title and category path into the page <title>
// and <meta description> for search-engine indexing.
export function setHead(title, description) {
  if (title) document.title = title;
  let meta = document.querySelector('meta[name="description"]');
  if (!meta) {
    meta = document.createElement('meta');
    meta.setAttribute('name', 'description');
    document.head.appendChild(meta);
  }
  if (description) meta.setAttribute('content', description);
}