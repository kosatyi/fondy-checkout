(function($){
    var select = document.createElement('select');
    var input  = document.createElement('input');
        input.type = 'text';
    var attr     = function(el,name,value){
        if( value !== '' && typeof(value) !== 'undefined')
            el.setAttribute(name,value);
    };
    var jsstr = function(str){
        try{
            str = (new Function(['return',str].join(' ')))()
        } catch(e) {
            str = [];
        }
        return str;
    };
    var setoptions = function(field,list,placeholder){
        var opt  = document.createElement('option');
        var node = opt.cloneNode(false);
        attr(node,'disabled','true');
        attr(node,'selected','selected');
        node.innerText = placeholder;
        field.appendChild(node);
        list.forEach(function(item,node){
            node = opt.cloneNode(false);
            attr(node,'value',item);
            node.innerText = item;
            field.appendChild(node);
        })
    };
    var customInput = function(node,key,data){
        var hidden,field;
        hidden       = input.cloneNode(false);
        attr(hidden,'name',['custom[',key,'][label]'].join(''));
        attr(hidden,'value',data.label);
        attr(hidden,'type','hidden');
        field        = node.cloneNode(false);
        if(data.hidden) field.type = 'hidden';
        attr(field,'name',['custom[',key,'][value]'].join(''));
        attr(field,'class','form-control');
        attr(field,'value',data.value);
        attr(field,'required',data.required);
        attr(field,'pattern',data.pattern);
        attr(field,'title',data.label);
        attr(field,'placeholder',data.placeholder );
        attr(field,'readonly',data.readonly );
        if(data.list && data.list.length) setoptions(field,data.list,data.placeholder);
        return [hidden.outerHTML,field.outerHTML].join('');
    };
    $.ejs.helper('customField',function(key,data){
        switch(data.type){
            case 'select':
                return customInput(select,key,data);
            break;
            default:
                return customInput(input,key,data);
        }
    });
})(jQuery);

(function ($) {
    $.jMaskGlobals.watchDataMask = true;
    $(document).initControls();
})(jQuery);
