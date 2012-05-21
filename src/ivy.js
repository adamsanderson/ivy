Ivy = {
  _id: 1,
  _callers: {}
};

Ivy.attr = function ObservableAttr(value, parseFn){
  if (!(this instanceof Ivy.attr)) return new Ivy.attr(value, parseFn);
    
  this.value = value;
  this.parseFn = parseFn;
  this.callbacks = {};
  this._id = Ivy._id++;
};

Ivy.attr.prototype.set = function(value){
  value = this.parseFn ? this.parseFn(value) : value;
  
  if (this.value === value) return this;

  this.value = value;
  this.emit('change', this.get());
  
  return this;
};

Ivy.attr.prototype.get = function(){
  return this.value;
};

Ivy.attr.prototype.on = function(event, fn){
  (this.callbacks[event] = this.callbacks[event] || [])
    .push(fn);
  return this;
};

Ivy.attr.prototype.off = function(event, fn){
  var callbacks = this.callbacks[event];

  if (!callbacks) return this;

  if (arguments.length === 1){
    // remove all handlers
    delete this.callbacks[event];
  } else {
    // remove specific handler
    var i = callbacks.indexOf(fn);
    callbacks.splice(i, 1);
  }

  return this;
};

Ivy.attr.prototype.emit = function(event){
  var args = [].slice.call(arguments, 1);
  var callbacks = this.callbacks[event];
  
  if (callbacks){
    var callers = Ivy._callers[event] = Ivy._callers[event] || {};
    if (callers[this._id]){ 
      return console.warn("Cycle detected on", this._id);
    } else {
      callers[this._id] = 1;
    }
    
    for (var i = 0, len = callbacks.length; i < len; ++i){
      callbacks[i].apply(this, args);
    }
    
    delete callers[this._id];
  }

  return this;
};

Ivy.attr.prototype.valueOf = function(){
  return this.get();
};

Ivy.attr.prototype.toJSON = function(){
  return this.get();
};

// ----------------------------------------------------------------------------
Ivy.fn = function(){
  var args = Array.prototype.slice.call(arguments),
      fn   = args.pop(),
      attr = Ivy.attr();
  
  function compute(){
    attr.set( fn.apply(attr, args) );
  }
  
  for(var i=0; i < args.length; i++){ 
    args[i].on('change', compute); 
  }
  compute();
  
  return attr;
};

Ivy.fnWith = function(context, fn){
  var names = Ivy.util.argumentNames(fn),
      args  = [];
  
  for(var i=0, len=names.length; i < len; i++){
    args.push(context[names[i]]);
  }
  
  args.push(fn);
  
  return Ivy.fn.apply(this, args);
};

// ----------------------------------------------------------------------------
Ivy.array = function ObservableArray(array){
  if (!(this instanceof Ivy.array)) return new Ivy.array(array);

  this.value = array || [];
  this.callbacks = {};
  this._id = Ivy._id++;
};
Ivy.array.prototype = Ivy.attr();

Ivy.array.prototype.set = function(index, item){
  if (arguments.length === 1) return Ivy.attr.prototype.set.call(this, index);

  this.value[index] = item;
  this.emit('change', this.get());
  
  return this;
};

Ivy.array.prototype.get = function(index){
  return (arguments.length === 0) ? this.value : this.value[index];
};

Ivy.array.prototype.push = function(item){
  this.value.push(item);
  this.emit('change', this.get(), item);
};

Ivy.array.prototype.unshift = function(item){
  this.value.unshift(item);
  this.emit('change', this.get(), item);
};

Ivy.array.prototype.pop = function(){
  var item = this.value.pop();
  this.emit('change', this.get(), item);
  return item;
};

Ivy.array.prototype.shift = function(){
  var item = this.value.shift();
  this.emit('change', this.get(), item);
  return item;
};

Ivy.array.prototype.remove = function(item){
  var index = this.value.indexOf(item);
  return this.removeIndex(index);
};

Ivy.array.prototype.removeIndex = function(index){
  if (index === -1) return;
  
  var item = this.value.splice(index,1)[0];
  this.emit('change', this.get(), item);
  return item;
};

Ivy.array.prototype.length = function(){
  return this.value.length;
};

// ----------------------------------------------------------------------------
// Wrap an attribute with a decorator object or function
Ivy.wrap = function WrappedAttr(attr, wrapper){
  if (!(this instanceof Ivy.wrap)) return new Ivy.wrap(attr, wrapper);
  
  if (typeof wrapper === 'function'){
    wrapper = {get: wrapper};
  }
  wrapper.get = wrapper.get || function(v){ return v;};
  wrapper.set = wrapper.set || function(v){ return v;};
  
  this.attr      = attr;
  this.wrapper   = wrapper;
  this.callbacks = {};
  this._id       = Ivy._id++;
  
  // Proxy events for 'change'
  var self = this;
  this.attr.on('change', function(value){
    value = self.wrapper.get(value);
    self.emit.call(self, 'change', value);
  });
};
Ivy.wrap.prototype = Ivy.attr();

Ivy.wrap.prototype.get = function(){
  var value = this.attr.get();
  return this.wrapper.get(value);
};

Ivy.wrap.prototype.set = function(value){
  value = this.wrapper.set(value);
  this.attr.set(value);
  return this;
};

//-----------------------------------------------------------------------------

Ivy.bindAttrToValue = function(el, attrName, domEvent){
  var attr = this.atPath(attrName),
      delayedCallback;
      
  domEvent = domEvent || 'change';
  
  Ivy.watchAttr(attr, 'change', updateEl);
  if (attr.set){ el.addEventListener(domEvent, updateAttr); }

  function updateEl(value){ 
    if (document.activeElement === el){
      if (delayedCallback) return;
        
      delayedCallback = function(event){
        updateEl(attr.valueOf());
        el.removeEventListener('blur',delayedCallback);
        delayedCallback = null;
      };
      el.addEventListener('blur', delayedCallback);
      
    } else {
      el.value = value;
    }
  }
  
  function updateAttr(){
    attr.set(el.value);
  }
};

Ivy.bindAttrToChecked = function(el, attrName, domEvent){
  var attr = this.atPath(attrName),
      isRadio = el.type === 'radio';
  
  domEvent = domEvent || 'change';
  
  Ivy.watchAttr(attr, 'change', updateEl);
  if (attr.set){ el.addEventListener(domEvent, updateAttr); }

  function updateEl(value){
    el.checked = isRadio ? (value == el.value) : (!!value);
  }
  
  function updateAttr(){
    if (isRadio){
      if (el.checked) attr.set(el.value);
    } else {
      attr.set(!!el.checked);
    }
  }
};

Ivy.bindAttrToText = function(el, attrName){
  var attr = this.atPath(attrName);
  
  Ivy.watchAttr(attr, 'change', updateEl);
  function updateEl(value){ 
    Ivy.util.clearChildren(el);
    el.appendChild(document.createTextNode(value));
  }
};

Ivy.bindAttrToStyle = function(el, attrName, style){
  var attr = this.atPath(attrName);
  
  Ivy.watchAttr(attr, 'change', updateEl);
  function updateEl(value){ el.style[style] = value; }
};

Ivy.bindAttrToDomAttr = function(el, attrName, domAttr){
  var attr = this.atPath(attrName),
      booleanPropery = Ivy.bindAttrToDomAttr.booleanProperties[domAttr];
  
  Ivy.watchAttr(attr, 'change', updateEl);
  function updateEl(value){
    if (booleanPropery){
      !!value ? el.setAttribute(domAttr, domAttr) : el.removeAttribute(domAttr);
    } else {
      el.setAttribute(domAttr, value); 
    }
  }
};
Ivy.bindAttrToDomAttr.booleanProperties = {
  'disabled': true
};

Ivy.bindAttrToEach = function(el, attrName){
  var attr = this.atPath(attrName),
      fragment = Ivy.util.detachChildren(el),
      context  = this.context;
      
  el.__managed = true; // this is a managed node
  Ivy.watchAttr(attr, 'change', updateEl);
  
  function updateEl(val){
    Ivy.util.clearChildren(el);
    for(var i=0, len=val.length; i < len; i++){
      var childNode = fragment.cloneNode(true);
      Ivy.bindDom(childNode, val[i], context);
      el.appendChild(childNode);
    }
  }
  
};

Ivy.bindAttrToWith = function(el, attrName){
  var attr     = this.atPath(attrName),
      fragment = Ivy.util.detachChildren(el),
      context  = this.context;
      
  el.__managed = true; // this is a managed node
  Ivy.watchAttr(attr, 'change', updateEl);
  
  function updateEl(val){
    var childNode = fragment.cloneNode(true);
    Ivy.util.clearChildren(el);
    Ivy.bindDom(childNode, val, context);
    el.appendChild(childNode);
  }
};

Ivy.bindAttrToShow = function(el, attrName){
  var attr = this.atPath(attrName),
      originalDisplayStyle = el.style.display;
      
  Ivy.watchAttr(attr, 'change', updateEl);
  
  function updateEl(val){
    el.style.display = val ? originalDisplayStyle : 'none';
  }
};

Ivy.bindFnToEvent = function(el, eventName, fnPath){
  var fn = this.atPath(fnPath),
      receiver = this.atPath(fnPath.split('/').slice(0,-1).join('/'));
      subject  = this.context; // should be a 2nd param at some point

  if (subject['ivy:proto']){ 
    subject = subject['ivy:proto'];
  }
  
  el.addEventListener(eventName, makeListener(receiver,subject));
  
  function makeListener(receiver, subject){
    return function(event){
      fn.call(receiver, subject);
      event.preventDefault();
    };
  }
};

Ivy.watchAttr = function(attr, event, callback){
  if (attr.on){
    attr.on(event, callback);
  }
  callback(attr.valueOf());
};

Ivy.bindDom = function(el, context, parent){
  var el = el || document.body,
      context = context || window,
      bindings;
  
  if (typeof el === 'string'){
    el = document.getElementById(el);
  }
  
  if (parent){
    context = Ivy.util.beget(context);
    context['..'] = parent;
  }
  
  if (el.nodeType === Node.ELEMENT_NODE){
    bindings = Ivy.getBindings(el,context);
    if (bindings){
      for(var i=0, len=bindings.length; i < len; i++){
        Ivy.bindElement(el, bindings[i]);
      }
    }
  }
  
  // Only descend if this node has not been the root of any bindings already:
  if (el.__managed) return;
  
  for(var i=0, children = el.children || el.childNodes, len=children.length; i < len; i++){
    Ivy.bindDom(children[i], context);
  }
};

Ivy.getBindings = function(el, context){
  var bindText = el.getAttribute('data-bind'),
      bindingRules = [],
      bindings;
  
  if (!bindText) return null;
  bindings = bindText.trim().split(/\s*;\s*/);
  
  for(var i=0, len=bindings.length; i < len; i++){
    if (bindings[i].match(/^\s*$/)) continue; // ignore whitespace only rules
    bindingRules.push(new Ivy.BindingRule(bindings[i], context));
  }
  
  return bindingRules;
};

Ivy.bindings = {
  'value':    Ivy.bindAttrToValue,
  'checked':  Ivy.bindAttrToChecked,
  'text':     Ivy.bindAttrToText,
  'style':    Ivy.bindAttrToStyle,
  'attr':     Ivy.bindAttrToDomAttr,
  'each':     Ivy.bindAttrToEach,
  'show':     Ivy.bindAttrToShow,
  'with':     Ivy.bindAttrToWith,
  'on':       Ivy.bindFnToEvent
};

Ivy.bindElement = function(el, bindingRule){
  var name = bindingRule.name,
      args = [el].concat(bindingRule.options),
      bindingFn;

  bindingFn = Ivy.bindings[name];
  if (!bindingFn){ 
    console.warn('Unkown binding: ', name, bindingRule);
  } else {
    bindingFn.apply(bindingRule,args);
  }
};

Ivy.BindingRule = function(str, context){
  var options = str.trim().split(/\s+/),
      name = options.shift();
  
  if (!name.charAt(name.length - 1) === ':'){
    throw new Error("Invalid syntax for binding name.\n\t"+str);
  }
  
  this.name     = name.slice(0,-1);
  this.options  = options;
  this.context  = context;
};

Ivy.BindingRule.prototype.atPath = function(path, context){
  context = context || this.context;
  if (path === '.' || path === ''){ 
    return context;
  } else if (path.indexOf('../') === 0){
    return this.atPath(path.slice(3), context['..']);
  } else {
    return context[path];
  }
};

// ----------------------------------------------------------------------------
Ivy.util = {};
Ivy.util.detachChildren = function(el){
  var df = document.createDocumentFragment(),
      children = [].slice.apply(el.children); // Convert from NodeList to Array
  
  for (var i=0, len=children.length, child; i < len; i++){
    df.appendChild(el.removeChild(children[i]));
  }
  
  return df;
};
Ivy.util.clearChildren = function(el){
  while( el.hasChildNodes() ){
    el.removeChild( el.firstChild );
  }
};
Ivy.util.copy = function(src){
  return JSON.parse(JSON.stringify(src));
};
// From prototype.js
Ivy.util.argumentNames = function(fn){
  var names = fn.toString().match(/^[\s\(]*function[^(]*\(([^\)]*)\)/)[1]
    .replace(/\s+/g, '').split(',');
  return names.length == 1 && !names[0] ? [] : names;
};
// From Crockford -- modified to include the prototype for environments 
// that don't support `__proto__` or `getPrototypeOf`.
Ivy.util.beget = function(prototype){
  var F = function() {};
  F.prototype = prototype;
  var object = new F();
  object['ivy:proto'] = prototype;
  return object;
};