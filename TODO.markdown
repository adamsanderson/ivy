TODOs
=====

* Contexts -- How should they be managed?  The current prototype method seems sloppy.
* Bind Each -- Currently wastefully re-renders the entire list every time.
* Batched DOM Updates -- Would it help performance to batch updates? IE: delay updating the DOM until a setTimeout can gather multiple updates?
* Batched change dispatching -- If I'm going to add 30 items to a table, maybe it's better to accumulate changes and then react?
* Child Paths -- Binding to child attributes requires some extra callbacks on the intermediate children.
* Implement Map as a function returning an attr
* Bind Element classes to an attribute

Batched Updates
---------------
Not everything has to happen immediately.  Some attributes can update lazily if their listeners are
all _lazy_ listeners.  The DOM can always be considered a lazy listener since the models should never
query it directly, and some model listeners could optionally be lazy as well.

If an attribute only has lazy listeners, it can mark itself dirty when it changes, and register for a
batched update.  The first attribute registering a lazy update would setup a function to be called on
the next available tick.  All future attributes would get appended to a list for evaluating asynchronously.

Adding 10 items to an array would issue a single `change` event, and expensive functions could avoid 
recomputing repeatedly in a tight loop.

An even simpler issue is that if you have a bound function `Ivy.fn(a,b)`, and both `a` and `b` are changed at
once, you'll still recompute twice.

Map
---
Using a function that operates on an array of values like the done state of items in a todo list is tedious.
This then generalizes to `reduce`, `pluck`, etc.

Class Binding
-------------
A class binding could either look like:

    <div data-bind='class: isDone done-item pending-item'>
    
With the second and optionally third arguments being the class that is applied, or it could just use the results of the first attribute:

    <div data-bind='class: isDone'>
    
The second option is simpler to code, but you end up with css classes in your code, which bridges too many layers:

    CSS  <--> HTML
    HTML <--> View

So, the first option maintains this.  So how do we handle this?

Approach: Tokenize the element's `class` attribute, iterate over the items, and remove the `false` case if we see it, add the `true` case unless it's seen.