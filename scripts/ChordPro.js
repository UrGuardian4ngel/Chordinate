/**
 * This class handles tokenizing of ChordPro files, and rendering
 * a basic HTML structure for this chord data.
 *
 * It's heavily based on the twig.js project (https://github.com/justjohn/twig.js/).
 *
 * This will probably receive some refactoring and cleaning up
 * along the way.
 */
var ChordPro = function ()
{
};

ChordPro.token = {};

ChordPro.token.type = {
    raw:     'raw',
    command: 'command',
    chord:   'chord',
    comment: 'comment',
    linebreak: 'linebreak'
};

ChordPro.token.definitions = [
    {
        type:  ChordPro.token.type.command,
        open:  '{',
        close: '}'
    },
    {
        type:  ChordPro.token.type.chord,
        open:  '[',
        close: ']'
    },
    {
        type:  ChordPro.token.type.comment,
        open:  '#',
        close: '\n'
    }
];

ChordPro.token.findStart = function (template)
{
    var output = {
            position: null,
            def: null
        },

        i,
        tokenTemplate,
        firstKeyPosition;

    for (i=0; i < ChordPro.token.definitions.length; i++) {
        tokenTemplate = ChordPro.token.definitions[i];
        firstKeyPosition = template.indexOf(tokenTemplate.open);

        // Does this token occur before any other types?
        if (firstKeyPosition >= 0 && (output.position === null || firstKeyPosition < output.position)) {
            output.position = firstKeyPosition;
            output.def = tokenTemplate;
        }
    }

    return output;
};

ChordPro.token.findEnd = function (template, tokenDef, start)
{
    var end = null,
        found = false,
        offset = 0,

        // String position variables
        strpos = null,
        strFound = null,
        pos = null,
        endOffset = null,
        thisStrpos = null,
        endStrpos = null,

        // For loop variables
        i,
        l;

    while (!found) {
        strpos = null;
        strFound = null;
        pos = template.indexOf(tokenDef.close, offset);

        if (pos >= 0) {
            end = pos;
            found = true;
        } else {
            // throw an exception
            throw new Error("Unable to find closing bracket '" + tokenDef.close +
                            "'" + " opened near template position " + start);
        }

        // Ignore quotes within comments; just look for the next comment close sequence,
        // regardless of what comes before it. https://github.com/justjohn/twig.js/issues/95
        if (tokenDef.type === ChordPro.token.type.comment) {
          break;
        }
    }

    return end;
};

ChordPro.command = {};

ChordPro.command.type = {
    title:           'ChordPro.command.type.title',
    subtitle:        'ChordPro.command.type.subtitle',
    comment:         'ChordPro.command.type.comment',
    start_of_chorus: 'ChordPro.command.type.start_of_chorus',
    end_of_chorus:   'ChordPro.command.type.end_of_chorus',
    tag:             'ChordPro.command.type.tag',
    metronome:       'ChordPro.command.type.metronome'
};

ChordPro.command.definitions = [
    {
        type:   ChordPro.command.type.title,
        regex:  /^(t|title):\s*(.*)$/,
        open:   true,
        compile: function (token) {
            var title = token.match[2];

            return {
                type:  ChordPro.command.type.title,
                value: title
            };
        }
    },
    {
        type:   ChordPro.command.type.subtitle,
        regex:  /^(st|subtitle):\s*(.*)*$/,
        open:   true,
        compile: function (token) {
            var subtitle = token.match[2];

            return {
                type:  ChordPro.command.type.subtitle,
                value: subtitle
            };
        }
    },
    {
        type:   ChordPro.command.type.comment,
        regex:  /^(c|comment):\s*(.*)$/,
        open:   true,
        compile: function (token) {
            var comment = token.match[2];

            return {
                type:  ChordPro.command.type.comment,
                value: comment
            };
        }
    },
    {
        type:   ChordPro.command.type.start_of_chorus,
        regex:  /^(soc|start_of_chorus)$/,
        open:   true,
        compile: function (token) {
            return {
                type:  ChordPro.command.type.start_of_chorus,
            };
        }
    },
    {
        type:   ChordPro.command.type.end_of_chorus,
        regex:  /^(eoc|end_of_chorus)$/,
        open:   false,
        compile: function (token) {
            var subtitle = token.match[2];

            return {
                type:  ChordPro.command.type.end_of_chorus,
            };
        }
    },
    {
        type:   ChordPro.command.type.tag,
        regex:  /^tag:\s*(.*)$/,
        open:   true,
        compile: function (token) {
            var tag = token.match[1];

            return {
                type:  ChordPro.command.type.tag,
                value: tag
            };
        }
    },
    {
        type:   ChordPro.command.type.metronome,
        regex:  /^metronome:\s*(.*)$/,
        open:   true,
        compile: function (token) {
            var tempo = token.match[1];

            return {
                type:  ChordPro.command.type.metronome,
                value: tempo
            };
        }
    }
];

ChordPro.command.handler = [];

for (var i = 0; i < ChordPro.command.definitions.length; i++) {
    var definition = ChordPro.command.definitions[i];
    ChordPro.command.handler[definition.type] = definition;
};


ChordPro.command.tokenize = function (expression)
{
    var token = {},

        definition = null,
        regex = null,
        match = null;

    expression = expression.trim();

    for (var i=0; i < ChordPro.command.definitions.length; i++) {
        definition = ChordPro.command.definitions[i];
        if (match = expression.match(definition.regex)) {
            token.type = definition.type;
            token.match = match;

            return token;
        }
    } 
};

ChordPro.command.compile = function (rawToken)
{
    var expression = rawToken.value.trim(),
        token = ChordPro.command.tokenize.apply(this, [expression]),
        tokenTemplate = ChordPro.command.handler[token.type];

    if (tokenTemplate.compile) {
        token = tokenTemplate.compile.apply(this, [token]);
    }

    return token;
};

ChordPro.tokenize = function (template)
{
    var tokens = [],

        // The start and type of the first token found in the template.
        foundToken = null,
    
        // The end position of the matched token.
        end = null;

    while (template.length > 0) {
        foundToken = ChordPro.token.findStart(template);

        if (foundToken.position !== null) {
            // Add a raw type token for anything before the start of the token.
            if (foundToken.position > 0) {
                tokens.push({
                    type:  ChordPro.token.type.raw,
                    value: template.substring(0, foundToken.position)
                });
            }

            template = template.substring(foundToken.position + foundToken.def.open.length);

            // Find the end of the token.
            end = ChordPro.token.findEnd(template, foundToken.def);

            tokens.push({
                type:  foundToken.def.type,
                value: template.substring(0, end).trim()
            });

            if (foundToken.def.type === ChordPro.token.type.command && template.substr(end + foundToken.def.close.length, 1) === '\n') {
                // Newlines directly after command tokens are ignored.
                end += 1;
            }

            template = template.substring(end + foundToken.def.close.length);
        }

        else {
            // No more tokens.
            // Add the rest of the template as a raw-type token.
            tokens.push({
                type:  ChordPro.token.type.raw,
                value: template
            });

            template = '';
        }
    }

    return tokens;
};

ChordPro.compile = function (tokens)
{
    var output = [],
        token = null;

    while (tokens.length > 0) {
        token = tokens.shift();

        switch (token.type) {
            case ChordPro.token.type.raw:
                // Extract linebreaks into separate tokens

                var idx = token.value.indexOf('\n');
                if (idx === -1) {
                    output.push(token);
                    break;
                }

                var value = token.value;

                while (value.length > 0) {
                    if (idx > 0) {
                        output.push({
                            type:  ChordPro.token.type.raw,
                            value: value.substring(0, idx)
                        });

                        value = value.substring(idx);
                        idx = 0;
                    }

                    var lastToken = output[output.length - 1];

                    if (lastToken && lastToken.type === ChordPro.token.type.linebreak) {
                        lastToken.amount++;
                    } else {
                        output.push({
                            type:   ChordPro.token.type.linebreak,
                            amount: 1
                        });
                    }

                    value = value.substring(1);
                    idx = value.indexOf('\n');

                    if (idx === -1) {
                        output.push({
                            type:  ChordPro.token.type.raw,
                            value: value
                        });
                        break;
                    }
                }

                break;

            case ChordPro.token.type.chord:
                output.push(token);
                break;

            case ChordPro.token.type.comment:
                break;

            case ChordPro.token.type.command:
                var compiledToken = ChordPro.command.compile.apply(this, [token]);
                //if (compiledToken.type == ChordPro.command.type.start_of_chorus) {
                //    output.push('<p class="chorus">');
                //} else if (compiledToken.type == ChordPro.command.type.end_of_chorus) {
                //    output.push('</p>');
                //} else console.log(compiledToken.type);

                output.push(compiledToken);
                break;
        }
    }

    return output;
};

ChordPro.parseHTML = function (tokens)
{
    var output = [];
    var lastToken = null;

    var tags = {};

    function tagIsOpened(tag)
    {
        return tags.hasOwnProperty(tag) && tags[tag];
    }

    function closeTag(tag)
    {
        if (!tagIsOpened) {
            console.warn('Trying to close tag "' + tag + '", but it\'s not opened');
            return;
        }

        output.push('</' + tag + '>');
        delete tags[tag];
    }

    function openTag(tag, autoClose, attributes)
    {
        if (autoClose === undefined) {
            autoClose = true;
        }

        if (autoClose) {
            closeTag(tag);
        } else if (tagIsOpened(tag)) {
            return;
        }

        var html = '<' + tag;

        if (attributes) {
            for (var key in attributes) {
                html += ' ' + key + '="' + attributes[key] + '"';
            }
        }

        html += '>';

        output.push(html);
        tags[tag] = true;
    }

    tokens.forEach(function parseToken(token) {
        switch (token.type) {
            case ChordPro.command.type.title:
                output.push('<h1>' + token.value + '</h1>');
                break;

            case ChordPro.command.type.subtitle:
                output.push('<h2>' + token.value + '</h2>');
                break;

            case ChordPro.token.type.chord:
                openTag('span', true);

                output.push('<em>' + token.value + '</em>');
                break;

            case ChordPro.token.type.raw:
                openTag('section', false);
                output.push(token.value);
                break;

            case ChordPro.token.type.linebreak:
                closeTag('span');

                if (token.amount >= 2) {
                    openTag('section', true);
                } else {
                    output.push('<br />');
                }

                break;

            case ChordPro.command.type.start_of_chorus:
                if (lastToken && lastToken.type === ChordPro.token.type.linebreak) {
                    //output.pop();
                }

                openTag('section', true, { class: 'chorus' });
                break;

            case ChordPro.command.type.end_of_chorus:
                closeTag('section');
                break;

            case ChordPro.command.type.comment:
                output.push('<div class="comment">' + token.value + '</div>');
                break;
        }

        lastToken = token;
    });

    return output.join('');
};
