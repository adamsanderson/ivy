Now:
====
Improve binding errors.

General TODO:
=============
Below are an unordered list of ideas that should be addressed and assessed sometime:

* Bind Each -- Currently wastefully re-renders the entire list every time.
* Batched DOM Updates -- Would it help performance to batch updates? IE: delay updating the DOM until a setTimeout can gather multiple updates?
* Batched change dispatching -- If I'm going to add 30 items to a table, maybe it's better to accumulate changes and then react?
* Child Paths -- Binding to child attributes requires some extra callbacks on the intermediate children.
* Implement Map as a function returning an attr
* Special case binding TextNodes -- Instead of requiring a lot of spans, we can split text nodes up, and interpolate values

Notes
=====

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

Principles
----------
* Muddy domains make for muddy code.
* Tedious code is no fun to write.

Client side applications tend to cut across too many concerns.  Untangling those domains makes writing code less
tedious, and a lot more clear. In general, I think it's a good practice to make sure that the layers are clear:

    CSS <--> HTML <--> (ViewModel? Presenter?) <--> Model <--> Server

Your CSS should be written with the HTML in mind.  The HTML is structured such that the CSS can be applied cleanly, and 
is aware of the ViewModel (Presenter?).  The Presenter must know about the underlying models, but the CSS should be of no concern.
The Model most likely knows little of the ViewModel, but may provide convenience methods for it, it does however know about the
server.

Tedious code, is quite simply boring.