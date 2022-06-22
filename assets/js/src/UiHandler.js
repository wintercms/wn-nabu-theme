export default class UiHandler extends Snowboard.Singleton {
    dependencies() {
        return [
            'stickyElement',
            'codeBlock',
            'codeBlockStyle',
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
        document.querySelectorAll('code[class^="language-"]').forEach((element) => {
            this.snowboard.codeBlock(element);
        });

        // Create popovers
        document.querySelectorAll('[data-popover]').forEach((element) => {
            this.snowboard.popover(element);
        });
    }

    ajaxUpdate(updatedElement) {
        updatedElement.querySelectorAll('[data-sticky]').forEach((element) => {
            this.snowboard.stickyElement(element);
        });

        updatedElement.querySelectorAll('[data-popover]').forEach((element) => {
            this.snowboard.popover(element);
        });

        updatedElement.querySelectorAll('code[class^="language-"]').forEach((element) => {
            this.snowboard.codeBlock(element);
        });
    }
}
