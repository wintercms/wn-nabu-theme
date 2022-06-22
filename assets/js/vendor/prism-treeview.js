/*
This is a modified version of the Prism Treeview plugin, originally built by Golmote.
https://github.com/Golmote/prism-treeview

This version supports appended comments on the tree structure ('# comment')
*/

(function () {

    if (typeof Prism === 'undefined') {
        return;
    }

    Prism.languages.treeview = {
        'treeview-part': {
            pattern: /^.+/m,
            inside: {
                'entry-lines': {
                    pattern: /^[ \|\`\-\├\─\│\└]+/,
                    inside: {
                        'line-h': {
                            pattern: /\|-- |├── /,
                        },
                        'line-v': {
                            pattern: /\| {3}|│ {3}/,
                        },
                        'line-v-last': {
                            pattern: /`-- |└── /,
                        },
                        'line-v-gap': {
                            pattern: / {4}/,
                        },
                    },
                },
                'entry-dir': {
                    pattern: /^[^\/]+\/.*$/,
                },
                'entry-name': {
                    pattern: /^[^\/]+$/,
                },
            }
        }
    };

    Prism.hooks.add('wrap', function (env) {
        if (env.language === 'treeview' && env.type === 'entry-dir') {
            let dirName;
            let comment;

            if (env.content.match('#')) {
                [dirName, comment] = env.content.split('#', 2);
                comment = `<span class="token comment">#${comment}</span>`;
            } else {
                dirName = env.content;
                comment = '';
            }

            const trimmed = dirName.trimEnd();

            if (trimmed.endsWith('/')) {
                if (comment !== '') {
                    dirName = dirName.replace(/\/( *)$/, ' $1');
                } else {
                    dirName = dirName.replace(/\/ *$/, '');
                }
            }

            env.content = `${dirName}${comment}`
        } else if (env.language === 'treeview' && env.type === 'entry-name') {
            var classes = env.classes;
            let fileName;
            let comment;

            // remove trailing file marker
            env.content = env.content.replace(/(^|[^\\])[=*|](\s*)$/, '$1');

            if (env.content.match('#')) {
                [fileName, comment] = env.content.split('#', 2);
                comment = `<span class="token comment">#${comment}</span>`;
            } else {
                fileName = env.content;
                comment = '';
            }

            const matches = /^(.*?)(\.([a-z0-9]+))?$/.exec(fileName.toLowerCase().replace(/\s+/g, ''));
            const extension = matches[3] || matches[1];
            classes.push('ext-' + extension);

            if (fileName[0] === '.') {
                classes.push('dotfile');
            }

            env.content = `${fileName}${comment}`
        }
    });

}());
