/**
 * Modal element.
 *
 * Creates a modal window to display content.
 *
 * @copyright 2022 Winter.
 * @author Ben Thomson <git@alfreido.com>
 */
export default class Modal extends Snowboard.PluginBase {
    /**
     * Constructor.
     */
    construct(element) {
        this.element = element;
        this.config = this.snowboard.dataConfig(this, element);
        this.overlay = this.snowboard.overlay();
        this.modal = null;
        this.events = {
            keydown: (event) => this.onKeyDown(event),
            dismiss: (event) => this.close(event),
        };

        this.createModal();
    }

    listens() {
        return {
            'overlay.clicked': 'onOverlayClick',
            'ajaxUpdate': 'onAjaxUpdate',
        };
    }

    /**
     * Defines the dependencies.
     *
     * @returns {Array}
     */
    dependencies() {
        return ['transition', 'overlay'];
    }

    /**
     * Default configuration options.
     *
     * - `data-allow-multiple`: Allow multiple copies of the same modal.
     * - `data-class`: Specifies the class applied to the modal.
     * - `data-esc-close="false"`: Disables the closing of the modal when the escape key is pressed.
     * - `data-enable-scroll`: Enables scrolling of the page behind the modal.
     * - `data-overlay-close="false"`: Disables the closing of the modal when clicking on the
     *  overlay outside of the modal.
     * - `data-overlay-color="<color>"`: Specifies the color of the overlay.
     * - `data-overlay-opacity="<opacity>"`: Specifies the opacity of the overlay.
     * - `data-overlay-z-index="<z-index>"`: Specifies the z-index of the overlay.
     * - `data-modal-z-index="<z-index>"`: Specifies the z-index of the modal.
     *
     * @returns {Object}
     */
    defaults() {
        return {
            allowMultiple: false,
            class: 'modal',
            escClose: true,
            enableScroll: false,
            overlayClose: true,
            overlayColor: '#051016',
            overlayOpacity: 0.5,
            overlayZIndex: 60,
            modalZIndex: 70,
        };
    }

    /**
     * Creates a modal window and copies content from the targeted element within the modal.
     *
     * @returns {void}
     */
    createModal() {
        if (this.config.get('allowMultiple') === false) {
            if (this.element.dataset.modalOpened) {
                this.destruct();
                return;
            }

            this.element.dataset.modalOpened = true;
        }

        this.modal = document.createElement('aside');
        this.modal.style.zIndex = this.config.get('modalZIndex');
        this.modal.classList.add(this.config.get('class'));

        // Clone element
        const clone = this.element.cloneNode(true);
        Array.from(clone.children).forEach((child) => {
            this.modal.appendChild(child);
        });

        document.body.append(this.modal);
        this.overlay
            .setColor(this.config.get('overlayColor'))
            .setOpacity(this.config.get('overlayOpacity'))
            .setZIndex(this.config.get('overlayZIndex'))
            .show();

        this.snowboard.transition(this.modal, 'open', () => {
            this.focusOnFirstItem();
            this.snowboard.globalEvent('modal.opened', this, this.modal);
        });

        if (this.config.get('escClose')) {
            window.addEventListener('keydown', this.events.keydown);
        }

        this.attachDisposingElements(this.modal);
    }

    close() {
        this.overlay.hide();
        this.snowboard.transition(this.modal, 'close', () => {
            document.body.removeChild(this.modal);
            this.snowboard.globalEvent('modal.closed', this);
        });

        if (this.config.get('allowMultiple') === false) {
            delete this.element.dataset.modalOpened;
        }

        if (this.config.get('escClose')) {
            window.removeEventListener('keydown', this.events.keydown);
        }
    }

    getFocusableElements() {
        const focusable = [
            'a[href]',
            'area[href]',
            'input:not([disabled]):not([type="hidden"]):not([aria-hidden])',
            'select:not([disabled]):not([aria-hidden])',
            'textarea:not([disabled]):not([aria-hidden])',
            'button:not([disabled]):not([aria-hidden])',
            'iframe',
            'object',
            'embed',
            '[contenteditable]',
            '[tabindex]:not([tabindex^="-"])',
        ];

        return this.modal.querySelectorAll(focusable.join(','));
    }

    focusOnFirstItem() {
        const focusable = this.getFocusableElements();
        if (focusable.length > 0) {
            focusable[0].focus();
        }
    }

    onOverlayClick() {
        if (this.config.get('overlayClose')) {
            this.close();
        }
    }

    onKeyDown(event) {
        if (event.key !== 'Escape') {
            return;
        }

        if (!this.config.get('escClose')) {
            return;
        }

        this.close();
    }

    attachDisposingElements(parent) {
        parent.querySelectorAll('[data-dismiss-modal]').forEach((element) => {
            element.addEventListener('click', this.events.dismiss);
        });
    }

    onAjaxUpdate(element) {
        if (!this.modal.contains(element)) {
            return;
        }

        this.attachDisposingElements(element);
    }
}
