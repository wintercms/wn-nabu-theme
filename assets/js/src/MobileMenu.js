export default class MobileMenu extends Snowboard.Singleton {
    construct() {
        this.element = null;
        this.menu = null;
        this.docsMenu = null;
        this.hamburger = null;
        this.active = false;
        this.overlay = null;

        this.events = {
            click: (event) => this.onMenuToggle(event),
            pageClick: (event) => this.onPageClick(event),
        };
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
        const element = document.querySelector('[data-mobile-menu]');

        if (!element) {
            return;
        }

        this.element = element;
        this.menu = document.querySelector('#navigation');
        this.docsMenu = document.querySelector('#docs-menu');
        this.config = this.snowboard.dataConfig(this, element);
        this.hamburger = element.querySelector('.hamburger');
        this.initialise();
    }

    ajaxUpdate(updatedElement) {
        if (updatedElement === this.docsMenu) {
            this.docsMenu.querySelectorAll('a').forEach((item) => {
                item.addEventListener('click', this.events.pageClick);
            });
        }
    }

    initialise() {
        this.element.addEventListener('click', this.events.click);

        this.docsMenu.querySelectorAll('a').forEach((item) => {
            item.addEventListener('click', this.events.pageClick);
        });
    }

    onMenuToggle(event) {
        event.preventDefault();

        this.active = !this.active;
        this.animateBurger();

        if (this.active) {
            document.body.classList.add('mobile-menu-shown');
            this.overlay = this.snowboard.overlay();
            this.overlay
                .setColor(this.snowboard.darkMode().isDark() ? 'rgb(5, 16, 22)' : 'rgb(241, 245, 249)')
                .setOpacity(1)
                .show();
        } else {
            document.body.classList.remove('mobile-menu-shown');
            this.overlay.hide();
        }
    }

    onPageClick() {
        this.active = false;
        this.animateBurger();
        document.body.classList.remove('mobile-menu-shown');
        this.overlay.hide();
    }

    onOverlayShown(overlayInst) {
        if (this.overlay !== overlayInst) {
            return;
        }
        if (this.active) {
            this.menu.style.display = 'flex';
            this.menu.style.transition = 'opacity 300ms ease';
            setTimeout(() => {
                this.menu.style.opacity = 1;
            }, 15);
        }
    }

    onOverlayHide(overlayInst) {
        if (this.overlay !== overlayInst) {
            return;
        }
        if (!this.active) {
            this.menu.style.display = 'none';
            this.menu.style.opacity = 0;
        }
    }

    animateBurger() {
        if (this.active) {
            this.hamburger.children.item(0).style.transform = 'rotate(45deg) translate(0px, 5px)';
            this.hamburger.children.item(1).style.transform = 'rotate(-45deg)';
            this.hamburger.children.item(2).style.opacity = 0;
        } else {
            this.hamburger.children.item(0).style.transform = 'rotate(0deg) translate(0px, 0px)';
            this.hamburger.children.item(1).style.transform = 'rotate(0deg)';
            this.hamburger.children.item(2).style.opacity = 1;
        }
    }
}
