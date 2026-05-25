/**
 * Centralized utility for handling PDF page breaks and rendering quality.
 */

export const applySmartPaging = async (container: HTMLElement, pageHeightMm: number = 297, pageWidthMm: number = 210) => {
  if (!container) return;

  // 1. Wait for fonts to be ready
  if (typeof document !== 'undefined' && (document as any).fonts) {
    await (document as any).fonts.ready;
  }

  // 2. Wait for all images in the container to load
  const images = Array.from(container.querySelectorAll('img'));
  await Promise.all(
    images.map(img => {
      if (img.complete) return Promise.resolve();
      return new Promise((resolve) => {
        img.onload = resolve;
        img.onerror = resolve; // resolve anyway to avoid hanging
      });
    })
  );

  // Give the browser a moment to settle layout
  await new Promise(r => setTimeout(r, 100));

  // 3. Calculate page height in pixels based on the current container width
  const containerWidthPx = container.offsetWidth;
  const pxPerMm = containerWidthPx / pageWidthMm;
  const pageHeightPx = pageHeightMm * pxPerMm;

  // 4. Find all elements that shouldn't be split (rows, section headers) or should break before
  const breakables = container.querySelectorAll('.pdf-row, .pdf-page-break-before');
  
  // 5. Process each element and insert spacers if needed
  breakables.forEach((el: any) => {
    const rect = el.getBoundingClientRect();
    const parentRect = container.getBoundingClientRect();
    
    // Position relative to the top of the container
    const relativeTop = rect.top - parentRect.top;
    const relativeBottom = rect.bottom - parentRect.top;

    if (el.classList.contains('pdf-page-break-before')) {
      // Force page break before this element
      // Check if it's already exactly at the start of a page (within a tiny buffer)
      const isOnPageStart = Math.abs(relativeTop % pageHeightPx) < 2;
      if (!isOnPageStart) {
        const nextPageIndex = Math.ceil(relativeTop / pageHeightPx);
        const spacerHeight = (nextPageIndex * pageHeightPx) - relativeTop;
        
        if (spacerHeight > 0 && spacerHeight < pageHeightPx) {
          const spacer = document.createElement('div');
          spacer.className = 'pdf-spacer';
          spacer.style.height = `${spacerHeight}px`;
          spacer.style.width = '100%';
          spacer.style.clear = 'both';
          el.parentNode.insertBefore(spacer, el);
        }
      }
    } else {
      // Prevent splitting inside the element (.pdf-row)
      // Check which page each edge falls on
      const startPage = Math.floor((relativeTop + 1) / pageHeightPx);
      const endPage = Math.floor((relativeBottom - 1) / pageHeightPx);

      if (startPage !== endPage) {
        // Element crosses a page boundary!
        const spacerHeight = (endPage * pageHeightPx) - relativeTop;
        
        // Handle table rows differently (they need a <tr> wrapper)
        if (el.tagName === 'TR') {
          const table = el.closest('table');
          if (table) {
            const spacerRow = document.createElement('tr');
            spacerRow.className = 'pdf-spacer-row';
            const spacerCell = document.createElement('td');
            spacerCell.colSpan = 20; 
            spacerCell.style.height = `${spacerHeight}px`;
            spacerCell.style.border = 'none';
            spacerCell.style.padding = '0';
            spacerRow.appendChild(spacerCell);
            el.parentNode.insertBefore(spacerRow, el);
          }
        } else {
          // Standard div or other element
          const spacer = document.createElement('div');
          spacer.className = 'pdf-spacer';
          spacer.style.height = `${spacerHeight}px`;
          spacer.style.width = '100%';
          spacer.style.clear = 'both';
          el.parentNode.insertBefore(spacer, el);
        }
      }
    }
  });

  // Give the browser a moment to recalculate layout after adding spacers
  await new Promise(r => setTimeout(r, 100));
};
