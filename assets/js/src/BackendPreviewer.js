/**
 * Renders code blocks with language "backend" as a backend preview code snippet.
 *
 * @author Ben Thomson <git@alfreido.com>
 * @copyright Winter CMS
 */
export default class BackendPreviewer extends Snowboard.PluginBase
{
    /**
     * Constructor.
     *
     * The element provided should be a <code> block with a class starting with "language-" to
     * identify the language of the code being highlighted.
     *
     * @param {HTMLElement} element
     */
    construct(element) {
        this.element = element;
        this.container = element.closest('pre');
        this.iframe = null;

        this.renderBlock();
    }

    /**
     * Render backend preview
     */
    renderBlock() {
        const parser = new DOMParser();
        const tempDoc = parser.parseFromString(
            this.snowboard.sanitizer().sanitize(this.getHtmlFromElement()),
            'text/html'
        );

        this.iframe = document.createElement('iframe');
        this.iframe.classList.add('backend-preview');
        this.container.parentElement.replaceChild(this.iframe, this.container);
        this.iframe.contentWindow.document.open();
        this.iframe.contentWindow.document.write(this.htmlTemplate());
        this.iframe.contentWindow.document.close();

        tempDoc.body.childNodes.forEach((node) => {
            this.iframe.contentWindow.document.body.appendChild(node.cloneNode(true));
        });

        // Apply styling
        this.iframe.contentWindow.document.body.style.padding = '20px';

        // Resize to the size of the content
        setTimeout(() => {
            this.iframe.style.height = `${this.iframe.contentWindow.document.body.offsetHeight}px`;
        }, 10);
    }

    /**
     * Renders the HTML template for the backend preview
     */
    htmlTemplate() {
        return `
            <!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Backend Preview</title>

                <link rel="stylesheet" href="${this.snowboard.url().to('modules/system/assets/ui/storm.css')}">
            </head>
            <body>
            </body>
            </html>
        `;
    }

    getHtmlFromElement() {
        const textarea = document.createElement('textarea');
        textarea.innerHTML = this.element.innerHTML;
        return textarea.value;
    }
}
