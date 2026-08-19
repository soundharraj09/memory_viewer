/**
 * High-Performance Virtual Scroller for Chat Message Windowing.
 * Renders hundreds of thousands of messages smoothly.
 */

export class VirtualScroller {
  /**
   * @param {HTMLElement} container 
   * @param {Object} options
   * @param {number} [options.estimatedItemHeight=70]
   * @param {number} [options.buffer=30]
   * @param {Function} options.renderItem
   */
  constructor(container, options = {}) {
    this.container = container;
    this.estimatedItemHeight = options.estimatedItemHeight || 38;
    this.buffer = options.buffer || 35;
    this.renderItem = options.renderItem;

    this.items = [];
    this.totalHeight = 0;
    this.itemHeights = [];
    this.itemOffsets = [];
    this.renderedNodes = new Map(); // index -> DOMNode

    // Ensure container has scroll styles
    this.container.style.overflowY = 'auto';
    this.container.style.position = 'relative';

    // Inner scroll content height element
    this.contentElement = document.createElement('div');
    this.contentElement.className = 'virtual-scroll-content';
    this.contentElement.style.position = 'relative';
    this.contentElement.style.width = '100%';
    
    this.container.innerHTML = '';
    this.container.appendChild(this.contentElement);

    this.onScroll = this.onScroll.bind(this);
    this.container.addEventListener('scroll', this.onScroll, { passive: true });
    
    this.startIndex = 0;
    this.endIndex = 0;

    // ResizeObserver for viewport height changes
    if (window.ResizeObserver) {
      this.resizeObserver = new ResizeObserver(() => this.update());
      this.resizeObserver.observe(this.container);
    }
  }

  /**
   * Sets items array and recalculates layout.
   * @param {Array<any>} items 
   * @param {boolean} [preserveScroll=false]
   */
  setItems(items, preserveScroll = false) {
    this.items = items || [];
    const count = this.items.length;
    this.estimatedItemHeight = typeof this.getEstimatedItemHeight === 'function'
      ? this.getEstimatedItemHeight()
      : this.estimatedItemHeight;
    
    this.itemHeights = new Array(count).fill(this.estimatedItemHeight);
    this.itemOffsets = new Array(count);
    
    let currentOffset = 0;
    for (let i = 0; i < count; i++) {
      this.itemOffsets[i] = currentOffset;
      currentOffset += this.itemHeights[i];
    }
    this.totalHeight = currentOffset;
    this.contentElement.style.height = `${this.totalHeight}px`;

    // Clear rendered DOM nodes
    this.contentElement.innerHTML = '';
    this.renderedNodes.clear();

    if (!preserveScroll) {
      this.container.scrollTop = 0;
    }
    
    this.update();
  }

  findItemIndexAtOffset(offset) {
    let low = 0;
    let high = this.items.length - 1;
    
    while (low <= high) {
      const mid = Math.floor((low + high) / 2);
      const itemTop = this.itemOffsets[mid];
      const itemBottom = itemTop + this.itemHeights[mid];

      if (offset >= itemTop && offset < itemBottom) {
        return mid;
      } else if (offset < itemTop) {
        high = mid - 1;
      } else {
        low = mid + 1;
      }
    }

    return Math.max(0, Math.min(low, this.items.length - 1));
  }

  onScroll() {
    this.update();
  }

  update() {
    if (!this.items || this.items.length === 0) {
      this.contentElement.innerHTML = '';
      this.contentElement.style.height = '0px';
      this.renderedNodes.clear();
      return;
    }

    const scrollTop = this.container.scrollTop;
    const clientHeight = this.container.clientHeight || 600;

    let start = this.findItemIndexAtOffset(scrollTop);
    let end = this.findItemIndexAtOffset(scrollTop + clientHeight);

    start = Math.max(0, start - this.buffer);
    end = Math.min(this.items.length - 1, end + this.buffer);

    this.startIndex = start;
    this.endIndex = end;

    // Remove nodes out of window
    for (const [index, node] of this.renderedNodes.entries()) {
      if (index < start || index > end) {
        node.remove();
        this.renderedNodes.delete(index);
      }
    }

    // Render nodes in window
    const fragment = document.createDocumentFragment();

    for (let i = start; i <= end; i++) {
      if (!this.renderedNodes.has(i)) {
        const item = this.items[i];
        const node = this.renderItem(item, i);
        node.style.position = 'absolute';
        node.style.top = `${this.itemOffsets[i]}px`;
        node.style.left = '0';
        node.style.right = '0';
        node.style.width = '100%';
        node.setAttribute('data-index', i);

        fragment.appendChild(node);
        this.renderedNodes.set(i, node);
      }
    }

    this.contentElement.appendChild(fragment);

    // Height measurement correction
    requestAnimationFrame(() => {
      let heightChanged = false;
      for (let i = start; i <= end; i++) {
        const node = this.renderedNodes.get(i);
        if (node) {
          const measuredHeight = node.offsetHeight;
          if (measuredHeight > 0 && Math.abs(measuredHeight - this.itemHeights[i]) > 1) {
            this.itemHeights[i] = measuredHeight;
            heightChanged = true;
          }
        }
      }

      if (heightChanged) {
        this.recalculateOffsetsFrom(start);
      }
    });
  }

  recalculateOffsetsFrom(startIndex) {
    let currentOffset = startIndex > 0 ? this.itemOffsets[startIndex - 1] + this.itemHeights[startIndex - 1] : 0;
    for (let i = startIndex; i < this.items.length; i++) {
      this.itemOffsets[i] = currentOffset;
      currentOffset += this.itemHeights[i];
      const node = this.renderedNodes.get(i);
      if (node) {
        node.style.top = `${this.itemOffsets[i]}px`;
      }
    }
    this.totalHeight = currentOffset;
    this.contentElement.style.height = `${this.totalHeight}px`;
  }

  scrollToIndex(index, align = 'center') {
    if (index < 0 || index >= this.items.length) return;
    
    let targetOffset = this.itemOffsets[index];
    if (align === 'center') {
      targetOffset -= (this.container.clientHeight / 2) - (this.itemHeights[index] / 2);
    } else if (align === 'bottom') {
      targetOffset -= this.container.clientHeight - this.itemHeights[index];
    }

    this.container.scrollTop = Math.max(0, targetOffset);
    this.update();
  }
}
