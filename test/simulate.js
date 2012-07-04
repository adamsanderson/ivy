/**
 * From https://github.com/kangax/protolicious/blob/master/event.simulate.js
 * Modified so that prototype is not required.
 * 
 * simulate(element, eventName[, options])
 * 
 * - @element: element to fire event on
 * - eventName: name of event to fire (only MouseEvents and HTMLEvents interfaces are supported)
 * - options: optional object to fine-tune event properties - pointerX, pointerY, ctrlKey, etc.
 *
 *    foo.simulate('click'); // => fires "click" event on an element foo
 *
 **/
(function(){
  
  var eventMatchers = {
    'HTMLEvents': /^(?:load|unload|abort|error|select|change|submit|reset|focus|blur|resize|scroll)$/,
    'MouseEvents': /^(?:click|mouse(?:down|up|over|move|out))$/
  };
  
  var defaultOptions = {
    pointerX: 0,
    pointerY: 0,
    button: 0,
    ctrlKey: false,
    altKey: false,
    shiftKey: false,
    metaKey: false,
    bubbles: true,
    cancelable: true
  };
  
  // Make simulate available globally
  simulate = function(element, eventName, eventOptions) {
    var options = Ivy.util.beget(defaultOptions);
    for (var key in eventOptions){
      options[key] = eventOptions[key];
    }

    var oEvent, eventType = null;
        
    for (var name in eventMatchers) {
      if (eventMatchers[name].test(eventName)) { eventType = name; break; }
    }

    if (!eventType){
      throw new SyntaxError('Only HTMLEvents and MouseEvents interfaces are supported');
    }

    if (document.createEvent) {
      oEvent = document.createEvent(eventType);
      if (eventType == 'HTMLEvents') {
        oEvent.initEvent(eventName, options.bubbles, options.cancelable);
      }
      else {
        oEvent.initMouseEvent(eventName, options.bubbles, options.cancelable, document.defaultView, 
          options.button, options.pointerX, options.pointerY, options.pointerX, options.pointerY,
          options.ctrlKey, options.altKey, options.shiftKey, options.metaKey, options.button, element);
      }
      element.dispatchEvent(oEvent);
    }
    else {
      options.clientX = options.pointerX;
      options.clientY = options.pointerY;
      oEvent = document.createEventObject();
      for (var key in options){
        oEvent[key] = options[key];
      }
      element.fireEvent('on' + eventName, oEvent);
    }
    return element;
  };
})();