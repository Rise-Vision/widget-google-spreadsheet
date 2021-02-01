/* eslint-disable no-console */

( () => {
  "use strict";

  const bower = require( "gulp-bower" ),
    bump = require( "gulp-bump" ),
    del = require( "del" ),
    env = process.env.NODE_ENV || "prod",
    eslint = require( "gulp-eslint" ),
    factory = require( "widget-tester" ).gulpTaskFactory,
    file = require( "gulp-file" ),
    gulp = require( "gulp" ),
    gulpif = require( "gulp-if" ),
    gutil = require( "gulp-util" ),
    minifyCSS = require( "gulp-minify-css" ),
    path = require( "path" ),
    rename = require( "gulp-rename" ),
    runSequence = require( "run-sequence" ),
    sourcemaps = require( "gulp-sourcemaps" ),
    uglify = require( "gulp-uglify" ),
    usemin = require( "gulp-usemin" ),
    wct = require( "web-component-tester" ).gulp.init( gulp ), // eslint-disable-line no-unused-vars
    webpackStream = require( "webpack-stream" ),
    htmlFiles = [
      "./src/settings.html"
    ],
    vendorFiles = [
      "./src/components/tinymce/plugins/**/*",
      "./src/components/tinymce/skins/**/*",
      "./src/components/tinymce/themes/**/*",
      "./src/components/tinymce/tinymce*.js",
      "./src/components/jquery/dist/**/*",
      "./src/components/angular/angular*.js",
      "./src/components/angular/*.gzip",
      "./src/components/angular/*.map",
      "./src/components/angular/*.css"
    ];

  gulp.task( "clean", ( cb ) => {
    del( [ "./dist/**" ], cb );
  } );

  gulp.task( "clean-bower", ( cb ) => {
    del( [ "./src/components/**" ], cb );
  } );

  gulp.task( "config", () => {
    let configFile = ( env === "dev" ? "dev.js" : "prod.js" );

    gutil.log( "Environment is", env );

    return gulp.src( [ "./src/config/" + configFile ] )
      .pipe( rename( "config.js" ) )
      .pipe( gulp.dest( "./src/config" ) );
  } );

  gulp.task( "lint", () => {
    return gulp.src( [ "src/**/*.js", "test/**/*.js" ] )
      .pipe( eslint() )
      .pipe( eslint.format() )
      .pipe( eslint.failAfterError() );
  } );

  gulp.task("version", function () {
    var pkg = require("./package.json"),
      str = '/* exported version */\n' +
        'var version = "' + pkg.version + '";';

    return file("version.js", str, {src: true})
      .pipe(gulp.dest("./src/config/"));
  });

  gulp.task( "settings", [ "lint" ], () => {
    let isProd = ( env === "prod" );

    return gulp.src( htmlFiles )
      .pipe( gulpif( isProd,
        // Minify for production.
        usemin( {
          css: [ sourcemaps.init(), minifyCSS(), sourcemaps.write() ],
          js: [ sourcemaps.init(), uglify(), sourcemaps.write() ]
        } ),
        // Don't minify for staging.
        usemin( {} )
      ) )
      .pipe( gulp.dest( "dist/" ) );
  } );

  gulp.task( "widget", () => {
    return gulp.src( "src/widget/main.js" )
      .pipe( webpackStream( require( "./webpack.config.js" ) ) )
      .pipe( gulp.dest( "dist/" ) );
  } );

  gulp.task( "unminify", () => {
    return gulp.src( htmlFiles )
      .pipe( usemin( {
        css: [ rename( ( path ) => {
          path.basename = path.basename.substring( 0, path.basename.indexOf( ".min" ) )
        } ), gulp.dest( "dist" ) ],
        js: [ rename( ( path ) => {
          path.basename = path.basename.substring( 0, path.basename.indexOf( ".min" ) )
        } ), gulp.dest( "dist" ) ]
      } ) )
  } );

  gulp.task( "fonts", () => {
    return gulp.src( "src/components/common-style/dist/fonts/**/*" )
      .pipe( gulp.dest( "dist/fonts" ) );
  } );

  gulp.task( "images", () => {
    return gulp.src( "src/components/rv-bootstrap-formhelpers/img/bootstrap-formhelpers-googlefonts.png" )
      .pipe( gulp.dest( "dist/img" ) );
  } );

  gulp.task( "i18n", () => {
    return gulp.src( [ "src/components/common-header/dist/locales/**/*" ] )
      .pipe( gulp.dest( "dist/locales" ) );
  } );

  gulp.task( "vendor", () => {
    return gulp.src( vendorFiles, { base: "./src/components" } )
      .pipe( gulp.dest( "dist/js/vendor" ) );
  } );

  gulp.task( "components", () => {
    return gulp.src( [
      "src/components/webfontloader/webfontloader.js",
    ], { base: "./src/" } )
      .pipe( gulp.dest( "dist/" ) );
  } );

  gulp.task( "webdriver_update", factory.webdriveUpdate() );

  // ***** e2e Testing ***** //
  gulp.task( "e2e:server-close", factory.testServerClose() );

  gulp.task( "html:e2e:settings", factory.htmlE2E( {
    files: [ "./src/settings.html" ],
    e2eAngularMocks: "components/angular-mocks/angular-mocks.js",
    e2ePicker: "../node_modules/widget-tester/mocks/gapi-picker-mock.js",
    e2eSpreadsheetHTTP: "../test/mocks/google-sheet-http-mock.js",
    e2eTestApp: "../test/e2e/settings-app.js",
    e2eAppReplace: "../test/e2e/settings-app-replace.js",
    e2eTinymce: "components/tinymce/tinymce.js"
  } ) );

  gulp.task( "e2e:server:settings", [ "config", "html:e2e:settings" ], factory.testServer() );

  gulp.task( "test:e2e:settings:run", [ "webdriver_update" ], factory.testE2EAngular( {
    testFiles: "test/e2e/settings.js" }
  ) );

  gulp.task( "test:e2e:settings", ( cb ) => {
    runSequence( [ "e2e:server:settings" ], "test:e2e:settings:run", "e2e:server-close", cb );
  } );

  gulp.task( "test:e2e", ( cb ) => {
    runSequence( "test:e2e:settings", cb );
  } );

  // ****** Unit Testing ***** //
  gulp.task( "test:unit:widget", factory.testUnitReact(
    { configFile: path.join( __dirname, "test/react-karma.conf.js" ) }
  ) );

  gulp.task( "test:unit:settings", factory.testUnitAngular(
    { testFiles: [
      "src/components/jquery/dist/jquery.js",
      "src/components/q/q.js",
      "src/components/angular/angular.js",
      "src/components/angular-load/angular-load.js",
      "src/components/angular-translate/angular-translate.js",
      "src/components/angular-translate-loader-static-files/angular-translate-loader-static-files.js",
      "src/components/angular-ui-tinymce/src/tinymce.js",
      "src/components/rv-angular-bootstrap-colorpicker/js/bootstrap-colorpicker-module.js",
      "src/components/angular-mocks/angular-mocks.js",
      "node_modules/widget-tester/mocks/common-mock.js",
      "src/components/bootstrap-sass-official/assets/javascripts/bootstrap.js",
      "src/components/angular-bootstrap/ui-bootstrap-tpls.js",
      "src/components/widget-settings-ui-components/dist/js/**/*.js",
      "src/components/widget-settings-ui-core/dist/*.js",
      "src/components/bootstrap-form-components/dist/js/**/*.js",
      "src/components/google-drive-picker/dist/js/angular/google-drive-picker.js",
      "src/config/test.js",
      "src/settings/settings-app.js",
      "src/settings/**/*.js",
      "test/data/spreadsheet.js",
      "test/unit/settings/**/*spec.js" ] }
  ) );

  gulp.task( "test:unit", ( cb ) => {
    runSequence( "test:unit:settings", "test:unit:widget", cb );
  } );

  // ***** Integration Testing ***** //
  gulp.task( "test:integration", ( cb ) => {
    runSequence( "test:local", cb );
  } );

  // ***** Primary Tasks ***** //
  gulp.task( "bower-clean-install", [ "clean-bower" ], ( cb ) => {
    return bower().on( "error", ( err ) => {
      console.log( err );
      cb();
    } );
  } );

  gulp.task( "bower-update", ( cb ) => {
    return bower( { cmd: "update" } ).on( "error", ( err ) => {
      console.log( err );
      cb();
    } );
  } );

  gulp.task( "build-dev", ( cb ) => {
    runSequence( [ "clean", "config", "version" ], [ "settings", "widget", "fonts", "images", "i18n", "vendor", "components" ], [ "unminify" ], cb );
  } );

  gulp.task( "build", ( cb ) => {
    runSequence( [ "clean", "config", "bower-update", "version" ], [ "settings", "widget", "fonts", "images", "i18n", "vendor", "components" ], [ "unminify" ], cb );
  } );

  gulp.task( "bump", () => {
    return gulp.src( [ "./package.json", "./bower.json" ] )
      .pipe( bump( { type: "patch" } ) )
      .pipe( gulp.dest( "./" ) );
  } );

  gulp.task( "test", ( cb ) => {
    runSequence( "config", "version", "test:unit", "test:e2e", cb );
  } );

  gulp.task( "default", [], () => {
    console.log( "********************************************************************".yellow );
    console.log( "  gulp bower-clean-install: delete and re-install bower components".yellow );
    console.log( "  gulp bower-update: update bower components".yellow );
    console.log( "  gulp build: build a distribution version".yellow );
    console.log( "  gulp bump: bump the release version".yellow );
    console.log( "  gulp test: run e2e, integration, and unit tests".yellow );
    console.log( "********************************************************************".yellow );

    return true;
  } );

} )();
