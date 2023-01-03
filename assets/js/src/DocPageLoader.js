/**
 * Documentation page loader.
 *
 * The plugin provides a "single-page-app" like experience for the Docs by loading new docs pages
 * via AJAX and saving the response in a cache. If the user goes back to (or clicks on) a page that
 * was previously viewed, it will be immediately loaded from cache, thereby increasing the
 * speed of the viewing experience significantly.
 *
 * The only requirement of this plugin is that a meta tag called "docRoot" needs to be created with
 * the root URL of the documentation being viewed. The easiest way to do this is to add the
 * following code to the page or layout that you use for displaying the docs:
 *
 * ```
 * {% put head %}
 *     <meta name="docRoot" content="{{ this.page.fileName | page({ slug: '' }) }}">
 * {% endput %}
 * ```
 *
 * @author Ben Thomson <git@alfreido.com>
 * @copyright Winter CMS
 */
export default class DocPageLoader extends Snowboard.Singleton {
    /**
     * Constructor.
     */
    construct() {
        this.cached = {};
        this.docRoot = null;
        this.menu = null;
        this.currentState = null;

        this.events = {
            click: (event) => {
                this.loadPage(event);
            },
            popstate: (event) => {
                this.onNavigate(event);
            }
        };
    }

    /**
     * Listeners.
     *
     * @returns {Object}
     */
     listens() {
        return {
            ready: 'ready',
            ajaxDone: 'ajaxDone',
            'modal.opened': 'modalOpened',
        };
    }

    /**
     * Ready handler.
     *
     * Finds all internal links and adds click listeners in order to load docs content via AJAX.
     */
    ready() {
        if (!this.docsRoot()) {
            return;
        }

        this.menu = document.querySelector('#docs-menu');
        this.storeInitialPage();

        document.querySelectorAll('a:not([href^="#"],.external-link)').forEach((element) => {
            // Skip pages that are already tracked
            if (element.dataset.docPage) {
                return;
            }

            const pagePath = this.getPagePath(element);
            if (pagePath !== false) {
                element.dataset.docPage = this.getPagePath(element);
                element.addEventListener('click', this.events.click);
            }
        });

        // Create listener for history change (navigation)
        window.addEventListener('popstate', this.events.popstate);
    }

    /**
     * AJAX done handler
     *
     * @param {HTMLElement} updatedElement
     */
    ajaxDone(data) {
        if (!this.docsRoot()) {
            return;
        }

        Object.entries(data).forEach((entry) => {
            const [key, value] = entry;

            if (!key.startsWith('#')) {
                return;
            }
            const updatedElement = document.querySelector(key);
            if (!updatedElement) {
                return;
            }

            updatedElement.querySelectorAll('a:not([href^="#"],.external-link)').forEach((element) => {
                element.dataset.docPage = this.getPagePath(element);
                element.removeEventListener('click', this.events.click, {
                    capture: true,
                });
                element.addEventListener('click', this.events.click, {
                    capture: true,
                });
            });
        });
    }

    /**
     * Model opened handler
     *
     * @param {Modal} instance
     * @param {HTMLElement} modalElement
     */
     modalOpened(instance, modalElement) {
        if (!this.docsRoot()) {
            return;
        }

        modalElement.querySelectorAll('a:not([href^="#"],.external-link)').forEach((element) => {
            element.dataset.docPage = this.getPagePath(element);
            element.removeEventListener('click', this.events.click, {
                capture: true,
            });
            element.addEventListener('click', this.events.click, {
                capture: true,
            });
        });
    }

    /**
     * Gets the root URL for this documentation.
     *
     * @returns {String}
     */
    docsRoot() {
        if (this.docRoot) {
            return this.docRoot;
        }

        // Look for the docs root URL
        const docRoot = document.querySelector('meta[name="docRoot"]');

        if (!docRoot) {
            return null;
        }

        this.docRoot = docRoot.getAttribute('content');
        return this.docRoot;
    }

    /**
     * Determines the document page path from a given hyperlink.
     *
     * Returns the page path if it can be calculated, eitherwise `false`.
     *
     * @param {HTMLElement} element
     */
    getPagePath(element) {
        const docRoot = this.docsRoot();
        const link = element.getAttribute('href');
        if (!link) {
            return false;
        }
        let path = link.replace(`${docRoot}/`, '').replace(/#.*$/, '');

        // If this path looks external, don't handle the path
        if (path.startsWith('http://') || path.startsWith('https://')) {
            return false;
        }

        return this.resolvePagePath(path);
    }

    /**
     * Determines the document page path from a given hyperlink.
     *
     * Returns the page path if it can be calculated, eitherwise `false`.
     *
     * @param {String} url
     */
    resolvePagePath(url) {
        // If this path looks external, don't handle the path
        if (url.startsWith('http://') || url.startsWith('https://')) {
            return url;
        }

        const docRoot = this.docsRoot();
        let currentUrl = window.document.location.href.replace(`${docRoot}/`, '').replace(/#.*$/, '');
        let currentParts = currentUrl.split('/');
        let path = url;

        if (!path.includes('/') || path.startsWith('./')) {
            currentParts.pop();
            path = path.replace('./', '');
            currentParts.push(path);
            path = currentParts.join('/');
        } else if (path.startsWith('../../../')) {
            currentParts.pop();
            currentParts.pop();
            currentParts.pop();
            currentParts.pop();
            path = path.replace('../../../', '');
            currentParts.push(path);
            path = currentParts.join('/');
        } else if (path.startsWith('../../')) {
            currentParts.pop();
            currentParts.pop();
            currentParts.pop();
            path = path.replace('../../', '');
            currentParts.push(path);
            path = currentParts.join('/');
        } else if (path.startsWith('../')) {
            currentParts.pop();
            currentParts.pop();
            path = path.replace('../', '');
            currentParts.push(path);
            path = currentParts.join('/');
        }

        return path;
    }

    /**
     * Stores the initial page being loaded to the cache.
     */
    storeInitialPage() {
        const menu = document.querySelector('#docs-menu');
        const contents = document.querySelector('#docs-content');
        const toc = document.querySelector('#docs-toc');
        const title = document.querySelector('title').innerText;

        // Populate data
        const data = {
            title,
        };
        if (menu) {
            data['#docs-menu'] = menu.innerHTML;
        }
        if (contents) {
            data['#docs-content'] = contents.innerHTML;
        }
        if (toc) {
            data['#docs-toc'] = toc.innerHTML;
        }

        // Store initial cache
        const pagePath = this.resolvePagePath(window.location.href);
        const hash = window.location.hash.replace('#', '');
        this.cached[pagePath] = data;
        history.replaceState({ path: pagePath, hash }, '');
        this.currentState = {
            path: pagePath,
            hash
        };
    }

    /**
     * Loads a documentation page dynamically.
     *
     * @param {Event} event
     */
    loadPage(event) {
        const element = event.target.closest('a');

        if (!element.dataset.docPage) {
            return;
        }

        // If any meta or control keys are held during click, allow the browser to handle this click.
        if (event.metaKey || event.ctrlKey || event.altKey || event.shiftKey) {
            return;
        }

        event.preventDefault();

        if (this.cached[element.dataset.docPage]) {
            const hash = window.location.hash.replace('#', '');
            this.loadCached(element.dataset.docPage);
            history.pushState({ path: element.dataset.docPage, hash }, '', element.getAttribute('href'));
            this.currentState = { path: element.dataset.docPage, hash };
            return;
        }

        this.snowboard.request(element, 'docsPage::onLoadPage', {
            data: {
                page: element.dataset.docPage
            },
            flash: true,
            error: (message, request) => {
                if (request.responseData.error) {
                    this.snowboard.flash(request.responseData.error, 'error');
                }
            },
            success: (data, request) => {
                document.querySelector('title').innerText = `${data.title} | ${data.docName}`;
                this.cached[element.dataset.docPage] = data;
                const hash = window.location.hash.replace('#', '');
                history.pushState({ path: element.dataset.docPage, hash }, '', element.getAttribute('href'));
                this.currentState = { path: element.dataset.docPage, hash };

                requestAnimationFrame(() => {
                    document.querySelector('#content').scrollTo(0, 0);
                    this.triggerHashChange();
                    this.scrollMenu(element.dataset.docPage);
                });
            },
        });
    }

    /**
     * Loads a cached version of the page, by the given path.
     *
     * @param {String} path
     */
    loadCached(path) {
        const data = this.cached[path];
        const menu = document.querySelector('#docs-menu');
        const contents = document.querySelector('#docs-content');
        const toc = document.querySelector('#docs-toc');

        if (data.docName) {
            document.querySelector('title').innerText = `${data.title} | ${data.docName}`;
        } else {
            document.querySelector('title').innerText = data.title;
        }
        if (menu) {
            menu.innerHTML = data['#docs-menu'];
            this.snowboard.globalEvent('ajaxUpdate', menu, data['#docs-menu']);

            menu.querySelectorAll('a:not([href^="#"],.external-link)').forEach((element) => {
                element.dataset.docPage = this.getPagePath(element);
                element.removeEventListener('click', this.events.click, {
                    capture: true,
                });
                element.addEventListener('click', this.events.click, {
                    capture: true,
                });
            });
        }
        if (contents) {
            contents.innerHTML = data['#docs-content'];
            this.snowboard.globalEvent('ajaxUpdate', contents, data['#docs-content']);

            contents.querySelectorAll('a:not([href^="#"],.external-link)').forEach((element) => {
                element.dataset.docPage = this.getPagePath(element);
                element.removeEventListener('click', this.events.click, {
                    capture: true,
                });
                element.addEventListener('click', this.events.click, {
                    capture: true,
                });
            });
        }
        if (toc) {
            toc.innerHTML = data['#docs-toc'];
            this.snowboard.globalEvent('ajaxUpdate', toc, data['#docs-toc']);

            toc.querySelectorAll('a:not([href^="#"],.external-link)').forEach((element) => {
                element.dataset.docPage = this.getPagePath(element);
                element.removeEventListener('click', this.events.click, {
                    capture: true,
                });
                element.addEventListener('click', this.events.click, {
                    capture: true,
                });
            });
        }
        this.snowboard.globalEvent('ajaxUpdateComplete');

        requestAnimationFrame(() => {
            document.querySelector('#content').scrollTo(0, 0);
            this.triggerHashChange();
            this.scrollMenu(path);
        });
        return;
    }

    /**
     * Navigation handler.
     *
     * Allow navigation actions such as going back and forward through the history to still run
     * through the same "SPA-like" experience.
     */
    onNavigate(event) {
        let state = event.state;

        // If there's no docs root, do a standard reload.
        if (!this.docsRoot()) {
            window.location.reload();
            return;
        }

        // If state is null, we're dealing with a hash change.
        if (!state) {
            const hash = window.location.hash.replace('#', '');
            state = {
                ...this.currentState,
                hash,
            };
            history.replaceState(state, '');
            return;
        }

        if (this.cached[state.path]) {
            this.loadCached(state.path);
        } else {
            this.snowboard.request(null, 'docsPage::onLoadPage', {
                data: {
                    page: state.path
                },
                flash: true,
                error: (message, request) => {
                    if (request.responseData.error) {
                        this.snowboard.flash(request.responseData.error, 'error');
                    }
                },
                success: (data) => {
                    document.querySelector('title').innerText = `${data.title} | ${data.docName}`;
                    this.cached[state.path] = data;

                    requestAnimationFrame(() => {
                        document.querySelector('#content').scrollTo(0, 0);
                        this.triggerHashChange();
                        this.scrollMenu(state.path);
                    });
                },
            });
        }
    }

    /**
     * Trigger a hashchange event for placing the user at their intended anchor if needed.
     */
    triggerHashChange() {
        const event = new Event('hashchange');
        window.dispatchEvent(event);
    }

    /**
     * Scrolls the main menu to the selected path.
     *
     * @param {String} path
     */
    scrollMenu(path) {
        if (!this.menu) {
            return;
        }

        // Try to find nav item
        const link = this.menu.querySelector(`a[data-doc-page="${path}"]`);
        if (link) {
            link.scrollIntoView({ behavior: 'auto', block: 'center' });
        }
    }
}
