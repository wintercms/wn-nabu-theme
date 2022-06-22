/**
 * Renders code blocks using Prism.js
 *
 * @author Ben Thomson <git@alfreido.com>
 * @copyright Winter CMS
 */
export default class CodeBlock extends Snowboard.PluginBase
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

        this.renderBlock();
    }

    /**
     * Render code highlighting on element.
     */
    renderBlock() {
        window.Prism.highlightElement(this.element);
    }
}
