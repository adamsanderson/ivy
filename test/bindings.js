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
  var snippet = '<input data-bind="text: x"/>';
  
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
});