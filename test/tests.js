describe('IvyAttr', function(){
  describe('constructor', function(){
    it('should return a new attribute', function(){
      var attr = Ivy.attr();
      assert.instanceOf(attr, IvyAttr);
    });
    
    it('should initialize with given value', function(){
      var attr = Ivy.attr(5);
      assert.equal(attr.get(), 5);
    });
    
    it('should accept a parsing function', function(){
      var attr = Ivy.attr('5', Number);
      assert.equal(attr.get(), 5);
    });
  });
  
  describe('events', function(){
    function callback(){};
    it('should register events', function(){
      var attr = Ivy.attr().on('event-name', callback);
      assert.deepEqual(attr.callbacks['event-name'], [callback]);
    });
    
    it('should pass arguments when emitting an event', function(done){
      var attr = Ivy.attr().on('event-name', function(arg1, arg2){ 
        assert.equal(arg1, 1);
        assert.equal(arg2, 2);
        done(); 
      });
      attr.emit('event-name',1,2);
    });
    
    it('should remove callbacks by name', function(){
      var attr = Ivy.attr()
                  .on('event-name', callback)
                  .off('event-name');
      
      assert.isUndefined(attr.callbacks['event-name']);
    });
    
    it('should remove callbacks by function', function(){
      function otherCallback(){};
      
      var attr = Ivy.attr()
                  .on('event-name', callback)
                  .on('event-name', otherCallback)
                  .off('event-name', callback);
      
      assert.equal(attr.callbacks['event-name'].length, 1);
    });
    
  });
  
  describe('#set', function(){
    it('should change the value', function(){
      var attr = Ivy.attr().set(5);
      assert.equal(attr.get(), 5);
    });
    
    it('should emit a change event with the new value', function(done){
      var attr = Ivy.attr();
      
      attr.on('change', function(value){
        assert.equal(value, 7);
        done();
      });
      
      attr.set(7);
    });
    
    it('should not emit a change if the value has not changed', function(){
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
    it('should return the internal value', function(){
      var attr = Ivy.attr(5);
      assert.equal(attr.valueOf(), 5);
    });
    
    it('should allow coercion', function(){
      var value = Ivy.attr(5) + 1;
      assert.equal(value, 6);
    });
  });
  
  describe('#toJSON', function(){
    it('should serialize its internal value', function(){
      var objectWithAttr = {x: Ivy.attr(5)};
      var object         = {x: 5};
      assert.equal(
        JSON.stringify(object), 
        JSON.stringify(objectWithAttr)
      );
    });
    
    it('should allow coercion', function(){
      var value = Ivy.attr(5) + 1;
      assert.equal(value, 6);
    });
  });
  
});