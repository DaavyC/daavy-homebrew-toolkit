export function getHTMLElement(html) {
  const element = html?.nodeType === 1 ? html : html?.[0];
  return element?.nodeType === 1 ? element : null;
}
