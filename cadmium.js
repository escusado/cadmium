var express = require('express'),
    app     = express(),
    Tm      = require('thulium'),
    fs      = require('fs'),
    //app
    port        = 3000,
    siteFolder  = 'site',
    viewsFolder = 'views',
    assetFolder = 'assets',
    indexFile   = 'index.ejs';

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
      var indexFilePath = siteFolder+'/'+viewsFolder+'/'+indexFile;
          indexTemplate = fs.readFileSync( indexFilePath, 'utf8');

      cd.loadSiteFiles();
      cd.createContext( cd.siteFiles );
      console.log('Rendering index file!');
      res.send( new Tm( {template: indexTemplate} ).parseSync().renderSync( {Cd: cd.context} ) );
    });

    app.use('/assets', express.static(__dirname + '/site/assets'));
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
      path = siteFolder+'/'+cd.siteFiles[file];
      console.log('Parsing '+path);
      buff[file] = JSON.parse( fs.readFileSync( path, 'utf8') );
    });

    this.siteFiles = buff;

    return this;
  },

  createContext : function( siteConf ){
    //check for assets index
    if( !siteConf.assets ){ console.log('No assets index in conf'); return; }
    console.log('Creating context.');
    var context = {};

    context.projectData  = siteConf.project;
    context.renderAssets = this.renderAssets;
    context.renderFonts  = this.renderFonts;
    context.assets       = this.siteFiles.assets;
    context.render       = this.render;

    this.context = context;
  },

  renderAssets : function( assets ){
    var pre = '',
        suf = '',
        buff = [];

    assets.forEach(function( asset ){
        var type = asset.indexOf('.js') > -1 ? 'js' : 'css';

        if( type === 'css' ){
          pre = '<link href="';
          suf = '" rel="stylesheet" type="text/css">';
        }else{
          pre = '<script src="';
          suf = '"></script>';
        }

        buff.push( pre + assetFolder+'/'+type+'/'+asset +suf );
    });

    return buff.join('\n');
  },

  renderFonts : function( fonts ){
    var buff = [];

    fonts.forEach(function( font ){
      buff.push( '<link href="http://fonts.googleapis.com/css?family='+font+'" rel="stylesheet" type="text/css">' );
    });

    return buff.join('\n');
  },

  render : function( partialName, locals ){
    return new Tm( {template: fs.readFileSync( siteFolder+'/'+viewsFolder+'/'+partialName, 'utf8')} ).parseSync().renderSync({Cd: this.context, locals: locals});
  }

};

Cd.start();