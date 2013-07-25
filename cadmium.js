var express = require('express'),
    app     = express(),
    Tm      = require('thulium'),
    fs      = require('fs'),
    Ne      = require('neon'),
    hljs    = require('highlight.js'),
    //app
    port        = 3000,
    viewsFolder = 'views',
    assetFolder = 'assets',
    indexFile   = 'index.ejs';

/****************** Thulium helper */
var ThuliumProcessor = Ne.Class('ThuliumProcessor')({

    _currentViews : [],

    currentView : function () {
      return this._currentViews[this._currentViews.length - 1];
    },

    result : function( templateString, context ){
        var currentView;
        currentView = new Tm( { template: templateString } );
        this._currentViews.push(currentView);
        currentView.parseSync().renderSync( context );
        this._currentViews.pop();
        return currentView.view;
    }

});
/****************** Thulium helper */


var Context = function( siteFiles ){

    this.prototype = {

      init : function( siteFiles ){
        //check for assets index
        if( !siteFiles.assets ){ console.log('No assets index in conf'); return; }
        console.log('Creating context.');

        this.proj         = siteFiles.project;
        // this.renderAssets = this.renderAssets;
        // this.renderFonts  = this.renderFonts;
        this.assets       = siteFiles.assets;
        this.render       = this.render;
        this.rId          = '?r='+( Math.floor((1 + Math.random()) * 0x10000).toString(16).substring(1) );

        return this;
      },

      renderCdn : function(){
        return this.assets.cdn.join('\n');
      },

      renderCss : function(){
        var buff = [];

        this.assets.css.forEach(function( css ){
            buff.push( '<link href="assets/css/' + css + '" rel="stylesheet" type="text/css">' );
        });

        return buff.join('\n');
      },

      renderJs : function(){
        var buff = [];

        this.assets.js.forEach(function( js ){
            buff.push( '<script src="assets/js/' + js + '"></script>' );
        });

        return buff.join('\n');
      },

      renderGoogleFonts : function(){
        var buff = [];

        this.assets.googleFonts.forEach(function( font ){
            buff.push( '<link href="http://fonts.googleapis.com/css?family='+font+'" rel="stylesheet" type="text/css">' );
        });

        return buff.join('\n');
      },

      render : function( partialName, locals ){
        return ThuliumProcessor.result( fs.readFileSync( viewsFolder+'/'+partialName, 'utf8'), {Cd: this, locals: locals});
      },

      printCode : function( partial ){
        //Get thulium partial
        var partialContent = ThuliumProcessor.currentView().renderer.capture( partial ).replace(/\?/g,'%').replace(/^[\s]+|[\s]+$/g, '');
        var zeroCode = '';
        var lang = /```(\w*)/.exec( partialContent )[1];

        //strip md ``` code markers
        partialContent = partialContent.replace(/```(\w*)/,'').replace(/```/g, '');

        //save string for clipbord paste
        zeroCode = partialContent.replace(/\n/g,'\\n')
                                       //encode html
                                       .replace(/"/g, '&dqu;')
                                       .replace(/'/g, '&squ;')
                                       .replace(/&/g, "&amp;")
                                       .replace(/</g, "&lt;")
                                       .replace(/>/g, "&gt;");
        
        //check for specified lang
        partialHighlight = lang ? hljs.highlight(lang, partialContent).value : hljs.highlight(partialContent).value;
        lang = lang ? lang : 'no-highlight';

        //gift wrap it and send
        return '<div class="code-highlight">\
                  <div class="button code-copy" data-clipboard-text="'+zeroCode+'" ><i class="icon icon-copy"></i><div class="label">copy</div><div class="shade"></div></div>\
        <pre><code class="'+lang+'">'+ partialHighlight +'</code></pre></div>';
      }
    };

    return this.prototype.init( siteFiles );
};

var Cd = {

  start : function(){
    cd = this;
    //filenames will be replaced by its content
    this.siteFiles = {
      project : 'project.json',
      assets  : 'assets.json'
    };

    //init route
    app.get('/', function( req, res ){
      var renderedIndex = '',
          indexFilePath = viewsFolder+'/'+indexFile,
          indexTemplate = fs.readFileSync( indexFilePath, 'utf8');

      //reload config
      cd.siteFiles = {
        project : 'project.json',
        assets  : 'assets.json'
      };

      //read config and data
      cd.loadSiteFiles();

      //set a rendering context
      // cd.createContext( cd.siteFiles );
      cd.context = new Context( cd.siteFiles );

      //try to render
      console.log('Rendering style and index file!');
      fs.writeFileSync( assetFolder+'/css/style.css', ThuliumProcessor.result( fs.readFileSync( assetFolder+'/css/style.css.ejs', 'utf8'),  {Cd : cd.context}) );
      // renderedIndex = new Tm( {template: indexTemplate} ).parseSync().renderSync( {Cd: cd.context} );
      renderedIndex = ThuliumProcessor.result(indexTemplate, {Cd: cd.context});

      //also write file
      fs.writeFileSync( 'index.html', renderedIndex );
      console.log('index.html File saved!');

      //render preview result
      res.send( renderedIndex );
    });

    //asset static route
    app.use('/assets', express.static(__dirname + '/assets'));
    app.use(app.router);

    app.listen( port );
    console.log('Cd ready on port: ' + port);
    return;
  },

  loadSiteFiles : function(){
    var cd = this,
        path = '',
        buff = {};

    Object.keys(this.siteFiles).forEach(function( file ){
      if(typeof cd.siteFiles[file] !== 'string'){return;} //i'm really sory about this, but an [object obecjt keeps poppung up]
      path = cd.siteFiles[file];
      console.log('Parsing '+path);
      buff[file] = JSON.parse( fs.readFileSync( path, 'utf8') );
    });

    this.siteFiles = buff;

    return this;
  }
};

Cd.start();