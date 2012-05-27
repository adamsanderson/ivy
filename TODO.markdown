TODOs
=====

* How to listen to child events? 
* Contexts -- How should they be managed?  The current prototype method seems sloppy.
* Bind Each -- Currently wastefully re-renders the entire list every time.
* Batched DOM Updates -- Would it help performance to batch updates? IE: delay updating the DOM until a setTimeout can gather multiple updates?
* Batched change dispatching -- If I'm going to add 30 items to a table, maybe it's better to accumulate changes and then react?
* Child Paths -- Binding to child attributes requires some extra callbacks on the intermediate children.


Child Events
------------
In the todo example we need to know when a todo has changed, we could either leave it to the application to manage,
or make the array support listening to children.

This could actually just be two functions were provided, one for getting
the attribute to bind to, and another for the handler:

  todoList.onEach('change',
    function(todo){ return todo.isDone },
    recalculate);
  
By making `change` events track when items are added and removed, we can hook the appropriate events.

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
