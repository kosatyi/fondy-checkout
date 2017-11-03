(function($){

    $.createModel('base', {
        call: function ( method ) {
            if (typeof(this[method]) == 'function') {
                return this[method].apply(this, Array.prototype.slice.call(arguments, 1));
            }
        }
    });

    $.createModel('api', 'base',  {
        getInstance:function(){
            if(!this.constructor.instance){
                this.constructor.instance = $checkout('Api');
            }
            return this.constructor.instance;
        },
        init: function (data){
            this.extend(data);
        },
        send: function (endpoint,method,params){
            var defer    = $.Deferred();
            var model    = this;
            this.getInstance().scope(function(){
                this.request(endpoint,method,params).then(function(response){
                    defer.resolve(response);
                },function(response){
                    defer.reject(response);
                });
            });
            return defer;
        }
    });

    $.createModel( 'api.checkout' , 'api' , {
        app: function(params){
            return this.send('api.checkout','app',params);
        },
        submit: function(params){
            return this.send( 'api.checkout.form','request', params );
        },
        cards:function(params){
            return this.send( 'api.checkout.cards','get', params );
        }
    });

    $.createModel( 'view' , 'base' , {
        unpkg: 'https://unpkg.com/fondy-checkout@latest/',
        cdn:function(url){
            return this.unpkg.concat(url)
        }
    });

    $.createModel( 'params' , 'base' , {

    });

})(jQuery);

(function($){

    $.createControl('ui.base' , {
        deparam: function (obj) {
            var prop;
            var result = {};
            var breaker = /[^\[\]]+|\[\]$/g;
            var attr = function (name, value) {
                var i, data = result, last = name.pop(), len = name.length;
                for (i = 0; i < len; i++) {
                    if (!data[name[i]])
                        data[name[i]] = len == i + 1 && last == '[]' ? [] : {};
                    data = data[name[i]];
                }
                if (last == '[]') {
                    data.push(value);
                } else {
                    data[last] = value;
                }
            };
            for (prop in obj) {
                if (obj.hasOwnProperty(prop)) {
                    attr(obj[prop].name.match(breaker), obj[prop].value);
                }
            }
            return result;
        },
        getView: function (name,folder) {
            return $.ejs([folder||'page',name].join('/'));
        },
        getModel: function(name,data){
            return $.getModel(name,data);
        },
        toStrictType:function(value){
            var numeric = /^\-?[1-9]+(\.[0-9]+)?$/;
            var types   = {'true':true,'false':false,'null':null};
            if( numeric.test(value) ) return +value;
            return value in types ? types[value] : value;
        },
        getMetaFields:function(){
            var toStrictType = this.toStrictType;
            return this.find('meta[name],param[name],input[name]').map(function(i,e){
                return{
                    name  : e.getAttribute('name'),
                    value : toStrictType(e.getAttribute('value') || e.getAttribute('content'))
                }
            }).toArray();
        },
        getMetaConfig:function(){
            return this.deparam(this.getMetaFields());
        }
    });

    $.createControl('ui.datepicker', {
        create: function () {
            this.picker();
        },
        picker: function () {
            this.element.datetimepicker({
                locale: moment.locale(),
                format: this.element.attr('format') || 'DD.MM.YYYY HH:mm'
            });
            this.data = this.element.data();
            this.datetimepicker = this.element.data("DateTimePicker");
            this.config();
        },
        config: function () {
            this.on( 'dp.show' , 'show' );
            if (this.element.data('today')) {
                this.datetimepicker.minDate(moment());
            }
            if (this.element.data('default')) {
                this.datetimepicker.defaultDate(moment(this.element.data('default')));
            }
        },
        show: function () {
            if (this.element.data('min'))
                this.datetimepicker.minDate(moment(this.element.data('min')));
            if (this.element.data('max'))
                this.datetimepicker.maxDate(moment(this.element.data('max')));
        }
    });

    $.createControl('ui.toggle.group', {
        create: function () {
            this.data = this.element.data();
            this.on('click', 'toggle');
        },
        toggle: function () {
            $(this.data.target).toggleClass(this.data.class)
        }
    });

    $.createControl('ui.cc.cvv', {
        create: function () {
            this.field = this.find('[data-field]');
            this.input = this.find('[data-input]');
            this.placeholder = this.input.attr('placeholder');
            this.maxlength   = this.input.attr('maxlength');
            this.mask        = this.find('[data-mask]');
            this.on('focus', 'triggerFocus');
            this.on('keydown paste', '[data-input]', 'keydown');
            this.on('focus blur', '[data-input]', 'toggleFocus');
            this.on('reset','[data-field]','clear');
            this.on('focus','[data-field]','triggerFocus');
        },
        keydown: function (el, ev) {
            clearTimeout(this.idle);
            this.event = ev;
            this.idle = setTimeout(this.proxy('change'), 20);
        },
        clear: function () {
            this.newValue = '';
            this.oldValue = '';
            this.event = {keyCode: 0};
            this.changeValue();
            this.togglePlaceholder();
            this.updateValue();
        },
        change: function(){
            this.newValue = this.onlyNumeric(this.input.val());
            this.oldValue = this.field.val();
            this.changeValue();
            this.togglePlaceholder();
            this.updateValue();
        },
        onlyNumeric: function(value){
            return String(value).match(/^[0-9]+$/) ? String(value) : '';
        },
        toggleFocus: function(){
            if(this.input.is(':focus')){
                this.element.addClass('state-focus');
            } else{
                this.element.removeClass('state-focus');
            }
        },
        triggerFocus: function () {
            this.input.focus();
            this.field.trigger('change');
        },
        triggerBlur: function () {
            this.field.trigger('blur');
        },
        updateValue: function () {
            this.input.val('');
            this.field.val(this.oldValue);
            this.field.trigger('change');
            this.mask.text(Array(this.oldValue.length + 1).join('X'));
        },
        isRemove: function () {
            return this.event.keyCode == 8 && this.newValue == '';
        },
        maxLength: function () {
            return (this.oldValue.length + this.newValue.length) <= this.maxlength;
        },
        togglePlaceholder: function () {
            if (this.oldValue) {
                this.input.removeAttr('placeholder');
            } else {
                this.input.attr('placeholder', this.placeholder);
            }
        },
        changeValue: function () {
            if (this.isRemove()) {
                this.oldValue = this.oldValue.slice(0,-1);
            } else if (this.maxLength()) {
                this.oldValue += this.newValue;
            }
        }
    });

    $.createControl('ui.toggle.list', {
        create: function () {
            this.data = this.element.data();
            this.events();
        },
        events: function () {
            this.on('click', '.toggle', 'toggle');
        },
        close:function(){

        },
        toggle: function (el, ev) {
            ev.preventDefault();
            $(el).toggleClass(this.data.self)
                .next().toggleClass(this.data.class);
        }
    });

    $.createControl('ui.recurring.period', {
        create: function(){
            this.on('change', 'select', 'change');
            this.select = this.find('select');
            this.select.attr('value') && this.select.val(this.select.attr('value'));
            this.select.trigger('change');
        },
        change: function (el) {
            var chunks = el.value.split(',');
            this.find('input:hidden').each(function (i, e) {
                e.value = chunks[i];
            })
        }
    });

    $.createControl('ui.tooltip', {
        create: function () {
            this.data = {};
            this.data.container = '.checkout-container';
            this.data.delay = 100;
            this.data.placement = 'top';
            this.data.html = true;
            this.data.selector = '[data-toggle="tooltip"]';
            this.document.tooltip(this.data);
        }
    });

    $.createControl('ui.modal.init',{
        defaults:{
            backdrop:false
        },
        wrapper: 'body' ,
        init: function ( config ) {
            this.config = $.extend({}, this.defaults, config);
            this.config.element = document.createElement('div');
            this.wrapper = $(this.wrapper);
            this.wrapper.append(this.config.element);
            this.pushInstance();
            this.initElement( this.config.element );
            this.create( this.element );
        },
        render:function(){
            this.modal = $.ejs(this.config.template).render();
            this.modal = $(this.modal);
            this.element.append(this.modal).initControls();
            this.modal.modal(this.config);
            this.modal.on('hidden.bs.modal',this.proxy('clean'));
        },
        clean: function () {
            this.modal.off();
            this.modal.remove();
            this.element.remove();
            this.destroy();
        }
    });

    $.createControl('ui.form.cc', {
        create: function () {
            this.card_number = this.find('input[name="card_number"]');
            this.expiry_date = this.find('input[name="expiry_date"]');
            this.cvv2        = this.find('input[name="cvv2"]');
            this.email       = this.find('input[name="email"]');
            this.on('click', '[data-card]', 'card');
        },
        card: function (el, ev) {
            ev.preventDefault();
            this.card = JSON.parse(el.getAttribute('data-card'));
            this.element.setFormData(this.card);
            this.card_number.trigger('change.bs.validator').trigger('keyup');
            this.expiry_date.trigger('change.bs.validator');
            this.email.trigger('change.bs.validator');
            this.cvv2.trigger('reset');
            this.cvv2.focus();
        }
    });

    $.createControl('ui.cards.list', 'ui.base' , {
        create: function () {
            this.data  = this.element.data();
            this.model = this.getModel('api.checkout');
            this.menu  = this.find('.dropdown-menu');
            this.template = this.getView('list.cards','block');
            this.on('show.bs.dropdown','show');
        },
        show: function (el, ev) {
            if(this.loading) return;
            this.loading = true;
            this.model.cards().then(this.proxy('render'));
        },
        render:function(xhr,model){
            this.menu.html(this.template.render({model:model}));
            this.loading = false;
        }
    });

    $.createControl('ui.checkout','ui.base',{
        create:function(){
            this.data     = {};
            this.config   = this.getMetaConfig();
            this.config.template = 'checkout';
            this.model    = this.getModel('api.checkout');
            this.state    = this.getModel('state').instance();
            this.on('submit','form','submit');
            this.on('click','[data-action]','action');
            this.locale().then(this.proxy('render'));
        },
        action:function(el,ev){
            var action = el.getAttribute('data-action').split(':');
            var name   = ['action',action[0]].join('_');
            var value  = action[1];
            if(typeof(this[name]) === 'function'){
                ev.preventDefault();
                this[name](el,value);
            }
        },
        action_modal:function(el,value){
            $.initControl('ui.modal.init',{
                template: ['modal',value].join('/')
            }).render();
        },
        action_page:function(el,value){
            this.config.template = value;
            this.render();
        },
        action_widget: function(el,value){
            this.data.params.attr('payment_system',el.getAttribute('data-type'));
            this.load_widget(value);
            this.action_menu(el,'hide');
        },
        action_lang:function(el,value){
            this.config.params.lang = value;
            this.locale().then(this.proxy('render'));
        },
        action_menu: function(el,value){
            var state = 'hidden';
            switch (value){
                case 'show':
                    this.menu.removeClass(state);
                    this.wrapper.addClass(state);
                break;
                case 'hide':
                    this.menu.addClass(state);
                    this.wrapper.removeClass(state);
                break;
                case 'toggle':
                    this.menu.toggleClass(state);
                    this.wrapper.toggleClass(state);
                break;
            }
        },
        load_widget:function(value){
            this.wrapper.html(this.getView(value,'widget').render(this.data));
            this.wrapper.initControls();
        },
        request: function(){
            this.model.app(this.config.params).then(this.proxy('render'));
        },
        locale:function(){
            return $.locale.load(this.config.params.lang);
        },
        submit: function (el, ev) {
            if (ev.isDefaultPrevented()) return;
                ev.preventDefault();
            this.loading(true);
            this.params = $.extend({},this.config.params,this.form.getFormData(true));
            this.model.submit(this.params).done(this.proxy('success')).fail(this.proxy('error'));
        },
        loading:function(state){
            this.find('.checkout-form').toggleClass('loading',state);
        },
        success:function(xhr,model){
            if(model.sendResponse()) return;
            this.loading(false);
            model.submitToMerchant();
            if( model.needVerifyCode() ){
                this.config.template     = 'verify';
                this.config.params.token = model.attr('order.token');
                this.render();
            }
        },
        error:function(xhr,model){
            this.loading(false);
            this.find('[data-message]').removeClass('hidden')
                .html(this.getView('message','error').render({model:model}));
        },
        render: function(){
            this.data.params = this.getModel('params',this.config.params);
            this.data.view   = this.getModel('view',this.config.view);
            this.state.attr('params',this.data.params);
            this.state.attr('view',this.data.params);
            this.element.html(this.getView(this.config.template).render(this.data)).initControls();
            this.wrapper = this.find('[data-form-wrapper]');
            this.menu    = this.find('[data-payment-methods]');
            this.form    = this.find('[data-form]').validator({});
        }
    });

})(jQuery);

(function($){
    $.createModel('state',{
        instance:function(){
            if(!this.constructor.singleton){
                this.constructor.singleton = this._super();
            }
            return this.constructor.singleton;
        },
        init:function(){
            this.data     = {};
            this.listener = $(document.createElement('div'));
        },
        set:function(key,value){
            var old = this.get(key);
            this.attr(key,value);
            if( old === undefined ) this.trigger('add',key,value,old);
            if( value !== old ) this.trigger('change',key,value,old);
            this.trigger(key,key,value,old);
        },
        get:function(key){
            return this.attr(key);
        },
        trigger:function(key){
            var props  = Array.prototype.slice.call(arguments,1);
            var params = [key,props];
            this.listener.trigger.apply(this.listener,params);
            return this;
        },
        on:function(key,callback){
            this.listener.on.apply(this.listener,arguments);
            return this;
        },
        off:function(key,callback){
            this.listener.off.apply(this.listener,arguments);
            return this;
        }
    });
    $.createControl('ui.state',{
        create:function(){
            this.state = $.getModel('state').instance();
            this.on( 'keypress input change copy paste' , '[data-bind]' ,'value');
            this.state.on( 'change' , this.proxy('handler') );
        },
        value:function(el,ev){
            if( this.process ) return;
            this.event   = ev;
            this.target  = el;
            this.process = true;
            this.timeout('change',25);
        },
        change:function(){
            this.process = false;
            this.prop    = this.target.getAttribute('data-bind');
            this.state.set(this.prop,this.target.value);
        },
        handler:function(el,ev,key,value){
            var list = this.find('[data-bind="'+key+'"]').not(this.target);
            list.each(function(index,element){
                element.value     = value;
                element.innerHTML = value;
            });
        }
    });
})(jQuery);