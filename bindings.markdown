Ivy Bindings
============

Ivy will bind your data model to the DOM.  Changes made to Ivy attributes will update the DOM,
and user input will update your data model.  Ivy's bindings are declared in your HTML using the
`data-bind` attribute.

    <input data-bind='value: name keyup; class: isValid valid invalid'/>
    
Take a look at the examples to see these bindings in action.

value: attrName [event = 'change'];
-------------------------------

The `value` binding will bind an input's value with an Ivy attribute.  Use this to let your users
edit forms.
    
    <!-- Bind name to the input's keyup event -->
    <input data-bind='value: name keyup;'/>
    <script>
      Ivy.bindDom({name: Ivy.attr('Marvin')});
    </script>
    
The event parameter is optional, and can be used to specify which form event Ivy should use.
`keyup` is good for changes that should be evaluated immediately, and the default `change` 
event works well when the data needs to be validated.

checked: attrName [event = 'change'];
---------------------------------

Bind a checkbox, or group of radio buttons, with the `checked` binding.  When binding a checkbox
the bound attribute will be a boolean value.  When binding radio buttons, the bound value will be
value of the selected radio button.

    <!-- Bind size to the radio buttons, and express to a checkbox -->
    
    <input type='radio' data-bind='checked: size' value='small'/> Small
    <input type='radio' data-bind='checked: size' value='medium'/> Medium
    <input type='radio' data-bind='checked: size' value='large'/> Large
    
    <input type='checkbox' data-bind='checked: express'/> Express Delivery
    
    
    <script>
      Ivy.bindDom({size: Ivy.attr('medium'), express: Ivy.attr(true)});
    </script>

text: attrName;
-----------

Use the `text` binding to display text from your data model.

    <!-- Bind the name -->
    <div>
      Hello <span data-bind='text: name;'></span>
    </div>
    <script>
      Ivy.bindDom({name: Ivy.attr('World')});
    </script>
    
The `text` always creates a DOM text node, so its value will always be escaped.

attr: attrName domAttribute;
----------------------------

The `attr` binding will bind an Ivy attribute to a DOM element's attribute.

    <!-- Bind the isLocked attribute to the DOM attribute disabled -->
    <input data-bind='attr: isLocked disabled;'/>
    
This can be applied to any DOM attribute, however the `disabled` attribute
is the most common use case.

class: attrName trueClass [falseClass];
---------------------------------------

The `class` binding will toggle the `trueClass` and `falseClass` on
and off if `attrName` is true.

    <!-- Bind isValid to the input's class -->
    <input data-bind='class: isValid valid invalid'/>
    
In this example, when `isValid` evaluates to true, the input will have
the class `valid`, when false, `invalid`.  The `falseClass` is not
required, but is often useful.

show: attrName;
---------------

To show or hide an element, use the `show` binding.  When its attribute evaluates to
true, the element will be displayed, otherwise it will be hidden.

    <!-- Bind isValid to the input's class -->
    <a data-bind='show: promotionApplies'>
      Click here for more details!
    </a>
    
focussed: attrName;
-------------------
To control the page's focus, use the `focussed` binding.

    <!-- Set focus to this element: -->
    <input data-bind='class: isEditing'/>
    <script>
      Ivy.bindDom({isEditing: Ivy.attr(true)});
    </script>

Unlike other bindings, this does not synchronize back to the Ivy attribute
when the focus changes.

each: attrName;
--------------

Use `each` to bind to Ivy arrays.  As items are added or removed from the array,
they will be added or removed from the page.

    <!-- Bind the array cats -->
    <ul data-bind='each: cats'>
      <li data-bind='text: .'>
    </ul>
    <script>
      var cats = ["Felix", "Nyan", "Horace"];
      Ivy.bindDom({cats: Ivy.array(cats)});
    </script>
    
In the example above, three `li` elements will appear on the page, and they will
have the context of the array items Felix, Nyan, and Horace. Notice that the `text`
binding references the current item with a period.  If the array instead contained 
nested data such as `{name: "Felix", age: 5}`, then the `text` binding would be: 
`<li data-bind='text: name'>`.  If you need to access an attribute from a parent 
context, you can use a relative path such as `../name`.
  
with: attrName [templateId];
---------------

When dealing with nested data, use `with` to control the context.

    <!-- Bind the name attribute -->
    <h1 data-bind='text: name'></h1>
    
    <!-- Change the context to profession  -->
    <div data-bind='with: profession'>
      <span data-bind='text: title'></span>
      (<span data-bind='text: yearsExperience'></span>)
    </div>
    
    <script>
      var person = {
        name: Ivy.attr('Mortimer'),
        profession: {
          title: 'Chief Tester',
          yearsExperience: 3
        }
      }
    </script>

You can nest multiple `with` bindings to descend down a deep object hierarchy.

An optional second parameter can be passed to `with` to lookup a template 
elsewhere in the document.  A common pattern is to create a `script` tag with 
your template at the bottom of the document.

    <div data-bind='with: profession description'></div>
    <!-- ... -->
    <script type='text/html' id='description'>
      <span data-bind='text: title'></span>
      (<span data-bind='text: yearsExperience'></span>)
    </script>

This can be useful when you need to render something the same way in multiple
places.

on: eventName callbackName
--------------------------
Use the `on` binding to let people interact with your objects.  In the example
below we create a simple editable list of pets with a function that will add a new pet:

    <!-- Bind to the click event to addPet -->
    <a data-bind='on: click addPet'>Add Pet</a>
    <ul data-bind='each: cats'>
      <li>
        <input data-bind='value: name'/>
      </li>
    </ul>
    
    <script>
      function PetList(pets){
        this.pets = Ivy.array(pets);
        this.addPet = function(){
          this.pets.push({name: Ivy.attr("")});
        };
      }
      
      var petList = new PetList([
        {name: Ivy.attr("Felix")},
        {name: Ivy.attr("Nyan") }
      ]);
      Ivy.bindDom(petList);
    </script>

Notice that unlike most bindings, the first argument is an event such as `click`, and the
second is function to call when a user triggers the event.  The callback will be passed the
current context as well.