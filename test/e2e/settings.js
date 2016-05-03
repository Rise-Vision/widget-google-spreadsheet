/* jshint expr: true */

(function () {
  "use strict";

  /* https://github.com/angular/protractor/blob/master/docs/getting-started.md */

  var chai = require("chai");
  var chaiAsPromised = require("chai-as-promised");

  chai.use(chaiAsPromised);
  var expect = chai.expect;

  browser.driver.manage().window().setSize(1024, 768);

  describe("Google Spreadsheet Settings - e2e Testing", function() {

    beforeEach(function () {
      browser.get("/src/settings-e2e.html");
    });

    describe("Initialization", function () {
      it("Should load Save button", function () {
        expect(element(by.css("button#save")).isPresent()).to.eventually.be.true;
      });

      it("Should load Cancel button", function () {
        expect(element(by.css("button#cancel")).isPresent()).to.eventually.be.true;
      });
    });

    describe("Defaults", function () {

      it("Should load drive picker button", function () {
        expect(element(by.css(".google-drive-picker")).isPresent()).to.eventually.be.true;
      });
      it("Should select 'Show Entire Sheet'", function () {
        expect(element(by.css("input[type='radio'][value='sheet']")).isSelected()).to.eventually.be.true;
      });

      it("Should apply form as invalid due to no spreadsheet doc name", function () {
        expect(element(by.css("form[name='settingsForm'].ng-invalid")).isPresent()).to.eventually.be.true;
      });

      it("Should disable Save button", function () {
        expect(element(by.css("button#save[disabled=disabled")).isPresent()).to.eventually.be.true;
      });

      it("Should not show publishing instructions", function () {
        expect(element(by.css("div.content-box div.bg-danger")).isPresent()).to.eventually.be.false;
        expect(element(by.css("div.bg-danger a.btn")).isPresent()).to.eventually.be.false;
      });

    });

    describe("Visibility", function() {

      it("Should not show starting or ending range cell inputs if 'Show Entire Sheet' is selected", function () {
        expect(element(by.model("settings.additionalParams.spreadsheet.range.startCell")).isPresent()).to.eventually.be.false;
        expect(element(by.model("settings.additionalParams.spreadsheet.range.endCell")).isPresent()).to.eventually.be.false;
      });

      it("Should show range input settings if 'Show Range' is selected", function() {
        element(by.css("input[type='radio'][value='range']")).click();

        expect(element(by.model("settings.additionalParams.spreadsheet.range.startCell")).isDisplayed()).to.eventually.be.true;
        expect(element(by.model("settings.additionalParams.spreadsheet.range.endCell")).isDisplayed()).to.eventually.be.true;
      });

    });

    describe("Spreadsheet Publishing", function () {

      it("Should show instructions, retry button, and disable Save when spreadsheet not published", function () {
        // open dialog
        element(by.css(".google-drive-picker button")).click();

        // simulate picking a file
        browser.executeScript(function () {
          window.pickFiles([{
            id: "not-published",
            name: "Test File",
            url: "https://test-not-published"
          }]);
        });

        expect(element(by.css("div.content-box div.bg-danger")).isDisplayed()).to.eventually.be.true;
        expect(element(by.css("div.bg-danger a.btn")).isDisplayed()).to.eventually.be.true;
        expect(element(by.css("button#save[disabled=disabled")).isPresent()).to.eventually.be.true;

      });

      it("Should not show instructions when clear selection clicked", function () {
        // open dialog
        element(by.css(".google-drive-picker button")).click();

        // simulate picking a file
        browser.executeScript(function () {
          window.pickFiles([{
            id: "not-published",
            name: "Test File",
            url: "https://test-not-published"
          }]);
        });

        expect(element(by.css("div.content-box div.bg-danger")).isDisplayed()).to.eventually.be.true;
        expect(element(by.css("div.bg-danger a.btn")).isDisplayed()).to.eventually.be.true;

        element(by.css("div.clear-selection span")).click();

        expect(element(by.css("div.content-box div.bg-danger")).isPresent()).to.eventually.be.false;
        expect(element(by.css("div.bg-danger a.btn")).isPresent()).to.eventually.be.false;
      });

      it("Should not show instructions and enable Save when spreadsheet is published", function () {
        // open dialog
        element(by.css(".google-drive-picker button")).click();

        // simulate picking a file
        browser.executeScript(function () {
          window.pickFiles([{
            id: "published",
            name: "Test File",
            url: "https://test-published"
          }]);
        });

        expect(element(by.css("div.content-box div.bg-danger")).isPresent()).to.eventually.be.false;
        expect(element(by.css("div.bg-danger a.btn")).isPresent()).to.eventually.be.false;
        expect(element(by.css("button#save[disabled=disabled")).isPresent()).to.eventually.be.false;

      });

    });

    describe("Saving", function () {

      it("Should correctly save settings", function () {
        var settings = {
          params: {},
          additionalParams: {
            spreadsheet: {
              cells: "sheet",
              range: {
                startCell: "",
                endCell: ""
              },
              docName: "Test File",
              docURL: "https://test-published",
              fileId: "published"
            }
          }
        };

        // open dialog
        element(by.css(".google-drive-picker button")).click();

        // simulate picking a file
        browser.executeScript(function () {
          window.pickFiles([{
            id: "published",
            name: "Test File",
            url: "https://test-published"
          }]);
        });

        element(by.id("save")).click();

        expect(browser.executeScript("return window.result")).to.eventually.deep.equal(
          {
            'additionalParams': JSON.stringify(settings.additionalParams),
            'params': ''
          });
      });
    });

  });

})();