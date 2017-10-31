(function ($) {
    var defaultFormat = /(\d{1,4})/g;
    var __indexOf = [].indexOf || function (item) {
            for (var i = 0, l = this.length; i < l; i++) {
                if (i in this && this[i] === item) return i;
            }
            return -1;
        };
    var cards = [
        {
            type: 'elo',
            patterns: [401178, 401179, 431274, 438935, 451416, 457393, 457631, 457632, 504175, 506699, 5067, 509, 627780, 636297, 636368, 650, 6516, 6550],
            format: defaultFormat,
            length: [16],
            cvcLength: [3],
            luhn: true
        }, {
            type: 'maestro',
            patterns: [5018, 502, 503, 506, 56, 58, 639, 6220, 67],
            format: defaultFormat,
            length: [12, 13, 14, 15, 16, 17, 18, 19],
            cvcLength: [3],
            luhn: true
        }, {
            type: 'forbrugsforeningen',
            patterns: [600],
            format: defaultFormat,
            length: [16],
            cvcLength: [3],
            luhn: true
        }, {
            type: 'dankort',
            patterns: [5019],
            format: defaultFormat,
            length: [16],
            cvcLength: [3],
            luhn: true
        }, {
            type: 'visa',
            patterns: [4],
            format: defaultFormat,
            length: [13, 16],
            cvcLength: [3],
            luhn: true
        }, {
            type: 'mastercard',
            patterns: [51, 52, 53, 54, 55, 22, 23, 24, 25, 26, 27],
            format: defaultFormat,
            length: [16],
            cvcLength: [3],
            luhn: true
        }, {
            type: 'amex',
            patterns: [34, 37],
            format: /(\d{1,4})(\d{1,6})?(\d{1,5})?/,
            length: [15],
            cvcLength: [3, 4],
            luhn: true
        }, {
            type: 'dinersclub',
            patterns: [30, 36, 38, 39],
            format: /(\d{1,4})(\d{1,6})?(\d{1,4})?/,
            length: [14],
            cvcLength: [3],
            luhn: true
        }, {
            type: 'discover',
            patterns: [60, 64, 65, 622],
            format: defaultFormat,
            length: [16],
            cvcLength: [3],
            luhn: true
        }, {
            type: 'unionpay',
            patterns: [62, 88],
            format: defaultFormat,
            length: [16, 17, 18, 19],
            cvcLength: [3],
            luhn: false
        }, {
            type: 'jcb',
            patterns: [35],
            format: defaultFormat,
            length: [16],
            cvcLength: [3],
            luhn: true
        }
    ];

    $.createControl( 'ui.cc' , {
        eventTimeout: function (fn) {
            return setTimeout((function (cx) {
                return function () {
                    return fn.apply(cx, arguments);
                }
            })(this));
        },
        restrictNumeric: function (el, ev) {
            if (ev.metaKey || ev.ctrlKey)
                return true;
            if (ev.which === 32)
                return false;
            if (ev.which === 0)
                return true;
            if (ev.which < 33)
                return true;
            return !!/[\d\s]/.test(String.fromCharCode(ev.which));
        },
        cardFromNumber: function (num) {
            var card, p, pattern, _i, _j, _len, _len1, _ref;
            num = (num + '').replace(/\D/g, '');
            for (_i = 0, _len = cards.length; _i < _len; _i++) {
                card = cards[_i];
                _ref = card.patterns;
                for (_j = 0, _len1 = _ref.length; _j < _len1; _j++) {
                    pattern = _ref[_j];
                    p = pattern + '';
                    if (num.substr(0, p.length) === p) {
                        return card;
                    }
                }
            }
        },

        hasTextSelected: function (el) {
            var _ref;
            if ((el.selectionStart != null) && el.selectionStart !== el.selectionEnd) {
                return true;
            }
            if ((typeof document !== "undefined" && document !== null ? (_ref = document.selection) != null ? _ref.createRange : void 0 : void 0) != null) {
                if (document.selection.createRange().text) {
                    return true;
                }
            }
            return false;
        },
        isFocused: function (el) {
            var focused = document.activeElement;
            if (!focused || focused == document.body)
                focused = null;
            else if (document.querySelector)
                focused = document.querySelector(":focus");
            return el === focused;
        },
        safeVal: function (value, el) {
            var currPair, cursor, digit, last, prevPair;
            try {
                cursor = el.selectionStart;
            } catch (err) {
                cursor = null;
            }
            last = el.value;
            el.value = value;
            if (cursor !== null && this.isFocused(el)) {
                if (cursor === last.length) {
                    cursor = value.length;
                }
                if (last !== value) {
                    prevPair = last.slice(cursor - 1, +cursor + 1 || 9e9);
                    currPair = value.slice(cursor - 1, +cursor + 1 || 9e9);
                    digit = value[cursor];
                    if (/\d/.test(digit) && prevPair === ("" + digit + " ") && currPair === (" " + digit)) {
                        cursor = cursor + 1;
                    }
                }
                el.selectionStart = cursor;
                return el.selectionEnd = cursor;
                ;
            }
        },
        replaceFullWidthChars: function (str) {
            var chars, chr, fullWidth, halfWidth, idx, value, _i, _len;
            if (str == null) {
                str = '';
            }
            fullWidth = '\uff10\uff11\uff12\uff13\uff14\uff15\uff16\uff17\uff18\uff19';
            halfWidth = '0123456789';
            value = '';
            chars = str.split('');
            for (_i = 0, _len = chars.length; _i < _len; _i++) {
                chr = chars[_i];
                idx = fullWidth.indexOf(chr);
                if (idx > -1) {
                    chr = halfWidth[idx];
                }
                value += chr;
            }
            return value;
        }
    });

    $.createControl('ui.cc.number', 'ui.cc', {
        create: function () {
            this.on('keypress', 'restrictNumeric');
            this.on('keypress', 'restrictCardNumber');
            this.on('keypress', 'formatCardNumber');
            this.on('keydown', 'formatBackCardNumber');
            this.on('keyup', 'setCardType');
            this.on('paste', 'reFormatCardNumber');
            this.on('change', 'reFormatCardNumber');
            this.on('input', 'reFormatCardNumber');
            this.on('input', 'setCardType');
        },
        restrictCardNumber: function (el, ev) {
            var card, digit, value;
            digit = String.fromCharCode(ev.which);
            if (!/^\d+$/.test(digit)) {
                return;
            }
            if (this.hasTextSelected(el)) {
                return;
            }
            value = (el.value + digit).replace(/\D/g, '');
            card = this.cardFromNumber(value);
            if (card) {
                return value.length <= card.length[card.length.length - 1];
            } else {
                return value.length <= 16;
            }
        },
        formatCardNumber: function (el, ev) {
            var card, digit, length, re, upperLength, value;
            digit = String.fromCharCode(ev.which);
            if (!/^\d+$/.test(digit)) {
                return;
            }
            value = el.value;
            card = this.cardFromNumber(value + digit);
            length = (value.replace(/\D/g, '') + digit).length;
            upperLength = 16;
            if (card) {
                upperLength = card.length[card.length.length - 1];
            }
            if (length >= upperLength) {
                return;
            }
            if ((el.selectionStart != null) && el.selectionStart !== value.length) {
                return;
            }
            if (card && card.type === 'amex') {
                re = /^(\d{4}|\d{4}\s\d{6})$/;
            } else {
                re = /(?:^|\s)(\d{4})$/;
            }
            if (re.test(value)) {
                ev.preventDefault();
                this.eventTimeout(function () {
                    return el.value = value + ' ' + digit;
                })
            } else if (re.test(value + digit)) {
                ev.preventDefault();
                this.eventTimeout(function () {
                    return el.value = value + digit + ' ';
                });
            }
        },
        formatBackCardNumber: function (el, ev) {
            var value = el.value;
            if (ev.which !== 8) {
                return;
            }
            if ((el.selectionStart != null) && el.selectionStart !== value.length) {
                return;
            }
            if (/\d\s$/.test(value)) {
                ev.preventDefault();
                this.eventTimeout(function () {
                    return el.value = value.replace(/\d\s$/, '');
                });
            } else if (/\s\d?$/.test(value)) {
                ev.preventDefault();
                this.eventTimeout(function () {
                    return el.value = value.replace(/\d$/, '');
                });
            }
        },
        cardType: function (num) {
            var _ref;
            if (!num) {
                return null;
            }
            return ((_ref = this.cardFromNumber(num)) != null ? _ref.type : void 0) || null;
        },
        setCardType: function (el, ev) {
            var target, allTypes, card, cardType, val;
            target = $(ev.currentTarget);
            val = el.value;
            cardType = this.cardType(val) || 'unknown';

            if (!target.hasClass(cardType)) {
                allTypes = (function () {
                    var _i, _len, _results;
                    _results = [];
                    for (_i = 0, _len = cards.length; _i < _len; _i++) {
                        card = cards[_i];
                        _results.push(card.type);
                    }
                    return _results;
                })();
                target.removeClass('unknown');
                target.removeClass(allTypes.join(' '));
                target.addClass(cardType);
                target.toggleClass('identified', cardType !== 'unknown');
                return target.trigger('changeCardType', cardType);
            }

        },
        getFormatCardNumber: function (num) {
            var card, groups, upperLength, _ref;
            num = num.replace(/\D/g, '');
            card = this.cardFromNumber(num);
            if (!card) {
                return num;
            }
            upperLength = card.length[card.length.length - 1];
            num = num.slice(0, upperLength);
            if (card.format.global) {
                return (_ref = num.match(card.format)) != null ? _ref.join(' ') : void 0;
            } else {
                groups = card.format.exec(num);
                if (groups == null) {
                    return;
                }
                groups.shift();
                groups = $.grep(groups, function (n) {
                    return n;
                });
                return groups.join(' ');
            }
        },
        reFormatCardNumber: function (el, ev) {
            return this.eventTimeout(function () {
                var value = el.value;
                value = this.replaceFullWidthChars(value);
                value = this.getFormatCardNumber(value);
                return this.safeVal(value, el);
            });
        }
    });

    $.createControl('ui.cc.expiry', 'ui.cc', {
        create: function () {
            this.on('keypress', 'restrictNumeric');
            this.on('keypress', 'restrictExpiry');
            this.on('keypress', 'formatExpiry');
            this.on('keypress', 'formatForwardSlashAndSpace');
            this.on('keypress', 'formatForwardExpiry');
            this.on('keydown', 'formatBackExpiry');
            this.on('change', 'reFormatExpiry');
            this.on('input', 'reFormatExpiry');
        },
        reFormatExpiry: function (el, ev) {
            this.eventTimeout(function () {
                var value = el.value;
                value = this.replaceFullWidthChars(value);
                value = this.getFormatExpiry(value);
                return this.safeVal(value, el);
            });
        },
        restrictExpiry: function (el, ev) {
            var digit, value;
            digit = String.fromCharCode(ev.which);
            if (!/^\d+$/.test(digit))
                return;
            if (this.hasTextSelected(el))
                return;
            value = el.value + digit;
            value = value.replace(/\D/g, '');
            if (value.length > 6) {
                return false;
            }
        },
        formatExpiry: function (el, ev) {
            var digit, val;
            digit = String.fromCharCode(ev.which);
            if (!/^\d+$/.test(digit)) {
                return;
            }
            val = el.value + digit;
            if (/^\d$/.test(val) && (val !== '0' && val !== '1')) {
                ev.preventDefault();
                return this.eventTimeout(function () {
                    return el.value = "0" + val + " / ";
                });
            } else if (/^\d\d$/.test(val)) {
                ev.preventDefault();
                this.eventTimeout(function () {
                    var m1, m2;
                    m1 = parseInt(val[0], 10);
                    m2 = parseInt(val[1], 10);
                    if (m2 > 2 && m1 !== 0) {
                        return el.value = "0" + m1 + " / " + m2;
                    } else {
                        return el.value = "" + val + " / ";
                    }
                });
            }
        },
        getFormatExpiry: function (expiry) {
            var mon, parts, sep, year;
            parts = expiry.match(/^\D*(\d{1,2})(\D+)?(\d{1,4})?/);
            if (!parts) {
                return '';
            }
            mon = parts[1] || '';
            sep = parts[2] || '';
            year = parts[3] || '';
            if (year.length > 0) {
                sep = ' / ';
            } else if (sep === ' /') {
                mon = mon.substring(0, 1);
                sep = '';
            } else if (mon.length === 2 || sep.length > 0) {
                sep = ' / ';
            } else if (mon.length === 1 && (mon !== '0' && mon !== '1')) {
                mon = "0" + mon;
                sep = ' / ';
            }
            return mon + sep + year;
        },
        formatForwardSlashAndSpace: function (el, ev) {
            var val, which;
            which = String.fromCharCode(ev.which);
            if (!(which === '/' || which === ' ')) {
                return;
            }
            val = el.value;
            if (/^\d$/.test(val) && val !== '0')
                return el.value = "0" + val + " / ";
        },
        formatForwardExpiry: function (el, ev) {
            var digit, val;
            digit = String.fromCharCode(ev.which);
            if (!/^\d+$/.test(digit))
                return;
            val = el.value;
            if (/^\d\d$/.test(val)) {
                return el.value = "" + val + " / ";
            }
        },
        formatBackExpiry: function (el, ev) {
            var value = el.value;
            if (ev.which !== 8) {
                return;
            }
            if ((el.selectionStart != null) && el.selectionStart !== value.length) {
                return;
            }
            if (/\d\s\/\s$/.test(value)) {
                ev.preventDefault();
                this.eventTimeout(function () {
                    return el.value = value.replace(/\d\s\/\s$/, '');
                });
            }
        }
    });

    $.createControl('ui.cc.cvc', 'ui.cc', {
        create: function () {
            this.on('keypress', 'restrictNumeric');
            this.on('keypress', 'restrictCVC');
            this.on('paste', 'reFormatCVC');
            this.on('change', 'reFormatCVC');
            this.on('input', 'reFormatCVC');
        },
        restrictCVC: function (el, ev) {
            var $target, digit, val;
            $target = $(ev.currentTarget);
            digit = String.fromCharCode(ev.which);
            if (!/^\d+$/.test(digit)) {
                return;
            }
            if (this.hasTextSelected(el)) {
                return;
            }
            val = $target.val() + digit;
            return val.length <= 4;
        },
        reFormatCVC: function (el, ev) {
            this.eventTimeout(function () {
                var value = el.value;
                value = this.replaceFullWidthChars(value);
                value = value.replace(/\D/g, '').slice(0, 4);
                return this.safeVal(value, el);
            });
        }
    });

    $.cardFromNumber = function(num) {
        var card, p, pattern, _i, _j, _len, _len1, _ref;
        num = (num + '').replace(/\D/g, '');
        for (_i = 0, _len = cards.length; _i < _len; _i++) {
            card = cards[_i];
            _ref = card.patterns;
            for (_j = 0, _len1 = _ref.length; _j < _len1; _j++) {
                pattern = _ref[_j];
                p = pattern + '';
                if (num.substr(0, p.length) === p) {
                    return card;
                }
            }
        }
    };
    $.luhnCheck = function(num) {
        var digit, digits, odd, sum, _i, _len;
        odd = true;
        sum = 0;
        digits = (num + '').split('').reverse();
        for (_i = 0, _len = digits.length; _i < _len; _i++) {
            digit = digits[_i];
            digit = parseInt(digit, 10);
            if ((odd = !odd)) {
                digit *= 2;
            }
            if (digit > 9) {
                digit -= 9;
            }
            sum += digit;
        }
        return sum % 10 === 0;
    };

    $.validateCardNumber = function(num) {
        var card, _ref;
        num = (num + '').replace(/\s+|-/g, '');
        if (!/^\d+$/.test(num)) {
            return false;
        }
        card = $.cardFromNumber(num);
        if (!card) {
            return false;
        }
        return (_ref = num.length, __indexOf.call(card.length, _ref) >= 0) && (card.luhn === false || $.luhnCheck(num));
    };

    $.validateCardExpiry = function(month, year) {
        var currentTime, expiry, _ref;
        if (typeof month === 'object' && 'month' in month) {
            _ref = month, month = _ref.month, year = _ref.year;
        }
        if (!(month && year)) {
            return false;
        }
        month = $.trim(month);
        year = $.trim(year);
        if (!/^\d+$/.test(month)) {
            return false;
        }
        if (!/^\d+$/.test(year)) {
            return false;
        }
        if (!((1 <= month && month <= 12))) {
            return false;
        }
        if (year.length === 2) {
            if (year < 70) {
                year = "20" + year;
            } else {
                year = "19" + year;
            }
        }
        if (year.length !== 4) {
            return false;
        }
        expiry = new Date(year, month);
        currentTime = new Date;
        expiry.setMonth(expiry.getMonth() - 1);
        expiry.setMonth(expiry.getMonth() + 1, 1);
        return expiry > currentTime;
    };

    $.cardFromType = function(type) {
        var card, _i, _len;
        for (_i = 0, _len = cards.length; _i < _len; _i++) {
            card = cards[_i];
            if (card.type === type) {
                return card;
            }
        }
    };
    $.validateCardCVC = function( cvc, type) {
        var card, _ref;
        cvc = $.trim(cvc);
        if (!/^\d+$/.test(cvc)) {
            return false;
        }
        card = $.cardFromType(type);
        if (card != null) {
            return _ref = cvc.length, __indexOf.call(card.cvcLength, _ref) >= 0;
        } else {
            return cvc.length >= 3 && cvc.length <= 4;
        }
    };
})(jQuery);

(function($){
    var validator;
    if( $.fn.validator &&
        $.fn.validator.Constructor &&
        $.fn.validator.Constructor.VALIDATORS ){
        validator = $.fn.validator.Constructor.VALIDATORS;
        validator.ccard = function($el,next){
            next( $el.val().indexOf('XX XXXX ')!==-1 || $.validateCardNumber($el.val()) );
        };
        validator.cvv2 = function($el,next){
            next($.validateCardCVC($el.val()));
        };
        validator.expdate = function($el,next){
            $el = ($el.val()||'').split('/');
            next( $.validateCardExpiry($el[0],$el[1]) );
        };
    }
})(jQuery);