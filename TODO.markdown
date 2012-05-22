TODOs
=====

* How to listen to child events? 
* Contexts -- How should they be managed?  The current prototype method seems sloppy.
* Focused Elements -- They are unusual because it behaves more like a function call than a binding.
* Bind Each -- Currently wastefully re-renders the entire list every time.
* Batched DOM Updates -- Would it help performance to batch updates? IE: delay updating the DOM until a setTimeout can gather multiple updates?
* Child Paths -- Binding to child attributes requires some extra callbacks on the intermediate children.


Child Events
------------
In the todo example we need to know when a todo has changed, we could either leave it to the application to manager,
or make the array support listening to children.

   todoList.onChild('change', function(){ ... });
  
A Todo however is currently modeled as a normal object with two observable attributes, and the count is really only interested
in Todo.isDone changing.

Maybe a better approach is to add onAdd and onRemove hooks:

  todoList.on('add', function(){ ... })
  todoList.on('remove', function(){ ... })
  
Then you could do:

  todoList.on('add', function(todo){ todo.isDone.on('change', recalculate) });
  todoList.on('remove', function(todo){ todo.isDone.off('change', recalculate) });
  
Used sparingly, this could be a decent pattern.