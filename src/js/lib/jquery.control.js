(function () {
    var classes = {};
    var init = false;
    var fnTest = /xyz/.test(function () {
        xyz;
    }) ? /\b_super\b/ : /.*/;
    var Class = function () {

    };
    Class.prototype = {
        instance: function (params) {
            return new this.constructor(params);
        },
        proxy: function (fn) {
            fn = typeof(fn) === 'string' ? this[fn] : fn;
            return (function (cx, cb) {
                return function () {
                    return cb.apply(cx, [this].concat(Array.prototype.slice.call(arguments)))
                };
            })(this, fn);
        }
    };
    Class.extend = function (instance, name) {
        var prop, proto, parent = this.prototype;
        init = true;
        proto = new this();
        init = false;
        for (prop in instance) {
            if (instance.hasOwnProperty(prop)) {
                if (typeof(parent[prop]) === 'function' &&
                    typeof(instance[prop]) === 'function' &&
                    fnTest.test(instance[prop])
                ) {
                    proto[prop] = (function (name, fn) {
                        return function () {
                            var temp = this._super, result;
                            this._super = parent[name];
                            result = fn.apply(this, arguments);
                            this._super = temp;
                            return result;
                        };
                    })(prop, instance[prop]);
                } else {
                    proto[prop] = instance[prop];
                }
            }
        }
        function Class() {
            if (!init && this.init) this.init.apply(this, arguments);
        }
        Class.prototype = proto;
        Class.prototype.name = name;
        Class.prototype.constructor = Class;
        Class.extend = arguments.callee;
        return Class;
    };

    this.Class = Class;

})();

(function () {
    var classes = {};
    $.createClass = function (name, extend, proto) {
        if (classes[name]) {
            console.info('class with name [%s] is already exist', name);
            return classes[name];
        }
        classes[name] = (proto ? classes[extend] : Class ).extend(proto ? proto : extend, name);
        return classes[name];
    };
    $.getClass = function (name, data) {
        if (typeof(classes[name]) !== 'function') return;
        return new classes[name](data);
    };
})();

(function ($) {
    var classes = {};
    var controls = [];
    var Control = Class.extend({
        window: $(window),
        document: $(document),
        init: function (element) {
            this.pushInstance();
            this.initElement(element);
            this.create(element);
        },
        pushInstance: function () {
            controls.push(this);
        },
        initElement: function (element) {
            this.element = $(this._element_ = element);
            this.element.addClass(this.name.split('.').join('-'));
        },
        create: function (element) {

        },
        toArray: function (arr) {
            return Array.prototype.slice.call(arr);
        },
        compareArray: function (arr1, arr2) {
            return JSON.stringify(arr1) === JSON.stringify(arr2);
        },
        initBindings: function () {
            if (!this._bindings_)
                this._bindings_ = [];
        },
        addBinding: function (args) {
            this.initBindings();
            this._bindings_.push([].concat(args));
        },
        proxy: function (fn) {
            if (!this._proxy_cache_) this._proxy_cache_ = {};
            if (!this._proxy_cache_[fn]) {
                this._proxy_cache_[fn] = this._super(fn);
            }
            return this._proxy_cache_[fn];
        },
        el: function (tag) {
            return $(document.createElement(tag));
        },
        clearProxyCache: function () {
            for (var prop in this._proxy_cache_) {
                if (this._proxy_cache_.hasOwnProperty(prop)) {
                    delete this._proxy_cache_[prop];
                }
            }
        },
        bind: function () {
            var el, args = this.toArray(arguments);
            this.addBinding(args);
            if (args.length === 3)
                args[2] = this.proxy(args[2]);
            if (args.length === 4)
                args[3] = this.proxy(args[3]);
            el = this[args[0]] || $(args[0]);
            el.on.apply(el, args.slice(1));
            return this;
        },
        unbind: function () {
            var i, el, args = this.toArray(arguments);
            this.initBindings();
            for (i = 0; i < this._bindings_.length; i++) {
                if (this.compareArray(this._bindings_[i], args)) {
                    if (args.length === 3)
                        args[2] = this.proxy(args[2]);
                    if (args.length === 4)
                        args[3] = this.proxy(args[3]);
                    el = this[args[0]] || $(args[0]);
                    el.off.apply(el, args.slice(1));
                    this._bindings_.splice(1, i);
                }
            }
            return this;
        },
        unbindAll: function () {
            var i;
            this.initBindings();
            for (i = 0; i < this._bindings_.length; i++)
                this.unbind.apply(this, this._bindings_[i]);
            return this;
        },
        on: function () {
            var args = this.toArray(arguments);
            if (args.length === 2) {
                args[1] = this.proxy(args[1]);
            }
            if (args.length === 3) {
                args[2] = this.proxy(args[2]);
            }
            this.element.on.apply(this.element, args);
            return this;
        },
        off: function () {
            var args = this.toArray(arguments);
            if (args.length === 2) {
                args[1] = this.proxy(args[1]);
            }
            if (args.length === 3) {
                args[2] = this.proxy(args[2]);
            }
            this.element.off.apply(this.element, args);
            return this;
        },
        timeout: function (callback, time) {
            if (!this._idle_timeout_) this._idle_timeout_ = {};
            clearTimeout(this._idle_timeout_[callback]);
            delete this._idle_timeout_[callback];
            this._idle_timeout_[callback] = setTimeout(this.proxy(callback), time);
            return this;
        },
        find: function () {
            return this.element.find.apply(this.element, arguments);
        },
        destroy: function () {
            this.off();
            this.unbindAll();
            this.clearProxyCache();
            this.element.removeClass(this.name.split('.').join('-'));
            this.element.removeData();
        },
        canBeDestroyed: function () {
            return this._element_ ? document.body.contains(this._element_) === false : false;
        }
    });

    function sortControls(a, b) {
        var c = a.querySelectorAll('[control]').length,
            d = b.querySelectorAll('[control]').length;
        if ((c && !d) || (c > d)) return 1;
        if ((!c && d) || (c < d)) return -1;
        return 0;
    }
    function cleanControls(forse) {
        controls = controls.filter(function (control) {
            if (control.canBeDestroyed() || forse) {
                control.destroy();
                return false;
            }
            return true;
        });
    }
    $.createControl = function (name, extend, proto) {
        if (classes[name]) {
            console.info('control with name [%s] is already exist', name);
            return classes[name];
        }
        classes[name] = (proto ? classes[extend] : Control ).extend(proto ? proto : extend, name);
        return classes[name];
    };
    $.cleanControls = cleanControls;
    $.initControl = function (name, params) {
        if (typeof(classes[name]) !== 'function') return;
        return new classes[name](params);
    };
    $.fn.extend({
        initControls: function () {
            cleanControls();
            this.find('[control]').toArray()
                .sort(sortControls)
                .forEach(function (item) {
                    item.getAttribute('control').split(',').forEach(function(name){
                        $.initControl(name,item);
                    });
                    item.removeAttribute('control');
                });
        }
    });
})(jQuery);


(function ($) {
    var classes = {};
    var Model = Class.extend({
        init: function (data){
            this.extend(data);
        },
        extend: function (data) {
            if ( data ) {
                this.data = data;
            } else {
                this.data = {};
            }
        },
        each: function () {
            var args = arguments;
            var name = args[1] ? args[0] : null;
            var callback = args[1] ? args[1] : args[0];
            var prop, value = name ? this.alt(name, []) : this.data;
            for (prop in value) {
                if (value.hasOwnProperty(prop)) {
                    callback(this.instance(value[prop]), value[prop], prop);
                }
            }
        },
        isPlainObject: function (value) {
            return $.isPlainObject(value);
        },
        isArray: function (value) {
            return $.isArray(value);
        },
        isFunction:function(value){
            return $.isFunction(value);
        },
        attrs: function (props) {
            this.data = (function (data, parent, prop) {
                for (prop in data) {
                    if (data.hasOwnProperty(prop)) {
                        if (parent[prop] && this.isFunction(parent[prop]['serialize'])) {
                            parent[prop].attrs(data[prop]);
                        } else {
                            if (this.isArray(data[prop]) || this.isPlainObject(data[prop])) {
                                if (this.isArray(data[prop]))
                                    parent[prop] = parent[prop] || [];
                                if (this.isPlainObject(data[prop]))
                                    parent[prop] = parent[prop] || {};
                                arguments.callee.call(this,data[prop],parent[prop]);
                            }
                            else {
                                parent[prop] = data[prop];
                            }
                        }
                    }
                }
                return parent;
            }).call(this, props, this.data);
            return this;
        },
        attr: function (key, value) {
            var i = 0, tmp,
                data = this.data,
                name = (key || '').split('.'),
                prop = name.pop(),
                len = arguments.length;
            for (; i < name.length; i++) {
                if (data && data.hasOwnProperty(name[i])) {
                    if (this.isFunction(data[name[i]]['serialize'])) {
                        tmp = [key.split('.').slice(i+1).join('.')];
                        len === 2 && tmp.push(value);
                        return data[name[i]].attr.apply(data[name[i]], tmp);
                    } else {
                        data = data[name[i]];
                    }
                }
                else {
                    if (len === 2) {
                        data = (data[name[i]] = {});
                    }
                    else {
                        break;
                    }
                }
            }
            if (len === 1) {
                return data ? data[prop] : undefined;
            }
            if (len === 2) {
                data[prop] = value;
            }
            return this;
        },
        serialize: function () {
            return (function (result, data) {
                var prop;
                for (prop in data) {
                    if (data.hasOwnProperty(prop)) {
                        if (typeof(data[prop]['serialize']) === 'function') {
                            result[prop] = data[prop].serialize();
                        } else {
                            if (this.isArray(data[prop]) || this.isPlainObject(data[prop])) {
                                if (this.isArray(data[prop]))
                                    result[prop] = {};
                                if (this.isPlainObject(data[prop]))
                                    result[prop] = {};
                                arguments.callee.call(this, result[prop], data[prop]);
                            } else {
                                result[prop] = data[prop]
                            }
                        }
                    }
                }
                return result;
            }).call(this, {}, this.data);
        },
        stringify: function () {
            return JSON.stringify(this.serialize());
        },
        alt: function (prop, defaults) {
            prop = this.attr(prop);
            return typeof(prop) === 'undefined' ? defaults : prop;
        }
    });
    $.createModel = function (name, extend, proto) {
        if (classes[name]) {
            console.info('model with name [%s] is already exist', name);
            return classes[name];
        }
        classes[name] = (proto ? classes[extend] : Model ).extend(proto ? proto : extend, name);
        return classes[name];
    };
    $.getModel = function (name, data) {
        if (typeof(classes[name]) !== 'function') return;
        return new classes[name](data);
    };
})(jQuery);

(function ($) {

    $.location = {
        prefix: '#',
        type: 'hash',
        callbacks: [],
        event: null,
        binded: false,
        link: document.createElement('a') ,
        ctrlKey:function(){
            return window.event && window.event.ctrlKey;
        },
        popup:function(url){
            this.link.setAttribute('href',url);
            this.tab = window.open(this.link.href,'_blank');
            this.tab.focus();
        },
        url: function (url, replace) {
            if(this.ctrlKey()){
                this.popup(url);
            } else{
                location[replace === true ? 'replace' : 'assign'](url);
            }
            return this;
        },
        normalize: function (url) {
            var prefix = this.prefix;
            if (url.indexOf('http') === 0) prefix = '';
            else if (url.indexOf('#') === 0) prefix = '';
            return [prefix, url].join('');
        },
        assign: function (url, silence) {
            this.silence(silence);
            return this.url(this.normalize(url));
        },
        replace: function (url, silence) {
            this.silence(silence);
            return this.url(this.normalize(url), true);
        },
        changeUrl:function(value,replace,silence){
            this[replace ? 'replace' : 'assign'](value, silence);
        },
        href: function () {
            return location[this.type].slice(1);
        },
        part: function (index) {
            return this.href().split('#')[0].split('?')[index] || '';
        },
        query: function (value, replace, silence) {
            if (arguments.length) {
                value = value ? [this.part(0), $.param(value)].join('?') : this.part(0);
                this.changeUrl(value,replace,silence);
            } else {
                return $.deparam(this.part(1));
            }
        },
        anchor: function (value, replace, silence) {
            if (arguments.length) {
                value = value ? [this.href().split('#')[0], value.replace('#', '')].join('#') : this.href().split('#')[1];
                this.changeUrl(value,replace,silence);
            } else {
                return this.href().split('#')[1] || '';
            }
        },
        path: function (value, replace, silence) {
            if (arguments.length) {
                value = this.part(1) ? [value, this.part(1)].join('?') : value || '/';
                this.changeUrl(value,replace,silence);
            } else {
                return this.part(0);
            }
        },
        segment: function (p, v, r, s) {
            var path = this.part(0).split('/');
            if (v) (path[p] = v) && this.path(path.join('/'), r, s);
            return path[p];
        },
        proxy: function (callback) {
            return (function (cx) {
                return function () {
                    return cx[callback].apply(cx, arguments);
                }
            })(this);
        },
        bind: function (callback) {
            this.callbacks.push(callback);
            if (!this.binded) {
                this.binded = true;
                $(window).on('hashchange.location', this.proxy('change'));
            }
        },
        unbind: function (callback) {
            this.callbacks.splice(this.callbacks.indexOf(callback), 1);
        },
        host: function () {
            return location.host;
        },
        indexOf: function (str, index) {
            return this.href().indexOf(str) === index
        },
        silence:function( state ){
            if( arguments.length === 0 ) return this.SILENCE_HASH_CHANGE;
            this.SILENCE_HASH_CHANGE = state;
            return this;
        },
        reload : function(){
            this.silence(false);
            this.change();
        },
        change: function () {
            var index;
            if (this.silence() === true) {
                return this.silence(false);
            }
            if (this.callbacks.length) {
                for (index in this.callbacks) {
                    this.callbacks.hasOwnProperty(index) &&
                    this.callbacks[index].call(this);
                }
            }
        }
    };

})(jQuery);


(function ($) {
    var breaker = /[^\[\]]+|\[\]$/g;
    function attr(data, name) {
        var i = 0,
            name = (name || '').split('.'),
            prop = name.pop();
        for (; i < name.length; i++) {
            if (data && data.hasOwnProperty(name[i])) {
                data = data[name[i]];
            }
            else {
                break;
            }
        }
        return data ? data[prop] : null;
    }
    var deparam = function (params, coerce, spaces) {
        var obj = {},
            coerce_types = {'true': !0, 'false': !1, 'null': null};
        if (spaces) params = params.replace(/\+/g, ' ');
        params.split('&').forEach(function (v) {
            var param = v.split('='),
                key = decodeURIComponent(param[0]),
                val,
                cur = obj,
                i = 0,
                keys = key.split(']['),
                keys_last = keys.length - 1;
            if (/\[/.test(keys[0]) && /\]$/.test(keys[keys_last])) {
                keys[keys_last] = keys[keys_last].replace(/\]$/, '');
                keys = keys.shift().split('[').concat(keys);
                keys_last = keys.length - 1;
            } else {
                keys_last = 0;
            }
            if (param.length === 2) {
                val = decodeURIComponent(param[1]);
                if (coerce) {
                    val = val && !isNaN(val) && ((+val + '') === val) ? +val
                        : val === 'undefined' ? undefined
                        : coerce_types[val] !== undefined ? coerce_types[val]
                        : val;
                }
                if (keys_last) {
                    for (; i <= keys_last; i++) {
                        key = keys[i] === '' ? cur.length : keys[i];
                        cur = cur[key] = i < keys_last
                            ? cur[key] || ( keys[i + 1] && isNaN(keys[i + 1]) ? {} : [] )
                            : val;
                    }
                } else {
                    if (Object.prototype.toString.call(obj[key]) === '[object Array]') {
                        obj[key].push(val);
                    } else if ({}.hasOwnProperty.call(obj, key)) {
                        obj[key] = [obj[key], val];
                    } else {
                        obj[key] = val;
                    }
                }

            } else if (key) {
                obj[key] = coerce
                    ? undefined
                    : '';
            }
        });
        return obj;
    };

    function clean(obj) {
        var prop;
        for (prop in obj) {
            if (obj.hasOwnProperty(prop)) {
                if (obj[prop].length === 0) {
                    if ($.isArray(obj)) obj.splice(prop, 1);
                    if ($.isPlainObject(obj)) delete obj[prop];
                } else if (typeof(obj[prop]) === 'object') {
                    clean(obj[prop]);
                }
            }
        }
        return obj;
    }
    $.fn.serializeAndEncode = function () {
        return $.map(this.serializeArray(), function (field) {
            return [field.name, encodeURIComponent(field.value)].join('=');
        }).join('&');
    };
    $.fn.getFormData = function (filter, coerce, spaces) {
        var params = deparam(this.serializeAndEncode(), coerce, false);
        return filter === true ? clean(params) : params;
    };
    $.fn.setFormData = function (data) {
        this.find('[name]').each(function () {
            var value;
            var current = $(this);
            var parts = current.attr('name').match(breaker);
            if (value = attr(data, parts.join('.'))) {
                if (current.is(":radio")) {
                    if (current.val() === value) {
                        current.attr("checked", true);
                    }
                } else if (current.is(":checkbox")) {
                    value = $.isArray(value) ? value : [value];
                    if ($.inArray(current.val(), value) > -1) {
                        current.attr("checked", true);
                    }
                } else {
                    current.val(value);
                }
            }
        });
        return this;
    };
    $.deparam = deparam;
    $.parseQuery = function (qs) {
        return deparam(qs, true, true);
    };
})(jQuery);

(function ($) {
    var cache = {};
    $.locale = {
        defaults: 'en',
        current: 'en',
        path: 'locales/',
        file: '/translation.json',
        data: {}
    };
    $.locale.load = function (lang) {
        cache[lang] = cache[lang] || $.ajax({
                context: this,
                url: this.path.concat(lang).concat(this.file)
            });
        cache[lang].then(function (data) {
            this.data = data;
        });
        return cache[lang];
    };
    $.locale.lang = function (lang) {
        this.current = lang;
        return this;
    };
    $.locale.get = function (value) {
        return this.data[value] || value;
    };
    window._ = function (value) {
        return $.locale.get(value);
    };
})(jQuery);

(function ($) {
    var cache = {};
    var settings = {
        evaluate: /<%([\s\S]+?)%>/g,
        interpolate: /<%=([\s\S]+?)%>/g,
        escape: /<%-([\s\S]+?)%>/g
    };
    var noMatch = /(.)^/;
    var escapes = {
        "'": "'",
        '\\': '\\',
        '\r': 'r',
        '\n': 'n',
        '\t': 't',
        '\u2028': 'u2028',
        '\u2029': 'u2029'
    };
    var escaper = /\\|'|\r|\n|\t|\u2028|\u2029/g;
    var htmlEntities = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#x27;'
    };
    var entityRe = new RegExp('[&<>"\']', 'g');
    var escapeExpr = function (string) {
        if (string == null) return '';
        return ('' + string).replace(entityRe, function (match) {
            return htmlEntities[match];
        });
    };
    var counter = 0;
    var tmpl = function (text, data) {
        var render;
        var matcher = new RegExp([
                (settings.escape || noMatch).source,
                (settings.interpolate || noMatch).source,
                (settings.evaluate || noMatch).source
            ].join('|') + '|$', 'g');
        var index = 0;
        var source = "__p+='";
        text.replace(matcher, function (match, escape, interpolate, evaluate, offset) {
            source += text.slice(index, offset)
                .replace(escaper, function (match) {
                    return '\\' + escapes[match];
                });

            if (escape) {
                source += "'+\n((__t=(" + escape + "))==null?'':escapeExpr(__t))+\n'";
            }
            if (interpolate) {
                source += "'+\n((__t=(" + interpolate + "))==null?'':__t)+\n'";
            }
            if (evaluate) {
                source += "';\n" + evaluate + "\n__p+='";
            }
            index = offset + match.length;
            return match;
        });
        source += "';\n";
        if (!settings.variable) source = 'with(obj||{}){\n' + source + '}\n';
        source = "var __t,__p='',__j=Array.prototype.join," +
            "print=function(){__p+=__j.call(arguments,'');};\n" +
            source + "return __p;\n//# sourceURL=/tmpl/source[" + counter++ + "]";
        try {
            render = new Function(settings.variable || 'obj', 'escapeExpr', source);
        } catch (e) {
            e.source = source;
            throw e;
        }
        if (data) return render(data, escapeExpr);
        var template = function (data) {
            return render.call(this, data, escapeExpr);
        };
        template.source = 'function(' + (settings.variable || 'obj') + '){\n' + source + '}';
        return template;
    };

    var ejs = Class.extend({
        config: {
            ext: '.ejs'
        },
        init: function (params) {
            this.params = params;
            this.template = new ejs.view;
            if (this.params.url) {
                return this.request();
            }
            if (this.params.html) {
                this.template.source = this.params.html;
                return this.output();
            }
        },
        url: function () {
            var url = this.params.url;
            url = url + ( url.indexOf(this.config.ext) != -1 ? '' : this.config.ext );
            return url;
        },
        request: function () {
            var source,url    = this.url();
            if( source = $.ejs.views[url] ){
                this.template.source = source;
            } else {
                this.request = $.ajax({type: 'get', url: url, cache:false , async: false});
                this.template.source = this.request.status == 200 ? this.request.responseText : '';
            }
            this.template.path   = this.params.path;
            this.output();
        },
        output: function () {
            this.template.output = tmpl(this.template.source);
        },
        render: function (data) {
            data = this.template.extend(data);
            return this.template.output.call(data, data);
        }
    });

    ejs.view = Class.extend({
        extend: function (data) {
            return $.extend(false, {}, this, data || {}, ejs.helpers);
        },
        include: function (url, data){
            return $.ejs(this.format(url,this)).render(this.extend(data));
        },
        format:function(value,params){
            return (value || '').replace(/{(.+?)}/g, function (match, prop) {
                return typeof(params[prop]) != 'undefined' ? params[prop] : match;
            });
        }
    });

    ejs.helpers = {
        each: function (object, callback) {
            var prop;
            for (prop in object) object.hasOwnProperty(prop) && callback(object[prop], prop);
        }
    };

    $.ejs = function (url){
        if (cache[url]) return cache[url];
            cache[url] = new ejs({
                url  : $.ejs.path.concat('/').concat( url ),
                path : url.split('/').slice(0,-1).join('/')
            });
        return cache[url];
    };
    $.ejs.cache = new Date().getTime();
    $.ejs.path = 'templates';
    $.ejs.html = function (source) {
        cache[source] = new ejs({html: source});
        return cache[source];
    };
    $.ejs.helper = function (name, func) {
        ejs.helpers[name] = func;
    };
})(jQuery);


(function ($) {
    var pathToRegexp = function (path) {
        var result, keys = [], parse = function (_, slsh, format, key, capture, opt) {
            keys.push({name: key, optional: !!opt});
            slsh = slsh || '';
            return '' + (opt ? '' : slsh) + '(?:' + (opt ? slsh : '') + (format || '') + (capture || (format && '([^/.]+?)' || '([^/]+?)')) + ')' + (opt || '');
        };
        path = path.concat('/?');
        path = path.replace(/\/\(/g, '(?:/')
            .replace(/\+/g, '__plus__')
            .replace(/(\/)?(\.)?:(\w+)(?:(\(.*?\)))?(\?)?/g, parse)
            .replace(/([\/.])/g, '\\$1')
            .replace(/__plus__/g, '(.+)')
            .replace(/\*/g, '(.*)');
        result = new RegExp('^' + path + '$', '');
        result.keys = keys;
        return result;
    };
    var pathMatch = function (regexp, path) {
        var key;
        var match = regexp.exec(path);
        var params = {};
        if (!match) return false;
        for (var i = 1, len = match.length; i < len; ++i)
            if (key = regexp.keys[i - 1])
                params[key.name] = (typeof(match[i]) == 'string') ? decodeURIComponent(match[i]) : match[i];
        return params;
    };
    var gotoUrl = function (el, link) {
        link = document.createElement('a');
        link.href = el.getAttribute('href') || el.getAttribute('data-href');
        link.target = el.getAttribute('target') || el.getAttribute('data-target');
        document.body.appendChild(link);
        link.rel = 'tmp';
        link.click();
        link.parentNode.removeChild(link);
        return false;
    };
    var changeHash = function (ev) {
        var chunks = $.location.href().split('?'),
            path = this.getAttribute('href') || this.getAttribute('data-href'),
            query = this.hasAttribute('data-query') || false;
        if (path.indexOf('http') === 0) {
            if (this.rel === 'tmp') return;
            ev.preventDefault();
            ev.stopPropagation();
            gotoUrl(this);
            return;
        }
        path = path.slice(1);
        ev.preventDefault();
        if (path.charAt(0) === '/') {
            path = query && chunks[1] ? path.concat('?').concat(chunks[1]) : path;
            $.location.assign(path);
        }
        else if (path.charAt(0) === '?') {
            path = path == '?' ? chunks[0] : chunks[0].concat(path);
            $.location.assign(path);
        }
    };
    var listener = {
        hashchange: function (run) {
            $(document).on('click', '[href],[data-href]', changeHash);
            $.location.bind(function () {
                run(this.path());
            });
            if ($.location.part(0) === '') {
                $.location.assign('/');
            } else {
                run($.location.path());
            }
        }
    };

    $.createModel('router.request', {
        query: function () {
            return $.location.query();
        },
        match: function (exp) {
            return new RegExp(exp).test(this.attr('path'));
        }
    });

    $.createModel('router.response', {
        init: function () {
            this._super();
            this.defer = [];
        },
        load: function () {
            var def = $.Deferred();
            var res = this;
            $.when.apply(res, arguments).then(function () {
                def.resolve.apply(res, arguments);
            }, function (xhr, type, message) {
                if (String(xhr.status).match('404|403')) {
                    res.attr('data.page', '/page/error/'.concat(xhr.status));
                    def.reject.apply(res, arguments);
                }
            });
            this.defer.push(def);
            return def;
        },
        render: function (wrapper, template, data) {
            return $(wrapper).html($.ejs(template).render(data)).initControls();
        },
        stop: function () {
            this.defer.forEach(function (defer) {
                defer.reject();
            });
            this.defer.length = 0;
            return this;
        }
    });
    $.createClass('route', {
        init: function (name) {
            this.params = {};
            this.callbacks = [];
            this.preloads = [];
            this.name = name;
            this.regex = pathToRegexp(name);
        },
        then: function (fn) {
            this.callbacks.push(fn);
            return this;
        },
        use: function (file) {
            this.preloads.push((function (that, file) {
                return function (req, res, next) {
                    that.loadFile(file, next);
                };
            })(this, file));
            return this;
        },
        match: function (path) {
            this.path = path;
            this.params = pathMatch(this.regex, this.path);
            return !!this.params;
        },
        getCallbacks: function () {
            return this.callbacks;
        },
        getPreloads: function () {
            this.cleanPreloads();
            return this.preloads;
        },
        cleanPreloads: function () {
            var prop, list = Array.prototype.slice.call(document.getElementsByClassName('route-import'));
            for (prop in list) {
                if (list.hasOwnProperty(prop)) {
                    list[prop].parentNode.removeChild(list[prop]);
                }
            }
        },
        loadFile: function (file, callback) {
            var script = document.createElement('script');
            var className = file.split('/').join('-');
            if (document.getElementsByClassName(className)[0])
                return callback();
            script.src = file.concat('.js');
            script.async = true;
            script.className = ['route-import', className].join(' ');
            script.onload = callback;
            document.getElementsByTagName('head')[0].appendChild(script);
        }
    });

    $.createClass('router', {
        init: function () {
            this._before_ = [];
            this._after_ = [];
            this._routes_ = {};
            this.request = $.getModel('router.request');
            this.response = $.getModel('router.response');
        },
        route: function (path) {
            var route = this._routes_[path] || $.getClass('route', path);
            this._routes_[path] = route;
            return route;
        },
        before: function (fn) {
            this._before_.push(fn);
            return this;
        },
        after: function (fn) {
            this._after_.push(fn);
            return this;
        },
        process: function (list, complete) {
            (function (that, index) {
                var next = arguments.callee;
                if (!list[index]) return complete.call(that);
                list[index].call(that, that.request, that.response, function () {
                    next(that, ++index);
                });
            })(this, 0);
        },
        start: function (route) {
            this.request.attr('path', route.path);
            this.request.attr('params', route.params);
            this.request.attr('query', this.request.query());
            this.response.stop();
            this.response.attr('data', {});
            this.process(this._before_, function () {
                this.process(route.getPreloads(), function () {
                    this.process(route.getCallbacks(), function () {
                        this.process(this._after_, function () {

                        });
                    });
                });
            });
        },
        find: function (path) {
            var route;
            for (route in this._routes_) {
                if (this._routes_.hasOwnProperty(route)) {
                    route = this._routes_[route];
                    if (route.match(path)) {
                        this.start(route);
                        break;
                    }
                }
            }
        },
        listen: function (callback) {
            if (typeof(callback) === 'string' && typeof(listener[callback]) === 'function')
                callback = listener[callback];
            callback((function (that) {
                return function (path) {
                    that.find(path);
                };
            })(this));
            return this;
        }
    });
})(jQuery);