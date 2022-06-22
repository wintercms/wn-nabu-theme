export default class CollapsibleMenu extends Snowboard.Singleton {
    construct() {
        this.menu = null;
    }

    listens() {
        return {
            ready: 'ready',
            ajaxUpdateComplete: 'ready',
        };
    }

    ready() {
        this.menu = document.querySelector('#docs-menu > ul');
        if (!this.menu) {
            return;
        }

        this.attach();
    }

    attach() {
        this.menu.querySelectorAll('span').forEach((item) => {
            if (item.nextElementSibling && item.nextElementSibling.matches('ul:not(.menu-depth-2)')) {
                item.parentElement.dataset.collapsible = true;
                item.parentElement.dataset.collapsed = !item.parentElement.classList.contains('child-active');
                item.style.cursor = 'pointer';

                item.addEventListener('click', () => {
                    if (item.parentElement.dataset.collapsed) {
                        delete item.parentElement.dataset.collapsed;
                    } else {
                        item.parentElement.dataset.collapsed = true;
                    }
                });
            }
        });
    }
}
