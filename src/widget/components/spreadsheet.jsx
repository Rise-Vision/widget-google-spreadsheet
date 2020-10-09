/* global gadgets */
/* eslint-disable no-console */

var params = null;

require( "fixed-data-table/dist/fixed-data-table.css" );

require( "../css/fixed-data-table-overrides.css" );
import React from "react";
import Scroll from "./scroll";
import TableHeaderContainer from "../containers/TableHeaderContainer";
import RiseCache from "../../components/widget-common/dist/rise-cache";
import Logger from "../../components/widget-common/dist/logger";
import Common from "../../components/widget-common/dist/common";
import RiseData from "../../components/widget-common/dist/rise-data";
import RiseGoogleSheet from "../../components/widget-common/dist/rise-google-sheet";
import config from "../../config/config";

const prefs = new gadgets.Prefs(),
  Spreadsheet = React.createClass( {
    headerClass: "header_font-style",
    bodyClass: "body_font-style",
    isLoading: true,
    viewerPaused: true,
    errorFlag: false,
    pudTimer: null,
    totalCols: 0,
    apiErrorFlag: false,

    API_KEY_DEFAULT: config.apiKey,

    getInitialState: function() {
      return {
        data: null
      };
    },

    componentDidMount: function() {
      var id = new gadgets.Prefs().getString( "id" );

      if ( id && id !== "" ) {
        gadgets.rpc.register( "rscmd_play_" + id, this.play );
        gadgets.rpc.register( "rscmd_pause_" + id, this.pause );
        gadgets.rpc.register( "rscmd_stop_" + id, this.stop );
        gadgets.rpc.register( "rsparam_set_" + id, this.configure );
        gadgets.rpc.call( "", "rsparam_get", null, id, [ "companyId", "displayId", "additionalParams" ] );
      }
    },

    configure: function( names, values ) {
      var additionalParams = null,
        companyId = "",
        displayId = "";

      if ( Array.isArray( names ) && names.length > 0 && Array.isArray( values ) && values.length > 0 ) {
        if ( names[ 0 ] === "companyId" ) {
          companyId = values[ 0 ];
        }

        if ( names[ 1 ] === "displayId" ) {
          if ( values[ 1 ] ) {
            displayId = values[ 1 ];
          } else {
            displayId = "preview";
          }
        }

        Logger.setIds( companyId, displayId );

        if ( names[ 2 ] === "additionalParams" ) {
          additionalParams = JSON.parse( values[ 2 ] );

          this.setParams( additionalParams );
        }
      }
    },

    setParams: function( additionalParams ) {
      params = JSON.parse( JSON.stringify( additionalParams ) );

      params.width = prefs.getInt( "rsW" );
      params.height = prefs.getInt( "rsH" );

      this.init();
    },

    init: function() {
      this.props.initSize( params.width, params.height );
      this.setRowStyle();
      this.setSeparator();

      if ( Common.isLegacy() ) {
        this.logEvent( {
          event: "warning",
          event_details: "Widget is not supported on legacy rise player",
          url: params.spreadsheet.url
        } );

        this.errorFlag = true;
        this.isLoading = false;
        this.ready();

      } else {
        // show wait message while Storage initializes
        this.props.showMessage( "Please wait while your google sheet is loaded." );

        this.loadFonts();
        this.setVerticalAlignment();

        this.initRiseGoogleSheet();
        this.logConfiguration();
      }

    },

    setRowStyle: function() {
      Common.addCSSRules( [
        ".even" + " .fixedDataTableCellGroupLayout_cellGroup {background-color: " + params.format.evenRowColor + " !important }",
        ".odd" + " .fixedDataTableCellGroupLayout_cellGroup {background-color: " + params.format.oddRowColor + " !important }"
      ] );
    },

    setVerticalAlignment: function() {
      if ( params.spreadsheet.hasHeader ) {
        Common.addCSSRules( [
          ".header_font-style .fixedDataTableCellLayout_wrap3 {vertical-align: " + params.format.header.fontStyle.verticalAlign + " }"
        ] );
      }

      Common.addCSSRules( [
        ".body_font-style .fixedDataTableCellLayout_wrap3 {vertical-align: " + params.format.body.fontStyle.verticalAlign + " }"
      ] );
    },

    setSeparator: function() {
      var rules = [],
        columnBorderW,
        rowBorderW;

      if ( !params.format.separator.showRow && !params.format.separator.showColumn ) {
        // rely on default css overrides which have all borders transparent but also remove any border that was added
        rules.push( ".fixedDataTableCellLayout_main {border: none;}" );

      } else {

        // colors
        rules = [
          ".fixedDataTableCellLayout_main {border-color: " + params.format.separator.color + "; }",
          ".public_fixedDataTableCell_main {border-color: " + params.format.separator.color + "; }"
        ];

        // row and column separators (border widths of either 1 or 0)
        columnBorderW = ( params.format.separator.showColumn ) ? "1px" : "0";
        rowBorderW = ( params.format.separator.showRow ) ? "1px" : "0";

        rules.push( ".fixedDataTableCellLayout_main {border-style: solid; border-width: 0 " + columnBorderW +
          " " + rowBorderW + " 0; }" );

        if ( params.spreadsheet.hasHeader ) {
          // fill in gap between header and data tables
          rules.push( ".fixedDataTableLayout_main, .public_fixedDataTable_main {margin-bottom: -2px; }" );

          if ( params.format.separator.showRow ) {
            // apply border color to the border that visually shows to the top of the first row of the data table
            rules.push( ".public_fixedDataTable_header, .public_fixedDataTable_hasBottomBorder {border-color: " +
              params.format.separator.color + "; }" );
          }
        }
      }

      Common.addCSSRules( rules );
    },

    logConfiguration: function() {
      this.logEvent( {
        event: "configuration",
        event_details: JSON.stringify( params.spreadsheet ),
        url: params.spreadsheet.url,
        api_key: ( params.spreadsheet.apiKey ) ? params.spreadsheet.apiKey : this.API_KEY_DEFAULT
      } );
    },

    initRiseGoogleSheet: function() {
      const riseData = new RiseData( { endpoint: "spreadsheets", storageType: "local" }, RiseCache );

      let sheet,
        sheetParams = {
        key: params.spreadsheet.fileId,
        sheet: params.spreadsheet.sheetName,
        refresh: params.spreadsheet.refresh,
        range: "",
        apikey: this.API_KEY_DEFAULT
      };

      if ( params.spreadsheet.cells === "range" ) {
        if ( params.spreadsheet.range.startCell && params.spreadsheet.range.endCell ) {
          sheetParams.range = `${params.spreadsheet.range.startCell}:${params.spreadsheet.range.endCell}`;
        }
      }

      if ( params.spreadsheet.apiKey && params.spreadsheet.apiKey !== this.API_KEY_DEFAULT ) {
        sheetParams.apikey = params.spreadsheet.apiKey;
        // force a minimum 10 min refresh for custom API key
        sheetParams.refresh = params.spreadsheet.refresh < 10 ? 10 : params.spreadsheet.refresh;
      } else {
        // ensure a minimum 60 min refresh for RiseVision API key
        sheetParams.refresh = params.spreadsheet.refresh < 60 ? 60 : params.spreadsheet.refresh;
      }

      sheet = new RiseGoogleSheet( sheetParams, riseData, this.handleGoogleSheet );
      sheet.go();
    },

    handleGoogleSheet: function( type, detail ) {
      switch ( type ) {
        case "response":
          this.processGoogleSheetResponse( detail );
          break;
        case "error":
          this.processGoogleSheetError( detail );
          break;
      }
    },

    processGoogleSheetResponse: function( detail ) {
      this.props.hideMessage();

      if ( detail && detail.results ) {
        this.setState( { data: detail.results } );
      }

      if ( this.isLoading ) {
        this.isLoading = false;
        this.ready();
      } else {
        // in case refresh fixed previous error
        this.errorFlag = false;
        this.apiErrorFlag = false;
      }
    },

    processGoogleSheetError: function( detail ) {
      console.log( "processGoogleSheetError", detail );

      let statusCode = 0,
        logParams = {
          "event": "error",
          "event_details": "spreadsheet not reachable",
          "error_details": "The request failed with status code: 0",
          "url": params.spreadsheet.url,
          "api_key": ( params.spreadsheet.apiKey ) ? params.spreadsheet.apiKey : this.API_KEY_DEFAULT
        };

      this.props.hideMessage();

      if ( detail.status && detail.statusText ) {
        logParams.error_details = `${detail.status}: ${detail.statusText}`;
        statusCode = detail.status;
      }

      if ( statusCode === 429 ) {
        return this.processGoogleSheetQuota( detail );
      }

      if ( statusCode === 403 ) {
        logParams.event_details = "spreadsheet not public";
      } else if ( statusCode === 404 ) {
        logParams.event_details = "spreadsheet not found";
      }

      if ( statusCode && ( String( statusCode ).slice( 0, 2 ) === "50" ) ) {
        logParams.event = "warning"
        logParams.event_details = "api server error";
      }

      // check if there is cached data
      if ( detail.results ) {
        // cached data provided, process as normal response
        this.processGoogleSheetResponse( detail );
      } else {
        this.errorFlag = true;
        this.setState( { data: null } );
      }

      this.logEvent( logParams );

      if ( this.isLoading ) {
        this.isLoading = false;
        this.ready();
      } else {
        if ( this.errorFlag && !this.viewerPaused ) {
          this.done();
        }
      }
    },

    processGoogleSheetQuota: function( detail ) {
      // log the event
      this.logEvent( {
        "event": "error",
        "event_details": "api quota exceeded",
        "error_details": detail.status && detail.statusText ? `${detail.status}: ${detail.statusText}` : "",
        "url": params.spreadsheet.url,
        "api_key": ( params.spreadsheet.apiKey ) ? params.spreadsheet.apiKey : this.API_KEY_DEFAULT
      } );

      if ( detail && detail.results ) {
        // cached data provided, process as normal response
        this.processGoogleSheetResponse( detail );
      } else {
        this.errorFlag = true;
        this.setState( { data: null } );

        if ( this.isLoading ) {
          this.isLoading = false;
          this.ready();
        } else {
          if ( !this.viewerPaused ) {
            this.done();
          }
        }
      }
    },

    loadFonts: function() {
      const { columns } = params.format;

      var fontSettings = [];

      fontSettings.push( {
        "class": this.headerClass,
        "fontStyle": params.format.header.fontStyle
      } );

      fontSettings.push( {
        "class": this.bodyClass,
        "fontStyle": params.format.body.fontStyle
      } );

      fontSettings.push( {
        "class": this.bodyClass,
        "fontStyle": params.format.body.fontStyle
      } );

      columns.forEach( function( column ) {
        fontSettings.push( {
          // CSS class can't start with a number.
          "class": "_" + column.id,
          "fontStyle": column.fontStyle
        } );
      } );

      Common.loadFonts( fontSettings );
    },

    startPUDTimer: function() {
      let delay;

      if ( ( params.scroll.pud === undefined ) || ( params.scroll.pud < 1 ) ) {
        delay = 10000;
      } else {
        delay = params.scroll.pud * 1000;
      }

      this.pudTimer = setTimeout( () => this.done(), delay );
    },

    ready: function() {
      gadgets.rpc.call( "", "rsevent_ready", null, prefs.getString( "id" ), true, true, true, true, true );
    },

    done: function() {
      gadgets.rpc.call( "", "rsevent_done", null, prefs.getString( "id" ) );
    },

    play: function() {
      this.viewerPaused = false;

      if ( this.errorFlag ) {
        return this.done();
      }

      if ( this.refs.scrollComponent && this.refs.scrollComponent.canScroll() ) {
        this.refs.scrollComponent.play();
      } else {
        this.startPUDTimer();
      }
    },

    pause: function() {
      this.viewerPaused = true;

      if ( this.refs.scrollComponent ) {
        this.refs.scrollComponent.pause();
      }

      if ( this.pudTimer ) {
        clearTimeout( this.pudTimer );
      }
    },

    stop: function() {
      this.pause();
    },

    getTableName: function() {
      return "spreadsheet_events";
    },

    logEvent: function( params ) {
      Logger.logEvent( this.getTableName(), params );
    },

    // Calculate the width that is taken up by rendering columns with an explicit width.
    getColumnWidthObj: function() {
      const { columns } = params.format;

      var column = null,
        width = 0,
        numCols = 0;

      if ( columns !== undefined ) {
        // For every column formatting option...
        for ( let j = 0; j < columns.length; j++ ) {
          column = columns[ j ];

          if ( ( column.width !== undefined ) && ( column.width !== "" ) ) {
            width += parseInt( column.width, 10 );
            numCols++;
          }
        }
      } else {
        width = 0;
      }

      return {
        width: width,
        numCols: numCols
      };
    },

    getColumnWidth: function( column ) {
      if ( ( column.width !== undefined ) && ( column.width !== "" ) ) {
        return parseInt( column.width, 10 );
      } else {
        return this.getDefaultColumnWidth();
      }
    },

    getDefaultColumnWidth: function() {
      const columnWidthObj = this.getColumnWidthObj();

      return ( params.width - columnWidthObj.width ) / ( this.totalCols - columnWidthObj.numCols );
    },

    getColumnAlignment: function( column ) {
      if ( ( column.fontStyle !== undefined ) && ( column.fontStyle.align !== undefined )
        && ( column.fontStyle.align !== "" ) ) {
        return column.fontStyle.align;
      } else {
        return this.getDefaultColumnAlignment();
      }
    },

    getDefaultColumnAlignment: function() {
      return "left";
    },

    /* Get per column formatting as an object.
     * Object format: [{id: 0, alignment: "left", width: 100}]
     * 'width' is always returned; 'id' and 'alignment' are optionally returned.
     */
    getColumnFormats: function() {
      const { columns } = params.format;

      var found = false,
        column = null,
        columnFormats = [];

      if ( columns !== undefined ) {
        // Iterate over every column.
        for ( let i = 0; i < this.totalCols; i++ ) {
          found = false;
          columnFormats[ i ] = {};

          // Iterate over every column format setting.
          for ( let j = 0; j < columns.length; j++ ) {
            column = columns[ j ];

            // Map column to formatted column using column id (i.e. column index).
            if ( i == column.id ) {
              const columnFormat = columnFormats[ i ];

              columnFormat.id = parseInt( column.id, 10 );
              columnFormat.numeric = column.numeric ? column.numeric : false;
              columnFormat.alignment = this.getColumnAlignment( column );
              columnFormat.width = this.getColumnWidth( column );
              columnFormat.colorCondition = column.colorCondition;
              found = true;

              break;
            }
          }

          // No column formatting option for just this column.
          if ( !found ) {
            columnFormats[ i ].width = this.getDefaultColumnWidth();
          }
        }
      } else {
        // No per column format settings.
        for ( let i = 0; i < this.totalCols; i++ ) {
          columnFormats[ i ] = {};
          // Equal width columns.
          columnFormats[ i ].width = params.width / this.totalCols;
        }
      }

      return columnFormats;
    },

    getHeaders: function() {
      var matchFound = false,
        column = null,
        headers = [],
        { columns } = params.format;

      // Iterate over every column header.
      for ( let i = 0; i < this.totalCols; i++ ) {
        matchFound = false;

        // Iterate over every column formatting option.
        if ( columns !== undefined ) {
          for ( let j = 0; j < columns.length; j++ ) {
            column = columns[ j ];

            // Map column to formatted column using column id (i.e. column index).
            if ( i == column.id ) {
              if ( ( column.headerText !== undefined ) && ( column.headerText !== "" ) ) {
                headers.push( column.headerText );
                matchFound = true;
              }

              break;
            }
          }
        }

        // Use the header from the spreadsheet.
        if ( !matchFound ) {
          headers.push( this.state.data[ 0 ][ i ] );
        }
      }

      return headers;
    },

    getRows: function() {
      if ( params.spreadsheet.hasHeader ) {
        return this.state.data.slice( 1 );
      } else {
        return this.state.data;
      }
    },

    canRenderBody: function() {
      if ( !params.spreadsheet.hasHeader ) {
        return true;
      }

      return this.state.data.length > 1;
    },

    render: function() {
      if ( this.state.data ) {
        this.totalCols = this.state.data[ 0 ] ? this.state.data[ 0 ].length : 1;

        return (
          <div id="table">
          {params.spreadsheet.hasHeader ?
            <TableHeaderContainer
              align={params.format.header.fontStyle.align}
              data={this.getHeaders()}
              width={params.width}
              height={params.format.rowHeight}
              columnFormats={this.getColumnFormats()} />
              : false}
            {this.canRenderBody() ?
              <Scroll
                ref="scrollComponent"
                onDone={this.done}
                hasHeader={params.spreadsheet.hasHeader}
                scroll={params.scroll}
                data={this.getRows()}
                align={params.format.body.fontStyle.align}
                class={this.bodyClass}
                totalCols={this.totalCols}
                rowHeight={params.format.rowHeight}
                width={params.width}
                height={params.spreadsheet.hasHeader ? params.height - params.format.rowHeight : params.height}
                columnFormats={this.getColumnFormats()} />
            : false}
          </div>
        );
      } else {
        return null;
      }
    }
  } );

export default Spreadsheet;
