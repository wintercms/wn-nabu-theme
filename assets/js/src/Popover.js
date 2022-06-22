import { createPopper } from '@popperjs/core/lib/popper-lite';
import flip from '@popperjs/core/lib/modifiers/flip';
import preventOverflow from '@popperjs/core/lib/modifiers/preventOverflow';
import offset from '@popperjs/core/lib/modifiers/offset';
import arrow from '@popperjs/core/lib/modifiers/arrow';

export default class Popover extends Snowboard.PluginBase {
    construct(popover) {
        this.popover = popover;

        // Prevent double initialisation
        if (this.popover.dataset.popoverInitialised) {
            this.destruct();
            return;
        }
        this.popover.dataset.popoverInitialised = true;

        this.popper = null;
        this.config = snowboard.dataConfig(this, popover);
        this.target = (this.config.get('target'))
            ? document.querySelector(this.config.get('target'))
            : null;

        this.createPopper();
    }

    defaults() {
        return {
            target: null,
            trigger: 'click',
            placement: 'top',
            classes: null,
            noClasses: null,
            offset: 20,
        };
    }

    createPopper() {
        if (!this.target) {
            return;
        }

        const arrowElement = document.createElement('DIV');
        arrowElement.setAttribute('data-popper-arrow', '');
        this.popover.append(arrowElement);

        this.popper = createPopper(this.target, this.popover, {
            modifiers: [
                preventOverflow,
                arrow,
                {
                    ...offset,
                    options: {
                        offset: [0, this.config.get('offset')],
                    },
                }, {
                    ...flip,
                    options: {
                        padding: {
                            top: 120,
                            bottom: 20,
                            left: 20,
                            right: 20,
                        },
                    },
                }
            ],
            placement: this.config.get('placement'),
            offset: [0, this.config.get('offset')]
        });
        this.popover.removeAttribute('data-show');

        if (this.config.get('trigger') === 'click') {
            this.target.addEventListener('click', (event) => this.toggle(event));
            window.addEventListener('click', (event) => this.trackOuterClicks(event));
        }
    }

    toggle(event) {
        event.preventDefault();

        if (this.popover.hasAttribute('data-show')) {
            this.hide();
        } else {
            this.show();
        }
    }

    show() {
        this.popover.setAttribute('data-show', '');
        this.popper.update();

        if (this.config.get('classes')) {
            const classes = this.config.get('classes').split(/ +/);
            classes.forEach((className) => {
                this.target.classList.add(className);
            });
        }
        if (this.config.get('noClasses')) {
            const classes = this.config.get('noClasses').split(/ +/);
            classes.forEach((className) => {
                this.target.classList.remove(className);
            });
        }

        this.snowboard.globalEvent('popover.show', this);
    }

    hide() {
        this.popover.removeAttribute('data-show');

        if (this.config.get('classes')) {
            const classes = this.config.get('classes').split(/ +/);
            classes.forEach((className) => {
                this.target.classList.remove(className);
            });
        }
        if (this.config.get('noClasses')) {
            const classes = this.config.get('noClasses').split(/ +/);
            classes.forEach((className) => {
                this.target.classList.add(className);
            });
        }

        this.snowboard.globalEvent('popover.hide', this);
    }

    trackOuterClicks(event) {
        if (this.popover.contains(event.target) || this.target.contains(event.target)) {
            return;
        }

        this.hide();
    }
}
