export default class UiHandler extends Snowboard.Singleton {
    dependencies() {
        return [
            'stickyElement',
            'codeBlock',
            'codeBlockStyle',
            'backendPreviewer',
            'popover',
            'modal',
        ];
    }

    listens() {
        return {
            ready: 'ready',
            ajaxUpdate: 'ajaxUpdate',
        };
    }

    ready() {
        // Attach sticky elements
        document.querySelectorAll('[data-sticky]').forEach((element) => {
            this.snowboard.stickyElement(element);
        });

        // Attach code elements
        document.querySelectorAll('code[class^="language-"]:not(.language-backend)').forEach((element) => {
            this.snowboard.codeBlock(element);
        });

        // Attach backend elements
        document.querySelectorAll('code.language-backend').forEach((element) => {
            this.snowboard.backendPreviewer(element);
        });

        // Create popovers
        document.querySelectorAll('[data-popover]').forEach((element) => {
            this.snowboard.popover(element);
        });

        document.querySelector('a[data-search]').addEventListener('click', (event) => {
            this.snowboard.modal(document.querySelector('div[data-search]'));
        });

        // Add CTRL+K/CMD+K shortcut to show the search modal
        window.addEventListener('keydown', (event) => {
            if (event.key.toLowerCase() === 'k' && (event.ctrlKey || event.metaKey)) {
                event.preventDefault();

                this.snowboard.modal(document.querySelector('div[data-search]'));
            }
        });
    }

    ajaxUpdate(updatedElement) {
        updatedElement.querySelectorAll('[data-sticky]').forEach((element) => {
            this.snowboard.stickyElement(element);
        });

        updatedElement.querySelectorAll('[data-popover]').forEach((element) => {
            this.snowboard.popover(element);
        });

        updatedElement.querySelectorAll('code[class^="language-"]:not(.language-backend)').forEach((element) => {
            this.snowboard.codeBlock(element);
        });

        updatedElement.querySelectorAll('code.language-backend').forEach((element) => {
            this.snowboard.backendPreviewer(element);
        });
    }
}
