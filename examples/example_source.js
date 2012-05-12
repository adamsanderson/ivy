/**
  ExampleSource
  
  Takes an HTML `elementId` and a function `jsFunction`,
  and reformats them so they can be included as documentation
  in the Ivy examples.
  
  With Ivy, you can use it like this:
      
      var src = new ExampleSource('example-html',initExample);
      Ivy.bindDom('example-source', src);
  
  In this case 'example-html' is the id of the HTML to be displayed,
  and 'initExample' is the function who's source we will show. 
  This object is then bound to the element 'example-source'.
  
*/ 
function ExampleSource(elementId, jsFunction){
  var html = document.getElementById(elementId).innerHTML;
  var js   = jsFunction.toString();
  
  // The css styling of the examples is irrelevant to how
  // Ivy works, so strip the html classes.
  html = html.replace(/\s*class=['"][^'"]+['"]/mg,'');
  
  this.html = this.trimSource(html);
  this.js   = this.trimSource(js);
}

// Reformats the source to remove the leading and trailing
// lines, and then re-indents the code.
ExampleSource.prototype.trimSource = function(str){
  var lines  = str.split('\n').slice(1,-1);
  var indent = lines[0].match(/^\s+/)[0];
  
  for(var i=0, len=lines.length; i < len; i++){
    lines[i] = lines[i].replace(indent,'');
  }
  return lines.join('\n');
};