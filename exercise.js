class AltairFx {
    constructor(el) {
        this.DOM = {};
        this.DOM.el = el;
        this.DOM.stack = this.DOM.el.querySelector('.stack');
        this.DOM.stackItems = [].slice.call(this.DOM.stack.children);
        this.totalItems = this.DOM.stackItems.length;
        this.DOM.img = this.DOM.stack.querySelector('.stack__figure > .stack__img');
        this._initEvents();
    }

    _initEvents() {
        this._mouseenterFn = () => {
            this._removeAnimeTargets();
            this._in();
        };
        this._mouseleaveFn = () => {
            this._removeAnimeTargets();
            this._out();
        };
        this.DOM.stack.addEventListener('mouseenter', this._mouseenterFn);
        this.DOM.stack.addEventListener('mouseleave', this._mouseleaveFn);
    }

    _removeAnimeTargets() {
        anime.remove(this.DOM.stackItems);
        anime.remove(this.DOM.img);
    }

    _in() {
        // 스택 아이템의 원래 opacity 저장
        this.originalOpacities = this.DOM.stackItems.map(item => item.style.opacity);
        
        this.DOM.stackItems.forEach((item, i) => {
            if(item.classList.contains('stack__deco')) {
                item.style.opacity = i !== this.totalItems - 1 ? 0.2 * i + 0.2 : 1;
            }
        });

        anime({
            targets: this.DOM.stackItems,
            duration: 1000,
            easing: 'easeOutElastic',
            translateZ: (target, index) => index * 3,
            rotateX: (target, index) => -1 * index * 4,
            delay: (target, index, cnt) => (cnt - index - 1) * 30
        });
        
        anime({
            targets: this.DOM.img,
            duration: 500,
            easing: 'easeOutExpo',
            scale: 0.7
        });
    }

    _out() {
        // 저장된 원래 opacity로 복구
        this.DOM.stackItems.forEach((item, i) => {
            if(this.originalOpacities && this.originalOpacities[i]) {
                item.style.opacity = this.originalOpacities[i];
            }
        });

        anime({
            targets: this.DOM.stackItems,
            duration: 500,
            easing: 'easeOutExpo',
            translateZ: 0,
            rotateX: 0
        });

        anime({
            targets: this.DOM.img,
            duration: 500,
            easing: 'easeOutExpo',
            scale: 1
        });
    }
}

// Initialize
document.querySelectorAll('.grid__item').forEach((item) => {
    new AltairFx(item);
});