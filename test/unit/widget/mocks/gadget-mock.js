( function( window ) {

  var rpc = function( methodName, callback, param1, param2 ) {
    var i,
      value,
      callbackMethod = null;

    if ( methodName === "rscmd_saveSettings" ) {
      window.result.params = param1.params;
      window.result.additionalParams = param1.additionalParams;
      if ( callback ) {
        callback( param1 );
      } else {
        return param1;
      }
    } else if ( methodName === "rscmd_getAdditionalParams" ) {
      if ( callback ) {
        callback( window.result.additionalParams );
      }
    } else if ( methodName === "rsparam_get" ) {
      for ( i = 0; i < rpc.methods.length; i++ ) {
        if ( rpc.methods[ i ] === "rsparam_set_" + param1 ) {
          callbackMethod = rpc.callbacks[ i ];
          break;
        }
      }

      if ( callbackMethod && param2 ) {
        if ( typeof ( param2 ) === "string" ) {
          value = param2;
        } else if ( param2.length ) {
          value = [];

          for ( i = 0; i < param2.length; i++ ) {
            if ( param2[ i ] === "additionalParams" && window.gadget && window.gadget.settings ) {
              value[ i ] = JSON.stringify( window.gadget.settings.additionalParams );
            } else {
              value[ i ] = JSON.stringify( param2[ i ] );
            }
          }
        }

        callbackMethod( param2, value );
      }
    } else if ( ( methodName === "rsevent_ready" ) || ( methodName === "rsevent_done" ) ) {
      for ( i = 0; i < rpc.methods.length; i++ ) {
        if ( rpc.methods[ i ] === "rscmd_play_" + param1 ) {
          setTimeout( function() {
            rpc.callbacks[ i ]();
          }, 200 );
        }
      }
    } else {
      throw "Unknown method";
    }
  };

  rpc.methods = [];
  rpc.callbacks = [];

  rpc.register = function( methodName, callback ) {
    var i;

    if ( methodName && callback ) {
      for ( i = 0; i < rpc.methods.length; i++ ) {
        if ( rpc.methods[ i ] === methodName ) {
          rpc.callbacks[ i ] = callback;
          return;
        }
      }
      rpc.methods.push( methodName );
      rpc.callbacks.push( callback );
    }
  };

  window.result = {
    additionalParams: JSON.stringify(
      {}
    ) };

  window.gadgets = {
    Prefs: function() {
      return {
        getString: function( value ) {
          switch ( value ) {
          case "rsW":
            return window.innerWidth;
          case "rsH":
            return window.innerHeight;
          }
          return value;
        },
        getBool: function() {
          //TODO
          return false;
        },
        getInt: function( value ) {
          switch ( value ) {
          case "rsW":
            return window.innerWidth;
          case "rsH":
            return window.innerHeight;
          }

          return -1;
        }
      };
    },
    rpc: rpc
  };

} )( window );
