require( "./css/spreadsheet.css" );

const React = require( "react" ),
  ReactDOM = require( "react-dom" ),
  Main = require( "./components/main" );

( function( window, document ) {
  "use strict";

  // Disable context menu (right click menu)
  window.oncontextmenu = function() {
    return false;
  };

  ReactDOM.render( <Main />, document.getElementById( "mainContainer" ) );
} )( window, document );
