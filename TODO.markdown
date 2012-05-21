* Contexts -- How should they be managed?  The current prototype method seems sloppy.
* Focused Elements -- They are unusual because it behaves more like a function call than a binding.
* Bind Each -- Currently wastefully re-renders the entire list every time.
* Batched DOM Updates -- Would it help performance to batch updates? IE: delay updating the DOM until a setTimeout can gather multiple updates?
* Child Paths -- Binding to child attributes requires some extra callbacks on the intermediate children.