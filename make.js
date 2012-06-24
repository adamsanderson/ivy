var fs = require("fs"),
    marked = require("marked"),      // npm: marked
    Mustache = require("mustache"),  // npm: mustache
    less = require('less'),          // npm: less
    ducks = require("./lib/ducks");

/* 
  Builds documentation
  - index.html -- from readme.markdown
  - api.html -- from ducks output
  
*/

// Markdown rendering options
marked.setOptions({
  gfm: false,
  pedantic: false,
  sanitize: false
});

fs.readFile("templates/_navigation.html", function (err, html) {
  var partials = {navigation: html.toString()};
  renderSiteHtml(partials);
});

renderSiteCss();

/**
  Render the documentation pages
 */
function renderSiteHtml(partials){
  // Generate index.html:
  fs.readFile("readme.markdown", function (err, readme) {
    if (err) throw err;

    var data = {
      content: marked(readme.toString())
    };

    renderTemplate("templates/content.html", 'index.html', data);
  });

  // Generate bindings.html:
  fs.readFile("bindings.markdown", function (err, readme) {
    if (err) throw err;

    var data = {
      content: marked(readme.toString())
    };

    renderTemplate("templates/content.html", 'bindings.html', data);
  });

  // Generate api.html:
  fs.readFile("ivy.js", function (err, jsSrc) {
    if (err) throw err;

    var functions = ducks.parseComments(jsSrc.toString());
    for (var i=0; i < functions.length; i++){
      functions[i].commentHtml = marked(functions[i].comment);
    }

    renderTemplate("templates/api.html", 'api.html', {functions: functions});
  });
  
  /**
   *  Renders markdown templates to the outputPath path with the given data, and
   *  optional partials.
   */
  function renderTemplate(templatePath, outputPath, data){
    fs.readFile(templatePath, function(err, template){
      if (err) throw err;

      var html = Mustache.to_html(template.toString(), data, partials);
      fs.writeFile(outputPath, html, function(err){
        if (err) throw err;
      });
    });
  }
}

function renderSiteCss(){
  fs.readFile("css/site.less", function (err, lessSrc) {
    if (err) throw err;

    var parser = new less.Parser({
      filename: 'site.less',
      paths: ['css']
    });

    parser.parse(lessSrc.toString(), function (err, tree) {
        if (err) throw err;

        fs.writeFile('css/site.css', tree.toCSS({compress: true}), function(err){
          if (err) throw err;
        });
    });
  });
}