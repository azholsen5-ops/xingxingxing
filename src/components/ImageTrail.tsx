import { useRef, useEffect, useState } from 'react';
import { gsap } from 'gsap';

import './ImageTrail.css';

function lerp(a: number, b: number, n: number) {
  return (1 - n) * a + n * b;
}

function getLocalPointerPos(e: any, rect: DOMRect) {
  let clientX = 0,
    clientY = 0;
  if (e.touches && e.touches.length > 0) {
    clientX = e.touches[0].clientX;
    clientY = e.touches[0].clientY;
  } else {
    clientX = e.clientX;
    clientY = e.clientY;
  }
  return {
    x: clientX - rect.left,
    y: clientY - rect.top
  };
}
function getMouseDistance(p1: {x: number, y: number}, p2: {x: number, y: number}) {
  const dx = p1.x - p2.x;
  const dy = p1.y - p2.y;
  return Math.hypot(dx, dy);
}

class ImageItem {
  DOM: { el: HTMLElement | null, inner: HTMLElement | null } = { el: null, inner: null };
  defaultStyle = { scale: 1, x: 0, y: 0, opacity: 0 };
  rect: DOMRect | null = null;
  resize: (() => void) | null = null;

  constructor(DOM_el: HTMLElement) {
    this.DOM.el = DOM_el;
    this.DOM.inner = this.DOM.el.querySelector('.content__img-inner');
    this.getRect();
    this.initEvents();
  }
  initEvents() {
    this.resize = () => {
      if (this.DOM.el) {
        gsap.set(this.DOM.el, this.defaultStyle);
        this.getRect();
      }
    };
    window.addEventListener('resize', this.resize);
  }
  getRect() {
    if (this.DOM.el) {
      this.rect = this.DOM.el.getBoundingClientRect();
    }
  }
  destroy() {
    if (this.resize) {
      window.removeEventListener('resize', this.resize);
    }
  }
}

class ImageTrailVariant1 {
  container: HTMLElement;
  DOM: { el: HTMLElement };
  images: ImageItem[];
  imagesTotal: number;
  imgPosition = 0;
  zIndexVal = 1;
  activeImagesCount = 0;
  isIdle = true;
  threshold = 80;
  mousePos = { x: 0, y: 0 };
  lastMousePos = { x: 0, y: 0 };
  cacheMousePos = { x: 0, y: 0 };
  requestId: number | null = null;

  handlePointerMove: (ev: any) => void;
  initRender: (ev: any) => void;

  constructor(container: HTMLElement) {
    this.container = container;
    this.DOM = { el: container };
    this.images = [...this.DOM.el.querySelectorAll('.content__img')].map(img => new ImageItem(img as HTMLElement));
    this.imagesTotal = this.images.length;

    this.handlePointerMove = (ev: any) => {
      if (window.innerWidth < 1024) return; // Disable trail on mobile/tablets
      const rect = this.container.getBoundingClientRect();
      this.mousePos = getLocalPointerPos(ev, rect);
    };
    window.addEventListener('mousemove', this.handlePointerMove);
    window.addEventListener('touchmove', this.handlePointerMove, { passive: true });

    this.initRender = (ev: any) => {
      if (window.innerWidth < 1024) return;
      const rect = this.container.getBoundingClientRect();
      this.mousePos = getLocalPointerPos(ev, rect);
      this.cacheMousePos = { ...this.mousePos };

      this.requestId = requestAnimationFrame(() => this.render());

      window.removeEventListener('mousemove', this.initRender);
      window.removeEventListener('touchmove', this.initRender);
    };
    window.addEventListener('mousemove', this.initRender);
    window.addEventListener('touchmove', this.initRender);
  }

  render() {
    if (window.innerWidth < 1024) return;
    // Only show images if mouse is within container bounds
    const rect = this.container.getBoundingClientRect();
    const isInside = 
      this.mousePos.x >= 0 && 
      this.mousePos.x <= rect.width && 
      this.mousePos.y >= 0 && 
      this.mousePos.y <= rect.height;

    let distance = getMouseDistance(this.mousePos, this.lastMousePos);
    this.cacheMousePos.x = lerp(this.cacheMousePos.x, this.mousePos.x, 0.1);
    this.cacheMousePos.y = lerp(this.cacheMousePos.y, this.mousePos.y, 0.1);

    if (distance > this.threshold && isInside) {
      this.showNextImage();
      this.lastMousePos = { ...this.mousePos };
    }
    if (this.isIdle && this.zIndexVal !== 1) {
      this.zIndexVal = 1;
    }
    this.requestId = requestAnimationFrame(() => this.render());
  }

  showNextImage() {
    ++this.zIndexVal;
    this.imgPosition = this.imgPosition < this.imagesTotal - 1 ? this.imgPosition + 1 : 0;
    const img = this.images[this.imgPosition];

    if (!img.rect) return;

    gsap.killTweensOf(img.DOM.el);
    gsap
      .timeline({
        onStart: () => this.onImageActivated(),
        onComplete: () => this.onImageDeactivated()
      })
      .fromTo(
        img.DOM.el,
        {
          opacity: 1,
          scale: 1,
          zIndex: this.zIndexVal,
          x: this.cacheMousePos.x - img.rect.width / 2,
          y: this.cacheMousePos.y - img.rect.height / 2
        },
        {
          duration: 0.4,
          ease: 'power1',
          x: this.mousePos.x - img.rect.width / 2,
          y: this.mousePos.y - img.rect.height / 2
        },
        0
      )
      .to(
        img.DOM.el,
        {
          duration: 0.4,
          ease: 'power3',
          opacity: 0,
          scale: 0.2
        },
        0.4
      );
  }

  onImageActivated() {
    this.activeImagesCount++;
    this.isIdle = false;
  }
  onImageDeactivated() {
    this.activeImagesCount--;
    if (this.activeImagesCount === 0) {
      this.isIdle = true;
    }
  }

  destroy() {
    if (this.requestId) cancelAnimationFrame(this.requestId);
    window.removeEventListener('mousemove', this.handlePointerMove);
    window.removeEventListener('touchmove', this.handlePointerMove);
    window.removeEventListener('mousemove', this.initRender);
    window.removeEventListener('touchmove', this.initRender);
    this.images.forEach(img => img.destroy());
  }
}

// Simplified for brevity, only implementing variant 1 as requested/implied
const variantMap: any = {
  1: ImageTrailVariant1,
};

export default function ImageTrail({ items = [], variant = 1 }: { items: string[], variant?: string | number }) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const Cls = variantMap[variant] || variantMap[1];
    const instance = new Cls(containerRef.current);

    return () => {
      if (instance.destroy) instance.destroy();
    };
  }, [variant, items]);

  return (
    <div className="content" ref={containerRef}>
      {items.map((url, i) => (
        <div className="content__img" key={i}>
          <div className="content__img-inner" style={{ backgroundImage: `url(${url})` }} />
        </div>
      ))}
    </div>
  );
}
