function bindHTML(html, obj){
  var el = document.createElement('div');
  el.innerHTML = html;
  Ivy.bindDom(el, obj);
  
  return el.firstChild;
}

describe('Value binding', function(){
  var snippet = '<input data-bind="value: x"/>';
  
  it('sets the value of an input', function(){
    var input = bindHTML(snippet, {x: 7});
    assert.equal(input.value, 7);
  });
  
  it('updates value when the attribute changes', function(){
    var x = Ivy.attr(7);
    var input = bindHTML(snippet, {x: x});
    x.set(10);
    
    assert.equal(input.value, 10);
  });
  
  it('updates attr when the value changes', function(){
    var x = Ivy.attr(7);
    var input = bindHTML(snippet, {x: x});
    
    input.value = 10;
    simulate(input, 'change');
    
    assert.equal(x.get(), 10);
  });
  
  it('does not sync the input until it blurs', function(){
    var x = Ivy.attr(7);
    var input = bindHTML(snippet, {x: x});
    
    document.body.appendChild(input);
    try {
      input.focus();
      x.set(5);
      assert.equal(input.value, 7);
      input.blur();
      assert.equal(input.value, 5);
    } finally {
      document.body.removeChild(input);
    }
  });
});

describe('Checked binding', function(){
  describe('With checkboxes', function(){
    var snippet = '<input type="checkbox" data-bind="checked: x" />';

    it('sets the state of a checkbox', function(){
      var input = bindHTML(snippet, {x: true});
      assert.isTrue(input.checked);
    });
    
    it('accepts truthy values', function(){
      var input = bindHTML(snippet, {x: 1});
      assert.isTrue(input.checked);
    });
    
    it('updates the state of a checkbox', function(){
      var x = Ivy.attr(false);
      var input = bindHTML(snippet, {x: x});
      x.set(true);
      assert.isTrue(input.checked);
    });
    
    it('updates the state of a attr', function(){
      var x = Ivy.attr(false);
      var input = bindHTML(snippet, {x: x});
      input.checked = true;
      simulate(input, 'change');
      assert.isTrue(x.get());
    });
    
  });
  
  describe('With radio buttons', function(){
    var snippet = '<div>\
                    <input id="a" type="radio" data-bind="checked: x" name="r" value="a"/>\
                    <input id="b" type="radio" data-bind="checked: x" name="r" value="b"/>\
                  </div>';

    it('sets the state of a radio button', function(){
      var root = bindHTML(snippet, {x: 'a'});
      assert.isTrue(root.children[0].checked);
      assert.isFalse(root.children[1].checked);
    });
    
    it('updates the state of a radio button', function(){
      var x = Ivy.attr('a');
      var root = bindHTML(snippet, {x: x});
      x.set('b');
      
      assert.isFalse(root.children[0].checked);
      assert.isTrue(root.children[1].checked);
    });
    
    it('updates the state of a attr', function(){
      var x = Ivy.attr('a');
      var root = bindHTML(snippet, {x: x});
      var b = root.children[1];
      
      b.checked = true;
      simulate(b, 'change');
      assert.equal(x.get(), 'b');
    });    
  });
  
});

describe('Text binding', function(){
  var snippet = '<div data-bind="text: x"/>';
  
  it('sets the text of an element', function(){
    var el = bindHTML(snippet, {x: "Hello"});
    assert.equal(el.innerText || el.textContent, "Hello");
  });
  
  it('updates value when the attribute changes', function(){
    var x = Ivy.attr("Hello");
    var el = bindHTML(snippet, {x: x});
    x.set("Bye");
    
    assert.equal(el.innerText || el.textContent, "Bye");
  });
  
  it('only creates text nodes', function(){
    var el = bindHTML(snippet, {x: "<b>Hello</b>"});
    var children = el.children;
    var child;
    
    for(var i=0, len=children; i < len; i++){
      child = children[i];
      assert.equal(child.nodeType, document.TEXT_NODE);
    }
  });
});

describe('ClassName binding', function(){
  var snippet = '<div data-bind="class: x red blue"/>';
  
  it('sets the true className when true', function(){
    var el = bindHTML(snippet, {x: true});
    assert.equal(el.className, "red");
  });
  
  it('sets the false className when false', function(){
    var el = bindHTML(snippet, {x: false});
    assert.equal(el.className, "blue");
  });
  
  it('sets no className if false and no false className exists', function(){
    var el = bindHTML('<div data-bind="class: x red"/>', {x: false});
    assert.equal(el.className, "");
  });
  
  it('does not affect existing classes', function(){
    var el = bindHTML('<div class="orange" data-bind="class: x red"/>', {x: true});
    assert.equal(el.className, "orange red");
  });
  
  it('updates the className when the attribute changes', function(){
    var x  = Ivy.attr(true);
    var el = bindHTML(snippet, {x: x});
    x.set(false);
    
    assert.equal(el.className, "blue");
  });
});

describe('DOM Attribute binding', function(){
  var snippet = '<div data-bind="attr: x data-name"/>';
  
  it('sets the attribute', function(){
    var el = bindHTML(snippet, {x: "Marty"});
    assert.equal(el.getAttribute('data-name'), "Marty");
  });
  
  it('updates the attribute', function(){
    var x  = Ivy.attr("Marty");
    var el = bindHTML(snippet, {x: x});
    x.set("Doc");
    
    assert.equal(el.getAttribute('data-name'), "Doc");
  });
  
  it('handles boolean properties', function(){
    var el = bindHTML('<input data-bind="attr: x disabled">', {x: 1});

    assert.isTrue(el.disabled);
  });
});

describe('Focused binding', function(){
  var snippet = '<div data-bind="focused: x"/>';
  it('focuses when set to true');
  it('blurs when set to false');
});

describe('Each binding', function(){
  var snippet = '<ul data-bind="each: x"><li/></ul>';
  
  it('is empty when the array is empty', function(){
    var el = bindHTML(snippet, {x: []});
    assert.equal(el.children.length, 0);
  });
  
  it('creates a child for each array item', function(){
    var el = bindHTML(snippet, {x: [1,2,3]});
    assert.equal(el.children.length, 3);
  });
  
  it('adds children when new items are added', function(){
    var x  = Ivy.array([1,2,3]);
    var el = bindHTML(snippet, {x: x});
    x.push(4);
    assert.equal(el.children.length, 4);
  });
  
  it('removes children when items are removed', function(){
    var x  = Ivy.array([1,2,3]);
    var el = bindHTML(snippet, {x: x});
    x.pop();
    assert.equal(el.children.length, 2);
  });
  
  it('sets the context of each item', function(){
    var x  = Ivy.array([{y:"a"}, {y:"b"}]);
    var el = bindHTML('<ul data-bind="each: x"><li data-bind="attr: y title"></li></ul>', {x: x});

    assert.equal(el.children[0].title, 'a');
    assert.equal(el.children[1].title, 'b');
  });
  
  it('handles multiple child nodes', function(){
    var x  = Ivy.array([1,2]);
    var el = bindHTML('<ul data-bind="each: x"><li/><li/></ul>', {x: x});
    x.push(1);
    
    assert.equal(el.children.length, 6);
  });
  
});