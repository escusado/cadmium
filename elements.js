var repl = require("repl"),
    Ne = require('neon'),
    Tm = require('thulium'),
    fs = require('fs');

Ne.Class('Element')({
  prototype : {

    assetsPath : 'assets',

    init  : function(){
      var context = {},
          template = '';

      //read project data conf
      context.project = this.loadJson( 'conf.json' );

      //get assets
      context.assets = this.loadJson( 'assets.json' );

      context.api = {
        renderAssets : this.renderAssets
      };

      // console.log( context );
        //read conf
        //data
        //colors
        //code highlight theme
        //assets
      template = new Tm( {template: fs.readFileSync('views/index.ejs', 'utf8')} ).parseSync().renderSync( context );
      fs.writeFileSync( 'output/index.html', template );
      return 'done!';
    },

    /* API */
    renderAssets : function( type ){
        var pre = '',
            suf = '',
            buff = [];

        if( type === 'css' ){
          pre = '<link href="';
          suf = '" rel="stylesheet" type="text/css">';
        }else{
          pre = '<script src="';
          suf = '"></script>';
        }

        this.assets[type].forEach(function( asset ){
            buff.push( pre + asset +suf );
        });

        return buff.join('\n');
    },

    /* Utils */
    loadJson : function(filePath){
        return JSON.parse( fs.readFileSync( filePath, 'utf8') );
    }
  }
});

var element = new Ne.Element({name:'Neon'});

// repl.start({
//   prompt: "elem> ",
//   input: process.stdin,
//   output: process.stdout
// });