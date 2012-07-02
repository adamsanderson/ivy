describe('IvyAttr', function(){
  describe('constructor', function(){
    it('returns a new attribute', function(){
      var attr = Ivy.attr();
      assert.instanceOf(attr, IvyAttr);
    });
    
    it('initializes with given value', function(){
      var attr = Ivy.attr(5);
      assert.equal(attr.value, 5);
    });
    
    it('accepts a parsing function', function(){
      var attr = Ivy.attr('5', Number);
      assert.equal(attr.value, 5);
    });
  });
  
  describe('events', function(){
    function callback(){};
    it('registers events', function(){
      var attr = Ivy.attr().on('event-name', callback);
      assert.deepEqual(attr.callbacks['event-name'], [callback]);
    });
    
    it('passes arguments when emitting an event', function(done){
      var attr = Ivy.attr().on('event-name', function(arg1, arg2){ 
        assert.equal(arg1, 1);
        assert.equal(arg2, 2);
        done(); 
      });
      attr.emit('event-name',1,2);
    });
    
    it('removes callbacks by name', function(){
      var attr = Ivy.attr()
                  .on('event-name', callback)
                  .off('event-name');
      
      assert.isUndefined(attr.callbacks['event-name']);
    });
    
    it('removes callbacks by function', function(){
      function otherCallback(){};
      
      var attr = Ivy.attr()
                  .on('event-name', callback)
                  .on('event-name', otherCallback)
                  .off('event-name', callback);
      
      assert.equal(attr.callbacks['event-name'].length, 1);
    });
    
  });
  
  describe('#get', function(){
    it('returns the internal value', function(){
      assert.equal(Ivy.attr(5).get(), 5);
    });
  });
  
  describe('#set', function(){
    it('changes the value', function(){
      var attr = Ivy.attr().set(5);
      assert.equal(attr.get(), 5);
    });
    
    it('emits a change event with the new value', function(done){
      var attr = Ivy.attr();
      
      attr.on('change', function(value){
        assert.equal(value, 7);
        done();
      });
      
      attr.set(7);
    });
    
    it('does not emit a change if the value has not changed', function(){
      var attr = Ivy.attr(7),
          changed = false;
      
      attr.on('change', function(value){
        changed = true;
      });
      
      attr.set(7);
      assert.isFalse(changed);
    });
  });
  
  describe('#valueOf', function(){
    it('returns the internal value', function(){
      var attr = Ivy.attr(5);
      assert.equal(attr.valueOf(), 5);
    });
    
    it('allows coercion', function(){
      var value = Ivy.attr(5) + 1;
      assert.equal(value, 6);
    });
  });
  
  describe('#toJSON', function(){
    it('serializes its internal value', function(){
      var objectWithAttr = {x: Ivy.attr(5)};
      var object         = {x: 5};
      assert.equal(
        JSON.stringify(object), 
        JSON.stringify(objectWithAttr)
      );
    });
  });  
});

describe('IvyArray', function(){
  describe('constructor', function(){
    it('initalizes with an empty array', function(){
      var attr = Ivy.array();
      assert.deepEqual(attr.get(), []);
    });
    
    it('accepts an array', function(){
      var array = [1,2,3];
      var attr = Ivy.array(array);
      assert.deepEqual(attr.get(), array);
    });
    
    it('is an IvyAttr', function(){
      assert.instanceOf(Ivy.array(), IvyAttr);
    });
  });
  
  describe('#get', function(){
    it('returns the array if no index is given', function(){
      var attr = Ivy.array([1,2,3]);
      assert.deepEqual(attr.get(), [1,2,3]);
    });
    
    it('returns an array item if an index is given', function(){
      var attr = Ivy.array([1,2,3]);
      assert.deepEqual(attr.get(1), 2);
    });
  });
  
  describe('#set', function(){
    it('replaces the array if no index is given', function(){
      var attr = Ivy.array([1,2,3]);
      var newArray = [4,5,6];
      attr.set(newArray);
      assert.deepEqual(attr.get(), newArray);
    });
    
    it('sets a given index', function(){
      var attr = Ivy.array([1,2,3]);
      attr.set(1, "x");
      assert.deepEqual(attr.get(), [1,"x",3]);
    });
    
    it('emits the new array', function(done){
      var attr = Ivy.array([1,2,3]).on('change', function(value){
        assert.deepEqual(value, [1,"x",3]);
        done();
      });
      attr.set(1, "x");
    });
  });
  
  describe('#push', function(){
    it('adds an item to the end of the array', function(){
      var attr = Ivy.array([1,2]).push(3);
      assert.deepEqual(attr.get(), [1,2,3]);
    });
  });
  
  describe('#unshift', function(){
    it('adds an item to the end of the array', function(){
      var attr = Ivy.array([1,2]).unshift(0);
      assert.deepEqual(attr.get(), [0,1,2]);
    });
  });
  
  describe('#pop', function(){
    it('pops an item off the end of the array', function(){
      var attr = Ivy.array([1,2,3]);
      assert.equal(attr.pop(), 3);
      assert.deepEqual(attr.get(), [1,2]);
    });
  });
  
  describe('#shift', function(){
    it('shifts an item off the front of the array', function(){
      var attr = Ivy.array([1,2,3]);
      assert.equal(attr.shift(), 1);
      assert.deepEqual(attr.get(), [2,3]);
    });
  });
  
  describe('#replace', function(){
    it('replaces the internal array', function(){
      var attr = Ivy.array([1,2,3])
                    .replace([4,5]);
      assert.deepEqual(attr.get(), [4,5]);
    });
  });
  
  describe('#remove', function(){
    it('removes the item from the array', function(){
      var attr = Ivy.array(['a','b','c']);
      attr.remove('b');
      
      assert.deepEqual(attr.get(), ['a','c']);
    });
    
    it('only removes one item from the array', function(){
      var attr = Ivy.array(['a','a','a']);
      attr.remove('a');
      
      assert.deepEqual(attr.get(), ['a','a']);
    });
    
    it('returns the removed item', function(){
      var item = Ivy.array(['a','b','c']).remove('b');
      assert.equal(item, 'b');
    });
  });
  
  describe('#removeEach', function(){
    it('removes each item matching the function', function(){
      var attr = Ivy.array([1,2,3,4,5]);
      attr.removeEach(function(v){ 
        return v % 2 == 0; 
      });
      
      assert.deepEqual(attr.get(), [1,3,5]);
    });
    
    it('returns removed items', function(){
      var attr = Ivy.array([1,2,3,4,5]);
      var items = attr.removeEach(function(v){ 
        return v % 2 == 0; 
      });
      
      // Order is indeterminant
      assert.equal(items.length, 2);
      assert(~items.indexOf(2));
      assert(~items.indexOf(4));
    });
  });
  
  describe('#removeIndex', function(){
    it('removes an item at the given index', function(){
      var attr = Ivy.array(['a', 'b', 'c']);
      attr.removeIndex(1);
      assert.deepEqual(attr.get(), ['a', 'c']);
    });
    
    it('returns the removed item', function(){
      var item = Ivy.array(['a', 'b', 'c']).removeIndex(1);
      assert.equal(item,'b');
    });
    
    it('does nothing if the index is out of bounds', function(){
      var attr = Ivy.array(['a', 'b', 'c']);
      attr.removeIndex(-1);
      attr.removeIndex(5);
      assert.deepEqual(attr.get(), ['a', 'b', 'c']);
    });
  });
  
  describe('#onEach', function(){
    function callback(){};
    
    it('registers a listener on each item in the array', function(){
      var a = Ivy.attr(),
          b = Ivy.attr(),
          array = Ivy.array([a,b]);
      array.onEach('event-name', callback);
      
      assert.deepEqual(a.callbacks['event-name'], [callback]);
      assert.deepEqual(b.callbacks['event-name'], [callback]);
    });
    
    it('registers listeners when items are added', function(){
      var a = Ivy.attr(),
          array = Ivy.array();
      array.onEach('event-name', callback);
      array.push(a);
      
      assert.deepEqual(a.callbacks['event-name'], [callback]);
    });
    
    it('removes listeners when items are removed', function(){
      var a = Ivy.attr(),
          array = Ivy.array();
      array.onEach('event-name', callback);
      array.push(a);
      array.pop();
      
      assert.deepEqual(a.callbacks['event-name'], []);
    });
    
    it('applies listeners to the result of the getter', function(){
      var a = {x: Ivy.attr()},
          array = Ivy.array([a]);
      array.onEach('event-name', callback, function(attr){ 
        return attr.x; 
      });
      
      assert.deepEqual(a.x.callbacks['event-name'], [callback]);
    });
  });
  
  describe('#length', function(){
    it('returns the length of the array', function(){
      var attr = Ivy.array([2,3,4]);
      assert.equal(attr.length(), 3);
    });
  });
});

describe('IvyWrap', function(){
  function toPercent(num){ return (num * 100) + '%'; }
  function fromPercent(val){ return parseFloat(val) / 100; }
  
  describe('constructor', function(){
    it('create a new IvyAttr', function(){
      var inner = Ivy.attr(),
          wrap = Ivy.wrap(inner, {});
      
      assert.notStrictEqual(inner, wrap);
      assert.instanceOf(wrap, IvyAttr);
    });
  });
  
  describe('#get', function(){
    it('returns the wrapped value when a getter is not present', function(){
      var inner = Ivy.attr(3),
          wrap = Ivy.wrap(inner, {});
      
      assert.equal(wrap.get(), 3);
    });
    
    it('returns a decorated value when a getter is present', function(){
      var inner = Ivy.attr(0.3),
          wrap = Ivy.wrap(inner, {get: toPercent});
      
      assert.equal(wrap.get(), '30%');
    });
    
    it('does not modify the wrapped value', function(){
      var inner = Ivy.attr(0.3),
          wrap = Ivy.wrap(inner, {get: toPercent});
      
      assert.equal(inner.get(), 0.3);
    });
  });
  
  describe('#set', function(){
    it('sets the internal value when a setter is not present', function(){
      var inner = Ivy.attr(3),
          wrap = Ivy.wrap(inner, {})
                    .set(4);

      assert.equal(wrap.get(), 4);
    });
    
    it('converts the value when a setter is present', function(){
      var inner = Ivy.attr(),
          wrap = Ivy.wrap(inner, {set: fromPercent})
                    .set('30%');
      
      assert.equal(inner.get(), 0.3);
    });
    
    it('can roundtrip a value when a getter is present', function(){
      var inner = Ivy.attr(),
          wrap = Ivy.wrap(inner, {get: toPercent, set: fromPercent})
                    .set('30%');
      
      assert.equal(inner.get(), 0.3);
      assert.equal(wrap.get(), '30%');
    });
  });
});

describe('Ivy.fn', function(){
  function callback(){};
  
  describe('constructor', function(){
    it('returns an IvyAttr', function(){
      var attr = Ivy.fn(callback);
      
      assert.instanceOf(attr, IvyAttr);
    });
    
    it('listens to changes on arguments', function(){
      var a = Ivy.attr(),
          b = Ivy.attr(),
          attr = Ivy.fn(a,b,callback);
      
      assert.equal(a.callbacks['change'].length, 1);
      assert.equal(b.callbacks['change'].length, 1);
    });
    
    it('calls the function once immediately', function(){
      var calls = 0,
          attr = Ivy.fn(function(){ return calls++; });
      
      assert.equal(calls, 1);
    });
  });
  
  describe('observing', function(){
    it('updates when its parameters update', function(){
      var a = Ivy.attr(3),
          b = Ivy.attr(4),
          attr = Ivy.fn(a,b, function(alpha, beta){
            return alpha + beta;
          });
      
      b.set(6);
      assert.equal(attr.get(), 9);
    });
    
    it('calls the function arguments in the order they were listed', function(done){
      var a = Ivy.attr(3),
          b = Ivy.attr(4);
          
      Ivy.fn(a,b, function(alpha, beta){
        assert.equal(alpha, a);
        assert.equal(beta, b);
        done();
      });
    });
    
    it('emits an event when its value changes', function(done){
      var a = Ivy.attr(3),
          attr = Ivy.fn(a, function(alpha){
            return alpha + 1;
          });
      
      attr.on('change',function(value){
        assert.equal(value, 5);
        done();
      });
      
      a.set(4);
    });
  });
  
  describe('#get', function(){
    it('returns the computed value', function(){
      var attr = Ivy.fn(function(){ 
        return 7; 
      });
      
      assert.equal(attr.get(), 7);
    });
  });
});

describe('Ivy.fnWith', function(){
  function callback(){};
  
  describe('constructor', function(){
    it('returns an IvyAttr', function(){
      var attr = Ivy.fnWith({}, callback);
      
      assert.instanceOf(attr, IvyAttr);
    });
    
    it('listens to changes on arguments', function(){
      var a = Ivy.attr(),
          b = Ivy.attr(),
          obj = {alpha: a, beta: b},
          attr = Ivy.fnWith(obj,function(alpha, beta){});
      
      assert.equal(a.callbacks['change'].length, 1);
      assert.equal(b.callbacks['change'].length, 1);
    });
  });
});