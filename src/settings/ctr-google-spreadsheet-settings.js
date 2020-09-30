angular.module( "risevision.widget.googleSpreadsheet.settings" )
  .controller( "spreadsheetSettingsController", [ "$scope", "googleSheet", "$window",
    function( $scope, googleSheet, $window ) {

      $scope.showPreview = false;
      $scope.sheets = [];
      $scope.currentSheet = null;
      $scope.columns = [];
      $scope.validApiKey = true;
      $scope.validCustomApiKeyInterval = true;
      $scope.public = true;
      $scope.validData = true;

      function resetWorkSheets() {
        $scope.sheets = [];
        $scope.currentSheet = null;
        $scope.settings.additionalParams.spreadsheet.sheetName = "";
      }

      function resetColumns( resetService ) {
        $scope.columns = [];
        $scope.settings.additionalParams.format.columns = [];

        if ( resetService ) {
          googleSheet.resetColumns();
        }
      }

      $scope.setCurrentSheet = function() {
        if ( $scope.settings.additionalParams.spreadsheet.sheetName ) {
          $scope.currentSheet = $scope.sheets.filter( function( obj ) {
            return obj.value === $scope.settings.additionalParams.spreadsheet.sheetName;
          } )[ 0 ];
        } else {
          $scope.currentSheet = $scope.sheets[ 0 ];
        }

        $scope.settingsForm.$setValidity( "sheet", !!$scope.currentSheet );
      }

      $scope.setWorkSheets = function( sheets ) {
        $scope.public = true;
        $scope.sheets = sheets.map( function( sheet ) {
          return {
            label: sheet.properties.title,
            value: sheet.properties.title
          };
        } );

        $scope.setCurrentSheet();
      }

      function getWorkSheets( fileId ) {
        googleSheet.getWorkSheets( fileId )
          .then( $scope.setWorkSheets )
          .then( null, function() {
            $scope.public = false;

            resetWorkSheets();
            resetColumns( true );
          } );
      }

      function getColumnsData( preserveFormats ) {
        var range = "";

        if ( !$scope.settings.additionalParams.spreadsheet.sheetName || !$scope.validApiKey ) {
          return;
        }

        if ( $scope.settings.additionalParams.spreadsheet.cells === "range" ) {
          if ( $scope.settings.additionalParams.spreadsheet.range.startCell &&
            $scope.settings.additionalParams.spreadsheet.range.endCell ) {

            range = $scope.settings.additionalParams.spreadsheet.range.startCell + ":" +
              $scope.settings.additionalParams.spreadsheet.range.endCell;
          }
        }

        googleSheet.getColumnsData( $scope.settings.additionalParams.spreadsheet.fileId,
          $scope.settings.additionalParams.spreadsheet.apiKey,
          $scope.settings.additionalParams.spreadsheet.sheetName,
          range )
          .then( function( columns ) {
            $scope.validData = true;

            if ( columns ) {
              if ( !preserveFormats ) {
                $scope.settings.additionalParams.format.columns = [];
              }
              $scope.columns = columns;
            }

          } )
          .then( null, function() {
            $scope.validData = false;

            resetColumns();
          } );
      }

      $scope.$watch( "currentSheet", function( currentSheet ) {
        if ( currentSheet ) {
          $scope.settings.additionalParams.spreadsheet.sheetName = currentSheet.value;

          $scope.setCurrentSheet();
        }
      } );

      $scope.$watch( "settings.additionalParams.spreadsheet.sheetName", function( newVal, oldVal ) {
        if ( typeof oldVal === "undefined" && newVal && newVal !== "" ) {
          // previously saved settings are being shown, populate columns but preserve saved formats
          getColumnsData( true );
        } else {
          if ( typeof newVal !== "undefined" && newVal !== "" ) {
            // new sheet chosen, populate columns
            getColumnsData();
          }
        }

      } );

      $scope.$watch( "settings.additionalParams.spreadsheet.cells", function( newVal, oldVal ) {
        if ( typeof newVal !== "undefined" && typeof oldVal !== "undefined" ) {
          // user has manually changed value
          getColumnsData();
        }
      } );

      $scope.startCellBlur = function() {
        getColumnsData();
      };

      $scope.endCellBlur = function() {
        getColumnsData();
      };

      $scope.$watch( "settings.additionalParams.spreadsheet.fileId", function( fileId ) {
        if ( typeof fileId === "undefined" || !fileId ) {
          $scope.settingsForm.$setValidity( "fileId", false );
        }
      } );

      $scope.fileIdBlur = function() {

        if ( $scope.settings.additionalParams.spreadsheet.fileId ) {
          if ( $scope.settings.additionalParams.spreadsheet.selection === "key" ) {
            $scope.settings.additionalParams.spreadsheet.url =
              "https://docs.google.com/spreadsheets/d/" + $scope.settings.additionalParams.spreadsheet.fileId + "/edit#gid=0";
          }
        }
      };

      $scope.$watch( "settings.additionalParams.spreadsheet.url", function( newUrl, oldUrl ) {
        if ( typeof newUrl !== "undefined" ) {
          if ( newUrl !== oldUrl ) {
            if ( newUrl !== "" ) {
              $scope.showPreview = true;
              $scope.settingsForm.$setValidity( "fileId", true );
              getWorkSheets( $scope.settings.additionalParams.spreadsheet.fileId );
            }
          }
        }
      } );

      $scope.$watch( "public", function( value ) {
        if ( typeof value !== "undefined" && $scope.settings.additionalParams.spreadsheet &&
          $scope.settings.additionalParams.spreadsheet.fileId &&
          $scope.settings.additionalParams.spreadsheet.fileId !== "" ) {
          $scope.settingsForm.$setValidity( "fileId", value );
        }
      } );

      $scope.$on( "picked", function( event, data ) {
        $scope.settings.additionalParams.spreadsheet.selection = "drive";
        $scope.settings.additionalParams.spreadsheet.docName = data[ 0 ].name;
        $scope.settings.additionalParams.spreadsheet.fileId = data[ 0 ].id;
        $scope.settings.additionalParams.spreadsheet.url = encodeURI( data[ 0 ].url );
      } );

      $scope.setSelection = function() {
        $scope.showPreview = true;
        $scope.settings.additionalParams.spreadsheet.selection = "key";
      };

      $scope.previewFile = function() {
        $window.open( $scope.settings.additionalParams.spreadsheet.url, "_blank" );
      };

      $scope.retryFile = function() {
        if ( $scope.settings.additionalParams.spreadsheet.fileId &&
          $scope.settings.additionalParams.spreadsheet.fileId !== "" ) {
          $scope.public = true;
          getWorkSheets( $scope.settings.additionalParams.spreadsheet.fileId );
        }
      };

      $scope.clearSelection = function() {
        $scope.public = true;

        if ( $scope.settings.additionalParams.spreadsheet.selection === "drive" ) {
          $scope.settings.additionalParams.spreadsheet.docName = "";
        }

        $scope.settings.additionalParams.spreadsheet.url = "";
        $scope.settings.additionalParams.spreadsheet.fileId = "";

        resetWorkSheets();
        resetColumns( true );
      };

      $scope.$watch( "settings.additionalParams.spreadsheet.apiKey", function( apiKey ) {
        if ( typeof apiKey === "undefined" || !apiKey ) {
          $scope.settingsForm.$setValidity( "apiKey", true );
          $scope.validApiKey = true;
          if ( $scope.settings.additionalParams.spreadsheet ) {
            $scope.settings.additionalParams.spreadsheet.refresh = 60;
          }
        }
      } );

      $scope.$watch( "settings.additionalParams.spreadsheet.refresh", function( newVal ) {
        var isValid = true;

        if ( $scope.settings.additionalParams.spreadsheet.apiKey ) {
          isValid = ( newVal && newVal >= 10 ) ? true : false;
        }

        $scope.validCustomApiKeyInterval = isValid;
        $scope.settingsForm.$setValidity( "refresh", isValid );
      } );

      $scope.$watch( "validApiKey", function( newVal, oldVal ) {
        if ( newVal !== oldVal && newVal ) {
          // a previously invalid API key has been corrected, ensure correct columns are populated
          getColumnsData();
        }
      } );

      $scope.apiKeyBlur = function() {
        if ( $scope.settings.additionalParams.spreadsheet.apiKey ) {
          $scope.settingsForm.$setValidity( "apiKey", true );
          googleSheet.getWorkSheets( $scope.settings.additionalParams.spreadsheet.fileId, $scope.settings.additionalParams.spreadsheet.apiKey )
            .then( function() {
              $scope.validApiKey = true;
              $scope.settingsForm.$setValidity( "apiKey", true );
            } )
            .then( null, function() {
              $scope.validApiKey = false;
              $scope.settingsForm.$setValidity( "apiKey", false );
            } );
        }
      };
    } ] )
  .value( "defaultSettings", {
    params: {},
    additionalParams: {
      format: {
        body: {
          fontStyle: {
            font: {
              family: "tahoma,arial,helvetica,sans-serif",
              type: "standard",
              url: ""
            },
            size: "18px",
            customSize: "",
            align: "left",
            verticalAlign: "middle",
            bold: false,
            italic: false,
            underline: false,
            forecolor: "black",
            backcolor: "transparent"
          }
        },
        columns: [],
        evenRowColor: "rgba(0,0,0,0)",
        header: {
          fontStyle: {
            font: {
              family: "tahoma,arial,helvetica,sans-serif",
              type: "standard",
              url: ""
            },
            size: "18px",
            customSize: "",
            align: "left",
            verticalAlign: "middle",
            bold: false,
            italic: false,
            underline: false,
            forecolor: "black",
            backcolor: "transparent"
          }
        },
        oddRowColor: "rgba(0,0,0,0)",
        rowHeight: 50,
        separator: {
          color: "rgba(238,238,238, 1)",
          showColumn: true,
          showRow: true
        }
      },
      scroll: {},
      spreadsheet: {
        selection: "drive",
        docName: "",
        url: "",
        fileId: "",
        cells: "sheet",
        range: {
          startCell: "",
          endCell: ""
        },
        sheetName: "",
        hasHeader: false,
        refresh: 60,
        apiKey: ""
      }
    }
  } );
