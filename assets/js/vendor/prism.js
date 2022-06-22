/* PrismJS 1.28.0
https://prismjs.com/download.html#themes=prism-tomorrow&languages=markup+css+clike+javascript+apacheconf+bash+bnf+css-extras+editorconfig+git+graphql+http+ignore+ini+javadoclike+jsdoc+js-extras+json+json5+less+markdown+markup-templating+nginx+php+phpdoc+php-extras+sass+scss+sql+twig+typescript+yaml&plugins=line-highlight+line-numbers+autolinker+show-language+remove-initial-line-feed+inline-color+normalize-whitespace+toolbar+copy-to-clipboard+download-button+match-braces */
/// <reference lib="WebWorker"/>

var _self = (typeof window !== 'undefined') ?
    window // if in browser
    :
    (
        (typeof WorkerGlobalScope !== 'undefined' && self instanceof WorkerGlobalScope) ?
        self // if in worker
        :
        {} // if in node js
    );

/**
 * Prism: Lightweight, robust, elegant syntax highlighting
 *
 * @license MIT <https://opensource.org/licenses/MIT>
 * @author Lea Verou <https://lea.verou.me>
 * @namespace
 * @public
 */
var Prism = (function (_self) {

    // Private helper vars
    var lang = /(?:^|\s)lang(?:uage)?-([\w-]+)(?=\s|$)/i;
    var uniqueId = 0;

    // The grammar object for plaintext
    var plainTextGrammar = {};


    var _ = {
        /**
         * By default, Prism will attempt to highlight all code elements (by calling {@link Prism.highlightAll}) on the
         * current page after the page finished loading. This might be a problem if e.g. you wanted to asynchronously load
         * additional languages or plugins yourself.
         *
         * By setting this value to `true`, Prism will not automatically highlight all code elements on the page.
         *
         * You obviously have to change this value before the automatic highlighting started. To do this, you can add an
         * empty Prism object into the global scope before loading the Prism script like this:
         *
         * ```js
         * window.Prism = window.Prism || {};
         * Prism.manual = true;
         * // add a new <script> to load Prism's script
         * ```
         *
         * @default false
         * @type {boolean}
         * @memberof Prism
         * @public
         */
        manual: _self.Prism && _self.Prism.manual,
        /**
         * By default, if Prism is in a web worker, it assumes that it is in a worker it created itself, so it uses
         * `addEventListener` to communicate with its parent instance. However, if you're using Prism manually in your
         * own worker, you don't want it to do this.
         *
         * By setting this value to `true`, Prism will not add its own listeners to the worker.
         *
         * You obviously have to change this value before Prism executes. To do this, you can add an
         * empty Prism object into the global scope before loading the Prism script like this:
         *
         * ```js
         * window.Prism = window.Prism || {};
         * Prism.disableWorkerMessageHandler = true;
         * // Load Prism's script
         * ```
         *
         * @default false
         * @type {boolean}
         * @memberof Prism
         * @public
         */
        disableWorkerMessageHandler: _self.Prism && _self.Prism.disableWorkerMessageHandler,

        /**
         * A namespace for utility methods.
         *
         * All function in this namespace that are not explicitly marked as _public_ are for __internal use only__ and may
         * change or disappear at any time.
         *
         * @namespace
         * @memberof Prism
         */
        util: {
            encode: function encode(tokens) {
                if (tokens instanceof Token) {
                    return new Token(tokens.type, encode(tokens.content), tokens.alias);
                } else if (Array.isArray(tokens)) {
                    return tokens.map(encode);
                } else {
                    return tokens.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/\u00a0/g, ' ');
                }
            },

            /**
             * Returns the name of the type of the given value.
             *
             * @param {any} o
             * @returns {string}
             * @example
             * type(null)      === 'Null'
             * type(undefined) === 'Undefined'
             * type(123)       === 'Number'
             * type('foo')     === 'String'
             * type(true)      === 'Boolean'
             * type([1, 2])    === 'Array'
             * type({})        === 'Object'
             * type(String)    === 'Function'
             * type(/abc+/)    === 'RegExp'
             */
            type: function (o) {
                return Object.prototype.toString.call(o).slice(8, -1);
            },

            /**
             * Returns a unique number for the given object. Later calls will still return the same number.
             *
             * @param {Object} obj
             * @returns {number}
             */
            objId: function (obj) {
                if (!obj['__id']) {
                    Object.defineProperty(obj, '__id', {
                        value: ++uniqueId
                    });
                }
                return obj['__id'];
            },

            /**
             * Creates a deep clone of the given object.
             *
             * The main intended use of this function is to clone language definitions.
             *
             * @param {T} o
             * @param {Record<number, any>} [visited]
             * @returns {T}
             * @template T
             */
            clone: function deepClone(o, visited) {
                visited = visited || {};

                var clone;
                var id;
                switch (_.util.type(o)) {
                    case 'Object':
                        id = _.util.objId(o);
                        if (visited[id]) {
                            return visited[id];
                        }
                        clone = /** @type {Record<string, any>} */ ({});
                        visited[id] = clone;

                        for (var key in o) {
                            if (o.hasOwnProperty(key)) {
                                clone[key] = deepClone(o[key], visited);
                            }
                        }

                        return /** @type {any} */ (clone);

                    case 'Array':
                        id = _.util.objId(o);
                        if (visited[id]) {
                            return visited[id];
                        }
                        clone = [];
                        visited[id] = clone;

                        ( /** @type {Array} */ ( /** @type {any} */ (o))).forEach(function (v, i) {
                            clone[i] = deepClone(v, visited);
                        });

                        return /** @type {any} */ (clone);

                    default:
                        return o;
                }
            },

            /**
             * Returns the Prism language of the given element set by a `language-xxxx` or `lang-xxxx` class.
             *
             * If no language is set for the element or the element is `null` or `undefined`, `none` will be returned.
             *
             * @param {Element} element
             * @returns {string}
             */
            getLanguage: function (element) {
                while (element) {
                    var m = lang.exec(element.className);
                    if (m) {
                        return m[1].toLowerCase();
                    }
                    element = element.parentElement;
                }
                return 'none';
            },

            /**
             * Sets the Prism `language-xxxx` class of the given element.
             *
             * @param {Element} element
             * @param {string} language
             * @returns {void}
             */
            setLanguage: function (element, language) {
                // remove all `language-xxxx` classes
                // (this might leave behind a leading space)
                element.className = element.className.replace(RegExp(lang, 'gi'), '');

                // add the new `language-xxxx` class
                // (using `classList` will automatically clean up spaces for us)
                element.classList.add('language-' + language);
            },

            /**
             * Returns the script element that is currently executing.
             *
             * This does __not__ work for line script element.
             *
             * @returns {HTMLScriptElement | null}
             */
            currentScript: function () {
                if (typeof document === 'undefined') {
                    return null;
                }
                if ('currentScript' in document && 1 < 2 /* hack to trip TS' flow analysis */ ) {
                    return /** @type {any} */ (document.currentScript);
                }

                // IE11 workaround
                // we'll get the src of the current script by parsing IE11's error stack trace
                // this will not work for inline scripts

                try {
                    throw new Error();
                } catch (err) {
                    // Get file src url from stack. Specifically works with the format of stack traces in IE.
                    // A stack will look like this:
                    //
                    // Error
                    //    at _.util.currentScript (http://localhost/components/prism-core.js:119:5)
                    //    at Global code (http://localhost/components/prism-core.js:606:1)

                    var src = (/at [^(\r\n]*\((.*):[^:]+:[^:]+\)$/i.exec(err.stack) || [])[1];
                    if (src) {
                        var scripts = document.getElementsByTagName('script');
                        for (var i in scripts) {
                            if (scripts[i].src == src) {
                                return scripts[i];
                            }
                        }
                    }
                    return null;
                }
            },

            /**
             * Returns whether a given class is active for `element`.
             *
             * The class can be activated if `element` or one of its ancestors has the given class and it can be deactivated
             * if `element` or one of its ancestors has the negated version of the given class. The _negated version_ of the
             * given class is just the given class with a `no-` prefix.
             *
             * Whether the class is active is determined by the closest ancestor of `element` (where `element` itself is
             * closest ancestor) that has the given class or the negated version of it. If neither `element` nor any of its
             * ancestors have the given class or the negated version of it, then the default activation will be returned.
             *
             * In the paradoxical situation where the closest ancestor contains __both__ the given class and the negated
             * version of it, the class is considered active.
             *
             * @param {Element} element
             * @param {string} className
             * @param {boolean} [defaultActivation=false]
             * @returns {boolean}
             */
            isActive: function (element, className, defaultActivation) {
                var no = 'no-' + className;

                while (element) {
                    var classList = element.classList;
                    if (classList.contains(className)) {
                        return true;
                    }
                    if (classList.contains(no)) {
                        return false;
                    }
                    element = element.parentElement;
                }
                return !!defaultActivation;
            }
        },

        /**
         * This namespace contains all currently loaded languages and the some helper functions to create and modify languages.
         *
         * @namespace
         * @memberof Prism
         * @public
         */
        languages: {
            /**
             * The grammar for plain, unformatted text.
             */
            plain: plainTextGrammar,
            plaintext: plainTextGrammar,
            text: plainTextGrammar,
            txt: plainTextGrammar,

            /**
             * Creates a deep copy of the language with the given id and appends the given tokens.
             *
             * If a token in `redef` also appears in the copied language, then the existing token in the copied language
             * will be overwritten at its original position.
             *
             * ## Best practices
             *
             * Since the position of overwriting tokens (token in `redef` that overwrite tokens in the copied language)
             * doesn't matter, they can technically be in any order. However, this can be confusing to others that trying to
             * understand the language definition because, normally, the order of tokens matters in Prism grammars.
             *
             * Therefore, it is encouraged to order overwriting tokens according to the positions of the overwritten tokens.
             * Furthermore, all non-overwriting tokens should be placed after the overwriting ones.
             *
             * @param {string} id The id of the language to extend. This has to be a key in `Prism.languages`.
             * @param {Grammar} redef The new tokens to append.
             * @returns {Grammar} The new language created.
             * @public
             * @example
             * Prism.languages['css-with-colors'] = Prism.languages.extend('css', {
             *     // Prism.languages.css already has a 'comment' token, so this token will overwrite CSS' 'comment' token
             *     // at its original position
             *     'comment': { ... },
             *     // CSS doesn't have a 'color' token, so this token will be appended
             *     'color': /\b(?:red|green|blue)\b/
             * });
             */
            extend: function (id, redef) {
                var lang = _.util.clone(_.languages[id]);

                for (var key in redef) {
                    lang[key] = redef[key];
                }

                return lang;
            },

            /**
             * Inserts tokens _before_ another token in a language definition or any other grammar.
             *
             * ## Usage
             *
             * This helper method makes it easy to modify existing languages. For example, the CSS language definition
             * not only defines CSS highlighting for CSS documents, but also needs to define highlighting for CSS embedded
             * in HTML through `<style>` elements. To do this, it needs to modify `Prism.languages.markup` and add the
             * appropriate tokens. However, `Prism.languages.markup` is a regular JavaScript object literal, so if you do
             * this:
             *
             * ```js
             * Prism.languages.markup.style = {
             *     // token
             * };
             * ```
             *
             * then the `style` token will be added (and processed) at the end. `insertBefore` allows you to insert tokens
             * before existing tokens. For the CSS example above, you would use it like this:
             *
             * ```js
             * Prism.languages.insertBefore('markup', 'cdata', {
             *     'style': {
             *         // token
             *     }
             * });
             * ```
             *
             * ## Special cases
             *
             * If the grammars of `inside` and `insert` have tokens with the same name, the tokens in `inside`'s grammar
             * will be ignored.
             *
             * This behavior can be used to insert tokens after `before`:
             *
             * ```js
             * Prism.languages.insertBefore('markup', 'comment', {
             *     'comment': Prism.languages.markup.comment,
             *     // tokens after 'comment'
             * });
             * ```
             *
             * ## Limitations
             *
             * The main problem `insertBefore` has to solve is iteration order. Since ES2015, the iteration order for object
             * properties is guaranteed to be the insertion order (except for integer keys) but some browsers behave
             * differently when keys are deleted and re-inserted. So `insertBefore` can't be implemented by temporarily
             * deleting properties which is necessary to insert at arbitrary positions.
             *
             * To solve this problem, `insertBefore` doesn't actually insert the given tokens into the target object.
             * Instead, it will create a new object and replace all references to the target object with the new one. This
             * can be done without temporarily deleting properties, so the iteration order is well-defined.
             *
             * However, only references that can be reached from `Prism.languages` or `insert` will be replaced. I.e. if
             * you hold the target object in a variable, then the value of the variable will not change.
             *
             * ```js
             * var oldMarkup = Prism.languages.markup;
             * var newMarkup = Prism.languages.insertBefore('markup', 'comment', { ... });
             *
             * assert(oldMarkup !== Prism.languages.markup);
             * assert(newMarkup === Prism.languages.markup);
             * ```
             *
             * @param {string} inside The property of `root` (e.g. a language id in `Prism.languages`) that contains the
             * object to be modified.
             * @param {string} before The key to insert before.
             * @param {Grammar} insert An object containing the key-value pairs to be inserted.
             * @param {Object<string, any>} [root] The object containing `inside`, i.e. the object that contains the
             * object to be modified.
             *
             * Defaults to `Prism.languages`.
             * @returns {Grammar} The new grammar object.
             * @public
             */
            insertBefore: function (inside, before, insert, root) {
                root = root || /** @type {any} */ (_.languages);
                var grammar = root[inside];
                /** @type {Grammar} */
                var ret = {};

                for (var token in grammar) {
                    if (grammar.hasOwnProperty(token)) {

                        if (token == before) {
                            for (var newToken in insert) {
                                if (insert.hasOwnProperty(newToken)) {
                                    ret[newToken] = insert[newToken];
                                }
                            }
                        }

                        // Do not insert token which also occur in insert. See #1525
                        if (!insert.hasOwnProperty(token)) {
                            ret[token] = grammar[token];
                        }
                    }
                }

                var old = root[inside];
                root[inside] = ret;

                // Update references in other language definitions
                _.languages.DFS(_.languages, function (key, value) {
                    if (value === old && key != inside) {
                        this[key] = ret;
                    }
                });

                return ret;
            },

            // Traverse a language definition with Depth First Search
            DFS: function DFS(o, callback, type, visited) {
                visited = visited || {};

                var objId = _.util.objId;

                for (var i in o) {
                    if (o.hasOwnProperty(i)) {
                        callback.call(o, i, o[i], type || i);

                        var property = o[i];
                        var propertyType = _.util.type(property);

                        if (propertyType === 'Object' && !visited[objId(property)]) {
                            visited[objId(property)] = true;
                            DFS(property, callback, null, visited);
                        } else if (propertyType === 'Array' && !visited[objId(property)]) {
                            visited[objId(property)] = true;
                            DFS(property, callback, i, visited);
                        }
                    }
                }
            }
        },

        plugins: {},

        /**
         * This is the most high-level function in Prism’s API.
         * It fetches all the elements that have a `.language-xxxx` class and then calls {@link Prism.highlightElement} on
         * each one of them.
         *
         * This is equivalent to `Prism.highlightAllUnder(document, async, callback)`.
         *
         * @param {boolean} [async=false] Same as in {@link Prism.highlightAllUnder}.
         * @param {HighlightCallback} [callback] Same as in {@link Prism.highlightAllUnder}.
         * @memberof Prism
         * @public
         */
        highlightAll: function (async, callback) {
            _.highlightAllUnder(document, async, callback);
        },

        /**
         * Fetches all the descendants of `container` that have a `.language-xxxx` class and then calls
         * {@link Prism.highlightElement} on each one of them.
         *
         * The following hooks will be run:
         * 1. `before-highlightall`
         * 2. `before-all-elements-highlight`
         * 3. All hooks of {@link Prism.highlightElement} for each element.
         *
         * @param {ParentNode} container The root element, whose descendants that have a `.language-xxxx` class will be highlighted.
         * @param {boolean} [async=false] Whether each element is to be highlighted asynchronously using Web Workers.
         * @param {HighlightCallback} [callback] An optional callback to be invoked on each element after its highlighting is done.
         * @memberof Prism
         * @public
         */
        highlightAllUnder: function (container, async, callback) {
            var env = {
                callback: callback,
                container: container,
                selector: 'code[class*="language-"], [class*="language-"] code, code[class*="lang-"], [class*="lang-"] code'
            };

            _.hooks.run('before-highlightall', env);

            env.elements = Array.prototype.slice.apply(env.container.querySelectorAll(env.selector));

            _.hooks.run('before-all-elements-highlight', env);

            for (var i = 0, element;
                (element = env.elements[i++]);) {
                _.highlightElement(element, async ===true, env.callback);
            }
        },

        /**
         * Highlights the code inside a single element.
         *
         * The following hooks will be run:
         * 1. `before-sanity-check`
         * 2. `before-highlight`
         * 3. All hooks of {@link Prism.highlight}. These hooks will be run by an asynchronous worker if `async` is `true`.
         * 4. `before-insert`
         * 5. `after-highlight`
         * 6. `complete`
         *
         * Some the above hooks will be skipped if the element doesn't contain any text or there is no grammar loaded for
         * the element's language.
         *
         * @param {Element} element The element containing the code.
         * It must have a class of `language-xxxx` to be processed, where `xxxx` is a valid language identifier.
         * @param {boolean} [async=false] Whether the element is to be highlighted asynchronously using Web Workers
         * to improve performance and avoid blocking the UI when highlighting very large chunks of code. This option is
         * [disabled by default](https://prismjs.com/faq.html#why-is-asynchronous-highlighting-disabled-by-default).
         *
         * Note: All language definitions required to highlight the code must be included in the main `prism.js` file for
         * asynchronous highlighting to work. You can build your own bundle on the
         * [Download page](https://prismjs.com/download.html).
         * @param {HighlightCallback} [callback] An optional callback to be invoked after the highlighting is done.
         * Mostly useful when `async` is `true`, since in that case, the highlighting is done asynchronously.
         * @memberof Prism
         * @public
         */
        highlightElement: function (element, async, callback) {
            // Find language
            var language = _.util.getLanguage(element);
            var grammar = _.languages[language];

            // Set language on the element, if not present
            _.util.setLanguage(element, language);

            // Set language on the parent, for styling
            var parent = element.parentElement;
            if (parent && parent.nodeName.toLowerCase() === 'pre') {
                _.util.setLanguage(parent, language);
            }

            var code = element.textContent;

            var env = {
                element: element,
                language: language,
                grammar: grammar,
                code: code
            };

            function insertHighlightedCode(highlightedCode) {
                env.highlightedCode = highlightedCode;

                _.hooks.run('before-insert', env);

                env.element.innerHTML = env.highlightedCode;

                _.hooks.run('after-highlight', env);
                _.hooks.run('complete', env);
                callback && callback.call(env.element);
            }

            _.hooks.run('before-sanity-check', env);

            // plugins may change/add the parent/element
            parent = env.element.parentElement;
            if (parent && parent.nodeName.toLowerCase() === 'pre' && !parent.hasAttribute('tabindex')) {
                parent.setAttribute('tabindex', '0');
            }

            if (!env.code) {
                _.hooks.run('complete', env);
                callback && callback.call(env.element);
                return;
            }

            _.hooks.run('before-highlight', env);

            if (!env.grammar) {
                insertHighlightedCode(_.util.encode(env.code));
                return;
            }

            if (async &&_self.Worker) {
                var worker = new Worker(_.filename);

                worker.onmessage = function (evt) {
                    insertHighlightedCode(evt.data);
                };

                worker.postMessage(JSON.stringify({
                    language: env.language,
                    code: env.code,
                    immediateClose: true
                }));
            } else {
                insertHighlightedCode(_.highlight(env.code, env.grammar, env.language));
            }
        },

        /**
         * Low-level function, only use if you know what you’re doing. It accepts a string of text as input
         * and the language definitions to use, and returns a string with the HTML produced.
         *
         * The following hooks will be run:
         * 1. `before-tokenize`
         * 2. `after-tokenize`
         * 3. `wrap`: On each {@link Token}.
         *
         * @param {string} text A string with the code to be highlighted.
         * @param {Grammar} grammar An object containing the tokens to use.
         *
         * Usually a language definition like `Prism.languages.markup`.
         * @param {string} language The name of the language definition passed to `grammar`.
         * @returns {string} The highlighted HTML.
         * @memberof Prism
         * @public
         * @example
         * Prism.highlight('var foo = true;', Prism.languages.javascript, 'javascript');
         */
        highlight: function (text, grammar, language) {
            var env = {
                code: text,
                grammar: grammar,
                language: language
            };
            _.hooks.run('before-tokenize', env);
            if (!env.grammar) {
                throw new Error('The language "' + env.language + '" has no grammar.');
            }
            env.tokens = _.tokenize(env.code, env.grammar);
            _.hooks.run('after-tokenize', env);
            return Token.stringify(_.util.encode(env.tokens), env.language);
        },

        /**
         * This is the heart of Prism, and the most low-level function you can use. It accepts a string of text as input
         * and the language definitions to use, and returns an array with the tokenized code.
         *
         * When the language definition includes nested tokens, the function is called recursively on each of these tokens.
         *
         * This method could be useful in other contexts as well, as a very crude parser.
         *
         * @param {string} text A string with the code to be highlighted.
         * @param {Grammar} grammar An object containing the tokens to use.
         *
         * Usually a language definition like `Prism.languages.markup`.
         * @returns {TokenStream} An array of strings and tokens, a token stream.
         * @memberof Prism
         * @public
         * @example
         * let code = `var foo = 0;`;
         * let tokens = Prism.tokenize(code, Prism.languages.javascript);
         * tokens.forEach(token => {
         *     if (token instanceof Prism.Token && token.type === 'number') {
         *         console.log(`Found numeric literal: ${token.content}`);
         *     }
         * });
         */
        tokenize: function (text, grammar) {
            var rest = grammar.rest;
            if (rest) {
                for (var token in rest) {
                    grammar[token] = rest[token];
                }

                delete grammar.rest;
            }

            var tokenList = new LinkedList();
            addAfter(tokenList, tokenList.head, text);

            matchGrammar(text, tokenList, grammar, tokenList.head, 0);

            return toArray(tokenList);
        },

        /**
         * @namespace
         * @memberof Prism
         * @public
         */
        hooks: {
            all: {},

            /**
             * Adds the given callback to the list of callbacks for the given hook.
             *
             * The callback will be invoked when the hook it is registered for is run.
             * Hooks are usually directly run by a highlight function but you can also run hooks yourself.
             *
             * One callback function can be registered to multiple hooks and the same hook multiple times.
             *
             * @param {string} name The name of the hook.
             * @param {HookCallback} callback The callback function which is given environment variables.
             * @public
             */
            add: function (name, callback) {
                var hooks = _.hooks.all;

                hooks[name] = hooks[name] || [];

                hooks[name].push(callback);
            },

            /**
             * Runs a hook invoking all registered callbacks with the given environment variables.
             *
             * Callbacks will be invoked synchronously and in the order in which they were registered.
             *
             * @param {string} name The name of the hook.
             * @param {Object<string, any>} env The environment variables of the hook passed to all callbacks registered.
             * @public
             */
            run: function (name, env) {
                var callbacks = _.hooks.all[name];

                if (!callbacks || !callbacks.length) {
                    return;
                }

                for (var i = 0, callback;
                    (callback = callbacks[i++]);) {
                    callback(env);
                }
            }
        },

        Token: Token
    };
    _self.Prism = _;


    // Typescript note:
    // The following can be used to import the Token type in JSDoc:
    //
    //   @typedef {InstanceType<import("./prism-core")["Token"]>} Token

    /**
     * Creates a new token.
     *
     * @param {string} type See {@link Token#type type}
     * @param {string | TokenStream} content See {@link Token#content content}
     * @param {string|string[]} [alias] The alias(es) of the token.
     * @param {string} [matchedStr=""] A copy of the full string this token was created from.
     * @class
     * @global
     * @public
     */
    function Token(type, content, alias, matchedStr) {
        /**
         * The type of the token.
         *
         * This is usually the key of a pattern in a {@link Grammar}.
         *
         * @type {string}
         * @see GrammarToken
         * @public
         */
        this.type = type;
        /**
         * The strings or tokens contained by this token.
         *
         * This will be a token stream if the pattern matched also defined an `inside` grammar.
         *
         * @type {string | TokenStream}
         * @public
         */
        this.content = content;
        /**
         * The alias(es) of the token.
         *
         * @type {string|string[]}
         * @see GrammarToken
         * @public
         */
        this.alias = alias;
        // Copy of the full string this token was created from
        this.length = (matchedStr || '').length | 0;
    }

    /**
     * A token stream is an array of strings and {@link Token Token} objects.
     *
     * Token streams have to fulfill a few properties that are assumed by most functions (mostly internal ones) that process
     * them.
     *
     * 1. No adjacent strings.
     * 2. No empty strings.
     *
     *    The only exception here is the token stream that only contains the empty string and nothing else.
     *
     * @typedef {Array<string | Token>} TokenStream
     * @global
     * @public
     */

    /**
     * Converts the given token or token stream to an HTML representation.
     *
     * The following hooks will be run:
     * 1. `wrap`: On each {@link Token}.
     *
     * @param {string | Token | TokenStream} o The token or token stream to be converted.
     * @param {string} language The name of current language.
     * @returns {string} The HTML representation of the token or token stream.
     * @memberof Token
     * @static
     */
    Token.stringify = function stringify(o, language) {
        if (typeof o == 'string') {
            return o;
        }
        if (Array.isArray(o)) {
            var s = '';
            o.forEach(function (e) {
                s += stringify(e, language);
            });
            return s;
        }

        var env = {
            type: o.type,
            content: stringify(o.content, language),
            tag: 'span',
            classes: ['token', o.type],
            attributes: {},
            language: language
        };

        var aliases = o.alias;
        if (aliases) {
            if (Array.isArray(aliases)) {
                Array.prototype.push.apply(env.classes, aliases);
            } else {
                env.classes.push(aliases);
            }
        }

        _.hooks.run('wrap', env);

        var attributes = '';
        for (var name in env.attributes) {
            attributes += ' ' + name + '="' + (env.attributes[name] || '').replace(/"/g, '&quot;') + '"';
        }

        return '<' + env.tag + ' class="' + env.classes.join(' ') + '"' + attributes + '>' + env.content + '</' + env.tag + '>';
    };

    /**
     * @param {RegExp} pattern
     * @param {number} pos
     * @param {string} text
     * @param {boolean} lookbehind
     * @returns {RegExpExecArray | null}
     */
    function matchPattern(pattern, pos, text, lookbehind) {
        pattern.lastIndex = pos;
        var match = pattern.exec(text);
        if (match && lookbehind && match[1]) {
            // change the match to remove the text matched by the Prism lookbehind group
            var lookbehindLength = match[1].length;
            match.index += lookbehindLength;
            match[0] = match[0].slice(lookbehindLength);
        }
        return match;
    }

    /**
     * @param {string} text
     * @param {LinkedList<string | Token>} tokenList
     * @param {any} grammar
     * @param {LinkedListNode<string | Token>} startNode
     * @param {number} startPos
     * @param {RematchOptions} [rematch]
     * @returns {void}
     * @private
     *
     * @typedef RematchOptions
     * @property {string} cause
     * @property {number} reach
     */
    function matchGrammar(text, tokenList, grammar, startNode, startPos, rematch) {
        for (var token in grammar) {
            if (!grammar.hasOwnProperty(token) || !grammar[token]) {
                continue;
            }

            var patterns = grammar[token];
            patterns = Array.isArray(patterns) ? patterns : [patterns];

            for (var j = 0; j < patterns.length; ++j) {
                if (rematch && rematch.cause == token + ',' + j) {
                    return;
                }

                var patternObj = patterns[j];
                var inside = patternObj.inside;
                var lookbehind = !!patternObj.lookbehind;
                var greedy = !!patternObj.greedy;
                var alias = patternObj.alias;

                if (greedy && !patternObj.pattern.global) {
                    // Without the global flag, lastIndex won't work
                    var flags = patternObj.pattern.toString().match(/[imsuy]*$/)[0];
                    patternObj.pattern = RegExp(patternObj.pattern.source, flags + 'g');
                }

                /** @type {RegExp} */
                var pattern = patternObj.pattern || patternObj;

                for ( // iterate the token list and keep track of the current token/string position
                    var currentNode = startNode.next, pos = startPos; currentNode !== tokenList.tail; pos += currentNode.value.length, currentNode = currentNode.next
                ) {

                    if (rematch && pos >= rematch.reach) {
                        break;
                    }

                    var str = currentNode.value;

                    if (tokenList.length > text.length) {
                        // Something went terribly wrong, ABORT, ABORT!
                        return;
                    }

                    if (str instanceof Token) {
                        continue;
                    }

                    var removeCount = 1; // this is the to parameter of removeBetween
                    var match;

                    if (greedy) {
                        match = matchPattern(pattern, pos, text, lookbehind);
                        if (!match || match.index >= text.length) {
                            break;
                        }

                        var from = match.index;
                        var to = match.index + match[0].length;
                        var p = pos;

                        // find the node that contains the match
                        p += currentNode.value.length;
                        while (from >= p) {
                            currentNode = currentNode.next;
                            p += currentNode.value.length;
                        }
                        // adjust pos (and p)
                        p -= currentNode.value.length;
                        pos = p;

                        // the current node is a Token, then the match starts inside another Token, which is invalid
                        if (currentNode.value instanceof Token) {
                            continue;
                        }

                        // find the last node which is affected by this match
                        for (
                            var k = currentNode; k !== tokenList.tail && (p < to || typeof k.value === 'string'); k = k.next
                        ) {
                            removeCount++;
                            p += k.value.length;
                        }
                        removeCount--;

                        // replace with the new match
                        str = text.slice(pos, p);
                        match.index -= pos;
                    } else {
                        match = matchPattern(pattern, 0, str, lookbehind);
                        if (!match) {
                            continue;
                        }
                    }

                    // eslint-disable-next-line no-redeclare
                    var from = match.index;
                    var matchStr = match[0];
                    var before = str.slice(0, from);
                    var after = str.slice(from + matchStr.length);

                    var reach = pos + str.length;
                    if (rematch && reach > rematch.reach) {
                        rematch.reach = reach;
                    }

                    var removeFrom = currentNode.prev;

                    if (before) {
                        removeFrom = addAfter(tokenList, removeFrom, before);
                        pos += before.length;
                    }

                    removeRange(tokenList, removeFrom, removeCount);

                    var wrapped = new Token(token, inside ? _.tokenize(matchStr, inside) : matchStr, alias, matchStr);
                    currentNode = addAfter(tokenList, removeFrom, wrapped);

                    if (after) {
                        addAfter(tokenList, currentNode, after);
                    }

                    if (removeCount > 1) {
                        // at least one Token object was removed, so we have to do some rematching
                        // this can only happen if the current pattern is greedy

                        /** @type {RematchOptions} */
                        var nestedRematch = {
                            cause: token + ',' + j,
                            reach: reach
                        };
                        matchGrammar(text, tokenList, grammar, currentNode.prev, pos, nestedRematch);

                        // the reach might have been extended because of the rematching
                        if (rematch && nestedRematch.reach > rematch.reach) {
                            rematch.reach = nestedRematch.reach;
                        }
                    }
                }
            }
        }
    }

    /**
     * @typedef LinkedListNode
     * @property {T} value
     * @property {LinkedListNode<T> | null} prev The previous node.
     * @property {LinkedListNode<T> | null} next The next node.
     * @template T
     * @private
     */

    /**
     * @template T
     * @private
     */
    function LinkedList() {
        /** @type {LinkedListNode<T>} */
        var head = {
            value: null,
            prev: null,
            next: null
        };
        /** @type {LinkedListNode<T>} */
        var tail = {
            value: null,
            prev: head,
            next: null
        };
        head.next = tail;

        /** @type {LinkedListNode<T>} */
        this.head = head;
        /** @type {LinkedListNode<T>} */
        this.tail = tail;
        this.length = 0;
    }

    /**
     * Adds a new node with the given value to the list.
     *
     * @param {LinkedList<T>} list
     * @param {LinkedListNode<T>} node
     * @param {T} value
     * @returns {LinkedListNode<T>} The added node.
     * @template T
     */
    function addAfter(list, node, value) {
        // assumes that node != list.tail && values.length >= 0
        var next = node.next;

        var newNode = {
            value: value,
            prev: node,
            next: next
        };
        node.next = newNode;
        next.prev = newNode;
        list.length++;

        return newNode;
    }
    /**
     * Removes `count` nodes after the given node. The given node will not be removed.
     *
     * @param {LinkedList<T>} list
     * @param {LinkedListNode<T>} node
     * @param {number} count
     * @template T
     */
    function removeRange(list, node, count) {
        var next = node.next;
        for (var i = 0; i < count && next !== list.tail; i++) {
            next = next.next;
        }
        node.next = next;
        next.prev = node;
        list.length -= i;
    }
    /**
     * @param {LinkedList<T>} list
     * @returns {T[]}
     * @template T
     */
    function toArray(list) {
        var array = [];
        var node = list.head.next;
        while (node !== list.tail) {
            array.push(node.value);
            node = node.next;
        }
        return array;
    }


    if (!_self.document) {
        if (!_self.addEventListener) {
            // in Node.js
            return _;
        }

        if (!_.disableWorkerMessageHandler) {
            // In worker
            _self.addEventListener('message', function (evt) {
                var message = JSON.parse(evt.data);
                var lang = message.language;
                var code = message.code;
                var immediateClose = message.immediateClose;

                _self.postMessage(_.highlight(code, _.languages[lang], lang));
                if (immediateClose) {
                    _self.close();
                }
            }, false);
        }

        return _;
    }

    // Get current script and highlight
    var script = _.util.currentScript();

    if (script) {
        _.filename = script.src;

        if (script.hasAttribute('data-manual')) {
            _.manual = true;
        }
    }

    function highlightAutomaticallyCallback() {
        if (!_.manual) {
            _.highlightAll();
        }
    }

    if (!_.manual) {
        // If the document state is "loading", then we'll use DOMContentLoaded.
        // If the document state is "interactive" and the prism.js script is deferred, then we'll also use the
        // DOMContentLoaded event because there might be some plugins or languages which have also been deferred and they
        // might take longer one animation frame to execute which can create a race condition where only some plugins have
        // been loaded when Prism.highlightAll() is executed, depending on how fast resources are loaded.
        // See https://github.com/PrismJS/prism/issues/2102
        var readyState = document.readyState;
        if (readyState === 'loading' || readyState === 'interactive' && script && script.defer) {
            document.addEventListener('DOMContentLoaded', highlightAutomaticallyCallback);
        } else {
            if (window.requestAnimationFrame) {
                window.requestAnimationFrame(highlightAutomaticallyCallback);
            } else {
                window.setTimeout(highlightAutomaticallyCallback, 16);
            }
        }
    }

    return _;

}(_self));

if (typeof module !== 'undefined' && module.exports) {
    module.exports = Prism;
}

// hack for components to work correctly in node.js
if (typeof global !== 'undefined') {
    global.Prism = Prism;
}

// some additional documentation/types

/**
 * The expansion of a simple `RegExp` literal to support additional properties.
 *
 * @typedef GrammarToken
 * @property {RegExp} pattern The regular expression of the token.
 * @property {boolean} [lookbehind=false] If `true`, then the first capturing group of `pattern` will (effectively)
 * behave as a lookbehind group meaning that the captured text will not be part of the matched text of the new token.
 * @property {boolean} [greedy=false] Whether the token is greedy.
 * @property {string|string[]} [alias] An optional alias or list of aliases.
 * @property {Grammar} [inside] The nested grammar of this token.
 *
 * The `inside` grammar will be used to tokenize the text value of each token of this kind.
 *
 * This can be used to make nested and even recursive language definitions.
 *
 * Note: This can cause infinite recursion. Be careful when you embed different languages or even the same language into
 * each another.
 * @global
 * @public
 */

/**
 * @typedef Grammar
 * @type {Object<string, RegExp | GrammarToken | Array<RegExp | GrammarToken>>}
 * @property {Grammar} [rest] An optional grammar object that will be appended to this grammar.
 * @global
 * @public
 */

/**
 * A function which will invoked after an element was successfully highlighted.
 *
 * @callback HighlightCallback
 * @param {Element} element The element successfully highlighted.
 * @returns {void}
 * @global
 * @public
 */

/**
 * @callback HookCallback
 * @param {Object<string, any>} env The environment variables of the hook.
 * @returns {void}
 * @global
 * @public
 */
;
Prism.languages.markup = {
    'comment': {
        pattern: /<!--(?:(?!<!--)[\s\S])*?-->/,
        greedy: true
    },
    'prolog': {
        pattern: /<\?[\s\S]+?\?>/,
        greedy: true
    },
    'doctype': {
        // https://www.w3.org/TR/xml/#NT-doctypedecl
        pattern: /<!DOCTYPE(?:[^>"'[\]]|"[^"]*"|'[^']*')+(?:\[(?:[^<"'\]]|"[^"]*"|'[^']*'|<(?!!--)|<!--(?:[^-]|-(?!->))*-->)*\]\s*)?>/i,
        greedy: true,
        inside: {
            'internal-subset': {
                pattern: /(^[^\[]*\[)[\s\S]+(?=\]>$)/,
                lookbehind: true,
                greedy: true,
                inside: null // see below
            },
            'string': {
                pattern: /"[^"]*"|'[^']*'/,
                greedy: true
            },
            'punctuation': /^<!|>$|[[\]]/,
            'doctype-tag': /^DOCTYPE/i,
            'name': /[^\s<>'"]+/
        }
    },
    'cdata': {
        pattern: /<!\[CDATA\[[\s\S]*?\]\]>/i,
        greedy: true
    },
    'tag': {
        pattern: /<\/?(?!\d)[^\s>\/=$<%]+(?:\s(?:\s*[^\s>\/=]+(?:\s*=\s*(?:"[^"]*"|'[^']*'|[^\s'">=]+(?=[\s>]))|(?=[\s/>])))+)?\s*\/?>/,
        greedy: true,
        inside: {
            'tag': {
                pattern: /^<\/?[^\s>\/]+/,
                inside: {
                    'punctuation': /^<\/?/,
                    'namespace': /^[^\s>\/:]+:/
                }
            },
            'special-attr': [],
            'attr-value': {
                pattern: /=\s*(?:"[^"]*"|'[^']*'|[^\s'">=]+)/,
                inside: {
                    'punctuation': [{
                            pattern: /^=/,
                            alias: 'attr-equals'
                        },
                        {
                            pattern: /^(\s*)["']|["']$/,
                            lookbehind: true
                        }
                    ]
                }
            },
            'punctuation': /\/?>/,
            'attr-name': {
                pattern: /[^\s>\/]+/,
                inside: {
                    'namespace': /^[^\s>\/:]+:/
                }
            }

        }
    },
    'entity': [{
            pattern: /&[\da-z]{1,8};/i,
            alias: 'named-entity'
        },
        /&#x?[\da-f]{1,8};/i
    ]
};

Prism.languages.markup['tag'].inside['attr-value'].inside['entity'] =
    Prism.languages.markup['entity'];
Prism.languages.markup['doctype'].inside['internal-subset'].inside = Prism.languages.markup;

// Plugin to make entity title show the real entity, idea by Roman Komarov
Prism.hooks.add('wrap', function (env) {

    if (env.type === 'entity') {
        env.attributes['title'] = env.content.replace(/&amp;/, '&');
    }
});

Object.defineProperty(Prism.languages.markup.tag, 'addInlined', {
    /**
     * Adds an inlined language to markup.
     *
     * An example of an inlined language is CSS with `<style>` tags.
     *
     * @param {string} tagName The name of the tag that contains the inlined language. This name will be treated as
     * case insensitive.
     * @param {string} lang The language key.
     * @example
     * addInlined('style', 'css');
     */
    value: function addInlined(tagName, lang) {
        var includedCdataInside = {};
        includedCdataInside['language-' + lang] = {
            pattern: /(^<!\[CDATA\[)[\s\S]+?(?=\]\]>$)/i,
            lookbehind: true,
            inside: Prism.languages[lang]
        };
        includedCdataInside['cdata'] = /^<!\[CDATA\[|\]\]>$/i;

        var inside = {
            'included-cdata': {
                pattern: /<!\[CDATA\[[\s\S]*?\]\]>/i,
                inside: includedCdataInside
            }
        };
        inside['language-' + lang] = {
            pattern: /[\s\S]+/,
            inside: Prism.languages[lang]
        };

        var def = {};
        def[tagName] = {
            pattern: RegExp(/(<__[^>]*>)(?:<!\[CDATA\[(?:[^\]]|\](?!\]>))*\]\]>|(?!<!\[CDATA\[)[\s\S])*?(?=<\/__>)/.source.replace(/__/g, function () {
                return tagName;
            }), 'i'),
            lookbehind: true,
            greedy: true,
            inside: inside
        };

        Prism.languages.insertBefore('markup', 'cdata', def);
    }
});
Object.defineProperty(Prism.languages.markup.tag, 'addAttribute', {
    /**
     * Adds an pattern to highlight languages embedded in HTML attributes.
     *
     * An example of an inlined language is CSS with `style` attributes.
     *
     * @param {string} attrName The name of the tag that contains the inlined language. This name will be treated as
     * case insensitive.
     * @param {string} lang The language key.
     * @example
     * addAttribute('style', 'css');
     */
    value: function (attrName, lang) {
        Prism.languages.markup.tag.inside['special-attr'].push({
            pattern: RegExp(
                /(^|["'\s])/.source + '(?:' + attrName + ')' + /\s*=\s*(?:"[^"]*"|'[^']*'|[^\s'">=]+(?=[\s>]))/.source,
                'i'
            ),
            lookbehind: true,
            inside: {
                'attr-name': /^[^\s=]+/,
                'attr-value': {
                    pattern: /=[\s\S]+/,
                    inside: {
                        'value': {
                            pattern: /(^=\s*(["']|(?!["'])))\S[\s\S]*(?=\2$)/,
                            lookbehind: true,
                            alias: [lang, 'language-' + lang],
                            inside: Prism.languages[lang]
                        },
                        'punctuation': [{
                                pattern: /^=/,
                                alias: 'attr-equals'
                            },
                            /"|'/
                        ]
                    }
                }
            }
        });
    }
});

Prism.languages.html = Prism.languages.markup;
Prism.languages.mathml = Prism.languages.markup;
Prism.languages.svg = Prism.languages.markup;

Prism.languages.xml = Prism.languages.extend('markup', {});
Prism.languages.ssml = Prism.languages.xml;
Prism.languages.atom = Prism.languages.xml;
Prism.languages.rss = Prism.languages.xml;

(function (Prism) {

    var string = /(?:"(?:\\(?:\r\n|[\s\S])|[^"\\\r\n])*"|'(?:\\(?:\r\n|[\s\S])|[^'\\\r\n])*')/;

    Prism.languages.css = {
        'comment': /\/\*[\s\S]*?\*\//,
        'atrule': {
            pattern: RegExp('@[\\w-](?:' + /[^;{\s"']|\s+(?!\s)/.source + '|' + string.source + ')*?' + /(?:;|(?=\s*\{))/.source),
            inside: {
                'rule': /^@[\w-]+/,
                'selector-function-argument': {
                    pattern: /(\bselector\s*\(\s*(?![\s)]))(?:[^()\s]|\s+(?![\s)])|\((?:[^()]|\([^()]*\))*\))+(?=\s*\))/,
                    lookbehind: true,
                    alias: 'selector'
                },
                'keyword': {
                    pattern: /(^|[^\w-])(?:and|not|only|or)(?![\w-])/,
                    lookbehind: true
                }
                // See rest below
            }
        },
        'url': {
            // https://drafts.csswg.org/css-values-3/#urls
            pattern: RegExp('\\burl\\((?:' + string.source + '|' + /(?:[^\\\r\n()"']|\\[\s\S])*/.source + ')\\)', 'i'),
            greedy: true,
            inside: {
                'function': /^url/i,
                'punctuation': /^\(|\)$/,
                'string': {
                    pattern: RegExp('^' + string.source + '$'),
                    alias: 'url'
                }
            }
        },
        'selector': {
            pattern: RegExp('(^|[{}\\s])[^{}\\s](?:[^{};"\'\\s]|\\s+(?![\\s{])|' + string.source + ')*(?=\\s*\\{)'),
            lookbehind: true
        },
        'string': {
            pattern: string,
            greedy: true
        },
        'property': {
            pattern: /(^|[^-\w\xA0-\uFFFF])(?!\s)[-_a-z\xA0-\uFFFF](?:(?!\s)[-\w\xA0-\uFFFF])*(?=\s*:)/i,
            lookbehind: true
        },
        'important': /!important\b/i,
        'function': {
            pattern: /(^|[^-a-z0-9])[-a-z0-9]+(?=\()/i,
            lookbehind: true
        },
        'punctuation': /[(){};:,]/
    };

    Prism.languages.css['atrule'].inside.rest = Prism.languages.css;

    var markup = Prism.languages.markup;
    if (markup) {
        markup.tag.addInlined('style', 'css');
        markup.tag.addAttribute('style', 'css');
    }

}(Prism));

Prism.languages.clike = {
    'comment': [{
            pattern: /(^|[^\\])\/\*[\s\S]*?(?:\*\/|$)/,
            lookbehind: true,
            greedy: true
        },
        {
            pattern: /(^|[^\\:])\/\/.*/,
            lookbehind: true,
            greedy: true
        }
    ],
    'string': {
        pattern: /(["'])(?:\\(?:\r\n|[\s\S])|(?!\1)[^\\\r\n])*\1/,
        greedy: true
    },
    'class-name': {
        pattern: /(\b(?:class|extends|implements|instanceof|interface|new|trait)\s+|\bcatch\s+\()[\w.\\]+/i,
        lookbehind: true,
        inside: {
            'punctuation': /[.\\]/
        }
    },
    'keyword': /\b(?:break|catch|continue|do|else|finally|for|function|if|in|instanceof|new|null|return|throw|try|while)\b/,
    'boolean': /\b(?:false|true)\b/,
    'function': /\b\w+(?=\()/,
    'number': /\b0x[\da-f]+\b|(?:\b\d+(?:\.\d*)?|\B\.\d+)(?:e[+-]?\d+)?/i,
    'operator': /[<>]=?|[!=]=?=?|--?|\+\+?|&&?|\|\|?|[?*/~^%]/,
    'punctuation': /[{}[\];(),.:]/
};

Prism.languages.javascript = Prism.languages.extend('clike', {
    'class-name': [
        Prism.languages.clike['class-name'],
        {
            pattern: /(^|[^$\w\xA0-\uFFFF])(?!\s)[_$A-Z\xA0-\uFFFF](?:(?!\s)[$\w\xA0-\uFFFF])*(?=\.(?:constructor|prototype))/,
            lookbehind: true
        }
    ],
    'keyword': [{
            pattern: /((?:^|\})\s*)catch\b/,
            lookbehind: true
        },
        {
            pattern: /(^|[^.]|\.\.\.\s*)\b(?:as|assert(?=\s*\{)|async(?=\s*(?:function\b|\(|[$\w\xA0-\uFFFF]|$))|await|break|case|class|const|continue|debugger|default|delete|do|else|enum|export|extends|finally(?=\s*(?:\{|$))|for|from(?=\s*(?:['"]|$))|function|(?:get|set)(?=\s*(?:[#\[$\w\xA0-\uFFFF]|$))|if|implements|import|in|instanceof|interface|let|new|null|of|package|private|protected|public|return|static|super|switch|this|throw|try|typeof|undefined|var|void|while|with|yield)\b/,
            lookbehind: true
        },
    ],
    // Allow for all non-ASCII characters (See http://stackoverflow.com/a/2008444)
    'function': /#?(?!\s)[_$a-zA-Z\xA0-\uFFFF](?:(?!\s)[$\w\xA0-\uFFFF])*(?=\s*(?:\.\s*(?:apply|bind|call)\s*)?\()/,
    'number': {
        pattern: RegExp(
            /(^|[^\w$])/.source +
            '(?:' +
            (
                // constant
                /NaN|Infinity/.source +
                '|' +
                // binary integer
                /0[bB][01]+(?:_[01]+)*n?/.source +
                '|' +
                // octal integer
                /0[oO][0-7]+(?:_[0-7]+)*n?/.source +
                '|' +
                // hexadecimal integer
                /0[xX][\dA-Fa-f]+(?:_[\dA-Fa-f]+)*n?/.source +
                '|' +
                // decimal bigint
                /\d+(?:_\d+)*n/.source +
                '|' +
                // decimal number (integer or float) but no bigint
                /(?:\d+(?:_\d+)*(?:\.(?:\d+(?:_\d+)*)?)?|\.\d+(?:_\d+)*)(?:[Ee][+-]?\d+(?:_\d+)*)?/.source
            ) +
            ')' +
            /(?![\w$])/.source
        ),
        lookbehind: true
    },
    'operator': /--|\+\+|\*\*=?|=>|&&=?|\|\|=?|[!=]==|<<=?|>>>?=?|[-+*/%&|^!=<>]=?|\.{3}|\?\?=?|\?\.?|[~:]/
});

Prism.languages.javascript['class-name'][0].pattern = /(\b(?:class|extends|implements|instanceof|interface|new)\s+)[\w.\\]+/;

Prism.languages.insertBefore('javascript', 'keyword', {
    'regex': {
        pattern: RegExp(
            // lookbehind
            // eslint-disable-next-line regexp/no-dupe-characters-character-class
            /((?:^|[^$\w\xA0-\uFFFF."'\])\s]|\b(?:return|yield))\s*)/.source +
            // Regex pattern:
            // There are 2 regex patterns here. The RegExp set notation proposal added support for nested character
            // classes if the `v` flag is present. Unfortunately, nested CCs are both context-free and incompatible
            // with the only syntax, so we have to define 2 different regex patterns.
            /\//.source +
            '(?:' +
            /(?:\[(?:[^\]\\\r\n]|\\.)*\]|\\.|[^/\\\[\r\n])+\/[dgimyus]{0,7}/.source +
            '|' +
            // `v` flag syntax. This supports 3 levels of nested character classes.
            /(?:\[(?:[^[\]\\\r\n]|\\.|\[(?:[^[\]\\\r\n]|\\.|\[(?:[^[\]\\\r\n]|\\.)*\])*\])*\]|\\.|[^/\\\[\r\n])+\/[dgimyus]{0,7}v[dgimyus]{0,7}/.source +
            ')' +
            // lookahead
            /(?=(?:\s|\/\*(?:[^*]|\*(?!\/))*\*\/)*(?:$|[\r\n,.;:})\]]|\/\/))/.source
        ),
        lookbehind: true,
        greedy: true,
        inside: {
            'regex-source': {
                pattern: /^(\/)[\s\S]+(?=\/[a-z]*$)/,
                lookbehind: true,
                alias: 'language-regex',
                inside: Prism.languages.regex
            },
            'regex-delimiter': /^\/|\/$/,
            'regex-flags': /^[a-z]+$/,
        }
    },
    // This must be declared before keyword because we use "function" inside the look-forward
    'function-variable': {
        pattern: /#?(?!\s)[_$a-zA-Z\xA0-\uFFFF](?:(?!\s)[$\w\xA0-\uFFFF])*(?=\s*[=:]\s*(?:async\s*)?(?:\bfunction\b|(?:\((?:[^()]|\([^()]*\))*\)|(?!\s)[_$a-zA-Z\xA0-\uFFFF](?:(?!\s)[$\w\xA0-\uFFFF])*)\s*=>))/,
        alias: 'function'
    },
    'parameter': [{
            pattern: /(function(?:\s+(?!\s)[_$a-zA-Z\xA0-\uFFFF](?:(?!\s)[$\w\xA0-\uFFFF])*)?\s*\(\s*)(?!\s)(?:[^()\s]|\s+(?![\s)])|\([^()]*\))+(?=\s*\))/,
            lookbehind: true,
            inside: Prism.languages.javascript
        },
        {
            pattern: /(^|[^$\w\xA0-\uFFFF])(?!\s)[_$a-z\xA0-\uFFFF](?:(?!\s)[$\w\xA0-\uFFFF])*(?=\s*=>)/i,
            lookbehind: true,
            inside: Prism.languages.javascript
        },
        {
            pattern: /(\(\s*)(?!\s)(?:[^()\s]|\s+(?![\s)])|\([^()]*\))+(?=\s*\)\s*=>)/,
            lookbehind: true,
            inside: Prism.languages.javascript
        },
        {
            pattern: /((?:\b|\s|^)(?!(?:as|async|await|break|case|catch|class|const|continue|debugger|default|delete|do|else|enum|export|extends|finally|for|from|function|get|if|implements|import|in|instanceof|interface|let|new|null|of|package|private|protected|public|return|set|static|super|switch|this|throw|try|typeof|undefined|var|void|while|with|yield)(?![$\w\xA0-\uFFFF]))(?:(?!\s)[_$a-zA-Z\xA0-\uFFFF](?:(?!\s)[$\w\xA0-\uFFFF])*\s*)\(\s*|\]\s*\(\s*)(?!\s)(?:[^()\s]|\s+(?![\s)])|\([^()]*\))+(?=\s*\)\s*\{)/,
            lookbehind: true,
            inside: Prism.languages.javascript
        }
    ],
    'constant': /\b[A-Z](?:[A-Z_]|\dx?)*\b/
});

Prism.languages.insertBefore('javascript', 'string', {
    'hashbang': {
        pattern: /^#!.*/,
        greedy: true,
        alias: 'comment'
    },
    'template-string': {
        pattern: /`(?:\\[\s\S]|\$\{(?:[^{}]|\{(?:[^{}]|\{[^}]*\})*\})+\}|(?!\$\{)[^\\`])*`/,
        greedy: true,
        inside: {
            'template-punctuation': {
                pattern: /^`|`$/,
                alias: 'string'
            },
            'interpolation': {
                pattern: /((?:^|[^\\])(?:\\{2})*)\$\{(?:[^{}]|\{(?:[^{}]|\{[^}]*\})*\})+\}/,
                lookbehind: true,
                inside: {
                    'interpolation-punctuation': {
                        pattern: /^\$\{|\}$/,
                        alias: 'punctuation'
                    },
                    rest: Prism.languages.javascript
                }
            },
            'string': /[\s\S]+/
        }
    },
    'string-property': {
        pattern: /((?:^|[,{])[ \t]*)(["'])(?:\\(?:\r\n|[\s\S])|(?!\2)[^\\\r\n])*\2(?=\s*:)/m,
        lookbehind: true,
        greedy: true,
        alias: 'property'
    }
});

Prism.languages.insertBefore('javascript', 'operator', {
    'literal-property': {
        pattern: /((?:^|[,{])[ \t]*)(?!\s)[_$a-zA-Z\xA0-\uFFFF](?:(?!\s)[$\w\xA0-\uFFFF])*(?=\s*:)/m,
        lookbehind: true,
        alias: 'property'
    },
});

if (Prism.languages.markup) {
    Prism.languages.markup.tag.addInlined('script', 'javascript');

    // add attribute support for all DOM events.
    // https://developer.mozilla.org/en-US/docs/Web/Events#Standard_events
    Prism.languages.markup.tag.addAttribute(
        /on(?:abort|blur|change|click|composition(?:end|start|update)|dblclick|error|focus(?:in|out)?|key(?:down|up)|load|mouse(?:down|enter|leave|move|out|over|up)|reset|resize|scroll|select|slotchange|submit|unload|wheel)/.source,
        'javascript'
    );
}

Prism.languages.js = Prism.languages.javascript;

Prism.languages.apacheconf = {
    'comment': /#.*/,
    'directive-inline': {
        pattern: /(^[\t ]*)\b(?:AcceptFilter|AcceptPathInfo|AccessFileName|Action|Add(?:Alt|AltByEncoding|AltByType|Charset|DefaultCharset|Description|Encoding|Handler|Icon|IconByEncoding|IconByType|InputFilter|Language|ModuleInfo|OutputFilter|OutputFilterByType|Type)|Alias|AliasMatch|Allow(?:CONNECT|EncodedSlashes|Methods|Override|OverrideList)?|Anonymous(?:_LogEmail|_MustGiveEmail|_NoUserID|_VerifyEmail)?|AsyncRequestWorkerFactor|Auth(?:BasicAuthoritative|BasicFake|BasicProvider|BasicUseDigestAlgorithm|DBDUserPWQuery|DBDUserRealmQuery|DBMGroupFile|DBMType|DBMUserFile|Digest(?:Algorithm|Domain|NonceLifetime|Provider|Qop|ShmemSize)|Form(?:Authoritative|Body|DisableNoStore|FakeBasicAuth|Location|LoginRequiredLocation|LoginSuccessLocation|LogoutLocation|Method|Mimetype|Password|Provider|SitePassphrase|Size|Username)|GroupFile|LDAP(?:AuthorizePrefix|BindAuthoritative|BindDN|BindPassword|CharsetConfig|CompareAsUser|CompareDNOnServer|DereferenceAliases|GroupAttribute|GroupAttributeIsDN|InitialBindAsUser|InitialBindPattern|MaxSubGroupDepth|RemoteUserAttribute|RemoteUserIsDN|SearchAsUser|SubGroupAttribute|SubGroupClass|Url)|Merging|Name|nCache(?:Context|Enable|ProvideFor|SOCache|Timeout)|nzFcgiCheckAuthnProvider|nzFcgiDefineProvider|Type|UserFile|zDBDLoginToReferer|zDBDQuery|zDBDRedirectQuery|zDBMType|zSendForbiddenOnFailure)|BalancerGrowth|BalancerInherit|BalancerMember|BalancerPersist|BrowserMatch|BrowserMatchNoCase|BufferedLogs|BufferSize|Cache(?:DefaultExpire|DetailHeader|DirLength|DirLevels|Disable|Enable|File|Header|IgnoreCacheControl|IgnoreHeaders|IgnoreNoLastMod|IgnoreQueryString|IgnoreURLSessionIdentifiers|KeyBaseURL|LastModifiedFactor|Lock|LockMaxAge|LockPath|MaxExpire|MaxFileSize|MinExpire|MinFileSize|NegotiatedDocs|QuickHandler|ReadSize|ReadTime|Root|Socache(?:MaxSize|MaxTime|MinTime|ReadSize|ReadTime)?|StaleOnError|StoreExpired|StoreNoStore|StorePrivate)|CGIDScriptTimeout|CGIMapExtension|CharsetDefault|CharsetOptions|CharsetSourceEnc|CheckCaseOnly|CheckSpelling|ChrootDir|ContentDigest|CookieDomain|CookieExpires|CookieName|CookieStyle|CookieTracking|CoreDumpDirectory|CustomLog|Dav|DavDepthInfinity|DavGenericLockDB|DavLockDB|DavMinTimeout|DBDExptime|DBDInitSQL|DBDKeep|DBDMax|DBDMin|DBDParams|DBDPersist|DBDPrepareSQL|DBDriver|DefaultIcon|DefaultLanguage|DefaultRuntimeDir|DefaultType|Define|Deflate(?:BufferSize|CompressionLevel|FilterNote|InflateLimitRequestBody|InflateRatio(?:Burst|Limit)|MemLevel|WindowSize)|Deny|DirectoryCheckHandler|DirectoryIndex|DirectoryIndexRedirect|DirectorySlash|DocumentRoot|DTracePrivileges|DumpIOInput|DumpIOOutput|EnableExceptionHook|EnableMMAP|EnableSendfile|Error|ErrorDocument|ErrorLog|ErrorLogFormat|Example|ExpiresActive|ExpiresByType|ExpiresDefault|ExtendedStatus|ExtFilterDefine|ExtFilterOptions|FallbackResource|FileETag|FilterChain|FilterDeclare|FilterProtocol|FilterProvider|FilterTrace|ForceLanguagePriority|ForceType|ForensicLog|GprofDir|GracefulShutdownTimeout|Group|Header|HeaderName|Heartbeat(?:Address|Listen|MaxServers|Storage)|HostnameLookups|IdentityCheck|IdentityCheckTimeout|ImapBase|ImapDefault|ImapMenu|Include|IncludeOptional|Index(?:HeadInsert|Ignore|IgnoreReset|Options|OrderDefault|StyleSheet)|InputSed|ISAPI(?:AppendLogToErrors|AppendLogToQuery|CacheFile|FakeAsync|LogNotSupported|ReadAheadBuffer)|KeepAlive|KeepAliveTimeout|KeptBodySize|LanguagePriority|LDAP(?:CacheEntries|CacheTTL|ConnectionPoolTTL|ConnectionTimeout|LibraryDebug|OpCacheEntries|OpCacheTTL|ReferralHopLimit|Referrals|Retries|RetryDelay|SharedCacheFile|SharedCacheSize|Timeout|TrustedClientCert|TrustedGlobalCert|TrustedMode|VerifyServerCert)|Limit(?:InternalRecursion|Request(?:Body|Fields|FieldSize|Line)|XMLRequestBody)|Listen|ListenBackLog|LoadFile|LoadModule|LogFormat|LogLevel|LogMessage|LuaAuthzProvider|LuaCodeCache|Lua(?:Hook(?:AccessChecker|AuthChecker|CheckUserID|Fixups|InsertFilter|Log|MapToStorage|TranslateName|TypeChecker)|Inherit|InputFilter|MapHandler|OutputFilter|PackageCPath|PackagePath|QuickHandler|Root|Scope)|Max(?:ConnectionsPerChild|KeepAliveRequests|MemFree|RangeOverlaps|RangeReversals|Ranges|RequestWorkers|SpareServers|SpareThreads|Threads)|MergeTrailers|MetaDir|MetaFiles|MetaSuffix|MimeMagicFile|MinSpareServers|MinSpareThreads|MMapFile|ModemStandard|ModMimeUsePathInfo|MultiviewsMatch|Mutex|NameVirtualHost|NoProxy|NWSSLTrustedCerts|NWSSLUpgradeable|Options|Order|OutputSed|PassEnv|PidFile|PrivilegesMode|Protocol|ProtocolEcho|Proxy(?:AddHeaders|BadHeader|Block|Domain|ErrorOverride|ExpressDBMFile|ExpressDBMType|ExpressEnable|FtpDirCharset|FtpEscapeWildcards|FtpListOnWildcard|HTML(?:BufSize|CharsetOut|DocType|Enable|Events|Extended|Fixups|Interp|Links|Meta|StripComments|URLMap)|IOBufferSize|MaxForwards|Pass(?:Inherit|InterpolateEnv|Match|Reverse|ReverseCookieDomain|ReverseCookiePath)?|PreserveHost|ReceiveBufferSize|Remote|RemoteMatch|Requests|SCGIInternalRedirect|SCGISendfile|Set|SourceAddress|Status|Timeout|Via)|ReadmeName|ReceiveBufferSize|Redirect|RedirectMatch|RedirectPermanent|RedirectTemp|ReflectorHeader|RemoteIP(?:Header|InternalProxy|InternalProxyList|ProxiesHeader|TrustedProxy|TrustedProxyList)|RemoveCharset|RemoveEncoding|RemoveHandler|RemoveInputFilter|RemoveLanguage|RemoveOutputFilter|RemoveType|RequestHeader|RequestReadTimeout|Require|Rewrite(?:Base|Cond|Engine|Map|Options|Rule)|RLimitCPU|RLimitMEM|RLimitNPROC|Satisfy|ScoreBoardFile|Script(?:Alias|AliasMatch|InterpreterSource|Log|LogBuffer|LogLength|Sock)?|SecureListen|SeeRequestTail|SendBufferSize|Server(?:Admin|Alias|Limit|Name|Path|Root|Signature|Tokens)|Session(?:Cookie(?:Name|Name2|Remove)|Crypto(?:Cipher|Driver|Passphrase|PassphraseFile)|DBD(?:CookieName|CookieName2|CookieRemove|DeleteLabel|InsertLabel|PerUser|SelectLabel|UpdateLabel)|Env|Exclude|Header|Include|MaxAge)?|SetEnv|SetEnvIf|SetEnvIfExpr|SetEnvIfNoCase|SetHandler|SetInputFilter|SetOutputFilter|SSIEndTag|SSIErrorMsg|SSIETag|SSILastModified|SSILegacyExprParser|SSIStartTag|SSITimeFormat|SSIUndefinedEcho|SSL(?:CACertificateFile|CACertificatePath|CADNRequestFile|CADNRequestPath|CARevocationCheck|CARevocationFile|CARevocationPath|CertificateChainFile|CertificateFile|CertificateKeyFile|CipherSuite|Compression|CryptoDevice|Engine|FIPS|HonorCipherOrder|InsecureRenegotiation|OCSP(?:DefaultResponder|Enable|OverrideResponder|ResponderTimeout|ResponseMaxAge|ResponseTimeSkew|UseRequestNonce)|OpenSSLConfCmd|Options|PassPhraseDialog|Protocol|Proxy(?:CACertificateFile|CACertificatePath|CARevocation(?:Check|File|Path)|CheckPeer(?:CN|Expire|Name)|CipherSuite|Engine|MachineCertificate(?:ChainFile|File|Path)|Protocol|Verify|VerifyDepth)|RandomSeed|RenegBufferSize|Require|RequireSSL|Session(?:Cache|CacheTimeout|TicketKeyFile|Tickets)|SRPUnknownUserSeed|SRPVerifierFile|Stapling(?:Cache|ErrorCacheTimeout|FakeTryLater|ForceURL|ResponderTimeout|ResponseMaxAge|ResponseTimeSkew|ReturnResponderErrors|StandardCacheTimeout)|StrictSNIVHostCheck|UserName|UseStapling|VerifyClient|VerifyDepth)|StartServers|StartThreads|Substitute|Suexec|SuexecUserGroup|ThreadLimit|ThreadsPerChild|ThreadStackSize|TimeOut|TraceEnable|TransferLog|TypesConfig|UnDefine|UndefMacro|UnsetEnv|Use|UseCanonicalName|UseCanonicalPhysicalPort|User|UserDir|VHostCGIMode|VHostCGIPrivs|VHostGroup|VHostPrivs|VHostSecure|VHostUser|Virtual(?:DocumentRoot|ScriptAlias)(?:IP)?|WatchdogInterval|XBitHack|xml2EncAlias|xml2EncDefault|xml2StartParse)\b/im,
        lookbehind: true,
        alias: 'property'
    },
    'directive-block': {
        pattern: /<\/?\b(?:Auth[nz]ProviderAlias|Directory|DirectoryMatch|Else|ElseIf|Files|FilesMatch|If|IfDefine|IfModule|IfVersion|Limit|LimitExcept|Location|LocationMatch|Macro|Proxy|Require(?:All|Any|None)|VirtualHost)\b.*>/i,
        inside: {
            'directive-block': {
                pattern: /^<\/?\w+/,
                inside: {
                    'punctuation': /^<\/?/
                },
                alias: 'tag'
            },
            'directive-block-parameter': {
                pattern: /.*[^>]/,
                inside: {
                    'punctuation': /:/,
                    'string': {
                        pattern: /("|').*\1/,
                        inside: {
                            'variable': /[$%]\{?(?:\w\.?[-+:]?)+\}?/
                        }
                    }
                },
                alias: 'attr-value'
            },
            'punctuation': />/
        },
        alias: 'tag'
    },
    'directive-flags': {
        pattern: /\[(?:[\w=],?)+\]/,
        alias: 'keyword'
    },
    'string': {
        pattern: /("|').*\1/,
        inside: {
            'variable': /[$%]\{?(?:\w\.?[-+:]?)+\}?/
        }
    },
    'variable': /[$%]\{?(?:\w\.?[-+:]?)+\}?/,
    'regex': /\^?.*\$|\^.*\$?/
};

(function (Prism) {
    // $ set | grep '^[A-Z][^[:space:]]*=' | cut -d= -f1 | tr '\n' '|'
    // + LC_ALL, RANDOM, REPLY, SECONDS.
    // + make sure PS1..4 are here as they are not always set,
    // - some useless things.
    var envVars = '\\b(?:BASH|BASHOPTS|BASH_ALIASES|BASH_ARGC|BASH_ARGV|BASH_CMDS|BASH_COMPLETION_COMPAT_DIR|BASH_LINENO|BASH_REMATCH|BASH_SOURCE|BASH_VERSINFO|BASH_VERSION|COLORTERM|COLUMNS|COMP_WORDBREAKS|DBUS_SESSION_BUS_ADDRESS|DEFAULTS_PATH|DESKTOP_SESSION|DIRSTACK|DISPLAY|EUID|GDMSESSION|GDM_LANG|GNOME_KEYRING_CONTROL|GNOME_KEYRING_PID|GPG_AGENT_INFO|GROUPS|HISTCONTROL|HISTFILE|HISTFILESIZE|HISTSIZE|HOME|HOSTNAME|HOSTTYPE|IFS|INSTANCE|JOB|LANG|LANGUAGE|LC_ADDRESS|LC_ALL|LC_IDENTIFICATION|LC_MEASUREMENT|LC_MONETARY|LC_NAME|LC_NUMERIC|LC_PAPER|LC_TELEPHONE|LC_TIME|LESSCLOSE|LESSOPEN|LINES|LOGNAME|LS_COLORS|MACHTYPE|MAILCHECK|MANDATORY_PATH|NO_AT_BRIDGE|OLDPWD|OPTERR|OPTIND|ORBIT_SOCKETDIR|OSTYPE|PAPERSIZE|PATH|PIPESTATUS|PPID|PS1|PS2|PS3|PS4|PWD|RANDOM|REPLY|SECONDS|SELINUX_INIT|SESSION|SESSIONTYPE|SESSION_MANAGER|SHELL|SHELLOPTS|SHLVL|SSH_AUTH_SOCK|TERM|UID|UPSTART_EVENTS|UPSTART_INSTANCE|UPSTART_JOB|UPSTART_SESSION|USER|WINDOWID|XAUTHORITY|XDG_CONFIG_DIRS|XDG_CURRENT_DESKTOP|XDG_DATA_DIRS|XDG_GREETER_DATA_DIR|XDG_MENU_PREFIX|XDG_RUNTIME_DIR|XDG_SEAT|XDG_SEAT_PATH|XDG_SESSION_DESKTOP|XDG_SESSION_ID|XDG_SESSION_PATH|XDG_SESSION_TYPE|XDG_VTNR|XMODIFIERS)\\b';

    var commandAfterHeredoc = {
        pattern: /(^(["']?)\w+\2)[ \t]+\S.*/,
        lookbehind: true,
        alias: 'punctuation', // this looks reasonably well in all themes
        inside: null // see below
    };

    var insideString = {
        'bash': commandAfterHeredoc,
        'environment': {
            pattern: RegExp('\\$' + envVars),
            alias: 'constant'
        },
        'variable': [
            // [0]: Arithmetic Environment
            {
                pattern: /\$?\(\([\s\S]+?\)\)/,
                greedy: true,
                inside: {
                    // If there is a $ sign at the beginning highlight $(( and )) as variable
                    'variable': [{
                            pattern: /(^\$\(\([\s\S]+)\)\)/,
                            lookbehind: true
                        },
                        /^\$\(\(/
                    ],
                    'number': /\b0x[\dA-Fa-f]+\b|(?:\b\d+(?:\.\d*)?|\B\.\d+)(?:[Ee]-?\d+)?/,
                    // Operators according to https://www.gnu.org/software/bash/manual/bashref.html#Shell-Arithmetic
                    'operator': /--|\+\+|\*\*=?|<<=?|>>=?|&&|\|\||[=!+\-*/%<>^&|]=?|[?~:]/,
                    // If there is no $ sign at the beginning highlight (( and )) as punctuation
                    'punctuation': /\(\(?|\)\)?|,|;/
                }
            },
            // [1]: Command Substitution
            {
                pattern: /\$\((?:\([^)]+\)|[^()])+\)|`[^`]+`/,
                greedy: true,
                inside: {
                    'variable': /^\$\(|^`|\)$|`$/
                }
            },
            // [2]: Brace expansion
            {
                pattern: /\$\{[^}]+\}/,
                greedy: true,
                inside: {
                    'operator': /:[-=?+]?|[!\/]|##?|%%?|\^\^?|,,?/,
                    'punctuation': /[\[\]]/,
                    'environment': {
                        pattern: RegExp('(\\{)' + envVars),
                        lookbehind: true,
                        alias: 'constant'
                    }
                }
            },
            /\$(?:\w+|[#?*!@$])/
        ],
        // Escape sequences from echo and printf's manuals, and escaped quotes.
        'entity': /\\(?:[abceEfnrtv\\"]|O?[0-7]{1,3}|U[0-9a-fA-F]{8}|u[0-9a-fA-F]{4}|x[0-9a-fA-F]{1,2})/
    };

    Prism.languages.bash = {
        'shebang': {
            pattern: /^#!\s*\/.*/,
            alias: 'important'
        },
        'comment': {
            pattern: /(^|[^"{\\$])#.*/,
            lookbehind: true
        },
        'function-name': [
            // a) function foo {
            // b) foo() {
            // c) function foo() {
            // but not “foo {”
            {
                // a) and c)
                pattern: /(\bfunction\s+)[\w-]+(?=(?:\s*\(?:\s*\))?\s*\{)/,
                lookbehind: true,
                alias: 'function'
            },
            {
                // b)
                pattern: /\b[\w-]+(?=\s*\(\s*\)\s*\{)/,
                alias: 'function'
            }
        ],
        // Highlight variable names as variables in for and select beginnings.
        'for-or-select': {
            pattern: /(\b(?:for|select)\s+)\w+(?=\s+in\s)/,
            alias: 'variable',
            lookbehind: true
        },
        // Highlight variable names as variables in the left-hand part
        // of assignments (“=” and “+=”).
        'assign-left': {
            pattern: /(^|[\s;|&]|[<>]\()\w+(?=\+?=)/,
            inside: {
                'environment': {
                    pattern: RegExp('(^|[\\s;|&]|[<>]\\()' + envVars),
                    lookbehind: true,
                    alias: 'constant'
                }
            },
            alias: 'variable',
            lookbehind: true
        },
        'string': [
            // Support for Here-documents https://en.wikipedia.org/wiki/Here_document
            {
                pattern: /((?:^|[^<])<<-?\s*)(\w+)\s[\s\S]*?(?:\r?\n|\r)\2/,
                lookbehind: true,
                greedy: true,
                inside: insideString
            },
            // Here-document with quotes around the tag
            // → No expansion (so no “inside”).
            {
                pattern: /((?:^|[^<])<<-?\s*)(["'])(\w+)\2\s[\s\S]*?(?:\r?\n|\r)\3/,
                lookbehind: true,
                greedy: true,
                inside: {
                    'bash': commandAfterHeredoc
                }
            },
            // “Normal” string
            {
                // https://www.gnu.org/software/bash/manual/html_node/Double-Quotes.html
                pattern: /(^|[^\\](?:\\\\)*)"(?:\\[\s\S]|\$\([^)]+\)|\$(?!\()|`[^`]+`|[^"\\`$])*"/,
                lookbehind: true,
                greedy: true,
                inside: insideString
            },
            {
                // https://www.gnu.org/software/bash/manual/html_node/Single-Quotes.html
                pattern: /(^|[^$\\])'[^']*'/,
                lookbehind: true,
                greedy: true
            },
            {
                // https://www.gnu.org/software/bash/manual/html_node/ANSI_002dC-Quoting.html
                pattern: /\$'(?:[^'\\]|\\[\s\S])*'/,
                greedy: true,
                inside: {
                    'entity': insideString.entity
                }
            }
        ],
        'environment': {
            pattern: RegExp('\\$?' + envVars),
            alias: 'constant'
        },
        'variable': insideString.variable,
        'function': {
            pattern: /(^|[\s;|&]|[<>]\()(?:add|apropos|apt|apt-cache|apt-get|aptitude|aspell|automysqlbackup|awk|basename|bash|bc|bconsole|bg|bzip2|cal|cat|cfdisk|chgrp|chkconfig|chmod|chown|chroot|cksum|clear|cmp|column|comm|composer|cp|cron|crontab|csplit|curl|cut|date|dc|dd|ddrescue|debootstrap|df|diff|diff3|dig|dir|dircolors|dirname|dirs|dmesg|docker|docker-compose|du|egrep|eject|env|ethtool|expand|expect|expr|fdformat|fdisk|fg|fgrep|file|find|fmt|fold|format|free|fsck|ftp|fuser|gawk|git|gparted|grep|groupadd|groupdel|groupmod|groups|grub-mkconfig|gzip|halt|head|hg|history|host|hostname|htop|iconv|id|ifconfig|ifdown|ifup|import|install|ip|jobs|join|kill|killall|less|link|ln|locate|logname|logrotate|look|lpc|lpr|lprint|lprintd|lprintq|lprm|ls|lsof|lynx|make|man|mc|mdadm|mkconfig|mkdir|mke2fs|mkfifo|mkfs|mkisofs|mknod|mkswap|mmv|more|most|mount|mtools|mtr|mutt|mv|nano|nc|netstat|nice|nl|node|nohup|notify-send|npm|nslookup|op|open|parted|passwd|paste|pathchk|ping|pkill|pnpm|podman|podman-compose|popd|pr|printcap|printenv|ps|pushd|pv|quota|quotacheck|quotactl|ram|rar|rcp|reboot|remsync|rename|renice|rev|rm|rmdir|rpm|rsync|scp|screen|sdiff|sed|sendmail|seq|service|sftp|sh|shellcheck|shuf|shutdown|sleep|slocate|sort|split|ssh|stat|strace|su|sudo|sum|suspend|swapon|sync|tac|tail|tar|tee|time|timeout|top|touch|tr|traceroute|tsort|tty|umount|uname|unexpand|uniq|units|unrar|unshar|unzip|update-grub|uptime|useradd|userdel|usermod|users|uudecode|uuencode|v|vcpkg|vdir|vi|vim|virsh|vmstat|wait|watch|wc|wget|whereis|which|who|whoami|write|xargs|xdg-open|yarn|yes|zenity|zip|zsh|zypper)(?=$|[)\s;|&])/,
            lookbehind: true
        },
        'keyword': {
            pattern: /(^|[\s;|&]|[<>]\()(?:case|do|done|elif|else|esac|fi|for|function|if|in|select|then|until|while)(?=$|[)\s;|&])/,
            lookbehind: true
        },
        // https://www.gnu.org/software/bash/manual/html_node/Shell-Builtin-Commands.html
        'builtin': {
            pattern: /(^|[\s;|&]|[<>]\()(?:\.|:|alias|bind|break|builtin|caller|cd|command|continue|declare|echo|enable|eval|exec|exit|export|getopts|hash|help|let|local|logout|mapfile|printf|pwd|read|readarray|readonly|return|set|shift|shopt|source|test|times|trap|type|typeset|ulimit|umask|unalias|unset)(?=$|[)\s;|&])/,
            lookbehind: true,
            // Alias added to make those easier to distinguish from strings.
            alias: 'class-name'
        },
        'boolean': {
            pattern: /(^|[\s;|&]|[<>]\()(?:false|true)(?=$|[)\s;|&])/,
            lookbehind: true
        },
        'file-descriptor': {
            pattern: /\B&\d\b/,
            alias: 'important'
        },
        'operator': {
            // Lots of redirections here, but not just that.
            pattern: /\d?<>|>\||\+=|=[=~]?|!=?|<<[<-]?|[&\d]?>>|\d[<>]&?|[<>][&=]?|&[>&]?|\|[&|]?/,
            inside: {
                'file-descriptor': {
                    pattern: /^\d/,
                    alias: 'important'
                }
            }
        },
        'punctuation': /\$?\(\(?|\)\)?|\.\.|[{}[\];\\]/,
        'number': {
            pattern: /(^|\s)(?:[1-9]\d*|0)(?:[.,]\d+)?\b/,
            lookbehind: true
        }
    };

    commandAfterHeredoc.inside = Prism.languages.bash;

    /* Patterns in command substitution. */
    var toBeCopied = [
        'comment',
        'function-name',
        'for-or-select',
        'assign-left',
        'string',
        'environment',
        'function',
        'keyword',
        'builtin',
        'boolean',
        'file-descriptor',
        'operator',
        'punctuation',
        'number'
    ];
    var inside = insideString.variable[1].inside;
    for (var i = 0; i < toBeCopied.length; i++) {
        inside[toBeCopied[i]] = Prism.languages.bash[toBeCopied[i]];
    }

    Prism.languages.shell = Prism.languages.bash;
}(Prism));

Prism.languages.bnf = {
    'string': {
        pattern: /"[^\r\n"]*"|'[^\r\n']*'/
    },
    'definition': {
        pattern: /<[^<>\r\n\t]+>(?=\s*::=)/,
        alias: ['rule', 'keyword'],
        inside: {
            'punctuation': /^<|>$/
        }
    },
    'rule': {
        pattern: /<[^<>\r\n\t]+>/,
        inside: {
            'punctuation': /^<|>$/
        }
    },
    'operator': /::=|[|()[\]{}*+?]|\.{3}/
};

Prism.languages.rbnf = Prism.languages.bnf;

(function (Prism) {

    var string = /("|')(?:\\(?:\r\n|[\s\S])|(?!\1)[^\\\r\n])*\1/;
    var selectorInside;

    Prism.languages.css.selector = {
        pattern: Prism.languages.css.selector.pattern,
        lookbehind: true,
        inside: selectorInside = {
            'pseudo-element': /:(?:after|before|first-letter|first-line|selection)|::[-\w]+/,
            'pseudo-class': /:[-\w]+/,
            'class': /\.[-\w]+/,
            'id': /#[-\w]+/,
            'attribute': {
                pattern: RegExp('\\[(?:[^[\\]"\']|' + string.source + ')*\\]'),
                greedy: true,
                inside: {
                    'punctuation': /^\[|\]$/,
                    'case-sensitivity': {
                        pattern: /(\s)[si]$/i,
                        lookbehind: true,
                        alias: 'keyword'
                    },
                    'namespace': {
                        pattern: /^(\s*)(?:(?!\s)[-*\w\xA0-\uFFFF])*\|(?!=)/,
                        lookbehind: true,
                        inside: {
                            'punctuation': /\|$/
                        }
                    },
                    'attr-name': {
                        pattern: /^(\s*)(?:(?!\s)[-\w\xA0-\uFFFF])+/,
                        lookbehind: true
                    },
                    'attr-value': [
                        string,
                        {
                            pattern: /(=\s*)(?:(?!\s)[-\w\xA0-\uFFFF])+(?=\s*$)/,
                            lookbehind: true
                        }
                    ],
                    'operator': /[|~*^$]?=/
                }
            },
            'n-th': [{
                    pattern: /(\(\s*)[+-]?\d*[\dn](?:\s*[+-]\s*\d+)?(?=\s*\))/,
                    lookbehind: true,
                    inside: {
                        'number': /[\dn]+/,
                        'operator': /[+-]/
                    }
                },
                {
                    pattern: /(\(\s*)(?:even|odd)(?=\s*\))/i,
                    lookbehind: true
                }
            ],
            'combinator': />|\+|~|\|\|/,

            // the `tag` token has been existed and removed.
            // because we can't find a perfect tokenize to match it.
            // if you want to add it, please read https://github.com/PrismJS/prism/pull/2373 first.

            'punctuation': /[(),]/,
        }
    };

    Prism.languages.css['atrule'].inside['selector-function-argument'].inside = selectorInside;

    Prism.languages.insertBefore('css', 'property', {
        'variable': {
            pattern: /(^|[^-\w\xA0-\uFFFF])--(?!\s)[-_a-z\xA0-\uFFFF](?:(?!\s)[-\w\xA0-\uFFFF])*/i,
            lookbehind: true
        }
    });

    var unit = {
        pattern: /(\b\d+)(?:%|[a-z]+(?![\w-]))/,
        lookbehind: true
    };
    // 123 -123 .123 -.123 12.3 -12.3
    var number = {
        pattern: /(^|[^\w.-])-?(?:\d+(?:\.\d+)?|\.\d+)/,
        lookbehind: true
    };

    Prism.languages.insertBefore('css', 'function', {
        'operator': {
            pattern: /(\s)[+\-*\/](?=\s)/,
            lookbehind: true
        },
        // CAREFUL!
        // Previewers and Inline color use hexcode and color.
        'hexcode': {
            pattern: /\B#[\da-f]{3,8}\b/i,
            alias: 'color'
        },
        'color': [{
                pattern: /(^|[^\w-])(?:AliceBlue|AntiqueWhite|Aqua|Aquamarine|Azure|Beige|Bisque|Black|BlanchedAlmond|Blue|BlueViolet|Brown|BurlyWood|CadetBlue|Chartreuse|Chocolate|Coral|CornflowerBlue|Cornsilk|Crimson|Cyan|DarkBlue|DarkCyan|DarkGoldenRod|DarkGr[ae]y|DarkGreen|DarkKhaki|DarkMagenta|DarkOliveGreen|DarkOrange|DarkOrchid|DarkRed|DarkSalmon|DarkSeaGreen|DarkSlateBlue|DarkSlateGr[ae]y|DarkTurquoise|DarkViolet|DeepPink|DeepSkyBlue|DimGr[ae]y|DodgerBlue|FireBrick|FloralWhite|ForestGreen|Fuchsia|Gainsboro|GhostWhite|Gold|GoldenRod|Gr[ae]y|Green|GreenYellow|HoneyDew|HotPink|IndianRed|Indigo|Ivory|Khaki|Lavender|LavenderBlush|LawnGreen|LemonChiffon|LightBlue|LightCoral|LightCyan|LightGoldenRodYellow|LightGr[ae]y|LightGreen|LightPink|LightSalmon|LightSeaGreen|LightSkyBlue|LightSlateGr[ae]y|LightSteelBlue|LightYellow|Lime|LimeGreen|Linen|Magenta|Maroon|MediumAquaMarine|MediumBlue|MediumOrchid|MediumPurple|MediumSeaGreen|MediumSlateBlue|MediumSpringGreen|MediumTurquoise|MediumVioletRed|MidnightBlue|MintCream|MistyRose|Moccasin|NavajoWhite|Navy|OldLace|Olive|OliveDrab|Orange|OrangeRed|Orchid|PaleGoldenRod|PaleGreen|PaleTurquoise|PaleVioletRed|PapayaWhip|PeachPuff|Peru|Pink|Plum|PowderBlue|Purple|RebeccaPurple|Red|RosyBrown|RoyalBlue|SaddleBrown|Salmon|SandyBrown|SeaGreen|SeaShell|Sienna|Silver|SkyBlue|SlateBlue|SlateGr[ae]y|Snow|SpringGreen|SteelBlue|Tan|Teal|Thistle|Tomato|Transparent|Turquoise|Violet|Wheat|White|WhiteSmoke|Yellow|YellowGreen)(?![\w-])/i,
                lookbehind: true
            },
            {
                pattern: /\b(?:hsl|rgb)\(\s*\d{1,3}\s*,\s*\d{1,3}%?\s*,\s*\d{1,3}%?\s*\)\B|\b(?:hsl|rgb)a\(\s*\d{1,3}\s*,\s*\d{1,3}%?\s*,\s*\d{1,3}%?\s*,\s*(?:0|0?\.\d+|1)\s*\)\B/i,
                inside: {
                    'unit': unit,
                    'number': number,
                    'function': /[\w-]+(?=\()/,
                    'punctuation': /[(),]/
                }
            }
        ],
        // it's important that there is no boundary assertion after the hex digits
        'entity': /\\[\da-f]{1,8}/i,
        'unit': unit,
        'number': number
    });

}(Prism));

Prism.languages.editorconfig = {
    // https://editorconfig-specification.readthedocs.io
    'comment': /[;#].*/,
    'section': {
        pattern: /(^[ \t]*)\[.+\]/m,
        lookbehind: true,
        alias: 'selector',
        inside: {
            'regex': /\\\\[\[\]{},!?.*]/, // Escape special characters with '\\'
            'operator': /[!?]|\.\.|\*{1,2}/,
            'punctuation': /[\[\]{},]/
        }
    },
    'key': {
        pattern: /(^[ \t]*)[^\s=]+(?=[ \t]*=)/m,
        lookbehind: true,
        alias: 'attr-name'
    },
    'value': {
        pattern: /=.*/,
        alias: 'attr-value',
        inside: {
            'punctuation': /^=/
        }
    }
};

Prism.languages.git = {
    /*
     * A simple one line comment like in a git status command
     * For instance:
     * $ git status
     * # On branch infinite-scroll
     * # Your branch and 'origin/sharedBranches/frontendTeam/infinite-scroll' have diverged,
     * # and have 1 and 2 different commits each, respectively.
     * nothing to commit (working directory clean)
     */
    'comment': /^#.*/m,

    /*
     * Regexp to match the changed lines in a git diff output. Check the example below.
     */
    'deleted': /^[-–].*/m,
    'inserted': /^\+.*/m,

    /*
     * a string (double and simple quote)
     */
    'string': /("|')(?:\\.|(?!\1)[^\\\r\n])*\1/,

    /*
     * a git command. It starts with a random prompt finishing by a $, then "git" then some other parameters
     * For instance:
     * $ git add file.txt
     */
    'command': {
        pattern: /^.*\$ git .*$/m,
        inside: {
            /*
             * A git command can contain a parameter starting by a single or a double dash followed by a string
             * For instance:
             * $ git diff --cached
             * $ git log -p
             */
            'parameter': /\s--?\w+/
        }
    },

    /*
     * Coordinates displayed in a git diff command
     * For instance:
     * $ git diff
     * diff --git file.txt file.txt
     * index 6214953..1d54a52 100644
     * --- file.txt
     * +++ file.txt
     * @@ -1 +1,2 @@
     * -Here's my tetx file
     * +Here's my text file
     * +And this is the second line
     */
    'coord': /^@@.*@@$/m,

    /*
     * Match a "commit [SHA1]" line in a git log output.
     * For instance:
     * $ git log
     * commit a11a14ef7e26f2ca62d4b35eac455ce636d0dc09
     * Author: lgiraudel
     * Date:   Mon Feb 17 11:18:34 2014 +0100
     *
     *     Add of a new line
     */
    'commit-sha1': /^commit \w{40}$/m
};

Prism.languages.graphql = {
    'comment': /#.*/,
    'description': {
        pattern: /(?:"""(?:[^"]|(?!""")")*"""|"(?:\\.|[^\\"\r\n])*")(?=\s*[a-z_])/i,
        greedy: true,
        alias: 'string',
        inside: {
            'language-markdown': {
                pattern: /(^"(?:"")?)(?!\1)[\s\S]+(?=\1$)/,
                lookbehind: true,
                inside: Prism.languages.markdown
            }
        }
    },
    'string': {
        pattern: /"""(?:[^"]|(?!""")")*"""|"(?:\\.|[^\\"\r\n])*"/,
        greedy: true
    },
    'number': /(?:\B-|\b)\d+(?:\.\d+)?(?:e[+-]?\d+)?\b/i,
    'boolean': /\b(?:false|true)\b/,
    'variable': /\$[a-z_]\w*/i,
    'directive': {
        pattern: /@[a-z_]\w*/i,
        alias: 'function'
    },
    'attr-name': {
        pattern: /\b[a-z_]\w*(?=\s*(?:\((?:[^()"]|"(?:\\.|[^\\"\r\n])*")*\))?:)/i,
        greedy: true
    },
    'atom-input': {
        pattern: /\b[A-Z]\w*Input\b/,
        alias: 'class-name'
    },
    'scalar': /\b(?:Boolean|Float|ID|Int|String)\b/,
    'constant': /\b[A-Z][A-Z_\d]*\b/,
    'class-name': {
        pattern: /(\b(?:enum|implements|interface|on|scalar|type|union)\s+|&\s*|:\s*|\[)[A-Z_]\w*/,
        lookbehind: true
    },
    'fragment': {
        pattern: /(\bfragment\s+|\.{3}\s*(?!on\b))[a-zA-Z_]\w*/,
        lookbehind: true,
        alias: 'function'
    },
    'definition-mutation': {
        pattern: /(\bmutation\s+)[a-zA-Z_]\w*/,
        lookbehind: true,
        alias: 'function'
    },
    'definition-query': {
        pattern: /(\bquery\s+)[a-zA-Z_]\w*/,
        lookbehind: true,
        alias: 'function'
    },
    'keyword': /\b(?:directive|enum|extend|fragment|implements|input|interface|mutation|on|query|repeatable|scalar|schema|subscription|type|union)\b/,
    'operator': /[!=|&]|\.{3}/,
    'property-query': /\w+(?=\s*\()/,
    'object': /\w+(?=\s*\{)/,
    'punctuation': /[!(){}\[\]:=,]/,
    'property': /\w+/
};

Prism.hooks.add('after-tokenize', function afterTokenizeGraphql(env) {
    if (env.language !== 'graphql') {
        return;
    }

    /**
     * get the graphql token stream that we want to customize
     *
     * @typedef {InstanceType<import("./prism-core")["Token"]>} Token
     * @type {Token[]}
     */
    var validTokens = env.tokens.filter(function (token) {
        return typeof token !== 'string' && token.type !== 'comment' && token.type !== 'scalar';
    });

    var currentIndex = 0;

    /**
     * Returns whether the token relative to the current index has the given type.
     *
     * @param {number} offset
     * @returns {Token | undefined}
     */
    function getToken(offset) {
        return validTokens[currentIndex + offset];
    }

    /**
     * Returns whether the token relative to the current index has the given type.
     *
     * @param {readonly string[]} types
     * @param {number} [offset=0]
     * @returns {boolean}
     */
    function isTokenType(types, offset) {
        offset = offset || 0;
        for (var i = 0; i < types.length; i++) {
            var token = getToken(i + offset);
            if (!token || token.type !== types[i]) {
                return false;
            }
        }
        return true;
    }

    /**
     * Returns the index of the closing bracket to an opening bracket.
     *
     * It is assumed that `token[currentIndex - 1]` is an opening bracket.
     *
     * If no closing bracket could be found, `-1` will be returned.
     *
     * @param {RegExp} open
     * @param {RegExp} close
     * @returns {number}
     */
    function findClosingBracket(open, close) {
        var stackHeight = 1;

        for (var i = currentIndex; i < validTokens.length; i++) {
            var token = validTokens[i];
            var content = token.content;

            if (token.type === 'punctuation' && typeof content === 'string') {
                if (open.test(content)) {
                    stackHeight++;
                } else if (close.test(content)) {
                    stackHeight--;

                    if (stackHeight === 0) {
                        return i;
                    }
                }
            }
        }

        return -1;
    }

    /**
     * Adds an alias to the given token.
     *
     * @param {Token} token
     * @param {string} alias
     * @returns {void}
     */
    function addAlias(token, alias) {
        var aliases = token.alias;
        if (!aliases) {
            token.alias = aliases = [];
        } else if (!Array.isArray(aliases)) {
            token.alias = aliases = [aliases];
        }
        aliases.push(alias);
    }

    for (; currentIndex < validTokens.length;) {
        var startToken = validTokens[currentIndex++];

        // add special aliases for mutation tokens
        if (startToken.type === 'keyword' && startToken.content === 'mutation') {
            // any array of the names of all input variables (if any)
            var inputVariables = [];

            if (isTokenType(['definition-mutation', 'punctuation']) && getToken(1).content === '(') {
                // definition

                currentIndex += 2; // skip 'definition-mutation' and 'punctuation'

                var definitionEnd = findClosingBracket(/^\($/, /^\)$/);
                if (definitionEnd === -1) {
                    continue;
                }

                // find all input variables
                for (; currentIndex < definitionEnd; currentIndex++) {
                    var t = getToken(0);
                    if (t.type === 'variable') {
                        addAlias(t, 'variable-input');
                        inputVariables.push(t.content);
                    }
                }

                currentIndex = definitionEnd + 1;
            }

            if (isTokenType(['punctuation', 'property-query']) && getToken(0).content === '{') {
                currentIndex++; // skip opening bracket

                addAlias(getToken(0), 'property-mutation');

                if (inputVariables.length > 0) {
                    var mutationEnd = findClosingBracket(/^\{$/, /^\}$/);
                    if (mutationEnd === -1) {
                        continue;
                    }

                    // give references to input variables a special alias
                    for (var i = currentIndex; i < mutationEnd; i++) {
                        var varToken = validTokens[i];
                        if (varToken.type === 'variable' && inputVariables.indexOf(varToken.content) >= 0) {
                            addAlias(varToken, 'variable-input');
                        }
                    }
                }
            }
        }
    }
});

(function (Prism) {

    /**
     * @param {string} name
     * @returns {RegExp}
     */
    function headerValueOf(name) {
        return RegExp('(^(?:' + name + '):[ \t]*(?![ \t]))[^]+', 'i');
    }

    Prism.languages.http = {
        'request-line': {
            pattern: /^(?:CONNECT|DELETE|GET|HEAD|OPTIONS|PATCH|POST|PRI|PUT|SEARCH|TRACE)\s(?:https?:\/\/|\/)\S*\sHTTP\/[\d.]+/m,
            inside: {
                // HTTP Method
                'method': {
                    pattern: /^[A-Z]+\b/,
                    alias: 'property'
                },
                // Request Target e.g. http://example.com, /path/to/file
                'request-target': {
                    pattern: /^(\s)(?:https?:\/\/|\/)\S*(?=\s)/,
                    lookbehind: true,
                    alias: 'url',
                    inside: Prism.languages.uri
                },
                // HTTP Version
                'http-version': {
                    pattern: /^(\s)HTTP\/[\d.]+/,
                    lookbehind: true,
                    alias: 'property'
                },
            }
        },
        'response-status': {
            pattern: /^HTTP\/[\d.]+ \d+ .+/m,
            inside: {
                // HTTP Version
                'http-version': {
                    pattern: /^HTTP\/[\d.]+/,
                    alias: 'property'
                },
                // Status Code
                'status-code': {
                    pattern: /^(\s)\d+(?=\s)/,
                    lookbehind: true,
                    alias: 'number'
                },
                // Reason Phrase
                'reason-phrase': {
                    pattern: /^(\s).+/,
                    lookbehind: true,
                    alias: 'string'
                }
            }
        },
        'header': {
            pattern: /^[\w-]+:.+(?:(?:\r\n?|\n)[ \t].+)*/m,
            inside: {
                'header-value': [{
                        pattern: headerValueOf(/Content-Security-Policy/.source),
                        lookbehind: true,
                        alias: ['csp', 'languages-csp'],
                        inside: Prism.languages.csp
                    },
                    {
                        pattern: headerValueOf(/Public-Key-Pins(?:-Report-Only)?/.source),
                        lookbehind: true,
                        alias: ['hpkp', 'languages-hpkp'],
                        inside: Prism.languages.hpkp
                    },
                    {
                        pattern: headerValueOf(/Strict-Transport-Security/.source),
                        lookbehind: true,
                        alias: ['hsts', 'languages-hsts'],
                        inside: Prism.languages.hsts
                    },
                    {
                        pattern: headerValueOf(/[^:]+/.source),
                        lookbehind: true
                    }
                ],
                'header-name': {
                    pattern: /^[^:]+/,
                    alias: 'keyword'
                },
                'punctuation': /^:/
            }
        }
    };

    // Create a mapping of Content-Type headers to language definitions
    var langs = Prism.languages;
    var httpLanguages = {
        'application/javascript': langs.javascript,
        'application/json': langs.json || langs.javascript,
        'application/xml': langs.xml,
        'text/xml': langs.xml,
        'text/html': langs.html,
        'text/css': langs.css,
        'text/plain': langs.plain
    };

    // Declare which types can also be suffixes
    var suffixTypes = {
        'application/json': true,
        'application/xml': true
    };

    /**
     * Returns a pattern for the given content type which matches it and any type which has it as a suffix.
     *
     * @param {string} contentType
     * @returns {string}
     */
    function getSuffixPattern(contentType) {
        var suffix = contentType.replace(/^[a-z]+\//, '');
        var suffixPattern = '\\w+/(?:[\\w.-]+\\+)+' + suffix + '(?![+\\w.-])';
        return '(?:' + contentType + '|' + suffixPattern + ')';
    }

    // Insert each content type parser that has its associated language
    // currently loaded.
    var options;
    for (var contentType in httpLanguages) {
        if (httpLanguages[contentType]) {
            options = options || {};

            var pattern = suffixTypes[contentType] ? getSuffixPattern(contentType) : contentType;
            options[contentType.replace(/\//g, '-')] = {
                pattern: RegExp(
                    '(' + /content-type:\s*/.source + pattern + /(?:(?:\r\n?|\n)[\w-].*)*(?:\r(?:\n|(?!\n))|\n)/.source + ')' +
                    // This is a little interesting:
                    // The HTTP format spec required 1 empty line before the body to make everything unambiguous.
                    // However, when writing code by hand (e.g. to display on a website) people can forget about this,
                    // so we want to be liberal here. We will allow the empty line to be omitted if the first line of
                    // the body does not start with a [\w-] character (as headers do).
                    /[^ \t\w-][\s\S]*/.source,
                    'i'
                ),
                lookbehind: true,
                inside: httpLanguages[contentType]
            };
        }
    }
    if (options) {
        Prism.languages.insertBefore('http', 'header', options);
    }

}(Prism));

(function (Prism) {
    Prism.languages.ignore = {
        // https://git-scm.com/docs/gitignore
        'comment': /^#.*/m,
        'entry': {
            pattern: /\S(?:.*(?:(?:\\ )|\S))?/,
            alias: 'string',
            inside: {
                'operator': /^!|\*\*?|\?/,
                'regex': {
                    pattern: /(^|[^\\])\[[^\[\]]*\]/,
                    lookbehind: true
                },
                'punctuation': /\//
            }
        }
    };

    Prism.languages.gitignore = Prism.languages.ignore;
    Prism.languages.hgignore = Prism.languages.ignore;
    Prism.languages.npmignore = Prism.languages.ignore;

}(Prism));

Prism.languages.ini = {

    /**
     * The component mimics the behavior of the Win32 API parser.
     *
     * @see {@link https://github.com/PrismJS/prism/issues/2775#issuecomment-787477723}
     */

    'comment': {
        pattern: /(^[ \f\t\v]*)[#;][^\n\r]*/m,
        lookbehind: true
    },
    'section': {
        pattern: /(^[ \f\t\v]*)\[[^\n\r\]]*\]?/m,
        lookbehind: true,
        inside: {
            'section-name': {
                pattern: /(^\[[ \f\t\v]*)[^ \f\t\v\]]+(?:[ \f\t\v]+[^ \f\t\v\]]+)*/,
                lookbehind: true,
                alias: 'selector'
            },
            'punctuation': /\[|\]/
        }
    },
    'key': {
        pattern: /(^[ \f\t\v]*)[^ \f\n\r\t\v=]+(?:[ \f\t\v]+[^ \f\n\r\t\v=]+)*(?=[ \f\t\v]*=)/m,
        lookbehind: true,
        alias: 'attr-name'
    },
    'value': {
        pattern: /(=[ \f\t\v]*)[^ \f\n\r\t\v]+(?:[ \f\t\v]+[^ \f\n\r\t\v]+)*/,
        lookbehind: true,
        alias: 'attr-value',
        inside: {
            'inner-value': {
                pattern: /^("|').+(?=\1$)/,
                lookbehind: true
            }
        }
    },
    'punctuation': /=/
};

(function (Prism) {

    /**
     * Returns the placeholder for the given language id and index.
     *
     * @param {string} language
     * @param {string|number} index
     * @returns {string}
     */
    function getPlaceholder(language, index) {
        return '___' + language.toUpperCase() + index + '___';
    }

    Object.defineProperties(Prism.languages['markup-templating'] = {}, {
        buildPlaceholders: {
            /**
             * Tokenize all inline templating expressions matching `placeholderPattern`.
             *
             * If `replaceFilter` is provided, only matches of `placeholderPattern` for which `replaceFilter` returns
             * `true` will be replaced.
             *
             * @param {object} env The environment of the `before-tokenize` hook.
             * @param {string} language The language id.
             * @param {RegExp} placeholderPattern The matches of this pattern will be replaced by placeholders.
             * @param {(match: string) => boolean} [replaceFilter]
             */
            value: function (env, language, placeholderPattern, replaceFilter) {
                if (env.language !== language) {
                    return;
                }

                var tokenStack = env.tokenStack = [];

                env.code = env.code.replace(placeholderPattern, function (match) {
                    if (typeof replaceFilter === 'function' && !replaceFilter(match)) {
                        return match;
                    }
                    var i = tokenStack.length;
                    var placeholder;

                    // Check for existing strings
                    while (env.code.indexOf(placeholder = getPlaceholder(language, i)) !== -1) {
                        ++i;
                    }

                    // Create a sparse array
                    tokenStack[i] = match;

                    return placeholder;
                });

                // Switch the grammar to markup
                env.grammar = Prism.languages.markup;
            }
        },
        tokenizePlaceholders: {
            /**
             * Replace placeholders with proper tokens after tokenizing.
             *
             * @param {object} env The environment of the `after-tokenize` hook.
             * @param {string} language The language id.
             */
            value: function (env, language) {
                if (env.language !== language || !env.tokenStack) {
                    return;
                }

                // Switch the grammar back
                env.grammar = Prism.languages[language];

                var j = 0;
                var keys = Object.keys(env.tokenStack);

                function walkTokens(tokens) {
                    for (var i = 0; i < tokens.length; i++) {
                        // all placeholders are replaced already
                        if (j >= keys.length) {
                            break;
                        }

                        var token = tokens[i];
                        if (typeof token === 'string' || (token.content && typeof token.content === 'string')) {
                            var k = keys[j];
                            var t = env.tokenStack[k];
                            var s = typeof token === 'string' ? token : token.content;
                            var placeholder = getPlaceholder(language, k);

                            var index = s.indexOf(placeholder);
                            if (index > -1) {
                                ++j;

                                var before = s.substring(0, index);
                                var middle = new Prism.Token(language, Prism.tokenize(t, env.grammar), 'language-' + language, t);
                                var after = s.substring(index + placeholder.length);

                                var replacement = [];
                                if (before) {
                                    replacement.push.apply(replacement, walkTokens([before]));
                                }
                                replacement.push(middle);
                                if (after) {
                                    replacement.push.apply(replacement, walkTokens([after]));
                                }

                                if (typeof token === 'string') {
                                    tokens.splice.apply(tokens, [i, 1].concat(replacement));
                                } else {
                                    token.content = replacement;
                                }
                            }
                        } else if (token.content /* && typeof token.content !== 'string' */ ) {
                            walkTokens(token.content);
                        }
                    }

                    return tokens;
                }

                walkTokens(env.tokens);
            }
        }
    });

}(Prism));

/**
 * Original by Aaron Harun: http://aahacreative.com/2012/07/31/php-syntax-highlighting-prism/
 * Modified by Miles Johnson: http://milesj.me
 * Rewritten by Tom Pavelec
 *
 * Supports PHP 5.3 - 8.0
 */
(function (Prism) {
    var comment = /\/\*[\s\S]*?\*\/|\/\/.*|#(?!\[).*/;
    var constant = [{
            pattern: /\b(?:false|true)\b/i,
            alias: 'boolean'
        },
        {
            pattern: /(::\s*)\b[a-z_]\w*\b(?!\s*\()/i,
            greedy: true,
            lookbehind: true,
        },
        {
            pattern: /(\b(?:case|const)\s+)\b[a-z_]\w*(?=\s*[;=])/i,
            greedy: true,
            lookbehind: true,
        },
        /\b(?:null)\b/i,
        /\b[A-Z_][A-Z0-9_]*\b(?!\s*\()/,
    ];
    var number = /\b0b[01]+(?:_[01]+)*\b|\b0o[0-7]+(?:_[0-7]+)*\b|\b0x[\da-f]+(?:_[\da-f]+)*\b|(?:\b\d+(?:_\d+)*\.?(?:\d+(?:_\d+)*)?|\B\.\d+)(?:e[+-]?\d+)?/i;
    var operator = /<?=>|\?\?=?|\.{3}|\??->|[!=]=?=?|::|\*\*=?|--|\+\+|&&|\|\||<<|>>|[?~]|[/^|%*&<>.+-]=?/;
    var punctuation = /[{}\[\](),:;]/;

    Prism.languages.php = {
        'delimiter': {
            pattern: /\?>$|^<\?(?:php(?=\s)|=)?/i,
            alias: 'important'
        },
        'comment': comment,
        'variable': /\$+(?:\w+\b|(?=\{))/,
        'package': {
            pattern: /(namespace\s+|use\s+(?:function\s+)?)(?:\\?\b[a-z_]\w*)+\b(?!\\)/i,
            lookbehind: true,
            inside: {
                'punctuation': /\\/
            }
        },
        'class-name-definition': {
            pattern: /(\b(?:class|enum|interface|trait)\s+)\b[a-z_]\w*(?!\\)\b/i,
            lookbehind: true,
            alias: 'class-name'
        },
        'function-definition': {
            pattern: /(\bfunction\s+)[a-z_]\w*(?=\s*\()/i,
            lookbehind: true,
            alias: 'function'
        },
        'keyword': [{
                pattern: /(\(\s*)\b(?:array|bool|boolean|float|int|integer|object|string)\b(?=\s*\))/i,
                alias: 'type-casting',
                greedy: true,
                lookbehind: true
            },
            {
                pattern: /([(,?]\s*)\b(?:array(?!\s*\()|bool|callable|(?:false|null)(?=\s*\|)|float|int|iterable|mixed|object|self|static|string)\b(?=\s*\$)/i,
                alias: 'type-hint',
                greedy: true,
                lookbehind: true
            },
            {
                pattern: /(\)\s*:\s*(?:\?\s*)?)\b(?:array(?!\s*\()|bool|callable|(?:false|null)(?=\s*\|)|float|int|iterable|mixed|never|object|self|static|string|void)\b/i,
                alias: 'return-type',
                greedy: true,
                lookbehind: true
            },
            {
                pattern: /\b(?:array(?!\s*\()|bool|float|int|iterable|mixed|object|string|void)\b/i,
                alias: 'type-declaration',
                greedy: true
            },
            {
                pattern: /(\|\s*)(?:false|null)\b|\b(?:false|null)(?=\s*\|)/i,
                alias: 'type-declaration',
                greedy: true,
                lookbehind: true
            },
            {
                pattern: /\b(?:parent|self|static)(?=\s*::)/i,
                alias: 'static-context',
                greedy: true
            },
            {
                // yield from
                pattern: /(\byield\s+)from\b/i,
                lookbehind: true
            },
            // `class` is always a keyword unlike other keywords
            /\bclass\b/i,
            {
                // https://www.php.net/manual/en/reserved.keywords.php
                //
                // keywords cannot be preceded by "->"
                // the complex lookbehind means `(?<!(?:->|::)\s*)`
                pattern: /((?:^|[^\s>:]|(?:^|[^-])>|(?:^|[^:]):)\s*)\b(?:abstract|and|array|as|break|callable|case|catch|clone|const|continue|declare|default|die|do|echo|else|elseif|empty|enddeclare|endfor|endforeach|endif|endswitch|endwhile|enum|eval|exit|extends|final|finally|fn|for|foreach|function|global|goto|if|implements|include|include_once|instanceof|insteadof|interface|isset|list|match|namespace|never|new|or|parent|print|private|protected|public|readonly|require|require_once|return|self|static|switch|throw|trait|try|unset|use|var|while|xor|yield|__halt_compiler)\b/i,
                lookbehind: true
            }
        ],
        'argument-name': {
            pattern: /([(,]\s*)\b[a-z_]\w*(?=\s*:(?!:))/i,
            lookbehind: true
        },
        'class-name': [{
                pattern: /(\b(?:extends|implements|instanceof|new(?!\s+self|\s+static))\s+|\bcatch\s*\()\b[a-z_]\w*(?!\\)\b/i,
                greedy: true,
                lookbehind: true
            },
            {
                pattern: /(\|\s*)\b[a-z_]\w*(?!\\)\b/i,
                greedy: true,
                lookbehind: true
            },
            {
                pattern: /\b[a-z_]\w*(?!\\)\b(?=\s*\|)/i,
                greedy: true
            },
            {
                pattern: /(\|\s*)(?:\\?\b[a-z_]\w*)+\b/i,
                alias: 'class-name-fully-qualified',
                greedy: true,
                lookbehind: true,
                inside: {
                    'punctuation': /\\/
                }
            },
            {
                pattern: /(?:\\?\b[a-z_]\w*)+\b(?=\s*\|)/i,
                alias: 'class-name-fully-qualified',
                greedy: true,
                inside: {
                    'punctuation': /\\/
                }
            },
            {
                pattern: /(\b(?:extends|implements|instanceof|new(?!\s+self\b|\s+static\b))\s+|\bcatch\s*\()(?:\\?\b[a-z_]\w*)+\b(?!\\)/i,
                alias: 'class-name-fully-qualified',
                greedy: true,
                lookbehind: true,
                inside: {
                    'punctuation': /\\/
                }
            },
            {
                pattern: /\b[a-z_]\w*(?=\s*\$)/i,
                alias: 'type-declaration',
                greedy: true
            },
            {
                pattern: /(?:\\?\b[a-z_]\w*)+(?=\s*\$)/i,
                alias: ['class-name-fully-qualified', 'type-declaration'],
                greedy: true,
                inside: {
                    'punctuation': /\\/
                }
            },
            {
                pattern: /\b[a-z_]\w*(?=\s*::)/i,
                alias: 'static-context',
                greedy: true
            },
            {
                pattern: /(?:\\?\b[a-z_]\w*)+(?=\s*::)/i,
                alias: ['class-name-fully-qualified', 'static-context'],
                greedy: true,
                inside: {
                    'punctuation': /\\/
                }
            },
            {
                pattern: /([(,?]\s*)[a-z_]\w*(?=\s*\$)/i,
                alias: 'type-hint',
                greedy: true,
                lookbehind: true
            },
            {
                pattern: /([(,?]\s*)(?:\\?\b[a-z_]\w*)+(?=\s*\$)/i,
                alias: ['class-name-fully-qualified', 'type-hint'],
                greedy: true,
                lookbehind: true,
                inside: {
                    'punctuation': /\\/
                }
            },
            {
                pattern: /(\)\s*:\s*(?:\?\s*)?)\b[a-z_]\w*(?!\\)\b/i,
                alias: 'return-type',
                greedy: true,
                lookbehind: true
            },
            {
                pattern: /(\)\s*:\s*(?:\?\s*)?)(?:\\?\b[a-z_]\w*)+\b(?!\\)/i,
                alias: ['class-name-fully-qualified', 'return-type'],
                greedy: true,
                lookbehind: true,
                inside: {
                    'punctuation': /\\/
                }
            }
        ],
        'constant': constant,
        'function': {
            pattern: /(^|[^\\\w])\\?[a-z_](?:[\w\\]*\w)?(?=\s*\()/i,
            lookbehind: true,
            inside: {
                'punctuation': /\\/
            }
        },
        'property': {
            pattern: /(->\s*)\w+/,
            lookbehind: true
        },
        'number': number,
        'operator': operator,
        'punctuation': punctuation
    };

    var string_interpolation = {
        pattern: /\{\$(?:\{(?:\{[^{}]+\}|[^{}]+)\}|[^{}])+\}|(^|[^\\{])\$+(?:\w+(?:\[[^\r\n\[\]]+\]|->\w+)?)/,
        lookbehind: true,
        inside: Prism.languages.php
    };

    var string = [{
            pattern: /<<<'([^']+)'[\r\n](?:.*[\r\n])*?\1;/,
            alias: 'nowdoc-string',
            greedy: true,
            inside: {
                'delimiter': {
                    pattern: /^<<<'[^']+'|[a-z_]\w*;$/i,
                    alias: 'symbol',
                    inside: {
                        'punctuation': /^<<<'?|[';]$/
                    }
                }
            }
        },
        {
            pattern: /<<<(?:"([^"]+)"[\r\n](?:.*[\r\n])*?\1;|([a-z_]\w*)[\r\n](?:.*[\r\n])*?\2;)/i,
            alias: 'heredoc-string',
            greedy: true,
            inside: {
                'delimiter': {
                    pattern: /^<<<(?:"[^"]+"|[a-z_]\w*)|[a-z_]\w*;$/i,
                    alias: 'symbol',
                    inside: {
                        'punctuation': /^<<<"?|[";]$/
                    }
                },
                'interpolation': string_interpolation
            }
        },
        {
            pattern: /`(?:\\[\s\S]|[^\\`])*`/,
            alias: 'backtick-quoted-string',
            greedy: true
        },
        {
            pattern: /'(?:\\[\s\S]|[^\\'])*'/,
            alias: 'single-quoted-string',
            greedy: true
        },
        {
            pattern: /"(?:\\[\s\S]|[^\\"])*"/,
            alias: 'double-quoted-string',
            greedy: true,
            inside: {
                'interpolation': string_interpolation
            }
        }
    ];

    Prism.languages.insertBefore('php', 'variable', {
        'string': string,
        'attribute': {
            pattern: /#\[(?:[^"'\/#]|\/(?![*/])|\/\/.*$|#(?!\[).*$|\/\*(?:[^*]|\*(?!\/))*\*\/|"(?:\\[\s\S]|[^\\"])*"|'(?:\\[\s\S]|[^\\'])*')+\](?=\s*[a-z$#])/im,
            greedy: true,
            inside: {
                'attribute-content': {
                    pattern: /^(#\[)[\s\S]+(?=\]$)/,
                    lookbehind: true,
                    // inside can appear subset of php
                    inside: {
                        'comment': comment,
                        'string': string,
                        'attribute-class-name': [{
                                pattern: /([^:]|^)\b[a-z_]\w*(?!\\)\b/i,
                                alias: 'class-name',
                                greedy: true,
                                lookbehind: true
                            },
                            {
                                pattern: /([^:]|^)(?:\\?\b[a-z_]\w*)+/i,
                                alias: [
                                    'class-name',
                                    'class-name-fully-qualified'
                                ],
                                greedy: true,
                                lookbehind: true,
                                inside: {
                                    'punctuation': /\\/
                                }
                            }
                        ],
                        'constant': constant,
                        'number': number,
                        'operator': operator,
                        'punctuation': punctuation
                    }
                },
                'delimiter': {
                    pattern: /^#\[|\]$/,
                    alias: 'punctuation'
                }
            }
        },
    });

    Prism.hooks.add('before-tokenize', function (env) {
        if (!/<\?/.test(env.code)) {
            return;
        }

        var phpPattern = /<\?(?:[^"'/#]|\/(?![*/])|("|')(?:\\[\s\S]|(?!\1)[^\\])*\1|(?:\/\/|#(?!\[))(?:[^?\n\r]|\?(?!>))*(?=$|\?>|[\r\n])|#\[|\/\*(?:[^*]|\*(?!\/))*(?:\*\/|$))*?(?:\?>|$)/g;
        Prism.languages['markup-templating'].buildPlaceholders(env, 'php', phpPattern);
    });

    Prism.hooks.add('after-tokenize', function (env) {
        Prism.languages['markup-templating'].tokenizePlaceholders(env, 'php');
    });

}(Prism));

(function (Prism) {

    var javaDocLike = Prism.languages.javadoclike = {
        'parameter': {
            pattern: /(^[\t ]*(?:\/{3}|\*|\/\*\*)\s*@(?:arg|arguments|param)\s+)\w+/m,
            lookbehind: true
        },
        'keyword': {
            // keywords are the first word in a line preceded be an `@` or surrounded by curly braces.
            // @word, {@word}
            pattern: /(^[\t ]*(?:\/{3}|\*|\/\*\*)\s*|\{)@[a-z][a-zA-Z-]+\b/m,
            lookbehind: true
        },
        'punctuation': /[{}]/
    };


    /**
     * Adds doc comment support to the given language and calls a given callback on each doc comment pattern.
     *
     * @param {string} lang the language add doc comment support to.
     * @param {(pattern: {inside: {rest: undefined}}) => void} callback the function called with each doc comment pattern as argument.
     */
    function docCommentSupport(lang, callback) {
        var tokenName = 'doc-comment';

        var grammar = Prism.languages[lang];
        if (!grammar) {
            return;
        }
        var token = grammar[tokenName];

        if (!token) {
            // add doc comment: /** */
            var definition = {};
            definition[tokenName] = {
                pattern: /(^|[^\\])\/\*\*[^/][\s\S]*?(?:\*\/|$)/,
                lookbehind: true,
                alias: 'comment'
            };

            grammar = Prism.languages.insertBefore(lang, 'comment', definition);
            token = grammar[tokenName];
        }

        if (token instanceof RegExp) { // convert regex to object
            token = grammar[tokenName] = {
                pattern: token
            };
        }

        if (Array.isArray(token)) {
            for (var i = 0, l = token.length; i < l; i++) {
                if (token[i] instanceof RegExp) {
                    token[i] = {
                        pattern: token[i]
                    };
                }
                callback(token[i]);
            }
        } else {
            callback(token);
        }
    }

    /**
     * Adds doc-comment support to the given languages for the given documentation language.
     *
     * @param {string[]|string} languages
     * @param {Object} docLanguage
     */
    function addSupport(languages, docLanguage) {
        if (typeof languages === 'string') {
            languages = [languages];
        }

        languages.forEach(function (lang) {
            docCommentSupport(lang, function (pattern) {
                if (!pattern.inside) {
                    pattern.inside = {};
                }
                pattern.inside.rest = docLanguage;
            });
        });
    }

    Object.defineProperty(javaDocLike, 'addSupport', {
        value: addSupport
    });

    javaDocLike.addSupport(['java', 'javascript', 'php'], javaDocLike);

}(Prism));

(function (Prism) {

    Prism.languages.typescript = Prism.languages.extend('javascript', {
        'class-name': {
            pattern: /(\b(?:class|extends|implements|instanceof|interface|new|type)\s+)(?!keyof\b)(?!\s)[_$a-zA-Z\xA0-\uFFFF](?:(?!\s)[$\w\xA0-\uFFFF])*(?:\s*<(?:[^<>]|<(?:[^<>]|<[^<>]*>)*>)*>)?/,
            lookbehind: true,
            greedy: true,
            inside: null // see below
        },
        'builtin': /\b(?:Array|Function|Promise|any|boolean|console|never|number|string|symbol|unknown)\b/,
    });

    // The keywords TypeScript adds to JavaScript
    Prism.languages.typescript.keyword.push(
        /\b(?:abstract|declare|is|keyof|readonly|require)\b/,
        // keywords that have to be followed by an identifier
        /\b(?:asserts|infer|interface|module|namespace|type)\b(?=\s*(?:[{_$a-zA-Z\xA0-\uFFFF]|$))/,
        // This is for `import type *, {}`
        /\btype\b(?=\s*(?:[\{*]|$))/
    );

    // doesn't work with TS because TS is too complex
    delete Prism.languages.typescript['parameter'];
    delete Prism.languages.typescript['literal-property'];

    // a version of typescript specifically for highlighting types
    var typeInside = Prism.languages.extend('typescript', {});
    delete typeInside['class-name'];

    Prism.languages.typescript['class-name'].inside = typeInside;

    Prism.languages.insertBefore('typescript', 'function', {
        'decorator': {
            pattern: /@[$\w\xA0-\uFFFF]+/,
            inside: {
                'at': {
                    pattern: /^@/,
                    alias: 'operator'
                },
                'function': /^[\s\S]+/
            }
        },
        'generic-function': {
            // e.g. foo<T extends "bar" | "baz">( ...
            pattern: /#?(?!\s)[_$a-zA-Z\xA0-\uFFFF](?:(?!\s)[$\w\xA0-\uFFFF])*\s*<(?:[^<>]|<(?:[^<>]|<[^<>]*>)*>)*>(?=\s*\()/,
            greedy: true,
            inside: {
                'function': /^#?(?!\s)[_$a-zA-Z\xA0-\uFFFF](?:(?!\s)[$\w\xA0-\uFFFF])*/,
                'generic': {
                    pattern: /<[\s\S]+/, // everything after the first <
                    alias: 'class-name',
                    inside: typeInside
                }
            }
        }
    });

    Prism.languages.ts = Prism.languages.typescript;

}(Prism));

(function (Prism) {

    var javascript = Prism.languages.javascript;

    var type = /\{(?:[^{}]|\{(?:[^{}]|\{[^{}]*\})*\})+\}/.source;
    var parameterPrefix = '(@(?:arg|argument|param|property)\\s+(?:' + type + '\\s+)?)';

    Prism.languages.jsdoc = Prism.languages.extend('javadoclike', {
        'parameter': {
            // @param {string} foo - foo bar
            pattern: RegExp(parameterPrefix + /(?:(?!\s)[$\w\xA0-\uFFFF.])+(?=\s|$)/.source),
            lookbehind: true,
            inside: {
                'punctuation': /\./
            }
        }
    });

    Prism.languages.insertBefore('jsdoc', 'keyword', {
        'optional-parameter': {
            // @param {string} [baz.foo="bar"] foo bar
            pattern: RegExp(parameterPrefix + /\[(?:(?!\s)[$\w\xA0-\uFFFF.])+(?:=[^[\]]+)?\](?=\s|$)/.source),
            lookbehind: true,
            inside: {
                'parameter': {
                    pattern: /(^\[)[$\w\xA0-\uFFFF\.]+/,
                    lookbehind: true,
                    inside: {
                        'punctuation': /\./
                    }
                },
                'code': {
                    pattern: /(=)[\s\S]*(?=\]$)/,
                    lookbehind: true,
                    inside: javascript,
                    alias: 'language-javascript'
                },
                'punctuation': /[=[\]]/
            }
        },
        'class-name': [{
                pattern: RegExp(/(@(?:augments|class|extends|interface|memberof!?|template|this|typedef)\s+(?:<TYPE>\s+)?)[A-Z]\w*(?:\.[A-Z]\w*)*/.source.replace(/<TYPE>/g, function () {
                    return type;
                })),
                lookbehind: true,
                inside: {
                    'punctuation': /\./
                }
            },
            {
                pattern: RegExp('(@[a-z]+\\s+)' + type),
                lookbehind: true,
                inside: {
                    'string': javascript.string,
                    'number': javascript.number,
                    'boolean': javascript.boolean,
                    'keyword': Prism.languages.typescript.keyword,
                    'operator': /=>|\.\.\.|[&|?:*]/,
                    'punctuation': /[.,;=<>{}()[\]]/
                }
            }
        ],
        'example': {
            pattern: /(@example\s+(?!\s))(?:[^@\s]|\s+(?!\s))+?(?=\s*(?:\*\s*)?(?:@\w|\*\/))/,
            lookbehind: true,
            inside: {
                'code': {
                    pattern: /^([\t ]*(?:\*\s*)?)\S.*$/m,
                    lookbehind: true,
                    inside: javascript,
                    alias: 'language-javascript'
                }
            }
        }
    });

    Prism.languages.javadoclike.addSupport('javascript', Prism.languages.jsdoc);

}(Prism));

(function (Prism) {

    Prism.languages.insertBefore('javascript', 'function-variable', {
        'method-variable': {
            pattern: RegExp('(\\.\\s*)' + Prism.languages.javascript['function-variable'].pattern.source),
            lookbehind: true,
            alias: ['function-variable', 'method', 'function', 'property-access']
        }
    });

    Prism.languages.insertBefore('javascript', 'function', {
        'method': {
            pattern: RegExp('(\\.\\s*)' + Prism.languages.javascript['function'].source),
            lookbehind: true,
            alias: ['function', 'property-access']
        }
    });

    Prism.languages.insertBefore('javascript', 'constant', {
        'known-class-name': [{
                // standard built-ins
                // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects
                pattern: /\b(?:(?:Float(?:32|64)|(?:Int|Uint)(?:8|16|32)|Uint8Clamped)?Array|ArrayBuffer|BigInt|Boolean|DataView|Date|Error|Function|Intl|JSON|(?:Weak)?(?:Map|Set)|Math|Number|Object|Promise|Proxy|Reflect|RegExp|String|Symbol|WebAssembly)\b/,
                alias: 'class-name'
            },
            {
                // errors
                pattern: /\b(?:[A-Z]\w*)Error\b/,
                alias: 'class-name'
            }
        ]
    });

    /**
     * Replaces the `<ID>` placeholder in the given pattern with a pattern for general JS identifiers.
     *
     * @param {string} source
     * @param {string} [flags]
     * @returns {RegExp}
     */
    function withId(source, flags) {
        return RegExp(
            source.replace(/<ID>/g, function () {
                return /(?!\s)[_$a-zA-Z\xA0-\uFFFF](?:(?!\s)[$\w\xA0-\uFFFF])*/.source;
            }),
            flags);
    }
    Prism.languages.insertBefore('javascript', 'keyword', {
        'imports': {
            // https://tc39.es/ecma262/#sec-imports
            pattern: withId(/(\bimport\b\s*)(?:<ID>(?:\s*,\s*(?:\*\s*as\s+<ID>|\{[^{}]*\}))?|\*\s*as\s+<ID>|\{[^{}]*\})(?=\s*\bfrom\b)/.source),
            lookbehind: true,
            inside: Prism.languages.javascript
        },
        'exports': {
            // https://tc39.es/ecma262/#sec-exports
            pattern: withId(/(\bexport\b\s*)(?:\*(?:\s*as\s+<ID>)?(?=\s*\bfrom\b)|\{[^{}]*\})/.source),
            lookbehind: true,
            inside: Prism.languages.javascript
        }
    });

    Prism.languages.javascript['keyword'].unshift({
        pattern: /\b(?:as|default|export|from|import)\b/,
        alias: 'module'
    }, {
        pattern: /\b(?:await|break|catch|continue|do|else|finally|for|if|return|switch|throw|try|while|yield)\b/,
        alias: 'control-flow'
    }, {
        pattern: /\bnull\b/,
        alias: ['null', 'nil']
    }, {
        pattern: /\bundefined\b/,
        alias: 'nil'
    });

    Prism.languages.insertBefore('javascript', 'operator', {
        'spread': {
            pattern: /\.{3}/,
            alias: 'operator'
        },
        'arrow': {
            pattern: /=>/,
            alias: 'operator'
        }
    });

    Prism.languages.insertBefore('javascript', 'punctuation', {
        'property-access': {
            pattern: withId(/(\.\s*)#?<ID>/.source),
            lookbehind: true
        },
        'maybe-class-name': {
            pattern: /(^|[^$\w\xA0-\uFFFF])[A-Z][$\w\xA0-\uFFFF]+/,
            lookbehind: true
        },
        'dom': {
            // this contains only a few commonly used DOM variables
            pattern: /\b(?:document|(?:local|session)Storage|location|navigator|performance|window)\b/,
            alias: 'variable'
        },
        'console': {
            pattern: /\bconsole(?=\s*\.)/,
            alias: 'class-name'
        }
    });


    // add 'maybe-class-name' to tokens which might be a class name
    var maybeClassNameTokens = ['function', 'function-variable', 'method', 'method-variable', 'property-access'];

    for (var i = 0; i < maybeClassNameTokens.length; i++) {
        var token = maybeClassNameTokens[i];
        var value = Prism.languages.javascript[token];

        // convert regex to object
        if (Prism.util.type(value) === 'RegExp') {
            value = Prism.languages.javascript[token] = {
                pattern: value
            };
        }

        // keep in mind that we don't support arrays

        var inside = value.inside || {};
        value.inside = inside;

        inside['maybe-class-name'] = /^[A-Z][\s\S]*/;
    }

}(Prism));

// https://www.json.org/json-en.html
Prism.languages.json = {
    'property': {
        pattern: /(^|[^\\])"(?:\\.|[^\\"\r\n])*"(?=\s*:)/,
        lookbehind: true,
        greedy: true
    },
    'string': {
        pattern: /(^|[^\\])"(?:\\.|[^\\"\r\n])*"(?!\s*:)/,
        lookbehind: true,
        greedy: true
    },
    'comment': {
        pattern: /\/\/.*|\/\*[\s\S]*?(?:\*\/|$)/,
        greedy: true
    },
    'number': /-?\b\d+(?:\.\d+)?(?:e[+-]?\d+)?\b/i,
    'punctuation': /[{}[\],]/,
    'operator': /:/,
    'boolean': /\b(?:false|true)\b/,
    'null': {
        pattern: /\bnull\b/,
        alias: 'keyword'
    }
};

Prism.languages.webmanifest = Prism.languages.json;

(function (Prism) {

    var string = /("|')(?:\\(?:\r\n?|\n|.)|(?!\1)[^\\\r\n])*\1/;

    Prism.languages.json5 = Prism.languages.extend('json', {
        'property': [{
                pattern: RegExp(string.source + '(?=\\s*:)'),
                greedy: true
            },
            {
                pattern: /(?!\s)[_$a-zA-Z\xA0-\uFFFF](?:(?!\s)[$\w\xA0-\uFFFF])*(?=\s*:)/,
                alias: 'unquoted'
            }
        ],
        'string': {
            pattern: string,
            greedy: true
        },
        'number': /[+-]?\b(?:NaN|Infinity|0x[a-fA-F\d]+)\b|[+-]?(?:\b\d+(?:\.\d*)?|\B\.\d+)(?:[eE][+-]?\d+\b)?/
    });

}(Prism));

/* FIXME :
 :extend() is not handled specifically : its highlighting is buggy.
 Mixin usage must be inside a ruleset to be highlighted.
 At-rules (e.g. import) containing interpolations are buggy.
 Detached rulesets are highlighted as at-rules.
 A comment before a mixin usage prevents the latter to be properly highlighted.
 */

Prism.languages.less = Prism.languages.extend('css', {
    'comment': [
        /\/\*[\s\S]*?\*\//,
        {
            pattern: /(^|[^\\])\/\/.*/,
            lookbehind: true
        }
    ],
    'atrule': {
        pattern: /@[\w-](?:\((?:[^(){}]|\([^(){}]*\))*\)|[^(){};\s]|\s+(?!\s))*?(?=\s*\{)/,
        inside: {
            'punctuation': /[:()]/
        }
    },
    // selectors and mixins are considered the same
    'selector': {
        pattern: /(?:@\{[\w-]+\}|[^{};\s@])(?:@\{[\w-]+\}|\((?:[^(){}]|\([^(){}]*\))*\)|[^(){};@\s]|\s+(?!\s))*?(?=\s*\{)/,
        inside: {
            // mixin parameters
            'variable': /@+[\w-]+/
        }
    },

    'property': /(?:@\{[\w-]+\}|[\w-])+(?:\+_?)?(?=\s*:)/,
    'operator': /[+\-*\/]/
});

Prism.languages.insertBefore('less', 'property', {
    'variable': [
        // Variable declaration (the colon must be consumed!)
        {
            pattern: /@[\w-]+\s*:/,
            inside: {
                'punctuation': /:/
            }
        },

        // Variable usage
        /@@?[\w-]+/
    ],
    'mixin-usage': {
        pattern: /([{;]\s*)[.#](?!\d)[\w-].*?(?=[(;])/,
        lookbehind: true,
        alias: 'function'
    }
});

(function (Prism) {

    // Allow only one line break
    var inner = /(?:\\.|[^\\\n\r]|(?:\n|\r\n?)(?![\r\n]))/.source;

    /**
     * This function is intended for the creation of the bold or italic pattern.
     *
     * This also adds a lookbehind group to the given pattern to ensure that the pattern is not backslash-escaped.
     *
     * _Note:_ Keep in mind that this adds a capturing group.
     *
     * @param {string} pattern
     * @returns {RegExp}
     */
    function createInline(pattern) {
        pattern = pattern.replace(/<inner>/g, function () {
            return inner;
        });
        return RegExp(/((?:^|[^\\])(?:\\{2})*)/.source + '(?:' + pattern + ')');
    }


    var tableCell = /(?:\\.|``(?:[^`\r\n]|`(?!`))+``|`[^`\r\n]+`|[^\\|\r\n`])+/.source;
    var tableRow = /\|?__(?:\|__)+\|?(?:(?:\n|\r\n?)|(?![\s\S]))/.source.replace(/__/g, function () {
        return tableCell;
    });
    var tableLine = /\|?[ \t]*:?-{3,}:?[ \t]*(?:\|[ \t]*:?-{3,}:?[ \t]*)+\|?(?:\n|\r\n?)/.source;


    Prism.languages.markdown = Prism.languages.extend('markup', {});
    Prism.languages.insertBefore('markdown', 'prolog', {
        'front-matter-block': {
            pattern: /(^(?:\s*[\r\n])?)---(?!.)[\s\S]*?[\r\n]---(?!.)/,
            lookbehind: true,
            greedy: true,
            inside: {
                'punctuation': /^---|---$/,
                'front-matter': {
                    pattern: /\S+(?:\s+\S+)*/,
                    alias: ['yaml', 'language-yaml'],
                    inside: Prism.languages.yaml
                }
            }
        },
        'blockquote': {
            // > ...
            pattern: /^>(?:[\t ]*>)*/m,
            alias: 'punctuation'
        },
        'table': {
            pattern: RegExp('^' + tableRow + tableLine + '(?:' + tableRow + ')*', 'm'),
            inside: {
                'table-data-rows': {
                    pattern: RegExp('^(' + tableRow + tableLine + ')(?:' + tableRow + ')*$'),
                    lookbehind: true,
                    inside: {
                        'table-data': {
                            pattern: RegExp(tableCell),
                            inside: Prism.languages.markdown
                        },
                        'punctuation': /\|/
                    }
                },
                'table-line': {
                    pattern: RegExp('^(' + tableRow + ')' + tableLine + '$'),
                    lookbehind: true,
                    inside: {
                        'punctuation': /\||:?-{3,}:?/
                    }
                },
                'table-header-row': {
                    pattern: RegExp('^' + tableRow + '$'),
                    inside: {
                        'table-header': {
                            pattern: RegExp(tableCell),
                            alias: 'important',
                            inside: Prism.languages.markdown
                        },
                        'punctuation': /\|/
                    }
                }
            }
        },
        'code': [{
                // Prefixed by 4 spaces or 1 tab and preceded by an empty line
                pattern: /((?:^|\n)[ \t]*\n|(?:^|\r\n?)[ \t]*\r\n?)(?: {4}|\t).+(?:(?:\n|\r\n?)(?: {4}|\t).+)*/,
                lookbehind: true,
                alias: 'keyword'
            },
            {
                // ```optional language
                // code block
                // ```
                pattern: /^```[\s\S]*?^```$/m,
                greedy: true,
                inside: {
                    'code-block': {
                        pattern: /^(```.*(?:\n|\r\n?))[\s\S]+?(?=(?:\n|\r\n?)^```$)/m,
                        lookbehind: true
                    },
                    'code-language': {
                        pattern: /^(```).+/,
                        lookbehind: true
                    },
                    'punctuation': /```/
                }
            }
        ],
        'title': [{
                // title 1
                // =======

                // title 2
                // -------
                pattern: /\S.*(?:\n|\r\n?)(?:==+|--+)(?=[ \t]*$)/m,
                alias: 'important',
                inside: {
                    punctuation: /==+$|--+$/
                }
            },
            {
                // # title 1
                // ###### title 6
                pattern: /(^\s*)#.+/m,
                lookbehind: true,
                alias: 'important',
                inside: {
                    punctuation: /^#+|#+$/
                }
            }
        ],
        'hr': {
            // ***
            // ---
            // * * *
            // -----------
            pattern: /(^\s*)([*-])(?:[\t ]*\2){2,}(?=\s*$)/m,
            lookbehind: true,
            alias: 'punctuation'
        },
        'list': {
            // * item
            // + item
            // - item
            // 1. item
            pattern: /(^\s*)(?:[*+-]|\d+\.)(?=[\t ].)/m,
            lookbehind: true,
            alias: 'punctuation'
        },
        'url-reference': {
            // [id]: http://example.com "Optional title"
            // [id]: http://example.com 'Optional title'
            // [id]: http://example.com (Optional title)
            // [id]: <http://example.com> "Optional title"
            pattern: /!?\[[^\]]+\]:[\t ]+(?:\S+|<(?:\\.|[^>\\])+>)(?:[\t ]+(?:"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'|\((?:\\.|[^)\\])*\)))?/,
            inside: {
                'variable': {
                    pattern: /^(!?\[)[^\]]+/,
                    lookbehind: true
                },
                'string': /(?:"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'|\((?:\\.|[^)\\])*\))$/,
                'punctuation': /^[\[\]!:]|[<>]/
            },
            alias: 'url'
        },
        'bold': {
            // **strong**
            // __strong__

            // allow one nested instance of italic text using the same delimiter
            pattern: createInline(/\b__(?:(?!_)<inner>|_(?:(?!_)<inner>)+_)+__\b|\*\*(?:(?!\*)<inner>|\*(?:(?!\*)<inner>)+\*)+\*\*/.source),
            lookbehind: true,
            greedy: true,
            inside: {
                'content': {
                    pattern: /(^..)[\s\S]+(?=..$)/,
                    lookbehind: true,
                    inside: {} // see below
                },
                'punctuation': /\*\*|__/
            }
        },
        'italic': {
            // *em*
            // _em_

            // allow one nested instance of bold text using the same delimiter
            pattern: createInline(/\b_(?:(?!_)<inner>|__(?:(?!_)<inner>)+__)+_\b|\*(?:(?!\*)<inner>|\*\*(?:(?!\*)<inner>)+\*\*)+\*/.source),
            lookbehind: true,
            greedy: true,
            inside: {
                'content': {
                    pattern: /(^.)[\s\S]+(?=.$)/,
                    lookbehind: true,
                    inside: {} // see below
                },
                'punctuation': /[*_]/
            }
        },
        'strike': {
            // ~~strike through~~
            // ~strike~
            // eslint-disable-next-line regexp/strict
            pattern: createInline(/(~~?)(?:(?!~)<inner>)+\2/.source),
            lookbehind: true,
            greedy: true,
            inside: {
                'content': {
                    pattern: /(^~~?)[\s\S]+(?=\1$)/,
                    lookbehind: true,
                    inside: {} // see below
                },
                'punctuation': /~~?/
            }
        },
        'code-snippet': {
            // `code`
            // ``code``
            pattern: /(^|[^\\`])(?:``[^`\r\n]+(?:`[^`\r\n]+)*``(?!`)|`[^`\r\n]+`(?!`))/,
            lookbehind: true,
            greedy: true,
            alias: ['code', 'keyword']
        },
        'url': {
            // [example](http://example.com "Optional title")
            // [example][id]
            // [example] [id]
            pattern: createInline(/!?\[(?:(?!\])<inner>)+\](?:\([^\s)]+(?:[\t ]+"(?:\\.|[^"\\])*")?\)|[ \t]?\[(?:(?!\])<inner>)+\])/.source),
            lookbehind: true,
            greedy: true,
            inside: {
                'operator': /^!/,
                'content': {
                    pattern: /(^\[)[^\]]+(?=\])/,
                    lookbehind: true,
                    inside: {} // see below
                },
                'variable': {
                    pattern: /(^\][ \t]?\[)[^\]]+(?=\]$)/,
                    lookbehind: true
                },
                'url': {
                    pattern: /(^\]\()[^\s)]+/,
                    lookbehind: true
                },
                'string': {
                    pattern: /(^[ \t]+)"(?:\\.|[^"\\])*"(?=\)$)/,
                    lookbehind: true
                }
            }
        }
    });

    ['url', 'bold', 'italic', 'strike'].forEach(function (token) {
        ['url', 'bold', 'italic', 'strike', 'code-snippet'].forEach(function (inside) {
            if (token !== inside) {
                Prism.languages.markdown[token].inside.content.inside[inside] = Prism.languages.markdown[inside];
            }
        });
    });

    Prism.hooks.add('after-tokenize', function (env) {
        if (env.language !== 'markdown' && env.language !== 'md') {
            return;
        }

        function walkTokens(tokens) {
            if (!tokens || typeof tokens === 'string') {
                return;
            }

            for (var i = 0, l = tokens.length; i < l; i++) {
                var token = tokens[i];

                if (token.type !== 'code') {
                    walkTokens(token.content);
                    continue;
                }

                /*
                 * Add the correct `language-xxxx` class to this code block. Keep in mind that the `code-language` token
                 * is optional. But the grammar is defined so that there is only one case we have to handle:
                 *
                 * token.content = [
                 *     <span class="punctuation">```</span>,
                 *     <span class="code-language">xxxx</span>,
                 *     '\n', // exactly one new lines (\r or \n or \r\n)
                 *     <span class="code-block">...</span>,
                 *     '\n', // exactly one new lines again
                 *     <span class="punctuation">```</span>
                 * ];
                 */

                var codeLang = token.content[1];
                var codeBlock = token.content[3];

                if (codeLang && codeBlock &&
                    codeLang.type === 'code-language' && codeBlock.type === 'code-block' &&
                    typeof codeLang.content === 'string') {

                    // this might be a language that Prism does not support

                    // do some replacements to support C++, C#, and F#
                    var lang = codeLang.content.replace(/\b#/g, 'sharp').replace(/\b\+\+/g, 'pp');
                    // only use the first word
                    lang = (/[a-z][\w-]*/i.exec(lang) || [''])[0].toLowerCase();
                    var alias = 'language-' + lang;

                    // add alias
                    if (!codeBlock.alias) {
                        codeBlock.alias = [alias];
                    } else if (typeof codeBlock.alias === 'string') {
                        codeBlock.alias = [codeBlock.alias, alias];
                    } else {
                        codeBlock.alias.push(alias);
                    }
                }
            }
        }

        walkTokens(env.tokens);
    });

    Prism.hooks.add('wrap', function (env) {
        if (env.type !== 'code-block') {
            return;
        }

        var codeLang = '';
        for (var i = 0, l = env.classes.length; i < l; i++) {
            var cls = env.classes[i];
            var match = /language-(.+)/.exec(cls);
            if (match) {
                codeLang = match[1];
                break;
            }
        }

        var grammar = Prism.languages[codeLang];

        if (!grammar) {
            if (codeLang && codeLang !== 'none' && Prism.plugins.autoloader) {
                var id = 'md-' + new Date().valueOf() + '-' + Math.floor(Math.random() * 1e16);
                env.attributes['id'] = id;

                Prism.plugins.autoloader.loadLanguages(codeLang, function () {
                    var ele = document.getElementById(id);
                    if (ele) {
                        ele.innerHTML = Prism.highlight(ele.textContent, Prism.languages[codeLang], codeLang);
                    }
                });
            }
        } else {
            env.content = Prism.highlight(textContent(env.content), grammar, codeLang);
        }
    });

    var tagPattern = RegExp(Prism.languages.markup.tag.pattern.source, 'gi');

    /**
     * A list of known entity names.
     *
     * This will always be incomplete to save space. The current list is the one used by lowdash's unescape function.
     *
     * @see {@link https://github.com/lodash/lodash/blob/2da024c3b4f9947a48517639de7560457cd4ec6c/unescape.js#L2}
     */
    var KNOWN_ENTITY_NAMES = {
        'amp': '&',
        'lt': '<',
        'gt': '>',
        'quot': '"',
    };

    // IE 11 doesn't support `String.fromCodePoint`
    var fromCodePoint = String.fromCodePoint || String.fromCharCode;

    /**
     * Returns the text content of a given HTML source code string.
     *
     * @param {string} html
     * @returns {string}
     */
    function textContent(html) {
        // remove all tags
        var text = html.replace(tagPattern, '');

        // decode known entities
        text = text.replace(/&(\w{1,8}|#x?[\da-f]{1,8});/gi, function (m, code) {
            code = code.toLowerCase();

            if (code[0] === '#') {
                var value;
                if (code[1] === 'x') {
                    value = parseInt(code.slice(2), 16);
                } else {
                    value = Number(code.slice(1));
                }

                return fromCodePoint(value);
            } else {
                var known = KNOWN_ENTITY_NAMES[code];
                if (known) {
                    return known;
                }

                // unable to decode
                return m;
            }
        });

        return text;
    }

    Prism.languages.md = Prism.languages.markdown;

}(Prism));

(function (Prism) {

    var variable = /\$(?:\w[a-z\d]*(?:_[^\x00-\x1F\s"'\\()$]*)?|\{[^}\s"'\\]+\})/i;

    Prism.languages.nginx = {
        'comment': {
            pattern: /(^|[\s{};])#.*/,
            lookbehind: true,
            greedy: true
        },
        'directive': {
            pattern: /(^|\s)\w(?:[^;{}"'\\\s]|\\.|"(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*'|\s+(?:#.*(?!.)|(?![#\s])))*?(?=\s*[;{])/,
            lookbehind: true,
            greedy: true,
            inside: {
                'string': {
                    pattern: /((?:^|[^\\])(?:\\\\)*)(?:"(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*')/,
                    lookbehind: true,
                    greedy: true,
                    inside: {
                        'escape': {
                            pattern: /\\["'\\nrt]/,
                            alias: 'entity'
                        },
                        'variable': variable
                    }
                },
                'comment': {
                    pattern: /(\s)#.*/,
                    lookbehind: true,
                    greedy: true
                },
                'keyword': {
                    pattern: /^\S+/,
                    greedy: true
                },

                // other patterns

                'boolean': {
                    pattern: /(\s)(?:off|on)(?!\S)/,
                    lookbehind: true
                },
                'number': {
                    pattern: /(\s)\d+[a-z]*(?!\S)/i,
                    lookbehind: true
                },
                'variable': variable
            }
        },
        'punctuation': /[{};]/
    };

}(Prism));

(function (Prism) {

    var typeExpression = /(?:\b[a-zA-Z]\w*|[|\\[\]])+/.source;

    Prism.languages.phpdoc = Prism.languages.extend('javadoclike', {
        'parameter': {
            pattern: RegExp('(@(?:global|param|property(?:-read|-write)?|var)\\s+(?:' + typeExpression + '\\s+)?)\\$\\w+'),
            lookbehind: true
        }
    });

    Prism.languages.insertBefore('phpdoc', 'keyword', {
        'class-name': [{
            pattern: RegExp('(@(?:global|package|param|property(?:-read|-write)?|return|subpackage|throws|var)\\s+)' + typeExpression),
            lookbehind: true,
            inside: {
                'keyword': /\b(?:array|bool|boolean|callback|double|false|float|int|integer|mixed|null|object|resource|self|string|true|void)\b/,
                'punctuation': /[|\\[\]()]/
            }
        }],
    });

    Prism.languages.javadoclike.addSupport('php', Prism.languages.phpdoc);

}(Prism));

Prism.languages.insertBefore('php', 'variable', {
    'this': {
        pattern: /\$this\b/,
        alias: 'keyword'
    },
    'global': /\$(?:GLOBALS|HTTP_RAW_POST_DATA|_(?:COOKIE|ENV|FILES|GET|POST|REQUEST|SERVER|SESSION)|argc|argv|http_response_header|php_errormsg)\b/,
    'scope': {
        pattern: /\b[\w\\]+::/,
        inside: {
            'keyword': /\b(?:parent|self|static)\b/,
            'punctuation': /::|\\/
        }
    }
});

(function (Prism) {
    Prism.languages.sass = Prism.languages.extend('css', {
        // Sass comments don't need to be closed, only indented
        'comment': {
            pattern: /^([ \t]*)\/[\/*].*(?:(?:\r?\n|\r)\1[ \t].+)*/m,
            lookbehind: true,
            greedy: true
        }
    });

    Prism.languages.insertBefore('sass', 'atrule', {
        // We want to consume the whole line
        'atrule-line': {
            // Includes support for = and + shortcuts
            pattern: /^(?:[ \t]*)[@+=].+/m,
            greedy: true,
            inside: {
                'atrule': /(?:@[\w-]+|[+=])/
            }
        }
    });
    delete Prism.languages.sass.atrule;


    var variable = /\$[-\w]+|#\{\$[-\w]+\}/;
    var operator = [
        /[+*\/%]|[=!]=|<=?|>=?|\b(?:and|not|or)\b/,
        {
            pattern: /(\s)-(?=\s)/,
            lookbehind: true
        }
    ];

    Prism.languages.insertBefore('sass', 'property', {
        // We want to consume the whole line
        'variable-line': {
            pattern: /^[ \t]*\$.+/m,
            greedy: true,
            inside: {
                'punctuation': /:/,
                'variable': variable,
                'operator': operator
            }
        },
        // We want to consume the whole line
        'property-line': {
            pattern: /^[ \t]*(?:[^:\s]+ *:.*|:[^:\s].*)/m,
            greedy: true,
            inside: {
                'property': [
                    /[^:\s]+(?=\s*:)/,
                    {
                        pattern: /(:)[^:\s]+/,
                        lookbehind: true
                    }
                ],
                'punctuation': /:/,
                'variable': variable,
                'operator': operator,
                'important': Prism.languages.sass.important
            }
        }
    });
    delete Prism.languages.sass.property;
    delete Prism.languages.sass.important;

    // Now that whole lines for other patterns are consumed,
    // what's left should be selectors
    Prism.languages.insertBefore('sass', 'punctuation', {
        'selector': {
            pattern: /^([ \t]*)\S(?:,[^,\r\n]+|[^,\r\n]*)(?:,[^,\r\n]+)*(?:,(?:\r?\n|\r)\1[ \t]+\S(?:,[^,\r\n]+|[^,\r\n]*)(?:,[^,\r\n]+)*)*/m,
            lookbehind: true,
            greedy: true
        }
    });

}(Prism));

Prism.languages.scss = Prism.languages.extend('css', {
    'comment': {
        pattern: /(^|[^\\])(?:\/\*[\s\S]*?\*\/|\/\/.*)/,
        lookbehind: true
    },
    'atrule': {
        pattern: /@[\w-](?:\([^()]+\)|[^()\s]|\s+(?!\s))*?(?=\s+[{;])/,
        inside: {
            'rule': /@[\w-]+/
            // See rest below
        }
    },
    // url, compassified
    'url': /(?:[-a-z]+-)?url(?=\()/i,
    // CSS selector regex is not appropriate for Sass
    // since there can be lot more things (var, @ directive, nesting..)
    // a selector must start at the end of a property or after a brace (end of other rules or nesting)
    // it can contain some characters that aren't used for defining rules or end of selector, & (parent selector), or interpolated variable
    // the end of a selector is found when there is no rules in it ( {} or {\s}) or if there is a property (because an interpolated var
    // can "pass" as a selector- e.g: proper#{$erty})
    // this one was hard to do, so please be careful if you edit this one :)
    'selector': {
        // Initial look-ahead is used to prevent matching of blank selectors
        pattern: /(?=\S)[^@;{}()]?(?:[^@;{}()\s]|\s+(?!\s)|#\{\$[-\w]+\})+(?=\s*\{(?:\}|\s|[^}][^:{}]*[:{][^}]))/,
        inside: {
            'parent': {
                pattern: /&/,
                alias: 'important'
            },
            'placeholder': /%[-\w]+/,
            'variable': /\$[-\w]+|#\{\$[-\w]+\}/
        }
    },
    'property': {
        pattern: /(?:[-\w]|\$[-\w]|#\{\$[-\w]+\})+(?=\s*:)/,
        inside: {
            'variable': /\$[-\w]+|#\{\$[-\w]+\}/
        }
    }
});

Prism.languages.insertBefore('scss', 'atrule', {
    'keyword': [
        /@(?:content|debug|each|else(?: if)?|extend|for|forward|function|if|import|include|mixin|return|use|warn|while)\b/i,
        {
            pattern: /( )(?:from|through)(?= )/,
            lookbehind: true
        }
    ]
});

Prism.languages.insertBefore('scss', 'important', {
    // var and interpolated vars
    'variable': /\$[-\w]+|#\{\$[-\w]+\}/
});

Prism.languages.insertBefore('scss', 'function', {
    'module-modifier': {
        pattern: /\b(?:as|hide|show|with)\b/i,
        alias: 'keyword'
    },
    'placeholder': {
        pattern: /%[-\w]+/,
        alias: 'selector'
    },
    'statement': {
        pattern: /\B!(?:default|optional)\b/i,
        alias: 'keyword'
    },
    'boolean': /\b(?:false|true)\b/,
    'null': {
        pattern: /\bnull\b/,
        alias: 'keyword'
    },
    'operator': {
        pattern: /(\s)(?:[-+*\/%]|[=!]=|<=?|>=?|and|not|or)(?=\s)/,
        lookbehind: true
    }
});

Prism.languages.scss['atrule'].inside.rest = Prism.languages.scss;

Prism.languages.sql = {
    'comment': {
        pattern: /(^|[^\\])(?:\/\*[\s\S]*?\*\/|(?:--|\/\/|#).*)/,
        lookbehind: true
    },
    'variable': [{
            pattern: /@(["'`])(?:\\[\s\S]|(?!\1)[^\\])+\1/,
            greedy: true
        },
        /@[\w.$]+/
    ],
    'string': {
        pattern: /(^|[^@\\])("|')(?:\\[\s\S]|(?!\2)[^\\]|\2\2)*\2/,
        greedy: true,
        lookbehind: true
    },
    'identifier': {
        pattern: /(^|[^@\\])`(?:\\[\s\S]|[^`\\]|``)*`/,
        greedy: true,
        lookbehind: true,
        inside: {
            'punctuation': /^`|`$/
        }
    },
    'function': /\b(?:AVG|COUNT|FIRST|FORMAT|LAST|LCASE|LEN|MAX|MID|MIN|MOD|NOW|ROUND|SUM|UCASE)(?=\s*\()/i, // Should we highlight user defined functions too?
    'keyword': /\b(?:ACTION|ADD|AFTER|ALGORITHM|ALL|ALTER|ANALYZE|ANY|APPLY|AS|ASC|AUTHORIZATION|AUTO_INCREMENT|BACKUP|BDB|BEGIN|BERKELEYDB|BIGINT|BINARY|BIT|BLOB|BOOL|BOOLEAN|BREAK|BROWSE|BTREE|BULK|BY|CALL|CASCADED?|CASE|CHAIN|CHAR(?:ACTER|SET)?|CHECK(?:POINT)?|CLOSE|CLUSTERED|COALESCE|COLLATE|COLUMNS?|COMMENT|COMMIT(?:TED)?|COMPUTE|CONNECT|CONSISTENT|CONSTRAINT|CONTAINS(?:TABLE)?|CONTINUE|CONVERT|CREATE|CROSS|CURRENT(?:_DATE|_TIME|_TIMESTAMP|_USER)?|CURSOR|CYCLE|DATA(?:BASES?)?|DATE(?:TIME)?|DAY|DBCC|DEALLOCATE|DEC|DECIMAL|DECLARE|DEFAULT|DEFINER|DELAYED|DELETE|DELIMITERS?|DENY|DESC|DESCRIBE|DETERMINISTIC|DISABLE|DISCARD|DISK|DISTINCT|DISTINCTROW|DISTRIBUTED|DO|DOUBLE|DROP|DUMMY|DUMP(?:FILE)?|DUPLICATE|ELSE(?:IF)?|ENABLE|ENCLOSED|END|ENGINE|ENUM|ERRLVL|ERRORS|ESCAPED?|EXCEPT|EXEC(?:UTE)?|EXISTS|EXIT|EXPLAIN|EXTENDED|FETCH|FIELDS|FILE|FILLFACTOR|FIRST|FIXED|FLOAT|FOLLOWING|FOR(?: EACH ROW)?|FORCE|FOREIGN|FREETEXT(?:TABLE)?|FROM|FULL|FUNCTION|GEOMETRY(?:COLLECTION)?|GLOBAL|GOTO|GRANT|GROUP|HANDLER|HASH|HAVING|HOLDLOCK|HOUR|IDENTITY(?:COL|_INSERT)?|IF|IGNORE|IMPORT|INDEX|INFILE|INNER|INNODB|INOUT|INSERT|INT|INTEGER|INTERSECT|INTERVAL|INTO|INVOKER|ISOLATION|ITERATE|JOIN|KEYS?|KILL|LANGUAGE|LAST|LEAVE|LEFT|LEVEL|LIMIT|LINENO|LINES|LINESTRING|LOAD|LOCAL|LOCK|LONG(?:BLOB|TEXT)|LOOP|MATCH(?:ED)?|MEDIUM(?:BLOB|INT|TEXT)|MERGE|MIDDLEINT|MINUTE|MODE|MODIFIES|MODIFY|MONTH|MULTI(?:LINESTRING|POINT|POLYGON)|NATIONAL|NATURAL|NCHAR|NEXT|NO|NONCLUSTERED|NULLIF|NUMERIC|OFF?|OFFSETS?|ON|OPEN(?:DATASOURCE|QUERY|ROWSET)?|OPTIMIZE|OPTION(?:ALLY)?|ORDER|OUT(?:ER|FILE)?|OVER|PARTIAL|PARTITION|PERCENT|PIVOT|PLAN|POINT|POLYGON|PRECEDING|PRECISION|PREPARE|PREV|PRIMARY|PRINT|PRIVILEGES|PROC(?:EDURE)?|PUBLIC|PURGE|QUICK|RAISERROR|READS?|REAL|RECONFIGURE|REFERENCES|RELEASE|RENAME|REPEAT(?:ABLE)?|REPLACE|REPLICATION|REQUIRE|RESIGNAL|RESTORE|RESTRICT|RETURN(?:ING|S)?|REVOKE|RIGHT|ROLLBACK|ROUTINE|ROW(?:COUNT|GUIDCOL|S)?|RTREE|RULE|SAVE(?:POINT)?|SCHEMA|SECOND|SELECT|SERIAL(?:IZABLE)?|SESSION(?:_USER)?|SET(?:USER)?|SHARE|SHOW|SHUTDOWN|SIMPLE|SMALLINT|SNAPSHOT|SOME|SONAME|SQL|START(?:ING)?|STATISTICS|STATUS|STRIPED|SYSTEM_USER|TABLES?|TABLESPACE|TEMP(?:ORARY|TABLE)?|TERMINATED|TEXT(?:SIZE)?|THEN|TIME(?:STAMP)?|TINY(?:BLOB|INT|TEXT)|TOP?|TRAN(?:SACTIONS?)?|TRIGGER|TRUNCATE|TSEQUAL|TYPES?|UNBOUNDED|UNCOMMITTED|UNDEFINED|UNION|UNIQUE|UNLOCK|UNPIVOT|UNSIGNED|UPDATE(?:TEXT)?|USAGE|USE|USER|USING|VALUES?|VAR(?:BINARY|CHAR|CHARACTER|YING)|VIEW|WAITFOR|WARNINGS|WHEN|WHERE|WHILE|WITH(?: ROLLUP|IN)?|WORK|WRITE(?:TEXT)?|YEAR)\b/i,
    'boolean': /\b(?:FALSE|NULL|TRUE)\b/i,
    'number': /\b0x[\da-f]+\b|\b\d+(?:\.\d*)?|\B\.\d+\b/i,
    'operator': /[-+*\/=%^~]|&&?|\|\|?|!=?|<(?:=>?|<|>)?|>[>=]?|\b(?:AND|BETWEEN|DIV|ILIKE|IN|IS|LIKE|NOT|OR|REGEXP|RLIKE|SOUNDS LIKE|XOR)\b/i,
    'punctuation': /[;[\]()`,.]/
};

Prism.languages.twig = {
    'comment': /^\{#[\s\S]*?#\}$/,

    'tag-name': {
        pattern: /(^\{%-?\s*)\w+/,
        lookbehind: true,
        alias: 'keyword'
    },
    'delimiter': {
        pattern: /^\{[{%]-?|-?[%}]\}$/,
        alias: 'punctuation'
    },

    'string': {
        pattern: /("|')(?:\\.|(?!\1)[^\\\r\n])*\1/,
        inside: {
            'punctuation': /^['"]|['"]$/
        }
    },
    'keyword': /\b(?:even|if|odd)\b/,
    'boolean': /\b(?:false|null|true)\b/,
    'number': /\b0x[\dA-Fa-f]+|(?:\b\d+(?:\.\d*)?|\B\.\d+)(?:[Ee][-+]?\d+)?/,
    'operator': [{
            pattern: /(\s)(?:and|b-and|b-or|b-xor|ends with|in|is|matches|not|or|same as|starts with)(?=\s)/,
            lookbehind: true
        },
        /[=<>]=?|!=|\*\*?|\/\/?|\?:?|[-+~%|]/
    ],
    'punctuation': /[()\[\]{}:.,]/
};

Prism.hooks.add('before-tokenize', function (env) {
    if (env.language !== 'twig') {
        return;
    }

    var pattern = /\{(?:#[\s\S]*?#|%[\s\S]*?%|\{[\s\S]*?\})\}/g;
    Prism.languages['markup-templating'].buildPlaceholders(env, 'twig', pattern);
});

Prism.hooks.add('after-tokenize', function (env) {
    Prism.languages['markup-templating'].tokenizePlaceholders(env, 'twig');
});

(function (Prism) {

    // https://yaml.org/spec/1.2/spec.html#c-ns-anchor-property
    // https://yaml.org/spec/1.2/spec.html#c-ns-alias-node
    var anchorOrAlias = /[*&][^\s[\]{},]+/;
    // https://yaml.org/spec/1.2/spec.html#c-ns-tag-property
    var tag = /!(?:<[\w\-%#;/?:@&=+$,.!~*'()[\]]+>|(?:[a-zA-Z\d-]*!)?[\w\-%#;/?:@&=+$.~*'()]+)?/;
    // https://yaml.org/spec/1.2/spec.html#c-ns-properties(n,c)
    var properties = '(?:' + tag.source + '(?:[ \t]+' + anchorOrAlias.source + ')?|' +
        anchorOrAlias.source + '(?:[ \t]+' + tag.source + ')?)';
    // https://yaml.org/spec/1.2/spec.html#ns-plain(n,c)
    // This is a simplified version that doesn't support "#" and multiline keys
    // All these long scarry character classes are simplified versions of YAML's characters
    var plainKey = /(?:[^\s\x00-\x08\x0e-\x1f!"#%&'*,\-:>?@[\]`{|}\x7f-\x84\x86-\x9f\ud800-\udfff\ufffe\uffff]|[?:-]<PLAIN>)(?:[ \t]*(?:(?![#:])<PLAIN>|:<PLAIN>))*/.source
        .replace(/<PLAIN>/g, function () {
            return /[^\s\x00-\x08\x0e-\x1f,[\]{}\x7f-\x84\x86-\x9f\ud800-\udfff\ufffe\uffff]/.source;
        });
    var string = /"(?:[^"\\\r\n]|\\.)*"|'(?:[^'\\\r\n]|\\.)*'/.source;

    /**
     *
     * @param {string} value
     * @param {string} [flags]
     * @returns {RegExp}
     */
    function createValuePattern(value, flags) {
        flags = (flags || '').replace(/m/g, '') + 'm'; // add m flag
        var pattern = /([:\-,[{]\s*(?:\s<<prop>>[ \t]+)?)(?:<<value>>)(?=[ \t]*(?:$|,|\]|\}|(?:[\r\n]\s*)?#))/.source
            .replace(/<<prop>>/g, function () {
                return properties;
            }).replace(/<<value>>/g, function () {
                return value;
            });
        return RegExp(pattern, flags);
    }

    Prism.languages.yaml = {
        'scalar': {
            pattern: RegExp(/([\-:]\s*(?:\s<<prop>>[ \t]+)?[|>])[ \t]*(?:((?:\r?\n|\r)[ \t]+)\S[^\r\n]*(?:\2[^\r\n]+)*)/.source
                .replace(/<<prop>>/g, function () {
                    return properties;
                })),
            lookbehind: true,
            alias: 'string'
        },
        'comment': /#.*/,
        'key': {
            pattern: RegExp(/((?:^|[:\-,[{\r\n?])[ \t]*(?:<<prop>>[ \t]+)?)<<key>>(?=\s*:\s)/.source
                .replace(/<<prop>>/g, function () {
                    return properties;
                })
                .replace(/<<key>>/g, function () {
                    return '(?:' + plainKey + '|' + string + ')';
                })),
            lookbehind: true,
            greedy: true,
            alias: 'atrule'
        },
        'directive': {
            pattern: /(^[ \t]*)%.+/m,
            lookbehind: true,
            alias: 'important'
        },
        'datetime': {
            pattern: createValuePattern(/\d{4}-\d\d?-\d\d?(?:[tT]|[ \t]+)\d\d?:\d{2}:\d{2}(?:\.\d*)?(?:[ \t]*(?:Z|[-+]\d\d?(?::\d{2})?))?|\d{4}-\d{2}-\d{2}|\d\d?:\d{2}(?::\d{2}(?:\.\d*)?)?/.source),
            lookbehind: true,
            alias: 'number'
        },
        'boolean': {
            pattern: createValuePattern(/false|true/.source, 'i'),
            lookbehind: true,
            alias: 'important'
        },
        'null': {
            pattern: createValuePattern(/null|~/.source, 'i'),
            lookbehind: true,
            alias: 'important'
        },
        'string': {
            pattern: createValuePattern(string),
            lookbehind: true,
            greedy: true
        },
        'number': {
            pattern: createValuePattern(/[+-]?(?:0x[\da-f]+|0o[0-7]+|(?:\d+(?:\.\d*)?|\.\d+)(?:e[+-]?\d+)?|\.inf|\.nan)/.source, 'i'),
            lookbehind: true
        },
        'tag': tag,
        'important': anchorOrAlias,
        'punctuation': /---|[:[\]{}\-,|>?]|\.\.\./
    };

    Prism.languages.yml = Prism.languages.yaml;

}(Prism));

(function () {

    if (typeof Prism === 'undefined' || typeof document === 'undefined' || !document.querySelector) {
        return;
    }

    var LINE_NUMBERS_CLASS = 'line-numbers';
    var LINKABLE_LINE_NUMBERS_CLASS = 'linkable-line-numbers';

    /**
     * @param {string} selector
     * @param {ParentNode} [container]
     * @returns {HTMLElement[]}
     */
    function $$(selector, container) {
        return Array.prototype.slice.call((container || document).querySelectorAll(selector));
    }

    /**
     * Returns whether the given element has the given class.
     *
     * @param {Element} element
     * @param {string} className
     * @returns {boolean}
     */
    function hasClass(element, className) {
        return element.classList.contains(className);
    }

    /**
     * Calls the given function.
     *
     * @param {() => any} func
     * @returns {void}
     */
    function callFunction(func) {
        func();
    }

    // Some browsers round the line-height, others don't.
    // We need to test for it to position the elements properly.
    var isLineHeightRounded = (function () {
        var res;
        return function () {
            if (typeof res === 'undefined') {
                var d = document.createElement('div');
                d.style.fontSize = '13px';
                d.style.lineHeight = '1.5';
                d.style.padding = '0';
                d.style.border = '0';
                d.innerHTML = '&nbsp;<br />&nbsp;';
                document.body.appendChild(d);
                // Browsers that round the line-height should have offsetHeight === 38
                // The others should have 39.
                res = d.offsetHeight === 38;
                document.body.removeChild(d);
            }
            return res;
        };
    }());

    /**
     * Returns the top offset of the content box of the given parent and the content box of one of its children.
     *
     * @param {HTMLElement} parent
     * @param {HTMLElement} child
     */
    function getContentBoxTopOffset(parent, child) {
        var parentStyle = getComputedStyle(parent);
        var childStyle = getComputedStyle(child);

        /**
         * Returns the numeric value of the given pixel value.
         *
         * @param {string} px
         */
        function pxToNumber(px) {
            return +px.substr(0, px.length - 2);
        }

        return child.offsetTop +
            pxToNumber(childStyle.borderTopWidth) +
            pxToNumber(childStyle.paddingTop) -
            pxToNumber(parentStyle.paddingTop);
    }

    /**
     * Returns whether the Line Highlight plugin is active for the given element.
     *
     * If this function returns `false`, do not call `highlightLines` for the given element.
     *
     * @param {HTMLElement | null | undefined} pre
     * @returns {boolean}
     */
    function isActiveFor(pre) {
        if (!pre || !/pre/i.test(pre.nodeName)) {
            return false;
        }

        if (pre.hasAttribute('data-line')) {
            return true;
        }

        if (pre.id && Prism.util.isActive(pre, LINKABLE_LINE_NUMBERS_CLASS)) {
            // Technically, the line numbers plugin is also necessary but this plugin doesn't control the classes of
            // the line numbers plugin, so we can't assume that they are present.
            return true;
        }

        return false;
    }

    var scrollIntoView = true;

    Prism.plugins.lineHighlight = {
        /**
         * Highlights the lines of the given pre.
         *
         * This function is split into a DOM measuring and mutate phase to improve performance.
         * The returned function mutates the DOM when called.
         *
         * @param {HTMLElement} pre
         * @param {string | null} [lines]
         * @param {string} [classes='']
         * @returns {() => void}
         */
        highlightLines: function highlightLines(pre, lines, classes) {
            lines = typeof lines === 'string' ? lines : (pre.getAttribute('data-line') || '');

            var ranges = lines.replace(/\s+/g, '').split(',').filter(Boolean);
            var offset = +pre.getAttribute('data-line-offset') || 0;

            var parseMethod = isLineHeightRounded() ? parseInt : parseFloat;
            var lineHeight = parseMethod(getComputedStyle(pre).lineHeight);
            var hasLineNumbers = Prism.util.isActive(pre, LINE_NUMBERS_CLASS);
            var codeElement = pre.querySelector('code');
            var parentElement = hasLineNumbers ? pre : codeElement || pre;
            var mutateActions = /** @type {(() => void)[]} */ ([]);

            /**
             * The top offset between the content box of the <code> element and the content box of the parent element of
             * the line highlight element (either `<pre>` or `<code>`).
             *
             * This offset might not be zero for some themes where the <code> element has a top margin. Some plugins
             * (or users) might also add element above the <code> element. Because the line highlight is aligned relative
             * to the <pre> element, we have to take this into account.
             *
             * This offset will be 0 if the parent element of the line highlight element is the `<code>` element.
             */
            var codePreOffset = !codeElement || parentElement == codeElement ? 0 : getContentBoxTopOffset(pre, codeElement);

            ranges.forEach(function (currentRange) {
                var range = currentRange.split('-');

                var start = +range[0];
                var end = +range[1] || start;

                /** @type {HTMLElement} */
                var line = pre.querySelector('.line-highlight[data-range="' + currentRange + '"]') || document.createElement('div');

                mutateActions.push(function () {
                    line.setAttribute('aria-hidden', 'true');
                    line.setAttribute('data-range', currentRange);
                    line.className = (classes || '') + ' line-highlight';
                });

                // if the line-numbers plugin is enabled, then there is no reason for this plugin to display the line numbers
                if (hasLineNumbers && Prism.plugins.lineNumbers) {
                    var startNode = Prism.plugins.lineNumbers.getLine(pre, start);
                    var endNode = Prism.plugins.lineNumbers.getLine(pre, end);

                    if (startNode) {
                        var top = startNode.offsetTop + codePreOffset + 'px';
                        mutateActions.push(function () {
                            line.style.top = top;
                        });
                    }

                    if (endNode) {
                        var height = (endNode.offsetTop - startNode.offsetTop) + endNode.offsetHeight + 'px';
                        mutateActions.push(function () {
                            line.style.height = height;
                        });
                    }
                } else {
                    mutateActions.push(function () {
                        line.setAttribute('data-start', String(start));

                        if (end > start) {
                            line.setAttribute('data-end', String(end));
                        }

                        line.style.top = (start - offset - 1) * lineHeight + codePreOffset + 'px';

                        line.textContent = new Array(end - start + 2).join(' \n');
                    });
                }

                mutateActions.push(function () {
                    line.style.width = pre.scrollWidth + 'px';
                });

                mutateActions.push(function () {
                    // allow this to play nicely with the line-numbers plugin
                    // need to attack to pre as when line-numbers is enabled, the code tag is relatively which screws up the positioning
                    parentElement.appendChild(line);
                });
            });

            var id = pre.id;
            if (hasLineNumbers && Prism.util.isActive(pre, LINKABLE_LINE_NUMBERS_CLASS) && id) {
                // This implements linkable line numbers. Linkable line numbers use Line Highlight to create a link to a
                // specific line. For this to work, the pre element has to:
                //  1) have line numbers,
                //  2) have the `linkable-line-numbers` class or an ascendant that has that class, and
                //  3) have an id.

                if (!hasClass(pre, LINKABLE_LINE_NUMBERS_CLASS)) {
                    // add class to pre
                    mutateActions.push(function () {
                        pre.classList.add(LINKABLE_LINE_NUMBERS_CLASS);
                    });
                }

                var start = parseInt(pre.getAttribute('data-start') || '1');

                // iterate all line number spans
                $$('.line-numbers-rows > span', pre).forEach(function (lineSpan, i) {
                    var lineNumber = i + start;
                    lineSpan.onclick = function () {
                        var hash = id + '.' + lineNumber;

                        // this will prevent scrolling since the span is obviously in view
                        scrollIntoView = false;
                        location.hash = hash;
                        setTimeout(function () {
                            scrollIntoView = true;
                        }, 1);
                    };
                });
            }

            return function () {
                mutateActions.forEach(callFunction);
            };
        }
    };


    function applyHash() {
        var hash = location.hash.slice(1);

        // Remove pre-existing temporary lines
        $$('.temporary.line-highlight').forEach(function (line) {
            line.parentNode.removeChild(line);
        });

        var range = (hash.match(/\.([\d,-]+)$/) || [, ''])[1];

        if (!range || document.getElementById(hash)) {
            return;
        }

        var id = hash.slice(0, hash.lastIndexOf('.'));
        var pre = document.getElementById(id);

        if (!pre) {
            return;
        }

        if (!pre.hasAttribute('data-line')) {
            pre.setAttribute('data-line', '');
        }

        var mutateDom = Prism.plugins.lineHighlight.highlightLines(pre, range, 'temporary ');
        mutateDom();

        if (scrollIntoView) {
            document.querySelector('.temporary.line-highlight').scrollIntoView();
        }
    }

    var fakeTimer = 0; // Hack to limit the number of times applyHash() runs

    Prism.hooks.add('before-sanity-check', function (env) {
        var pre = env.element.parentElement;
        if (!isActiveFor(pre)) {
            return;
        }

        /*
         * Cleanup for other plugins (e.g. autoloader).
         *
         * Sometimes <code> blocks are highlighted multiple times. It is necessary
         * to cleanup any left-over tags, because the whitespace inside of the <div>
         * tags change the content of the <code> tag.
         */
        var num = 0;
        $$('.line-highlight', pre).forEach(function (line) {
            num += line.textContent.length;
            line.parentNode.removeChild(line);
        });
        // Remove extra whitespace
        if (num && /^(?: \n)+$/.test(env.code.slice(-num))) {
            env.code = env.code.slice(0, -num);
        }
    });

    Prism.hooks.add('complete', function completeHook(env) {
        var pre = env.element.parentElement;
        if (!isActiveFor(pre)) {
            return;
        }

        clearTimeout(fakeTimer);

        var hasLineNumbers = Prism.plugins.lineNumbers;
        var isLineNumbersLoaded = env.plugins && env.plugins.lineNumbers;

        if (hasClass(pre, LINE_NUMBERS_CLASS) && hasLineNumbers && !isLineNumbersLoaded) {
            Prism.hooks.add('line-numbers', completeHook);
        } else {
            var mutateDom = Prism.plugins.lineHighlight.highlightLines(pre);
            mutateDom();
            fakeTimer = setTimeout(applyHash, 1);
        }
    });

    window.addEventListener('hashchange', applyHash);
    window.addEventListener('resize', function () {
        var actions = $$('pre')
            .filter(isActiveFor)
            .map(function (pre) {
                return Prism.plugins.lineHighlight.highlightLines(pre);
            });
        actions.forEach(callFunction);
    });

}());

(function () {

    if (typeof Prism === 'undefined' || typeof document === 'undefined') {
        return;
    }

    /**
     * Plugin name which is used as a class name for <pre> which is activating the plugin
     *
     * @type {string}
     */
    var PLUGIN_NAME = 'line-numbers';

    /**
     * Regular expression used for determining line breaks
     *
     * @type {RegExp}
     */
    var NEW_LINE_EXP = /\n(?!$)/g;


    /**
     * Global exports
     */
    var config = Prism.plugins.lineNumbers = {
        /**
         * Get node for provided line number
         *
         * @param {Element} element pre element
         * @param {number} number line number
         * @returns {Element|undefined}
         */
        getLine: function (element, number) {
            if (element.tagName !== 'PRE' || !element.classList.contains(PLUGIN_NAME)) {
                return;
            }

            var lineNumberRows = element.querySelector('.line-numbers-rows');
            if (!lineNumberRows) {
                return;
            }
            var lineNumberStart = parseInt(element.getAttribute('data-start'), 10) || 1;
            var lineNumberEnd = lineNumberStart + (lineNumberRows.children.length - 1);

            if (number < lineNumberStart) {
                number = lineNumberStart;
            }
            if (number > lineNumberEnd) {
                number = lineNumberEnd;
            }

            var lineIndex = number - lineNumberStart;

            return lineNumberRows.children[lineIndex];
        },

        /**
         * Resizes the line numbers of the given element.
         *
         * This function will not add line numbers. It will only resize existing ones.
         *
         * @param {HTMLElement} element A `<pre>` element with line numbers.
         * @returns {void}
         */
        resize: function (element) {
            resizeElements([element]);
        },

        /**
         * Whether the plugin can assume that the units font sizes and margins are not depended on the size of
         * the current viewport.
         *
         * Setting this to `true` will allow the plugin to do certain optimizations for better performance.
         *
         * Set this to `false` if you use any of the following CSS units: `vh`, `vw`, `vmin`, `vmax`.
         *
         * @type {boolean}
         */
        assumeViewportIndependence: true
    };

    /**
     * Resizes the given elements.
     *
     * @param {HTMLElement[]} elements
     */
    function resizeElements(elements) {
        elements = elements.filter(function (e) {
            var codeStyles = getStyles(e);
            var whiteSpace = codeStyles['white-space'];
            return whiteSpace === 'pre-wrap' || whiteSpace === 'pre-line';
        });

        if (elements.length == 0) {
            return;
        }

        var infos = elements.map(function (element) {
            var codeElement = element.querySelector('code');
            var lineNumbersWrapper = element.querySelector('.line-numbers-rows');
            if (!codeElement || !lineNumbersWrapper) {
                return undefined;
            }

            /** @type {HTMLElement} */
            var lineNumberSizer = element.querySelector('.line-numbers-sizer');
            var codeLines = codeElement.textContent.split(NEW_LINE_EXP);

            if (!lineNumberSizer) {
                lineNumberSizer = document.createElement('span');
                lineNumberSizer.className = 'line-numbers-sizer';

                codeElement.appendChild(lineNumberSizer);
            }

            lineNumberSizer.innerHTML = '0';
            lineNumberSizer.style.display = 'block';

            var oneLinerHeight = lineNumberSizer.getBoundingClientRect().height;
            lineNumberSizer.innerHTML = '';

            return {
                element: element,
                lines: codeLines,
                lineHeights: [],
                oneLinerHeight: oneLinerHeight,
                sizer: lineNumberSizer,
            };
        }).filter(Boolean);

        infos.forEach(function (info) {
            var lineNumberSizer = info.sizer;
            var lines = info.lines;
            var lineHeights = info.lineHeights;
            var oneLinerHeight = info.oneLinerHeight;

            lineHeights[lines.length - 1] = undefined;
            lines.forEach(function (line, index) {
                if (line && line.length > 1) {
                    var e = lineNumberSizer.appendChild(document.createElement('span'));
                    e.style.display = 'block';
                    e.textContent = line;
                } else {
                    lineHeights[index] = oneLinerHeight;
                }
            });
        });

        infos.forEach(function (info) {
            var lineNumberSizer = info.sizer;
            var lineHeights = info.lineHeights;

            var childIndex = 0;
            for (var i = 0; i < lineHeights.length; i++) {
                if (lineHeights[i] === undefined) {
                    lineHeights[i] = lineNumberSizer.children[childIndex++].getBoundingClientRect().height;
                }
            }
        });

        infos.forEach(function (info) {
            var lineNumberSizer = info.sizer;
            var wrapper = info.element.querySelector('.line-numbers-rows');

            lineNumberSizer.style.display = 'none';
            lineNumberSizer.innerHTML = '';

            info.lineHeights.forEach(function (height, lineNumber) {
                wrapper.children[lineNumber].style.height = height + 'px';
            });
        });
    }

    /**
     * Returns style declarations for the element
     *
     * @param {Element} element
     */
    function getStyles(element) {
        if (!element) {
            return null;
        }

        return window.getComputedStyle ? getComputedStyle(element) : (element.currentStyle || null);
    }

    var lastWidth = undefined;
    window.addEventListener('resize', function () {
        if (config.assumeViewportIndependence && lastWidth === window.innerWidth) {
            return;
        }
        lastWidth = window.innerWidth;

        resizeElements(Array.prototype.slice.call(document.querySelectorAll('pre.' + PLUGIN_NAME)));
    });

    Prism.hooks.add('complete', function (env) {
        if (!env.code) {
            return;
        }

        var code = /** @type {Element} */ (env.element);
        var pre = /** @type {HTMLElement} */ (code.parentNode);

        // works only for <code> wrapped inside <pre> (not inline)
        if (!pre || !/pre/i.test(pre.nodeName)) {
            return;
        }

        // Abort if line numbers already exists
        if (code.querySelector('.line-numbers-rows')) {
            return;
        }

        // only add line numbers if <code> or one of its ancestors has the `line-numbers` class
        if (!Prism.util.isActive(code, PLUGIN_NAME)) {
            return;
        }

        // Remove the class 'line-numbers' from the <code>
        code.classList.remove(PLUGIN_NAME);
        // Add the class 'line-numbers' to the <pre>
        pre.classList.add(PLUGIN_NAME);

        var match = env.code.match(NEW_LINE_EXP);
        var linesNum = match ? match.length + 1 : 1;
        var lineNumbersWrapper;

        var lines = new Array(linesNum + 1).join('<span></span>');

        lineNumbersWrapper = document.createElement('span');
        lineNumbersWrapper.setAttribute('aria-hidden', 'true');
        lineNumbersWrapper.className = 'line-numbers-rows';
        lineNumbersWrapper.innerHTML = lines;

        if (pre.hasAttribute('data-start')) {
            pre.style.counterReset = 'linenumber ' + (parseInt(pre.getAttribute('data-start'), 10) - 1);
        }

        env.element.appendChild(lineNumbersWrapper);

        resizeElements([pre]);

        Prism.hooks.run('line-numbers', env);
    });

    Prism.hooks.add('line-numbers', function (env) {
        env.plugins = env.plugins || {};
        env.plugins.lineNumbers = true;
    });

}());

(function () {

    if (typeof Prism === 'undefined') {
        return;
    }

    var url = /\b([a-z]{3,7}:\/\/|tel:)[\w\-+%~/.:=&!$'()*,;@]+(?:\?[\w\-+%~/.:=?&!$'()*,;@]*)?(?:#[\w\-+%~/.:#=?&!$'()*,;@]*)?/;
    var email = /\b\S+@[\w.]+[a-z]{2}/;
    var linkMd = /\[([^\]]+)\]\(([^)]+)\)/;

    // Tokens that may contain URLs and emails
    var candidates = ['comment', 'url', 'attr-value', 'string'];

    Prism.plugins.autolinker = {
        processGrammar: function (grammar) {
            // Abort if grammar has already been processed
            if (!grammar || grammar['url-link']) {
                return;
            }
            Prism.languages.DFS(grammar, function (key, def, type) {
                if (candidates.indexOf(type) > -1 && !Array.isArray(def)) {
                    if (!def.pattern) {
                        def = this[key] = {
                            pattern: def
                        };
                    }

                    def.inside = def.inside || {};

                    if (type == 'comment') {
                        def.inside['md-link'] = linkMd;
                    }
                    if (type == 'attr-value') {
                        Prism.languages.insertBefore('inside', 'punctuation', {
                            'url-link': url
                        }, def);
                    } else {
                        def.inside['url-link'] = url;
                    }

                    def.inside['email-link'] = email;
                }
            });
            grammar['url-link'] = url;
            grammar['email-link'] = email;
        }
    };

    Prism.hooks.add('before-highlight', function (env) {
        Prism.plugins.autolinker.processGrammar(env.grammar);
    });

    Prism.hooks.add('wrap', function (env) {
        if (/-link$/.test(env.type)) {
            env.tag = 'a';

            var href = env.content;

            if (env.type == 'email-link' && href.indexOf('mailto:') != 0) {
                href = 'mailto:' + href;
            } else if (env.type == 'md-link') {
                // Markdown
                var match = env.content.match(linkMd);

                href = match[2];
                env.content = match[1];
            }

            env.attributes.href = href;

            // Silently catch any error thrown by decodeURIComponent (#1186)
            try {
                env.content = decodeURIComponent(env.content);
            } catch (e) {
                /* noop */ }
        }
    });

}());

(function () {

    if (typeof Prism === 'undefined' || typeof document === 'undefined') {
        return;
    }

    var callbacks = [];
    var map = {};
    var noop = function () {};

    Prism.plugins.toolbar = {};

    /**
     * @typedef ButtonOptions
     * @property {string} text The text displayed.
     * @property {string} [url] The URL of the link which will be created.
     * @property {Function} [onClick] The event listener for the `click` event of the created button.
     * @property {string} [className] The class attribute to include with element.
     */

    /**
     * Register a button callback with the toolbar.
     *
     * @param {string} key
     * @param {ButtonOptions|Function} opts
     */
    var registerButton = Prism.plugins.toolbar.registerButton = function (key, opts) {
        var callback;

        if (typeof opts === 'function') {
            callback = opts;
        } else {
            callback = function (env) {
                var element;

                if (typeof opts.onClick === 'function') {
                    element = document.createElement('button');
                    element.type = 'button';
                    element.addEventListener('click', function () {
                        opts.onClick.call(this, env);
                    });
                } else if (typeof opts.url === 'string') {
                    element = document.createElement('a');
                    element.href = opts.url;
                } else {
                    element = document.createElement('span');
                }

                if (opts.className) {
                    element.classList.add(opts.className);
                }

                element.textContent = opts.text;

                return element;
            };
        }

        if (key in map) {
            console.warn('There is a button with the key "' + key + '" registered already.');
            return;
        }

        callbacks.push(map[key] = callback);
    };

    /**
     * Returns the callback order of the given element.
     *
     * @param {HTMLElement} element
     * @returns {string[] | undefined}
     */
    function getOrder(element) {
        while (element) {
            var order = element.getAttribute('data-toolbar-order');
            if (order != null) {
                order = order.trim();
                if (order.length) {
                    return order.split(/\s*,\s*/g);
                } else {
                    return [];
                }
            }
            element = element.parentElement;
        }
    }

    /**
     * Post-highlight Prism hook callback.
     *
     * @param env
     */
    var hook = Prism.plugins.toolbar.hook = function (env) {
        // Check if inline or actual code block (credit to line-numbers plugin)
        var pre = env.element.parentNode;
        if (!pre || !/pre/i.test(pre.nodeName)) {
            return;
        }

        // Autoloader rehighlights, so only do this once.
        if (pre.parentNode.classList.contains('code-toolbar')) {
            return;
        }

        // Create wrapper for <pre> to prevent scrolling toolbar with content
        var wrapper = document.createElement('div');
        wrapper.classList.add('code-toolbar');
        pre.parentNode.insertBefore(wrapper, pre);
        wrapper.appendChild(pre);

        // Setup the toolbar
        var toolbar = document.createElement('div');
        toolbar.classList.add('toolbar');

        // order callbacks
        var elementCallbacks = callbacks;
        var order = getOrder(env.element);
        if (order) {
            elementCallbacks = order.map(function (key) {
                return map[key] || noop;
            });
        }

        elementCallbacks.forEach(function (callback) {
            var element = callback(env);

            if (!element) {
                return;
            }

            var item = document.createElement('div');
            item.classList.add('toolbar-item');

            item.appendChild(element);
            toolbar.appendChild(item);
        });

        // Add our toolbar to the currently created wrapper of <pre> tag
        wrapper.appendChild(toolbar);
    };

    registerButton('label', function (env) {
        var pre = env.element.parentNode;
        if (!pre || !/pre/i.test(pre.nodeName)) {
            return;
        }

        if (!pre.hasAttribute('data-label')) {
            return;
        }

        var element;
        var template;
        var text = pre.getAttribute('data-label');
        try {
            // Any normal text will blow up this selector.
            template = document.querySelector('template#' + text);
        } catch (e) {
            /* noop */ }

        if (template) {
            element = template.content;
        } else {
            if (pre.hasAttribute('data-url')) {
                element = document.createElement('a');
                element.href = pre.getAttribute('data-url');
            } else {
                element = document.createElement('span');
            }

            element.textContent = text;
        }

        return element;
    });

    /**
     * Register the toolbar with Prism.
     */
    Prism.hooks.add('complete', hook);
}());

(function () {

    if (typeof Prism === 'undefined' || typeof document === 'undefined') {
        return;
    }

    if (!Prism.plugins.toolbar) {
        console.warn('Show Languages plugin loaded before Toolbar plugin.');

        return;
    }

    /* eslint-disable */

    // The languages map is built automatically with gulp
    var Languages = /*languages_placeholder[*/ {
        "none": "Plain text",
        "plain": "Plain text",
        "plaintext": "Plain text",
        "text": "Plain text",
        "txt": "Plain text",
        "html": "HTML",
        "xml": "XML",
        "svg": "SVG",
        "mathml": "MathML",
        "ssml": "SSML",
        "rss": "RSS",
        "css": "CSS",
        "clike": "C-like",
        "js": "JavaScript",
        "abap": "ABAP",
        "abnf": "ABNF",
        "al": "AL",
        "antlr4": "ANTLR4",
        "g4": "ANTLR4",
        "apacheconf": "Apache Configuration",
        "apl": "APL",
        "aql": "AQL",
        "ino": "Arduino",
        "arff": "ARFF",
        "armasm": "ARM Assembly",
        "arm-asm": "ARM Assembly",
        "art": "Arturo",
        "asciidoc": "AsciiDoc",
        "adoc": "AsciiDoc",
        "aspnet": "ASP.NET (C#)",
        "asm6502": "6502 Assembly",
        "asmatmel": "Atmel AVR Assembly",
        "autohotkey": "AutoHotkey",
        "autoit": "AutoIt",
        "avisynth": "AviSynth",
        "avs": "AviSynth",
        "avro-idl": "Avro IDL",
        "avdl": "Avro IDL",
        "awk": "AWK",
        "gawk": "GAWK",
        "basic": "BASIC",
        "bbcode": "BBcode",
        "bnf": "BNF",
        "rbnf": "RBNF",
        "bsl": "BSL (1C:Enterprise)",
        "oscript": "OneScript",
        "csharp": "C#",
        "cs": "C#",
        "dotnet": "C#",
        "cpp": "C++",
        "cfscript": "CFScript",
        "cfc": "CFScript",
        "cil": "CIL",
        "cmake": "CMake",
        "cobol": "COBOL",
        "coffee": "CoffeeScript",
        "conc": "Concurnas",
        "csp": "Content-Security-Policy",
        "css-extras": "CSS Extras",
        "csv": "CSV",
        "cue": "CUE",
        "dataweave": "DataWeave",
        "dax": "DAX",
        "django": "Django/Jinja2",
        "jinja2": "Django/Jinja2",
        "dns-zone-file": "DNS zone file",
        "dns-zone": "DNS zone file",
        "dockerfile": "Docker",
        "dot": "DOT (Graphviz)",
        "gv": "DOT (Graphviz)",
        "ebnf": "EBNF",
        "editorconfig": "EditorConfig",
        "ejs": "EJS",
        "etlua": "Embedded Lua templating",
        "erb": "ERB",
        "excel-formula": "Excel Formula",
        "xlsx": "Excel Formula",
        "xls": "Excel Formula",
        "fsharp": "F#",
        "firestore-security-rules": "Firestore security rules",
        "ftl": "FreeMarker Template Language",
        "gml": "GameMaker Language",
        "gamemakerlanguage": "GameMaker Language",
        "gap": "GAP (CAS)",
        "gcode": "G-code",
        "gdscript": "GDScript",
        "gedcom": "GEDCOM",
        "gettext": "gettext",
        "po": "gettext",
        "glsl": "GLSL",
        "gn": "GN",
        "gni": "GN",
        "linker-script": "GNU Linker Script",
        "ld": "GNU Linker Script",
        "go-module": "Go module",
        "go-mod": "Go module",
        "graphql": "GraphQL",
        "hbs": "Handlebars",
        "hs": "Haskell",
        "hcl": "HCL",
        "hlsl": "HLSL",
        "http": "HTTP",
        "hpkp": "HTTP Public-Key-Pins",
        "hsts": "HTTP Strict-Transport-Security",
        "ichigojam": "IchigoJam",
        "icu-message-format": "ICU Message Format",
        "idr": "Idris",
        "ignore": ".ignore",
        "gitignore": ".gitignore",
        "hgignore": ".hgignore",
        "npmignore": ".npmignore",
        "inform7": "Inform 7",
        "javadoc": "JavaDoc",
        "javadoclike": "JavaDoc-like",
        "javastacktrace": "Java stack trace",
        "jq": "JQ",
        "jsdoc": "JSDoc",
        "js-extras": "JS Extras",
        "json": "JSON",
        "webmanifest": "Web App Manifest",
        "json5": "JSON5",
        "jsonp": "JSONP",
        "jsstacktrace": "JS stack trace",
        "js-templates": "JS Templates",
        "keepalived": "Keepalived Configure",
        "kts": "Kotlin Script",
        "kt": "Kotlin",
        "kumir": "KuMir (КуМир)",
        "kum": "KuMir (КуМир)",
        "latex": "LaTeX",
        "tex": "TeX",
        "context": "ConTeXt",
        "lilypond": "LilyPond",
        "ly": "LilyPond",
        "emacs": "Lisp",
        "elisp": "Lisp",
        "emacs-lisp": "Lisp",
        "llvm": "LLVM IR",
        "log": "Log file",
        "lolcode": "LOLCODE",
        "magma": "Magma (CAS)",
        "md": "Markdown",
        "markup-templating": "Markup templating",
        "matlab": "MATLAB",
        "maxscript": "MAXScript",
        "mel": "MEL",
        "metafont": "METAFONT",
        "mongodb": "MongoDB",
        "moon": "MoonScript",
        "n1ql": "N1QL",
        "n4js": "N4JS",
        "n4jsd": "N4JS",
        "nand2tetris-hdl": "Nand To Tetris HDL",
        "naniscript": "Naninovel Script",
        "nani": "Naninovel Script",
        "nasm": "NASM",
        "neon": "NEON",
        "nginx": "nginx",
        "nsis": "NSIS",
        "objectivec": "Objective-C",
        "objc": "Objective-C",
        "ocaml": "OCaml",
        "opencl": "OpenCL",
        "openqasm": "OpenQasm",
        "qasm": "OpenQasm",
        "parigp": "PARI/GP",
        "objectpascal": "Object Pascal",
        "psl": "PATROL Scripting Language",
        "pcaxis": "PC-Axis",
        "px": "PC-Axis",
        "peoplecode": "PeopleCode",
        "pcode": "PeopleCode",
        "php": "PHP",
        "phpdoc": "PHPDoc",
        "php-extras": "PHP Extras",
        "plant-uml": "PlantUML",
        "plantuml": "PlantUML",
        "plsql": "PL/SQL",
        "powerquery": "PowerQuery",
        "pq": "PowerQuery",
        "mscript": "PowerQuery",
        "powershell": "PowerShell",
        "promql": "PromQL",
        "properties": ".properties",
        "protobuf": "Protocol Buffers",
        "purebasic": "PureBasic",
        "pbfasm": "PureBasic",
        "purs": "PureScript",
        "py": "Python",
        "qsharp": "Q#",
        "qs": "Q#",
        "q": "Q (kdb+ database)",
        "qml": "QML",
        "rkt": "Racket",
        "cshtml": "Razor C#",
        "razor": "Razor C#",
        "jsx": "React JSX",
        "tsx": "React TSX",
        "renpy": "Ren'py",
        "rpy": "Ren'py",
        "res": "ReScript",
        "rest": "reST (reStructuredText)",
        "robotframework": "Robot Framework",
        "robot": "Robot Framework",
        "rb": "Ruby",
        "sas": "SAS",
        "sass": "Sass (Sass)",
        "scss": "Sass (Scss)",
        "shell-session": "Shell session",
        "sh-session": "Shell session",
        "shellsession": "Shell session",
        "sml": "SML",
        "smlnj": "SML/NJ",
        "solidity": "Solidity (Ethereum)",
        "sol": "Solidity (Ethereum)",
        "solution-file": "Solution file",
        "sln": "Solution file",
        "soy": "Soy (Closure Template)",
        "sparql": "SPARQL",
        "rq": "SPARQL",
        "splunk-spl": "Splunk SPL",
        "sqf": "SQF: Status Quo Function (Arma 3)",
        "sql": "SQL",
        "stata": "Stata Ado",
        "iecst": "Structured Text (IEC 61131-3)",
        "supercollider": "SuperCollider",
        "sclang": "SuperCollider",
        "systemd": "Systemd configuration file",
        "t4-templating": "T4 templating",
        "t4-cs": "T4 Text Templates (C#)",
        "t4": "T4 Text Templates (C#)",
        "t4-vb": "T4 Text Templates (VB)",
        "tap": "TAP",
        "tt2": "Template Toolkit 2",
        "toml": "TOML",
        "trickle": "trickle",
        "troy": "troy",
        "trig": "TriG",
        "ts": "TypeScript",
        "tsconfig": "TSConfig",
        "uscript": "UnrealScript",
        "uc": "UnrealScript",
        "uorazor": "UO Razor Script",
        "uri": "URI",
        "url": "URL",
        "vbnet": "VB.Net",
        "vhdl": "VHDL",
        "vim": "vim",
        "visual-basic": "Visual Basic",
        "vba": "VBA",
        "vb": "Visual Basic",
        "wasm": "WebAssembly",
        "web-idl": "Web IDL",
        "webidl": "Web IDL",
        "wgsl": "WGSL",
        "wiki": "Wiki markup",
        "wolfram": "Wolfram language",
        "nb": "Mathematica Notebook",
        "wl": "Wolfram language",
        "xeoracube": "XeoraCube",
        "xml-doc": "XML doc (.net)",
        "xojo": "Xojo (REALbasic)",
        "xquery": "XQuery",
        "yaml": "YAML",
        "yml": "YAML",
        "yang": "YANG"
    } /*]*/ ;

    /* eslint-enable */

    Prism.plugins.toolbar.registerButton('show-language', function (env) {
        var pre = env.element.parentNode;
        if (!pre || !/pre/i.test(pre.nodeName)) {
            return;
        }

        /**
         * Tries to guess the name of a language given its id.
         *
         * @param {string} id The language id.
         * @returns {string}
         */
        function guessTitle(id) {
            if (!id) {
                return id;
            }
            return (id.substring(0, 1).toUpperCase() + id.substring(1)).replace(/s(?=cript)/, 'S');
        }

        var language = pre.getAttribute('data-language') || Languages[env.language] || guessTitle(env.language);

        if (!language) {
            return;
        }
        var element = document.createElement('span');
        element.textContent = language;

        return element;
    });

}());

(function () {

    if (typeof Prism === 'undefined' || typeof document === 'undefined') {
        return;
    }

    Prism.hooks.add('before-sanity-check', function (env) {
        if (env.code) {
            var pre = env.element.parentNode;
            var clsReg = /(?:^|\s)keep-initial-line-feed(?:\s|$)/;
            if (
                pre && pre.nodeName.toLowerCase() === 'pre' &&
                // Apply only if nor the <pre> or the <code> have the class
                (!clsReg.test(pre.className) && !clsReg.test(env.element.className))
            ) {
                env.code = env.code.replace(/^(?:\r?\n|\r)/, '');
            }
        }
    });

}());

(function () {

    if (typeof Prism === 'undefined' || typeof document === 'undefined') {
        return;
    }

    // Copied from the markup language definition
    var HTML_TAG = /<\/?(?!\d)[^\s>\/=$<%]+(?:\s(?:\s*[^\s>\/=]+(?:\s*=\s*(?:"[^"]*"|'[^']*'|[^\s'">=]+(?=[\s>]))|(?=[\s/>])))+)?\s*\/?>/g;

    // a regex to validate hexadecimal colors
    var HEX_COLOR = /^#?((?:[\da-f]){3,4}|(?:[\da-f]{2}){3,4})$/i;

    /**
     * Parses the given hexadecimal representation and returns the parsed RGBA color.
     *
     * If the format of the given string is invalid, `undefined` will be returned.
     * Valid formats are: `RGB`, `RGBA`, `RRGGBB`, and `RRGGBBAA`.
     *
     * Hexadecimal colors are parsed because they are not fully supported by older browsers, so converting them to
     * `rgba` functions improves browser compatibility.
     *
     * @param {string} hex
     * @returns {string | undefined}
     */
    function parseHexColor(hex) {
        var match = HEX_COLOR.exec(hex);
        if (!match) {
            return undefined;
        }
        hex = match[1]; // removes the leading "#"

        // the width and number of channels
        var channelWidth = hex.length >= 6 ? 2 : 1;
        var channelCount = hex.length / channelWidth;

        // the scale used to normalize 4bit and 8bit values
        var scale = channelWidth == 1 ? 1 / 15 : 1 / 255;

        // normalized RGBA channels
        var channels = [];
        for (var i = 0; i < channelCount; i++) {
            var int = parseInt(hex.substr(i * channelWidth, channelWidth), 16);
            channels.push(int * scale);
        }
        if (channelCount == 3) {
            channels.push(1); // add alpha of 100%
        }

        // output
        var rgb = channels.slice(0, 3).map(function (x) {
            return String(Math.round(x * 255));
        }).join(',');
        var alpha = String(Number(channels[3].toFixed(3))); // easy way to round 3 decimal places

        return 'rgba(' + rgb + ',' + alpha + ')';
    }

    /**
     * Validates the given Color using the current browser's internal implementation.
     *
     * @param {string} color
     * @returns {string | undefined}
     */
    function validateColor(color) {
        var s = new Option().style;
        s.color = color;
        return s.color ? color : undefined;
    }

    /**
     * An array of function which parse a given string representation of a color.
     *
     * These parser serve as validators and as a layer of compatibility to support color formats which the browser
     * might not support natively.
     *
     * @type {((value: string) => (string|undefined))[]}
     */
    var parsers = [
        parseHexColor,
        validateColor
    ];


    Prism.hooks.add('wrap', function (env) {
        if (env.type === 'color' || env.classes.indexOf('color') >= 0) {
            var content = env.content;

            // remove all HTML tags inside
            var rawText = content.split(HTML_TAG).join('');

            var color;
            for (var i = 0, l = parsers.length; i < l && !color; i++) {
                color = parsers[i](rawText);
            }

            if (!color) {
                return;
            }

            var previewElement = '<span class="inline-color-wrapper"><span class="inline-color" style="background-color:' + color + ';"></span></span>';
            env.content = previewElement + content;
        }
    });

}());

(function () {

    if (typeof Prism === 'undefined') {
        return;
    }

    var assign = Object.assign || function (obj1, obj2) {
        for (var name in obj2) {
            if (obj2.hasOwnProperty(name)) {
                obj1[name] = obj2[name];
            }
        }
        return obj1;
    };

    function NormalizeWhitespace(defaults) {
        this.defaults = assign({}, defaults);
    }

    function toCamelCase(value) {
        return value.replace(/-(\w)/g, function (match, firstChar) {
            return firstChar.toUpperCase();
        });
    }

    function tabLen(str) {
        var res = 0;
        for (var i = 0; i < str.length; ++i) {
            if (str.charCodeAt(i) == '\t'.charCodeAt(0)) {
                res += 3;
            }
        }
        return str.length + res;
    }

    var settingsConfig = {
        'remove-trailing': 'boolean',
        'remove-indent': 'boolean',
        'left-trim': 'boolean',
        'right-trim': 'boolean',
        'break-lines': 'number',
        'indent': 'number',
        'remove-initial-line-feed': 'boolean',
        'tabs-to-spaces': 'number',
        'spaces-to-tabs': 'number',
    };

    NormalizeWhitespace.prototype = {
        setDefaults: function (defaults) {
            this.defaults = assign(this.defaults, defaults);
        },
        normalize: function (input, settings) {
            settings = assign(this.defaults, settings);

            for (var name in settings) {
                var methodName = toCamelCase(name);
                if (name !== 'normalize' && methodName !== 'setDefaults' &&
                    settings[name] && this[methodName]) {
                    input = this[methodName].call(this, input, settings[name]);
                }
            }

            return input;
        },

        /*
         * Normalization methods
         */
        leftTrim: function (input) {
            return input.replace(/^\s+/, '');
        },
        rightTrim: function (input) {
            return input.replace(/\s+$/, '');
        },
        tabsToSpaces: function (input, spaces) {
            spaces = spaces | 0 || 4;
            return input.replace(/\t/g, new Array(++spaces).join(' '));
        },
        spacesToTabs: function (input, spaces) {
            spaces = spaces | 0 || 4;
            return input.replace(RegExp(' {' + spaces + '}', 'g'), '\t');
        },
        removeTrailing: function (input) {
            return input.replace(/\s*?$/gm, '');
        },
        // Support for deprecated plugin remove-initial-line-feed
        removeInitialLineFeed: function (input) {
            return input.replace(/^(?:\r?\n|\r)/, '');
        },
        removeIndent: function (input) {
            var indents = input.match(/^[^\S\n\r]*(?=\S)/gm);

            if (!indents || !indents[0].length) {
                return input;
            }

            indents.sort(function (a, b) {
                return a.length - b.length;
            });

            if (!indents[0].length) {
                return input;
            }

            return input.replace(RegExp('^' + indents[0], 'gm'), '');
        },
        indent: function (input, tabs) {
            return input.replace(/^[^\S\n\r]*(?=\S)/gm, new Array(++tabs).join('\t') + '$&');
        },
        breakLines: function (input, characters) {
            characters = (characters === true) ? 80 : characters | 0 || 80;

            var lines = input.split('\n');
            for (var i = 0; i < lines.length; ++i) {
                if (tabLen(lines[i]) <= characters) {
                    continue;
                }

                var line = lines[i].split(/(\s+)/g);
                var len = 0;

                for (var j = 0; j < line.length; ++j) {
                    var tl = tabLen(line[j]);
                    len += tl;
                    if (len > characters) {
                        line[j] = '\n' + line[j];
                        len = tl;
                    }
                }
                lines[i] = line.join('');
            }
            return lines.join('\n');
        }
    };

    // Support node modules
    if (typeof module !== 'undefined' && module.exports) {
        module.exports = NormalizeWhitespace;
    }

    Prism.plugins.NormalizeWhitespace = new NormalizeWhitespace({
        'remove-trailing': true,
        'remove-indent': true,
        'left-trim': true,
        'right-trim': true,
        /*'break-lines': 80,
        'indent': 2,
        'remove-initial-line-feed': false,
        'tabs-to-spaces': 4,
        'spaces-to-tabs': 4*/
    });

    Prism.hooks.add('before-sanity-check', function (env) {
        var Normalizer = Prism.plugins.NormalizeWhitespace;

        // Check settings
        if (env.settings && env.settings['whitespace-normalization'] === false) {
            return;
        }

        // Check classes
        if (!Prism.util.isActive(env.element, 'whitespace-normalization', true)) {
            return;
        }

        // Simple mode if there is no env.element
        if ((!env.element || !env.element.parentNode) && env.code) {
            env.code = Normalizer.normalize(env.code, env.settings);
            return;
        }

        // Normal mode
        var pre = env.element.parentNode;
        if (!env.code || !pre || pre.nodeName.toLowerCase() !== 'pre') {
            return;
        }

        if (env.settings == null) {
            env.settings = {};
        }

        // Read settings from 'data-' attributes
        for (var key in settingsConfig) {
            if (Object.hasOwnProperty.call(settingsConfig, key)) {
                var settingType = settingsConfig[key];
                if (pre.hasAttribute('data-' + key)) {
                    try {
                        var value = JSON.parse(pre.getAttribute('data-' + key) || 'true');
                        if (typeof value === settingType) {
                            env.settings[key] = value;
                        }
                    } catch (_error) {
                        // ignore error
                    }
                }
            }
        }

        var children = pre.childNodes;
        var before = '';
        var after = '';
        var codeFound = false;

        // Move surrounding whitespace from the <pre> tag into the <code> tag
        for (var i = 0; i < children.length; ++i) {
            var node = children[i];

            if (node == env.element) {
                codeFound = true;
            } else if (node.nodeName === '#text') {
                if (codeFound) {
                    after += node.nodeValue;
                } else {
                    before += node.nodeValue;
                }

                pre.removeChild(node);
                --i;
            }
        }

        if (!env.element.children.length || !Prism.plugins.KeepMarkup) {
            env.code = before + env.code + after;
            env.code = Normalizer.normalize(env.code, env.settings);
        } else {
            // Preserve markup for keep-markup plugin
            var html = before + env.element.innerHTML + after;
            env.element.innerHTML = Normalizer.normalize(html, env.settings);
            env.code = env.element.textContent;
        }
    });

}());

(function () {

    if (typeof Prism === 'undefined' || typeof document === 'undefined') {
        return;
    }

    if (!Prism.plugins.toolbar) {
        console.warn('Copy to Clipboard plugin loaded before Toolbar plugin.');

        return;
    }

    /**
     * When the given elements is clicked by the user, the given text will be copied to clipboard.
     *
     * @param {HTMLElement} element
     * @param {CopyInfo} copyInfo
     *
     * @typedef CopyInfo
     * @property {() => string} getText
     * @property {() => void} success
     * @property {(reason: unknown) => void} error
     */
    function registerClipboard(element, copyInfo) {
        element.addEventListener('click', function () {
            copyTextToClipboard(copyInfo);
        });
    }

    // https://stackoverflow.com/a/30810322/7595472

    /** @param {CopyInfo} copyInfo */
    function fallbackCopyTextToClipboard(copyInfo) {
        var textArea = document.createElement('textarea');
        textArea.value = copyInfo.getText();

        // Avoid scrolling to bottom
        textArea.style.top = '0';
        textArea.style.left = '0';
        textArea.style.position = 'fixed';

        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();

        try {
            var successful = document.execCommand('copy');
            setTimeout(function () {
                if (successful) {
                    copyInfo.success();
                } else {
                    copyInfo.error();
                }
            }, 1);
        } catch (err) {
            setTimeout(function () {
                copyInfo.error(err);
            }, 1);
        }

        document.body.removeChild(textArea);
    }
    /** @param {CopyInfo} copyInfo */
    function copyTextToClipboard(copyInfo) {
        if (navigator.clipboard) {
            navigator.clipboard.writeText(copyInfo.getText()).then(copyInfo.success, function () {
                // try the fallback in case `writeText` didn't work
                fallbackCopyTextToClipboard(copyInfo);
            });
        } else {
            fallbackCopyTextToClipboard(copyInfo);
        }
    }

    /**
     * Selects the text content of the given element.
     *
     * @param {Element} element
     */
    function selectElementText(element) {
        // https://stackoverflow.com/a/20079910/7595472
        window.getSelection().selectAllChildren(element);
    }

    /**
     * Traverses up the DOM tree to find data attributes that override the default plugin settings.
     *
     * @param {Element} startElement An element to start from.
     * @returns {Settings} The plugin settings.
     * @typedef {Record<"copy" | "copy-error" | "copy-success" | "copy-timeout", string | number>} Settings
     */
    function getSettings(startElement) {
        /** @type {Settings} */
        var settings = {
            'copy': 'Copy',
            'copy-error': 'Press Ctrl+C to copy',
            'copy-success': 'Copied!',
            'copy-timeout': 5000
        };

        var prefix = 'data-prismjs-';
        for (var key in settings) {
            var attr = prefix + key;
            var element = startElement;
            while (element && !element.hasAttribute(attr)) {
                element = element.parentElement;
            }
            if (element) {
                settings[key] = element.getAttribute(attr);
            }
        }
        return settings;
    }

    Prism.plugins.toolbar.registerButton('copy-to-clipboard', function (env) {
        var element = env.element;

        var settings = getSettings(element);

        var linkCopy = document.createElement('button');
        linkCopy.className = 'copy-to-clipboard-button';
        linkCopy.setAttribute('type', 'button');
        var linkSpan = document.createElement('span');
        linkCopy.appendChild(linkSpan);

        setState('copy');

        registerClipboard(linkCopy, {
            getText: function () {
                return element.textContent;
            },
            success: function () {
                setState('copy-success');

                resetText();
            },
            error: function () {
                setState('copy-error');

                setTimeout(function () {
                    selectElementText(element);
                }, 1);

                resetText();
            }
        });

        return linkCopy;

        function resetText() {
            setTimeout(function () {
                setState('copy');
            }, settings['copy-timeout']);
        }

        /** @param {"copy" | "copy-error" | "copy-success"} state */
        function setState(state) {
            linkSpan.textContent = settings[state];
            linkCopy.setAttribute('data-copy-state', state);
        }
    });
}());

(function () {

    if (typeof Prism === 'undefined' || typeof document === 'undefined' || !document.querySelector) {
        return;
    }

    Prism.plugins.toolbar.registerButton('download-file', function (env) {
        var pre = env.element.parentNode;
        if (!pre || !/pre/i.test(pre.nodeName) || !pre.hasAttribute('data-src') || !pre.hasAttribute('data-download-link')) {
            return;
        }
        var src = pre.getAttribute('data-src');
        var a = document.createElement('a');
        a.textContent = pre.getAttribute('data-download-link-label') || 'Download';
        a.setAttribute('download', '');
        a.href = src;
        return a;
    });

}());

(function () {

    if (typeof Prism === 'undefined' || typeof document === 'undefined') {
        return;
    }

    function mapClassName(name) {
        var customClass = Prism.plugins.customClass;
        if (customClass) {
            return customClass.apply(name, 'none');
        } else {
            return name;
        }
    }

    var PARTNER = {
        '(': ')',
        '[': ']',
        '{': '}',
    };

    // The names for brace types.
    // These names have two purposes: 1) they can be used for styling and 2) they are used to pair braces. Only braces
    // of the same type are paired.
    var NAMES = {
        '(': 'brace-round',
        '[': 'brace-square',
        '{': 'brace-curly',
    };

    // A map for brace aliases.
    // This is useful for when some braces have a prefix/suffix as part of the punctuation token.
    var BRACE_ALIAS_MAP = {
        '${': '{', // JS template punctuation (e.g. `foo ${bar + 1}`)
    };

    var LEVEL_WARP = 12;

    var pairIdCounter = 0;

    var BRACE_ID_PATTERN = /^(pair-\d+-)(close|open)$/;

    /**
     * Returns the brace partner given one brace of a brace pair.
     *
     * @param {HTMLElement} brace
     * @returns {HTMLElement}
     */
    function getPartnerBrace(brace) {
        var match = BRACE_ID_PATTERN.exec(brace.id);
        return document.querySelector('#' + match[1] + (match[2] == 'open' ? 'close' : 'open'));
    }

    /**
     * @this {HTMLElement}
     */
    function hoverBrace() {
        if (!Prism.util.isActive(this, 'brace-hover', true)) {
            return;
        }

        [this, getPartnerBrace(this)].forEach(function (e) {
            e.classList.add(mapClassName('brace-hover'));
        });
    }
    /**
     * @this {HTMLElement}
     */
    function leaveBrace() {
        [this, getPartnerBrace(this)].forEach(function (e) {
            e.classList.remove(mapClassName('brace-hover'));
        });
    }
    /**
     * @this {HTMLElement}
     */
    function clickBrace() {
        if (!Prism.util.isActive(this, 'brace-select', true)) {
            return;
        }

        [this, getPartnerBrace(this)].forEach(function (e) {
            e.classList.add(mapClassName('brace-selected'));
        });
    }

    Prism.hooks.add('complete', function (env) {

        /** @type {HTMLElement} */
        var code = env.element;
        var pre = code.parentElement;

        if (!pre || pre.tagName != 'PRE') {
            return;
        }

        // find the braces to match
        /** @type {string[]} */
        var toMatch = [];
        if (Prism.util.isActive(code, 'match-braces')) {
            toMatch.push('(', '[', '{');
        }

        if (toMatch.length == 0) {
            // nothing to match
            return;
        }

        if (!pre.__listenerAdded) {
            // code blocks might be highlighted more than once
            pre.addEventListener('mousedown', function removeBraceSelected() {
                // the code element might have been replaced
                var code = pre.querySelector('code');
                var className = mapClassName('brace-selected');
                Array.prototype.slice.call(code.querySelectorAll('.' + className)).forEach(function (e) {
                    e.classList.remove(className);
                });
            });
            Object.defineProperty(pre, '__listenerAdded', {
                value: true
            });
        }

        /** @type {HTMLSpanElement[]} */
        var punctuation = Array.prototype.slice.call(
            code.querySelectorAll('span.' + mapClassName('token') + '.' + mapClassName('punctuation'))
        );

        /** @type {{ index: number, open: boolean, element: HTMLElement }[]} */
        var allBraces = [];

        toMatch.forEach(function (open) {
            var close = PARTNER[open];
            var name = mapClassName(NAMES[open]);

            /** @type {[number, number][]} */
            var pairs = [];
            /** @type {number[]} */
            var openStack = [];

            for (var i = 0; i < punctuation.length; i++) {
                var element = punctuation[i];
                if (element.childElementCount == 0) {
                    var text = element.textContent;
                    text = BRACE_ALIAS_MAP[text] || text;
                    if (text === open) {
                        allBraces.push({
                            index: i,
                            open: true,
                            element: element
                        });
                        element.classList.add(name);
                        element.classList.add(mapClassName('brace-open'));
                        openStack.push(i);
                    } else if (text === close) {
                        allBraces.push({
                            index: i,
                            open: false,
                            element: element
                        });
                        element.classList.add(name);
                        element.classList.add(mapClassName('brace-close'));
                        if (openStack.length) {
                            pairs.push([i, openStack.pop()]);
                        }
                    }
                }
            }

            pairs.forEach(function (pair) {
                var pairId = 'pair-' + (pairIdCounter++) + '-';

                var opening = punctuation[pair[0]];
                var closing = punctuation[pair[1]];

                opening.id = pairId + 'open';
                closing.id = pairId + 'close';

                [opening, closing].forEach(function (e) {
                    e.addEventListener('mouseenter', hoverBrace);
                    e.addEventListener('mouseleave', leaveBrace);
                    e.addEventListener('click', clickBrace);
                });
            });
        });

        var level = 0;
        allBraces.sort(function (a, b) {
            return a.index - b.index;
        });
        allBraces.forEach(function (brace) {
            if (brace.open) {
                brace.element.classList.add(mapClassName('brace-level-' + (level % LEVEL_WARP + 1)));
                level++;
            } else {
                level = Math.max(0, level - 1);
                brace.element.classList.add(mapClassName('brace-level-' + (level % LEVEL_WARP + 1)));
            }
        });
    });

}());
