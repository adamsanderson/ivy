Ivy = {
  attr: IvyAttr,
  array: IvyArray,
  wrap: IvyWrap
};

/** 
 * Creates an attribute. Attributes are the core of Ivy, they are observable
 * through the `on` listener.  Ivy attributes implement both `valueOf` and
 * `toJSON`, so they can usually be used like JavaScript primitives.
 * 
 *     var a = Ivy.attr(4),
 *         b = Ivy.attr(5);
 *     
 *     console.log(a+b); //=> 9
 * 
 * An optional `parseFn` may be passed in to help parse values:
 *  
 *      var c = Ivy.attr("7", Number)
 *      c.valueOf(); //=> 7
 */
function IvyAttr(value, parseFn){
  if (!(this instanceof IvyAttr)) return new IvyAttr(value, parseFn);
    
  this.value = value;
  this.parseFn = parseFn;
  this.callbacks = {};
  this._id = Ivy._id++;
};

/**
 * Sets the internal value of the attribute.
 */
IvyAttr.prototype.set = function(value){
  value = this.parseFn ? this.parseFn(value) : value;
  
  if (this.value === value) return this;

  this.value = value;
  this.emit('change', this.get());
  
  return this;
};

/**
 * Gets the internal value of the attribute.
 */
IvyAttr.prototype.get = function(){
  return this.value;
};

/**
 * Adds a listener `fn` to the attribute that will trigger on `event`.
 * The most common event is `change`.
 * 
 *     var a = Ivy.attr(4);
 *     a.on('change', function(value){ console.log('New value is', value); });
 *     a.set(5); //=> 'New value is 5'
 * 
 */
IvyAttr.prototype.on = function(event, fn){
  (this.callbacks[event] = this.callbacks[event] || [])
    .push(fn);
  return this;
};

/**
 * When given only an `event` type, stops all listeners for that event.
 * If `fn` is given, only that callback will be removed.
 */
IvyAttr.prototype.off = function(event, fn){
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

/**
 * Emits a named `event`. Any additional arguements will be passed
 * to the listeners.
 */
IvyAttr.prototype.emit = function(event){
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

/**
 * `valueOf` will return the attribute's internal value, this is useful when
 * doing simple operations on attributes:
 *
 *     Ivy.attr(4) + Ivy.attr(5); //=> 9
 *     Ivy.attr('Hello') + ' World'; //=> 'Hello World'
 *
 * Be careful when testing boolean conditions:
 *
 *     Ivy.attr(false) ? 'true' : 'false' //=> 'true'
 *
 */
IvyAttr.prototype.valueOf = function(){ 
  return this.get(); 
};

/**
 * `toJSON` will be called before `JSON.stringify` is called.  This lets you
 * easily serialize Ivy attributes:
 *
 *    var point = {x: Ivy.attr(3), y: Ivy.attr(7)};
 *    console.log(JSON.stringify(point)); //=> {"x":3,"y":7}
 *
 */
IvyAttr.prototype.toJSON = function(){ 
  return this.get(); 
};

/**
 * An `IvyArray` supports emits events like a normal attribute, but has
 * special methods for adding and removing array elements.
 *
 *     var array = Ivy.array([2,3,4]);
 *     array.get(1); //=> 3
 *     array.get(); //=> [2,3,4]
 */
function IvyArray(array){
  if (!(this instanceof Ivy.array)) return new Ivy.array(array);

  this.value = array || [];
  this.callbacks = {};
  this._id = Ivy._id++;
};
IvyArray.prototype = new IvyAttr;

/**
 * Sets either the entire array to a new value, or a specific
 * array element:
 *
 *     var array = Ivy.array();
 *     array.set([2,3,4]);
 *     array.set(1, "Hello");
 *     array.get(); //=> [2,"Hello",4]
 */
IvyArray.prototype.set = function(index, item){
  if (arguments.length === 1) return this.replace(index);
  
  var oldValue = this.value[index];
  this.value[index] = item;
  this.emit('change', this.get(), 
    new Ivy.ChangeSet()
      .remove(index, [oldValue])
      .add(index, [item])
  );
  
  return this;
};

/**
 * Gets either the array or an item at the given `index`.
 */
IvyArray.prototype.get = function(index){
  return (arguments.length === 0) ? this.value : this.value[index];
};

/**
 * Pushes an `item` onto the end of the array.
 *
 *     var array = Ivy.array([1,2,3]);
 *     array.push(4);
 *     array.get(); //=> [1,2,3,4]
 */
IvyArray.prototype.push = function(item){
  var index = this.length;
  this.value.push(item);
  this.emit('change', this.get(), new Ivy.ChangeSet().add(index, [item]) );
  return this;
};

/**
 * Pushes an `item` onto the front of the array.
 *
 *     var array = Ivy.array([1,2,3]);
 *     array.unshift(4);
 *     array.get(); //=> [4,1,2,3]
 *
 */
IvyArray.prototype.unshift = function(item){
  this.value.unshift(item);
  this.emit('change', this.get(), new Ivy.ChangeSet().add(0, [item]) );
  return this;
};

/**
 * Pops an item off the end of the array, and returns it.
 *
 *     var array = Ivy.array([1,2,3]);
 *     array.pop(); //=> 3
 *     array.get(); //=> [1,2]
 *
 */
IvyArray.prototype.pop = function(){
  var index = this.length;
  var item = this.value.pop();
  this.emit('change', this.get(), new Ivy.ChangeSet().remove(index, [item]) );
  return item;
};

/**
 * Shifts an item off the front of the array, and returns it.
 *
 *     var array = Ivy.array([1,2,3]);
 *     array.shift(); //=> 1
 *     array.get(); //=> [2,3]
 *
 */
IvyArray.prototype.shift = function(){
  var item = this.value.shift();
  this.emit('change', this.get(), new Ivy.ChangeSet().remove(0, [item]));
  return item;
};

/**
 * Replaces the array contents with a new `array`.
 *
 *     var array = Ivy.array([1,2,3]);
 *     array.replace([4,5,6]);
 *     array.get(); //=> [4,5,6]
 *
 */
IvyArray.prototype.replace = function(array){
  var oldValues = this.value;
  this.value = array;
  
  this.emit('change', this.get(), 
    new Ivy.ChangeSet()
      .remove(0, oldValues)
      .add(0, array)
  );
  
  return this;
};

/**
 * Removes an `item` from the array, and returns it.
 *
 *     var array = Ivy.array(["a", "b", "c"]);
 *     array.remove("b");
 *     array.get(); //=> ["a", "c"]
 *
 */
IvyArray.prototype.remove = function(item){
  var index = this.value.indexOf(item);
  return this.removeIndex(index);
};

/**
 * Removes any item from the array that matches the function `fn`.
 *
 *     var array = Ivy.array([1,2,3,4,5]);
 *     array.removeEach(function(i){ return i % 2; });
 *     array.get(); //=> [1,3,5]
 *
 * Returns an array of the items removed. The order of the items
 * is should not be relied upon.
 */
IvyArray.prototype.removeEach = function(fn){
  var i = this.value.length,
      items = [],
      item;
  
  while (i--){
    item = this.value[i];
    if (fn(item)){
      items.push(this.removeIndex(i));
    }
  }
  
  return items;
};

/**
 * Removes an item at a given `index`, and returns it.
 *
 *     var array = Ivy.array(["a", "b", "c"]);
 *     array.removeIndex(1);
 *     array.get(); //=> ["a", "c"]
 * 
 * Returns the removed item if any.
 */
IvyArray.prototype.removeIndex = function(index){
  if (index === -1) return;
  
  var item = this.value.splice(index,1)[0];
  if (item){
    this.emit('change', this.get(), new Ivy.ChangeSet().remove(index, [item]));
  }
  return item;
};

/**
 * Registers a `callback` for `event` on each array item as it is added,
 * and unregisters listeners when items are removed from the array.
 * 
 * A `getter` function can be used to bind to events on an object's properties.
 *
 *     function Todo(name){
 *       this.name = Ivy.attr(name);
 *       this.isDone = Ivy.attr(false);
 *     }
 *     
 *     var todos = Ivy.array();
 *     todos.onEach('change', function(isDone){
 *       console.log('Done state is now', isDone)
 *     }, function(todo){ return todo.isDone });
 *     
 *     todos.push(new Todo('Do something great!'));
 *     todos.get(0).isDone.set(true); //=> 'Done state changed'
 */
IvyArray.prototype.onEach = function(event, callback, getter){
  var changeSet;
  
  this.on('change', function(newArray, changes){
    for(var i=0; i < changes.length; i++){
      changeSet = changes[i];
      updateListeners(changeSet.operation, changeSet.items);
    }
  });
  
  updateListeners('add', this.value);
  function updateListeners(op, items){
    for(var i=0; i < items.length; i++){
      var attr = getter ? getter(items[i]) : items[i];
      if (!attr) continue;
      
      // Turn on or off listeners as items are added or removed
      attr[op === 'add' ? 'on' : 'off'](event, callback);
    }
  }
  
  return this;
};

/**
 * Returns the length of the internal array.
 */
IvyArray.prototype.length = function(){
  return this.value.length;
};

Ivy.ChangeSet = function(){};
Ivy.ChangeSet.prototype = [];
Ivy.ChangeSet.prototype.add = function(index, items){
  this.push({operation: 'add',index: index, items: items});
  return this;
};
Ivy.ChangeSet.prototype.remove = function(index, items){
  this.push({operation: 'remove',index: index, items: items});
  return this;
};

/**
 * Wrap an existing Ivy attribue, `attr`, with a `wrapper` 
 * providing custom getters and setters.
 *
 * The original attribute can still be accessed as normal.
 *
 *     var percent = Ivy.attr(0.1);
 *     var wrapped = Ivy.wrap(percent, {
 *       get: function(num){ return (num * 100) + '%'; },
 *       set: function(val){ return parseFloat(val) / 100; }
 *     });
 *     
 *     wrapped.get(); //=> "10%"
 *     wrapped.set("17%");
 *     percent.get(); //=> 0.17
 *
 * Use this to decorate attributes for display.
 */
function IvyWrap(attr, wrapper){
  if (!(this instanceof IvyWrap)) return new IvyWrap(attr, wrapper);
  
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
IvyWrap.prototype = new IvyAttr;

/**
 * Gets the internal attribute's value, then passes it through the custom
 * getter.
 */
IvyWrap.prototype.get = function(){
  var value = this.attr.get();
  return this.wrapper.get(value);
};

/**
 * Passes the `value` through the custom setter, then sets the internal attribute's value.
 */
IvyWrap.prototype.set = function(value){
  value = this.wrapper.set(value);
  this.attr.set(value);
  return this;
};

/**
 * Creates an computed attribute that is bound to its arguments. If an argument
 * changes, the function will be recomputed.
 *
 *     var price   = Ivy.attr(15),
 *         tax     = Ivy.attr(0.1),
 *         withTax = Ivy.fn(price, tax, function(p,t){
 *           return p * (1 + t);
 *         });
 *     
 *     withTax.get(); //=> 16.5
 *     tax.set(0.05);
 *     withTax.get(); //=> 15.75
 *
 * The first arguments are the arguments the function depends on, the last is
 * the function to be called.  A bound Ivy attribute will be returned.
 */
Ivy.fn = function(){
  var args = Array.prototype.slice.call(arguments),
      fn   = args.pop(),
      attr = IvyAttr();
  
  function compute(){
    attr.set( fn.apply(attr, args) );
  }
  
  for(var i=0; i < args.length; i++){ 
    args[i].on('change', compute); 
  }
  compute();
  
  return attr;
};

/**
 * Like `Ivy.fn`, this creates a bound attribute, but the function binds
 * to the variables named in the function.
 *
 *     function Purchase(price){
 *       this.price = Ivy.attr(price);
 *       this.tax   = Ivy.attr(0.1);
 *       this.withTax = Ivy.fnWith(this, function(price, tax){
 *         return price * (1 + tax);
 *       });
 *     }
 *     
 *     var purchase = new Purchase(15);
 *     purchase.withTax.get(); //=> 16.5
 *     purchase.tax.set(0.5);
 *     purchase.withTax.get(); //=> 15.75
 *
 * When working with complex objects, this is often simpler than using
 * `Ivy.fn`.  
 * 
 * This function does some _clever_ stuff, so be careful if you use it with a minifier.
 */
Ivy.fnWith = function(context, fn){
  var names = Ivy.util.argumentNames(fn),
      args  = [];
  
  for(var i=0, len=names.length; i < len; i++){
    args.push(context[names[i]]);
  }
  
  args.push(fn);
  
  return Ivy.fn.apply(this, args);
};

//-----------------------------------------------------------------------------
// Ivy Binding Support

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

Ivy.bindAttrToClassName = function(el, attrName, trueClass, falseClass){
  var attr = this.atPath(attrName);
  
  Ivy.watchAttr(attr, 'change', updateEl);
  function updateEl(value){
    var oldClasses  = el.className.split(/\s+/),
        newClasses  = [],
        addClass    = value.valueOf() ? trueClass : falseClass,
        removeClass = value.valueOf() ? falseClass : trueClass,
        seenAdd;
    
    for (var i=0, len = oldClasses.length, cls; i< len; i++){
      cls = oldClasses[i];
      seenAdd |= (cls === addClass);
      if (cls != removeClass) newClasses.push(cls);
    }
    if (!seenAdd) newClasses.push(addClass);
    el.className = newClasses.join(' ');
  }
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

Ivy.bindAttrToFocused = function(el, attrName){
  var attr = this.atPath(attrName);

  Ivy.watchAttr(attr, 'change', updateEl);  
  function updateEl(value){
    if (value){ 
      setTimeout(function(){ el.focus(); });
    }
  }
};

Ivy.bindAttrToEach = function(el, attrName){
  var attr     = this.atPath(attrName),
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

Ivy.bindings = {
  'value':    Ivy.bindAttrToValue,
  'checked':  Ivy.bindAttrToChecked,
  'text':     Ivy.bindAttrToText,
  'attr':     Ivy.bindAttrToDomAttr,
  'class':    Ivy.bindAttrToClassName,
  'show':     Ivy.bindAttrToShow,
  'focused':  Ivy.bindAttrToFocused,
  'each':     Ivy.bindAttrToEach,
  'with':     Ivy.bindAttrToWith,
  'on':       Ivy.bindFnToEvent
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

Ivy.util.bind = function(fn,context){
  return function(){ fn.call(context, arguments); };
};

// Tracking for shared Ivy state:
Ivy._id = 1;
Ivy._callers = {};