// GSAP 플러그인 등록
gsap.registerPlugin(ScrollTrigger, Flip);

// 전역 변수들
const ANIMATION_CONFIG = { duration: 1.5, ease: 'power4.inOut' };
let currentItem = -1;
let isAnimating = false;
let previewItems = [];
let backCtrl;

// 유틸리티 함수들
const preloadImages = (selector = 'img') => {
    console.log('Starting image preload for:', selector);
    return new Promise((resolve) => {
        const images = document.querySelectorAll(selector);
        console.log('Found images:', images.length);
        if (!images.length) {
            resolve();
            return;
        }
        imagesLoaded(images, { background: true }, resolve);
    });
};

const isInViewport = elem => {
    var bounding = elem.getBoundingClientRect();
    return (
        (bounding.bottom >= 0 && bounding.bottom <= (window.innerHeight || document.documentElement.clientHeight) || 
        bounding.top >= 0 && bounding.top <= (window.innerHeight || document.documentElement.clientHeight)) &&
        (bounding.right >= 0 && bounding.right <= (window.innerWidth || document.documentElement.clientWidth) || 
        bounding.left >= 0 && bounding.left <= (window.innerWidth || document.documentElement.clientWidth))
    );
};

const wrapLines = (arr, wrapType, wrapClass) => {
    arr.forEach(el => {
        const wrapEl = document.createElement(wrapType);
        wrapEl.classList = wrapClass;
        el.parentNode.appendChild(wrapEl);
        wrapEl.appendChild(el);
    });
}

// TextLinesReveal 클래스
class TextLinesReveal {
    constructor(DOM_el) {
        this.DOM = {
            el: DOM_el
        };
        this.SplitTypeInstance = new SplitType(this.DOM.el, { types: 'lines' });
        wrapLines(this.SplitTypeInstance.lines, 'div', 'oh');
        this.initEvents();
    }

    in(animation = true) {
        this.isVisible = true;
        gsap.killTweensOf(this.SplitTypeInstance.lines);
        
        let tl = gsap.timeline({
            defaults: {
                duration: 1.5,
                ease: 'power4.inOut'
            }
        })
        .set(this.SplitTypeInstance.lines, {
            yPercent: 105
        });

        if (animation) {
            tl.to(this.SplitTypeInstance.lines, {
                yPercent: 0,
                stagger: 0.1
            });
        } else {
            tl.set(this.SplitTypeInstance.lines, {
                yPercent: 0
            });
        }
        
        return tl;
    }

    out(animation = true) {
        this.isVisible = false;
        gsap.killTweensOf(this.SplitTypeInstance.lines);
        
        let tl = gsap.timeline({
            defaults: {
                duration: 1.5,
                ease: 'power4.inOut'
            }
        });

        if (animation) {
            tl.to(this.SplitTypeInstance.lines, {
                yPercent: -105,
                stagger: 0.02
            });
        } else {
            tl.set(this.SplitTypeInstance.lines, {
                yPercent: -105
            });
        }
        
        return tl;
    }

    initEvents() {
        window.addEventListener('resize', () => {
            this.SplitTypeInstance.split();
            wrapLines(this.SplitTypeInstance.lines, 'div', 'oh');
            if (!this.isVisible) {
                gsap.set(this.SplitTypeInstance.lines, {yPercent: -105});
            }
        });
    }
}

// Content 클래스
class Content {
    constructor(DOM_el) {
        this.DOM = {
            el: DOM_el,
            title: DOM_el.querySelector('.content__title'),
            titleInner: [...DOM_el.querySelectorAll('.content__title .oh__inner')],
            metaInner: DOM_el.querySelector('.content__meta > .oh__inner'),
            text: DOM_el.querySelector('.content__text'),
            thumbs: [...DOM_el.querySelectorAll('.content__thumbs-item')]
        };
        if (this.DOM.text) {
            this.multiLine = new TextLinesReveal(this.DOM.text);
        }

        // **콘텐츠 내부 클릭 시 뒤로가기 동작 추가**
        this.DOM.el.addEventListener('click', (event) => {
            if (isAnimating) return;
            isAnimating = true;
            hideContent();
            event.stopPropagation(); // 이벤트 버블링 방지
        });
    }
}

// Preview 클래스
class Preview {
    constructor(DOM_el, content_el) {
        this.DOM = {
            el: DOM_el,
            imageWrap: DOM_el.querySelector('.preview__img-wrap'),
            image: DOM_el.querySelector('.preview__img'),
            imageInner: DOM_el.querySelector('.preview__img-inner'),
            title: DOM_el.querySelector('.preview__title'),
            titleInner: [...DOM_el.querySelectorAll('.preview__title .oh__inner')],
            description: DOM_el.querySelector('.preview__desc')
        };
        this.content = new Content(content_el);
    }
}

function getAdjacentItems(item) {
    let arr = [];
    for (const [position, otherItem] of previewItems.entries()) {
        if (item != otherItem && isInViewport(otherItem.DOM.el)) {
            arr.push({position: position, item: otherItem});
        }
    }
    return arr;
}

function showContent(item) {
    const itemIndex = previewItems.indexOf(item);
    const adjacentItems = getAdjacentItems(item);
    item.adjacentItems = adjacentItems;

    const tl = gsap.timeline({
        defaults: ANIMATION_CONFIG,
        onStart: () => {
            document.body.classList.add('content-open');
            item.content.DOM.el.classList.add('content--current');
            
            gsap.set([item.content.DOM.titleInner, item.content.DOM.metaInner], {
                yPercent: -101,
                opacity: 0
            });
            gsap.set(item.content.DOM.thumbs, {
                transformOrigin: '0% 0%',
                scale: 0,
                yPercent: 150
            });
            gsap.set([item.content.DOM.text, backCtrl], {
                opacity: 0
            });
        },
        onComplete: () => isAnimating = false
    });

    tl.addLabel('start', 0);

    // 인접 아이템 숨기기
    for (const el of adjacentItems) {
        tl.to(el.item.DOM.el, {
            y: el.position < itemIndex ? -window.innerHeight : window.innerHeight
        }, 'start');
    }

    // Flip 애니메이션
    tl.add(() => {
        const flipstate = Flip.getState(item.DOM.image);
        item.content.DOM.el.appendChild(item.DOM.image);
        Flip.from(flipstate, {
            duration: ANIMATION_CONFIG.duration,
            ease: ANIMATION_CONFIG.ease,
            absolute: true
        });
    }, 'start')

    // 나머지 애니메이션
    .to(item.DOM.titleInner, {
        yPercent: 101,
        opacity: 0,
        stagger: -0.03
    }, 'start')
    .to(item.DOM.description, {
        yPercent: 101,
        opacity: 0
    }, 'start')
    .to(item.DOM.imageInner, {
        scaleY: 1
    }, 'start')
    .addLabel('content', 0.15)
    .to(backCtrl, {
        opacity: 1
    }, 'content')
    .to(item.content.DOM.titleInner, {
        yPercent: 0,
        opacity: 1,
        stagger: -0.05
    }, 'content')
    .to(item.content.DOM.metaInner, {
        yPercent: 0,
        opacity: 1
    }, 'content')
    .to(item.content.DOM.thumbs, {
        scale: 1,
        yPercent: 0,
        stagger: -0.05
    }, 'content')
    .add(() => {
        if (item.content.multiLine) {
            item.content.multiLine.in();
        }
        gsap.set(item.content.DOM.text, {
            opacity: 1,
            delay: 0.01
        });
    }, 'content');
}

function hideContent() {
    const item = previewItems[currentItem];

    const tl = gsap.timeline({
        defaults: ANIMATION_CONFIG,
        onComplete: () => {
            document.body.classList.remove('content-open');
            item.content.DOM.el.classList.remove('content--current');
            isAnimating = false;
        }
    });

    tl.addLabel('start', 0)
    .to(backCtrl, {
        opacity: 0
    }, 'start')
    .to(item.content.DOM.titleInner, {
        yPercent: -101,
        opacity: 0,
        stagger: 0.05
    }, 'start')
    .to(item.content.DOM.metaInner, {
        yPercent: -101,
        opacity: 0
    }, 'start')
    .to(item.content.DOM.thumbs, {
        scale: 0,
        yPercent: 150,
        stagger: -0.05
    }, 'start')
    .add(() => {
        if (item.content.multiLine) {
            item.content.multiLine.out();
        }
    }, 'start')
    .addLabel('preview', 0.15)
    .to(item.adjacentItems.map(el => el.item.DOM.el), {
        y: 0
    }, 'preview')
    .add(() => {
        const flipstate = Flip.getState(item.DOM.image);
        item.DOM.imageWrap.appendChild(item.DOM.image);
        Flip.from(flipstate, {
            duration: ANIMATION_CONFIG.duration,
            ease: ANIMATION_CONFIG.ease,
            absolute: true
        });
    }, 'preview')
    .to(item.DOM.titleInner, {
        yPercent: 0,
        opacity: 1,
        stagger: 0.03
    }, 'preview')
    .to(item.DOM.description, {
        yPercent: 0,
        opacity: 1
    }, 'preview')
    .to(item.DOM.imageInner, {
        scaleY: item.imageInnerScaleYCached || 1
    }, 'preview');
}

// 초기화 및 이벤트 설정
function init() {
    backCtrl = document.querySelector('.action--back');
    if (!backCtrl) {
        console.error('Back button not found');
        return;
    }

    const previewElems = [...document.querySelectorAll('.preview')];
    const contentElems = [...document.querySelectorAll('.content')];
    
    previewElems.forEach((item, pos) => {
        previewItems.push(new Preview(item, contentElems[pos]));
    });

    // 클릭 이벤트
    for (const [pos, item] of previewItems.entries()) {
        item.DOM.imageWrap.addEventListener('click', () => {
            if (isAnimating) return;
            isAnimating = true;
            currentItem = pos;
            showContent(item);
        });
    }

    // 리사이즈 이벤트
    window.addEventListener('resize', () => {
        if (currentItem === -1) return;
        const item = previewItems[currentItem];
        if (!item) return;
        
        const imageTransform = gsap.getProperty(item.DOM.image, "transform");
        gsap.set(item.DOM.image, {
            clearProps: "all"
        });
        if (item.content.multiLine) {
            item.content.multiLine.SplitTypeInstance.split();
        }
    });
}

// 초기화
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM Content Loaded');
    init();
    
    preloadImages('.preview__img-inner, .content__thumbs-item')
        .then(() => {
            console.log('Images loaded');
            document.body.classList.remove('loading');
        })
        .catch(err => {
            console.error('Image loading error:', err);
            document.body.classList.remove('loading');
        });
});