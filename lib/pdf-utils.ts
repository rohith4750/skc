/**
 * Centralized utility for handling PDF page breaks and rendering quality.
 */

export const applySmartPaging = async (container: HTMLElement, pageHeightMm: number = 297, pageWidthMm: number = 210) => {
  if (!container) return;

  // 1. Calculate page height in pixels based on the current container width
  const containerWidthPx = container.offsetWidth;
  const pxPerMm = containerWidthPx / pageWidthMm;
  const pageHeightPx = pageHeightMm * pxPerMm;

  // 2. Find all elements that shouldn't be split (rows, section headers)
  const rows = container.querySelectorAll('.pdf-row');
  
  // 3. Process each row and insert spacers if it crosses a page boundary
  rows.forEach((row: any) => {
    const rect = row.getBoundingClientRect();
    const parentRect = container.getBoundingClientRect();
    
    // Position relative to the top of the container
    const relativeTop = rect.top - parentRect.top;
    const relativeBottom = rect.bottom - parentRect.top;

    // Check which page each edge falls on
    // Using a tiny ±1px buffer to avoid floating point issues
    const startPage = Math.floor((relativeTop + 1) / pageHeightPx);
    const endPage = Math.floor((relativeBottom - 1) / pageHeightPx);

    if (startPage !== endPage) {
      // Row crosses a page boundary!
      // Calculate how much space is left on the current page
      const spacerHeight = (endPage * pageHeightPx) - relativeTop;
      
      // Handle table rows differently (they need a <tr> wrapper)
      if (row.tagName === 'TR') {
        const table = row.closest('table');
        if (table) {
          const spacerRow = document.createElement('tr');
          spacerRow.className = 'pdf-spacer-row';
          const spacerCell = document.createElement('td');
          // Use a large colSpan to cover all columns
          spacerCell.colSpan = 20; 
          spacerCell.style.height = `${spacerHeight}px`;
          spacerCell.style.border = 'none';
          spacerCell.style.padding = '0';
          spacerRow.appendChild(spacerCell);
          row.parentNode.insertBefore(spacerRow, row);
        }
      } else {
        // Standard div or other element
        const spacer = document.createElement('div');
        spacer.className = 'pdf-spacer';
        spacer.style.height = `${spacerHeight}px`;
        spacer.style.width = '100%';
        spacer.style.clear = 'both';
        row.parentNode.insertBefore(spacer, row);
      }
    }
  });

  // Give the browser a moment to recalculate layout after adding spacers
  await new Promise(r => setTimeout(r, 100));
};
