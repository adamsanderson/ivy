/**
  Keeping my all my docs in line.
  
  This is very minimal comment parsing for documentation.
 */

var ducks = exports;
ducks.version = '0.0.1';

/**
  Parses comments for function from the input `js`.
  Documentation comments should start with `/**`.
  
  For each commented function, an object will be returned
  with the following properties:
  
  - `signature`: The full function signature, ie: `ducks.parseComments(js)`
  - `name`: The qualified name of the function, ie: `ducks.parseComments`
  - `args`: The function's argumens as an array, ie: `[js]`
  - `comment`: The function's comment, which in this case is this comment.
  
*/
ducks.parseComments = function(js){
  js = js.replace(/\r\n/gm, '\n');

  var regexp   = /\/\*\*\s*\n([\s\S]+?)\s*\n\s*\*\/([\s\S]+?function[^{]+)/g,
      comments = [],
      matches,
      comment,
      fn,
      signature;
  
  while(matches = regexp.exec(js)){
    fn         = ducks.parseFunctionDeclaration(matches[2].trim());
    fn.comment = ducks.normalizeIndentation(matches[1]);
    
    comments.push(fn);
  }

  return comments;
};

ducks.normalizeIndentation = function(comment){
  var leader = comment.match(/^\s*\*?\s*/),
      blankComment = /^\s*\*?\s*$/,
      lines, 
      line;
  
  if (!leader) return comment;
  
  lines = comment.split('\n');
  for(var i=0; i < lines.length; i++){
    line = lines[i];
    if (line.match(blankComment)){
      lines[i] = '';
    } else {
      lines[i] = lines[i].replace(leader,'');
    }
  }
  return lines.join('\n');
};

ducks.parseFunctionDeclaration = function(str){
  // convert "x = function(a,b)" => "x(a,b)"
  var signature = str.replace(/\s*=?\s*function\s*/,''),
      nameAndArgs = (/\s*(.+?)\s*\([\w\s,]*\)\s*$/).exec(signature),
      name = nameAndArgs[1],
      args = nameAndArgs[2],
      shortName = name.split('.').pop(),
      type;
  
  args = (args ? args.split(/\s*,\s*/) : []);
  if (shortName.match(/^[A-Z]/)){
    type = 'constructor';
  } else if (~signature.indexOf('.prototype.')){
    type = 'method';
  } else {
    type = 'function';
  }
  
  return {
    signature: signature,
    name: name,
    shortName: shortName,
    args: args,
    type: type
  };
};
