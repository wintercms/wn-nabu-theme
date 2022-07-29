/**
 * Overlay element.
 *
 * Controls the overlay element that shrouds the page when a modal, popup or popover is open.
 *
 * @copyright 2021 Winter.
 * @author Ben Thomson <git@alfreido.com>
 */
 export default class Overlay extends Snowboard.PluginBase {
    /**
     * Constructor.
     */
    construct() {
        this.overlay = null;
        this.shown = false;
        this.color = '#000000';
        this.opacity = 0.42;
        this.speed = 175;
        this.zIndex = 39;
    }

    /**
     * Destructor.
     *
     * Destroys the overlay.
     */
    destruct() {
        this.destroyOverlay();
        super.destruct();
    }

    /**
     * Creates an overlay element and inserts it into the DOM.
     */
    createOverlay() {
        this.overlay = document.createElement('div');
        this.overlay.id = 'overlay';
        this.setStyle();
        this.overlay.addEventListener('click', (event) => {
            this.snowboard.globalEvent('overlay.clicked', this, event);
        });

        document.body.appendChild(this.overlay);
    }

    /**
     * Removes and destroys the overlay element from the DOM.
     */
    destroyOverlay() {
        document.body.removeChild(this.overlay);
        this.overlay = null;
    }

    /**
     * Sets the styling on the overlay.
     */
    setStyle() {
        this.overlay.style.backgroundColor = this.color;
        this.overlay.style.position = 'fixed';
        this.overlay.style.top = 0;
        this.overlay.style.left = 0;
        this.overlay.style.opacity = 0;
        this.overlay.style.zIndex = this.zIndex;
        this.overlay.style.transitionProperty = 'opacity';
        this.overlay.style.transitionTimingFunction = 'ease-out';
        this.overlay.style.transitionDuration = `${this.speed}ms`;

        window.requestAnimationFrame(() => {
            if (this.shown) {
                this.overlay.style.width = '100%';
                this.overlay.style.height = '100%';
                this.overlay.style.opacity = this.opacity;
            } else {
                this.overlay.style.width = '0px';
                this.overlay.style.height = '0px';
                this.overlay.style.opacity = 0;
            }
        });
    }

    /**
     * Shows the overlay.
     *
     * Fires an "overlay.show" event, and follows up with an "overlay.shown" when the transition completes.
     */
    show() {
        if (!this.overlay) {
            this.createOverlay();
            this.setStyle();
        }
        if (this.shown) {
            return;
        }

        window.requestAnimationFrame(() => {
            this.snowboard.globalEvent('overlay.show', this);
            this.shown = true;
            this.overlay.style.width = '100%';
            this.overlay.style.height = '100%';

            // Prevent scrolling of the body while an overlay is shown
            document.body.style.overflowY = 'hidden';

            window.requestAnimationFrame(() => {
                this.overlay.style.opacity = this.opacity;

                this.overlay.addEventListener('transitionend', () => {
                    this.snowboard.globalEvent('overlay.shown', this);
                }, {
                    once: true,
                });
            });
        });
    }

    /**
     * Hides the overlay.
     *
     * Fires an "overlay.hide" event, and follows up with an "overlay.hidden" when the transition completes.
     */
    hide() {
        if (!this.shown || !this.overlay) {
            return;
        }

        this.snowboard.globalEvent('overlay.hide', this);
        this.overlay.style.opacity = 0;

        document.body.style.overflowY = null;

        this.overlay.addEventListener('transitionend', () => {
            this.shown = false;
            this.overlay.style.width = '0px';
            this.overlay.style.height = '0px';
            this.snowboard.globalEvent('overlay.hidden', this);
            this.destruct();
        }, {
            once: true,
        });
    }

    /**
     * Toggles the overlay.
     */
    toggle() {
        if (this.shown) {
            this.hide();
            return;
        }

        this.show();
    }

    /**
     * Sets the color of the overlay.
     *
     * Fluent method.
     *
     * @param {string} color
     * @returns {Overlay}
     */
    setColor(color) {
        this.color = String(color);
        return this;
    }

    /**
     * Sets the opacity of the overlay.
     *
     * Fluent method.
     *
     * @param {Number} opacity
     * @returns {Overlay}
     */
    setOpacity(opacity) {
        this.opacity = Number(opacity);
        return this;
    }

    /**
     * Sets the speed of the transition for the overlay.
     *
     * Fluent method.
     *
     * @param {Number} speed
     * @returns {Overlay}
     */
    setSpeed(speed) {
        this.speed = Number(speed);
        return this;
    }

    /**
     * Sets the z-index for the overlay.
     *
     * Fluent method.
     *
     * @param {Number} zIndex
     * @returns {Overlay}
     */
     setZIndex(zIndex) {
        this.zIndex = Number(zIndex);
        return this;
    }
}
