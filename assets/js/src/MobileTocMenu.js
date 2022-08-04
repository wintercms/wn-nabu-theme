export default class MobileTocMenu extends Snowboard.Singleton {
    construct() {
        this.element = null;
        this.toc = null;
        this.docsToc = null;
        this.hamburger = null;
        this.active = false;
        this.overlay = null;
        this.mobileMenu = null;

        this.events = {
            click: (event) => this.onMenuToggle(event),
            pageClick: (event) => this.onPageClick(event),
        };
    }

    depends() {
        return ['mobileMenu'];
    }

    listens() {
        return {
            ready: 'ready',
            ajaxUpdate: 'ajaxUpdate',
            'overlay.shown': 'onOverlayShown',
            'overlay.hide': 'onOverlayHide',
        };
    }

    ready() {
        // Look for a mobile menu link
        const element = document.querySelector('[data-mobile-toc]');

        if (!element) {
            return;
        }

        this.element = element;
        this.toc = document.querySelector('#toc');
        this.docsToc = document.querySelector('#docs-toc');
        this.config = this.snowboard.dataConfig(this, element);
        this.hamburger = element.querySelector('.hashburger');
        this.mobileMenu = this.snowboard.mobileMenu();
        this.initialise();
    }

    ajaxUpdate(updatedElement) {
        if (updatedElement === this.docsToc) {
            this.docsToc.querySelectorAll('a').forEach((item) => {
                item.addEventListener('click', this.events.pageClick);
            });
        }
    }

    initialise() {
        this.element.addEventListener('click', this.events.click);

        this.docsToc.querySelectorAll('a').forEach((item) => {
            item.addEventListener('click', this.events.pageClick);
        });
    }

    onPageClick() {
        if (!this.active) {
            return;
        }
        this.active = false;
        this.animateBurger();
        document.body.classList.remove('mobile-menu-shown');
        this.overlay.hide();
    }

    onMenuToggle(event) {
        event.preventDefault();

        this.active = !this.active;
        this.animateBurger();

        if (this.active) {
            if (!document.body.classList.contains('mobile-menu-shown')) {
                document.body.classList.add('mobile-menu-shown');
                this.overlay = this.snowboard.overlay();
                this.overlay
                    .setColor(this.snowboard.darkMode().isDark() ? 'rgb(5, 16, 22)' : 'rgb(241, 245, 249)')
                    .setOpacity(1)
                    .show();
            } else if (this.mobileMenu.active) {
                this.swapFromMobileMenu();
            }
        } else {
            document.body.classList.remove('mobile-menu-shown');
            this.overlay.hide();
        }
    }

    onOverlayShown(overlayInst) {
        if (this.overlay !== overlayInst) {
            return;
        }
        if (this.active) {
            this.toc.style.display = 'block';
            this.toc.style.transition = 'opacity 300ms ease';
            this.toc.style.opacity = 0;
            setTimeout(() => {
                this.toc.style.opacity = 1;
            }, 15);
        }
    }

    onOverlayHide(overlayInst) {
        if (this.overlay !== overlayInst) {
            return;
        }
        if (!this.active) {
            this.toc.style.display = 'none';
            this.toc.style.opacity = 0;
        }
    }

    animateBurger() {
        if (this.active) {
            this.hamburger.children.item(2).style.transform = 'rotate(45deg) translate(0px, 3px)';
            this.hamburger.children.item(3).style.transform = 'rotate(-45deg) translate(0px, -4px)';
            this.hamburger.children.item(0).style.opacity = 0;
            this.hamburger.children.item(1).style.opacity = 0;
        } else {
            this.hamburger.children.item(2).style.transform = 'rotate(0deg) translate(0px, 0px)';
            this.hamburger.children.item(3).style.transform = 'rotate(0deg) translate(0px, 0px)';
            this.hamburger.children.item(0).style.opacity = 1;
            this.hamburger.children.item(1).style.opacity = 1;
        }
    }

    swapFromMobileMenu() {
        this.mobileMenu.active = false;
        this.mobileMenu.animateBurger();
        this.mobileMenu.menu.addEventListener('transitionend', () => {
            this.mobileMenu.menu.style.display = 'none';
            this.toc.style.display = 'flex';
            this.toc.style.transition = 'opacity 300ms ease';
            this.toc.style.opacity = 0;

            // Transfer overlay instance to this menu
            this.overlay = this.mobileMenu.overlay;

            setTimeout(() => {
                this.toc.style.opacity = 1;
            }, 15);
        }, {
            once: true,
        });

        this.mobileMenu.menu.style.opacity = 0;
    }
}
