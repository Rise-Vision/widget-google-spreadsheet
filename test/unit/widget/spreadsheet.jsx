/* global describe, before, beforeEach, after, afterEach, it, sinon, xit  */

import React from "react";
import { mount } from "enzyme";
import { expect } from "chai";
import Spreadsheet from "../../../src/widget/components/spreadsheet";
import TableHeaderContainer from "../../../src/widget/containers/TableHeaderContainer";
import Table from "../../../src/widget/components/table";
import Scroll from "../../../src/widget/components/scroll";
import LoggerUtils from "../../../src/components/widget-common/dist/logger";
import "../../data/spreadsheet";

describe( "<Spreadsheet />", function() {
  let server,
    logStub,
    wrapper;
  const data = [ [ "Column 1", "Column 2", "Column 3" ], [ "A2", "B2", "C2" ] ],
    additionalParams = window.gadget.settings.additionalParams,
    columnsParam = additionalParams.format.columns;

  var propHandlers = {
    initSize: function() {},
    showMessage: function() {},
    hideMessage: function() {}
  };

  before( function() {
    server = sinon.fakeServer.create();
    server.respondImmediately = true;
    server.respondWith( "GET", "https://sheets.googleapis.com/v4/spreadsheets/xxxxxxxxxx?key=abc123",
      [ 200, { "Content-Type": "application/json" },
        "{ \"sheets\": [{ \"properties\": { \"title\": \"Sheet1\" } }] }" ] );
    server.respondWith( "POST", "https://www.googleapis.com/oauth2/v3/token", [ 200, { "Content-Type": "text/html" }, "OK" ] );

  } );

  beforeEach( function() {
    logStub = sinon.stub( LoggerUtils, "logEvent" );
    wrapper = mount( <Spreadsheet initSize={propHandlers.initSize}
                                 showMessage={propHandlers.showMessage}
                                 hideMessage={propHandlers.hideMessage} /> );
  } );

  afterEach( function() {
    logStub.restore();
  } );

  after( function() {
    server.restore();
  } );

  it( "Should have an initial data state", function() {
    expect( wrapper.state().data ).to.be.null;
  } );

  describe( "<TableHeaderContainer />", function() {
    beforeEach( function() {
      wrapper.setState( { data: data } );
    } );

    it( "Should contain a TableHeaderContainer component", function() {
      expect( wrapper.find( TableHeaderContainer ) ).to.have.length( 1 );
    } );

    it( "Should have align prop", function() {
      expect( wrapper.find( TableHeaderContainer ).props().align ).to.equal( additionalParams.format.header.fontStyle.align );
    } );

    it( "Should have data prop", function() {
      var expected = [ additionalParams.format.columns[ 0 ].headerText, "Column 2", "Column 3" ];

      expect( wrapper.find( TableHeaderContainer ).props().data ).to.deep.equal( expected );
    } );

    it( "Should have columnFormats prop", function() {
      var expected = [
        {
          id: additionalParams.format.columns[ 0 ].id,
          numeric: false,
          alignment: "left",
          width: additionalParams.format.columns[ 0 ].width,
          colorCondition: "none"
        },
        {
          width: 250
        },
        {
          width: 250
        }
      ];

      expect( wrapper.find( TableHeaderContainer ).props().columnFormats ).to.deep.equal( expected );
    } );

    it( "Should have height prop", function() {
      expect( wrapper.find( TableHeaderContainer ).props().height ).to.equal( additionalParams.format.rowHeight );
    } );

    it( "Should have width prop", function() {
      expect( wrapper.find( TableHeaderContainer ).props().width ).to.equal( window.innerWidth );
    } );
  } );

  describe( "No <TableHeaderContainer />", function() {
    beforeEach( function() {
      additionalParams.spreadsheet.hasHeader = false;
      wrapper = mount( <Spreadsheet initSize={propHandlers.initSize}
                                   showMessage={propHandlers.showMessage}
                                   hideMessage={propHandlers.hideMessage} /> );

      wrapper.setState( { data: data } );
    } );

    afterEach( function() {
      additionalParams.spreadsheet.hasHeader = true;
    } );

    it( "Should not contain a TableHeaderContainer component", function() {
      expect( wrapper.find( TableHeaderContainer ) ).to.have.length( 0 );
    } );

    it( "Should pass the correct height prop for the Table component", function() {
      expect( wrapper.find( Table ).props().height ).to.equal( window.innerHeight );
    } );
  } );

  describe( "<Scroll />", function() {
    beforeEach( function() {
      wrapper.setState( { data: data } );
    } );

    it( "Should have columnFormats prop", function() {
      var expected = [
        {
          id: additionalParams.format.columns[ 0 ].id,
          numeric: false,
          alignment: "left",
          width: additionalParams.format.columns[ 0 ].width,
          colorCondition: "none"
        },
        {
          width: 250
        },
        {
          width: 250
        }
      ];

      expect( wrapper.find( Scroll ).props().columnFormats ).to.deep.equal( expected );
    } );
  } );

  describe( "Refreshing", function() {
    beforeEach( function() {
      wrapper.setState( { data: data } );
    } );

    xit( "should update the state", function() {
      const event = document.createEvent( "Event" ),
        sheet = document.getElementById( "rise-google-sheet" ),
        newData = [ [ "Column 1" ], [ "Test data" ] ];

      event.initEvent( "rise-google-sheet-response", true, true );
      event.detail = {};
      event.detail.results = newData;

      sheet.dispatchEvent( event );

      expect( wrapper.state().data ).to.deep.equal( newData );
    } );
  } );

  describe( "Handling error", function() {
    beforeEach( function() {
      wrapper.setState( { data: data } );
    } );

    xit( "should revert state back to initial value", function() {
      var event = document.createEvent( "Event" ),
        sheet = document.getElementById( "rise-google-sheet" );

      event.initEvent( "rise-google-sheet-error", true, true );
      event.detail = {};

      sheet.dispatchEvent( event );

      expect( wrapper.state().data ).to.be.null;
    } );

    xit( "should ensure state is updated when error and cached data is provided", function() {
        var event = document.createEvent( "Event" ),
          sheet = document.getElementById( "rise-google-sheet" );

        event.initEvent( "rise-google-sheet-error", true, true );
        event.detail = { results: [ [ "1", "2", "3" ] ] };

        sheet.dispatchEvent( event );

        expect( wrapper.state().data ).to.deep.equal( [ [ "1", "2", "3" ] ] );
      } );

    xit( "should ensure state is initial value when quota error and no cached data provided", function() {
      var event = document.createEvent( "Event" ),
        sheet = document.getElementById( "rise-google-sheet" );

      event.initEvent( "rise-google-sheet-quota", true, true );
      event.detail = {};

      sheet.dispatchEvent( event );

      expect( wrapper.state().data ).to.be.null;
    } );

    xit( "should ensure state is updated when quota error and cached data is provided", function() {
      var event = document.createEvent( "Event" ),
        sheet = document.getElementById( "rise-google-sheet" );

      event.initEvent( "rise-google-sheet-quota", true, true );
      event.detail = { results: [ [ "1", "2", "3" ] ] };

      sheet.dispatchEvent( event );

      expect( wrapper.state().data ).to.deep.equal( [ [ "1", "2", "3" ] ] );
    } );

  } );

  describe( "Logging", function() {
    var table = "spreadsheet_events",
      sheet = document.getElementById( "rise-google-sheet" );

    it( "should log the configuration event", function() {
      var eventDetails = JSON.stringify( additionalParams.spreadsheet ),
        params = {
          "event": "configuration",
          "event_details": eventDetails,
          "url": additionalParams.spreadsheet.url,
          "api_key": "abc123"
        },
        endpointParams = {
          severity: "info",
          eventApp: "widget-google-spreadsheet",
          debugInfo: JSON.stringify( {
            "event": "configuration",
            "url": additionalParams.spreadsheet.url,
            "api_key": "abc123"
          } )
        };

      expect( logStub.withArgs( table, params, endpointParams ).called ).to.equal( true );
    } );

    xit( "should log the default error event", function() {
      var event = document.createEvent( "Event" ),
        params = {
          "event": "error",
          "event_details": "spreadsheet not reachable",
          "error_details": "The request failed with status code: 0",
          "url": additionalParams.spreadsheet.url,
          "request_url": "",
          "api_key": "abc123"
        };

      event.initEvent( "rise-google-sheet-error", true, true );
      event.detail = {
        "error": {
          "message": ""
        }
      };
      sheet.dispatchEvent( event );

      expect( logStub.withArgs( table, params ).called ).to.equal( true );
    } );

    xit( "should only log the error event when spreadsheet is not reachable for a consecutive time", function() {
      let event = document.createEvent( "Event" ),
        params = {
          "event": "error",
          "event_details": "spreadsheet not reachable",
          "error_details": "The request failed with status code: 503",
          "url": additionalParams.spreadsheet.url,
          "request_url": "https://sheets.googleapis.com/v4/spreadsheets/xxxxxxxxxx/values/Sheet1?key=abc123&majorDimension=ROWS&valueRenderOption=FORMATTED_VALUE",
          "api_key": "abc123"
        };

      event.initEvent( "rise-google-sheet-error", true, true );
      event.detail = {
        "error": {
          "message": "The request failed with status code: 503"
        },
        "request": {
          "url": params.request_url
        }
      };
      sheet.dispatchEvent( event );

      expect( logStub.withArgs( table, params ).called ).to.equal( false );

      sheet.dispatchEvent( event );

      expect( logStub.withArgs( table, params ).called ).to.equal( true );
    } );

    xit( "should log the error event when spreadsheet is not public ", function() {
      var event = document.createEvent( "Event" ),
        params = {
          "event": "error",
          "event_details": "spreadsheet not public",
          "error_details": "The request failed with status code: 403",
          "url": additionalParams.spreadsheet.url,
          "request_url": "https://sheets.googleapis.com/v4/spreadsheets/xxxxxxxxxx/values/Sheet1?key=abc123&majorDimension=ROWS&valueRenderOption=FORMATTED_VALUE",
          "api_key": "abc123"
        };

      event.initEvent( "rise-google-sheet-error", true, true );
      event.detail = {
        "error": {
          "message": "The request failed with status code: 403"
        },
        "request": {
          "url": params.request_url
        }
      };
      sheet.dispatchEvent( event );

      expect( logStub.withArgs( table, params ).called ).to.equal( true );
    } );

    xit( "should log the error event when spreadsheet is not found ", function() {
      var event = document.createEvent( "Event" ),
        params = {
          "event": "error",
          "event_details": "spreadsheet not found",
          "error_details": "The request failed with status code: 404",
          "url": additionalParams.spreadsheet.url,
          "request_url": "https://sheets.googleapis.com/v4/spreadsheets/xxxxxxxxxx/values/Sheet1?key=abc123&majorDimension=ROWS&valueRenderOption=FORMATTED_VALUE",
          "api_key": "abc123"
        };

      event.initEvent( "rise-google-sheet-error", true, true );
      event.detail = {
        "error": {
          "message": "The request failed with status code: 404"
        },
        "request": {
          "url": params.request_url
        }
      };
      sheet.dispatchEvent( event );

      expect( logStub.withArgs( table, params ).called ).to.equal( true );
    } );

    xit( "should log the quota error event", function() {
      var event = document.createEvent( "Event" ),
        params = {
          "event": "error",
          "event_details": "api quota exceeded",
          "url": additionalParams.spreadsheet.url,
          "api_key": "abc123"
        };

      event.initEvent( "rise-google-sheet-quota", true, true );
      event.detail = {};
      sheet.dispatchEvent( event );

      expect( logStub.withArgs( table, params ).called ).to.equal( true );
    } );
  } );


  describe( "Column formatting", function() {

    afterEach( function() {
      additionalParams.format.columns = columnsParam;
    } );

    describe( "Header text", function() {
      it( "Should use default header text if custom header text is empty", function() {
        var expected = [ "Column 1", "Column 2", "Column 3" ];

        additionalParams.format.columns[ 0 ].headerText = "";
        wrapper = mount( <Spreadsheet initSize={propHandlers.initSize}
                                     showMessage={propHandlers.showMessage}
                                     hideMessage={propHandlers.hideMessage} /> );

        wrapper.setState( { data: data } );

        expect( wrapper.find( TableHeaderContainer ).props().data ).to.deep.equal( expected );
      } );

      it( "should use default header text if column formatting is not defined", function() {
        var expected = [ "Column 1", "Column 2", "Column 3" ];

        additionalParams.format.columns = [];
        wrapper = mount( <Spreadsheet initSize={propHandlers.initSize}
                                     showMessage={propHandlers.showMessage}
                                     hideMessage={propHandlers.hideMessage} /> );

        wrapper.setState( { data: data } );

        expect( wrapper.find( TableHeaderContainer ).props().data ).to.deep.equal( expected );
      } );
    } );

    describe( "columnFormats prop", function() {
      it( "Should set all properties for those columns with formatting applied and should set the " +
        "width of all other columns", function() {
        var expected = [
          {
            id: additionalParams.format.columns[ 0 ].id,
            numeric: false,
            alignment: "left",
            width: 100,
            colorCondition: "none"
          },
          {
            width: 250
          },
          {
            width: 250
          }
        ];

        wrapper = mount( <Spreadsheet initSize={propHandlers.initSize}
                                     showMessage={propHandlers.showMessage}
                                     hideMessage={propHandlers.hideMessage} /> );

        wrapper.setState( { data: data } );

        expect( wrapper.find( TableHeaderContainer ).props().columnFormats ).to.deep.equal( expected );
        expect( wrapper.find( Scroll ).props().columnFormats ).to.deep.equal( expected );
      } );

      it( "Should return equal width columns if column formatting is not defined on any " +
        "columns", function() {
        var expected = [ { width: 200 }, { width: 200 }, { width: 200 } ];

        additionalParams.format.columns = [];

        wrapper = mount( <Spreadsheet initSize={propHandlers.initSize}
                                     showMessage={propHandlers.showMessage}
                                     hideMessage={propHandlers.hideMessage} /> );

        wrapper.setState( { data: data } );

        expect( wrapper.find( TableHeaderContainer ).props().columnFormats ).to.deep.equal( expected );
        expect( wrapper.find( Scroll ).props().columnFormats ).to.deep.equal( expected );
      } );

      it( "Should return numeric property as defined by params", function() {
        var expected = [
          {
            id: additionalParams.format.columns[ 0 ].id,
            numeric: true,
            alignment: "left",
            width: 100,
            colorCondition: "none"
          },
          {
            width: 250
          },
          {
            width: 250
          }
        ];

        additionalParams.format.columns[ 0 ].numeric = true;

        wrapper = mount( <Spreadsheet initSize={propHandlers.initSize}
                                     showMessage={propHandlers.showMessage}
                                     hideMessage={propHandlers.hideMessage} /> );

        wrapper.setState( { data: data } );

        expect( wrapper.find( TableHeaderContainer ).props().columnFormats ).to.deep.equal( expected );
        expect( wrapper.find( Scroll ).props().columnFormats ).to.deep.equal( expected );
      } );

    } );

  } );
} );
