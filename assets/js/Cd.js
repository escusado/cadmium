Class('Cadmium')({
  prototype : {
    init : function( element ){
      this.element = element;
      //Copy to clipboard code block
      ZeroClipboard.setDefaults( { moviePath: 'assets/js/vendor/ZeroClipboard.swf' } );
      this.element.find('.code-copy').each(function( i, el ){
        zeroClip = new ZeroClipboard( el );
      });

    }
  }
});

$(function(){
  window.Cd = new Cadmium( $('.wrapper') );
});