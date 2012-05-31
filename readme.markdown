Ivy.js
======
Ivy ties JavaScript objects to the DOM, allowing you to focus on the relationships of your data.
Define attributes with `Ivy.attr`, and then bind them in HTML using a `data-bind` attribute:

    <p>
      Hello <span data-bind='text: name'></span>!
    </p>
    <input data-bind='value: name keyup'/>
    
    <script>
      Ivy.bindDom({name: Ivy.attr('World')});
    </script>

Ivy will fill in "World" both in the span, and in the input.  If you change the input, the span
will also change.  You don't need to write event listeners, or update the HTML, Ivy does that for
you.

You can also bind complex objects and functions:

    <div>
      <label>Price: $<input data-bind='value: price'/></label>
      <label>Tax: <input data-bind='value: tax'/>%</label>
    </div>
    <p>Amount after tax is: $<span data-bind='total'></span></p>
    
    <script>
      function Calculator(price){
        this.price = Ivy.attr(price);
        this.tax   = Ivy.attr(10);
        this.total = Ivy.fnWith(this, function(price, tax){
          return (price * (100+tax) / 100).toFixed(2);
        });
      }
      
      Ivy.bindDom( new Calculator(20.00) );
    </script>

Ivy plays nicely with others, and stays out of the way when it's not needed.
In many cases you can treat the value encapsulated by an `Ivy.attr` like a normal object:

    Ivy.attr(3) + Ivy.attr(4); //=> 7
    
    var point = {x: Ivy.attr(2.0), y: Ivy.attr(4.6)};
    JSON.stringify(point); //=> "{x: 2.0, y: 4.6}"

You can use Ivy as much, or as little as you like.
If a value like a user's id will never change, then don't wrap it.  If you only want to bind
a model to a specific part of your HTML, pass Ivy an element or its id:

    <h1 id='user-greeting'>
      Greetings <span data-bind='text: name'> </span> 
      (<span data-bind='text: id'>)
    </h1>

    <script>
      Ivy.bindDom( {name: Ivy.attr('Mr. Monkey'), id: 32}, 'user-greeting');
    </script>

Caveats
-------
This is very much a work in progress and there's a lot to do.  On the other 
hand, it works well enough to greatly simplify a lot of client side code.

Major issues at the moment:

* Changing bound arrays redraws the whole array
* Events are not debounced, so Ivy does more work than it needs to

Attributions
------------
This library was inspired largely by the work of [Steve Sanderson](https://github.com/SteveSanderson) (_no relation!_)
on [Knockout](https://github.com/SteveSanderson/knockout), and the [Shopify](https://github.com/Shopify) 
team's [Batman.js](https://github.com/Shopify/batman).  The event emitter code was cribbed from
[TJ Holowaychuk](https://github.com/visionmedia)'s various projects.

Ivy is written by [Adam Sanderson](https://github.com/adamsanderson) with the full support of 
[Monkey and Crow](http://monkeyandcrow.com), two imaginary friends who let me play around with stuff.