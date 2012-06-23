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
 * @param {Object} value
 * @param {Function} parseFn An optional function for parsing a value when set.
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
 * 
 * @param {Object} value
 * @emits "change" with value
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
 * Adds a listener to the attribute.
 * 
 *     var a = Ivy.attr(4);
 *     a.on('change', function(value){ console.log('New value is', value); });
 *     a.set(5); //=> 'New value is 5'
 * 
 * @param {String} event to listen for.
 * @param {Function(newValue)} fn
 */
IvyAttr.prototype.on = function(event, fn){
  (this.callbacks[event] = this.callbacks[event] || [])
    .push(fn);
  return this;
};

/**
 * When given only an event type, stops all listeners for that event.
 * If a callback is given, that callback will be removed.
 * 
 * @param {String} event to remove listeners from
 * @param {Function} fn to remove
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
 * Emits a named event.
 * 
 * @param {String} event
 * @param {Object...} Additional objects to be passed to listeners.
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
 *
 * @param {[Object]} array to be used for the attribute.
 */
function IvyArray(array){
  if (!(this instanceof Ivy.array)) return new Ivy.array(array);

  this.value = array || [];
  this.callbacks = {};
  this._id = Ivy._id++;
};
IvyArray.prototype = new IvyAttr;

/**
 * Set either the entire array to a new value, or a specific
 * array element;
 *
 *     var array = Ivy.array();
 *     array.set([2,3,4]);
 *     array.set(1, "Hello");
 *     array.get(); //=> [2,"Hello",4]
 *
 * @param {Number | Array} index to set, or new array
 * @param {Object} item to set at `index`
 * @emits "change" with new array
 */
IvyArray.prototype.set = function(index, item){
  if (arguments.length === 1) return this.replace(items);
  
  var oldValue = this.value[index];
  this.value[index] = item;
  this.emit('change', this.get(), 
    new Ivy.ChangeSet()
      .remove(index, [oldValue])
      .add(index, [value])
  );
  
  return this;
};

/**
 * Gets either the array or an item at the given index.
 * @param {Number} index of item to get
 */
IvyArray.prototype.get = function(index){
  return (arguments.length === 0) ? this.value : this.value[index];
};

/**
 * Pushes an item onto the end of the array.
 *
 *     var array = Ivy.array([1,2,3]);
 *     array.push(4);
 *     array.get(); //=> [1,2,3,4]
 *
 * @param {Object} item
 * @emits "change" with new array
 */
IvyArray.prototype.push = function(item){
  var index = this.length;
  this.value.push(item);
  this.emit('change', this.get(), new Ivy.ChangeSet().add(index, [item]) );
};

/**
 * Pushes an item onto the front of the array.
 *
 *     var array = Ivy.array([1,2,3]);
 *     array.unshift(4);
 *     array.get(); //=> [4,1,2,3]
 *
 * @param {Object} item
 * @emits "change" with new array
 */
IvyArray.prototype.unshift = function(item){
  this.value.unshift(item);
  this.emit('change', this.get(), new Ivy.ChangeSet().add(0, [item]) );
};

/**
 * Pops an item off the end of the array.
 *
 *     var array = Ivy.array([1,2,3]);
 *     array.pop(); //=> 3
 *     array.get(); //=> [1,2]
 *
 * @param {Object} item
 * @emits "change" with new array
 */
IvyArray.prototype.pop = function(){
  var index = this.length;
  var item = this.value.pop();
  this.emit('change', this.get(), new Ivy.ChangeSet().remove(index, [item]) );
  return item;
};

/**
 * Shifts an item off the front of the array.
 *
 *     var array = Ivy.array([1,2,3]);
 *     array.shift(); //=> 1
 *     array.get(); //=> [2,3]
 *
 * @param {Object} item
 * @emits "change" with new array
 */
IvyArray.prototype.shift = function(){
  var item = this.value.shift();
  this.emit('change', this.get(), new Ivy.ChangeSet().remove(0, [item]));
  return item;
};

/**
 * Replaces the array contents with a new array.
 *
 *     var array = Ivy.array([1,2,3]);
 *     array.replace([4,5,6]);
 *     array.get(); //=> [4,5,6]
 *
 * @param {Array} items
 * @emits "change" with new array
 */
IvyArray.prototype.replace = function(items){
  var oldValues = this.value;
  this.value = items;
  
  this.emit('change', this.get(), 
    new Ivy.ChangeSet()
      .remove(0, oldValues)
      .add(0, items)
  );
  
  return items;
};

/**
 * Removes an item from the array.
 *
 *     var array = Ivy.array(["a", "b", "c"]);
 *     array.remove("b");
 *     array.get(); //=> ["a", "c"]
 *
 * @param {Object} item
 * @emits "change" with new array
 */
IvyArray.prototype.remove = function(item){
  var index = this.value.indexOf(item);
  return this.removeIndex(index);
};

/**
 * Removes any item from the array that matches the function.
 *
 *     var array = Ivy.array([1,2,3,4,5]);
 *     array.removeEach(function(i){ return i % 2; });
 *     array.get(); //=> [1,3,5]
 *
 * @param {Function(Object)} predicate function
 * @emits "change" with new array
 */
IvyArray.prototype.removeEach = function(fn){
  var i = this.value.length;
  
  while (i--){
    if (fn(this.value[i])){
      this.removeIndex(i);
    }
  }
};

/**
 * Removes an item at a given index.
 *
 *     var array = Ivy.array(["a", "b", "c"]);
 *     array.removeIndex(1);
 *     array.get(); //=> ["a", "c"]
 *
 * @param {Object} index
 * @emits "change" with new array
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
 * Registers a listener on each array item as items are added,
 * and unregisters listeners when items are removed from the array.
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
 *
 * @param {String} event to listen to
 * @param {Function(Object)} callback for events
 * @param {Function} optional getter for retrieving the attribute
 * 
 * @emits "change" with new array
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
 * Wrap an existing attribute with custom getters and setters.
 * The original attribute can still be accessed as normal.
 *
 *     var percent = Ivy.attr(0.1);
 *     var wrapped = Ivy.wrap(percent, {
 *       get: function(num){ return (num * 10) + '%'; },
 *       set: function(val){ return parseFloat(val) / 10; }
 *     });
 *     
 *     wrapped.get(); //=> "10%"
 *     wrapped.set("17%");
 *     percent.get(); //=> 0.17
 *
 * @param {IvyAttr} attribute to be wrapped
 * @param {Object} wrapper to be applied to the attribute
 * @param {Function} wrapper.get custom getter for formatting the attribute
 * @param {Function} wrapper.set custom setter for parsing the attribute
 */
function IvyWrap(attr, wrapper){
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
IvyWrap.prototype = IvyAttr;

/**
 * Gets the internal attribute's value, then passes it through the getter
 * defined with `IvyWrap`
 */
IvyWrap.prototype.get = function(){
  var value = this.attr.get();
  return this.wrapper.get(value);
};

/**
 * Passes the value through the setter, then sets the internal attribute's value.
 * @param {Object} value
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
 * @param {Object...} arguments for the function
 * @param {Function} fn to be computed
 * @returns an attribute that will update with the function's result.
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
 * @param {Object} context to bind arguments against.
 * @param {Function} fn to be computed.
 * @returns an attribute that will update with the function's result.
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
  'attr':     Ivy.bindAttrToDomAttr,
  'class':    Ivy.bindAttrToClassName,
  'each':     Ivy.bindAttrToEach,
  'show':     Ivy.bindAttrToShow,
  'with':     Ivy.bindAttrToWith,
  'focused':  Ivy.bindAttrToFocused,
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

Ivy.util.bind = function(fn,context){
  return function(){ fn.call(context, arguments); };
};

// Tracking for shared Ivy state:
Ivy._id = 1;
Ivy._callers = {};