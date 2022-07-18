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

        this.createModal();
    }

    listens() {
        return {
            'overlay.clicked': 'onOverlayClick',
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
     * - `data-class`: Specifies the class applied to the modal.
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
            class: 'modal',
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
        });
    }

    close() {
        this.overlay.hide();
        this.snowboard.transition(this.modal, 'close', () => {
            document.body.removeChild(this.modal);
        });
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
}