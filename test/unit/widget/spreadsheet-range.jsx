import React from "react";
import { mount } from "enzyme";
import { expect } from "chai";
import TestUtils from "react-addons-test-utils";
import Spreadsheet from "../../../src/widget/components/spreadsheet";
import TableHeader from "../../../src/widget/components/table-header";
import Table from "../../../src/widget/components/table";
import "../../data/spreadsheet-range";

describe("<Spreadsheet />", function() {

  var wrapper;
  const cols = [
      {
        "content": {
          "$t": "Cell B2"
        },
        "gs$cell": {
          "col": "2",
          "row": "2"
        }
      },
      {
        "content": {
          "$t": "Cell C2"
        },
        "gs$cell": {
          "col": "3",
          "row": "2"
        }
      }],
    data = [
      {
        "content": {
          "$t": "Cell B3"
        },
        "gs$cell": {
          "col": "2",
          "row": "3"
        }
      },
      {
        "content": {
          "$t": "Cell C3"
        },
        "gs$cell": {
          "col": "3",
          "row": "3"
        }
      }],
    cells = cols.concat(data);

  beforeEach(function () {
    wrapper = mount(<Spreadsheet />);
  });

  describe("<TableHeader />", function() {
    beforeEach(function () {
      wrapper.setState({ data: cells });
    });

    it("Should contain a TableHeader component", function() {
      expect(wrapper.find(TableHeader)).to.have.length(1);
    });

    it("Should have data prop", function() {
      var expected = [ "Cell B2", "Cell C2" ];
      expect(wrapper.find(TableHeader).props().data).to.deep.equal(expected);
    });

  });

  describe("<Table />", function() {
    beforeEach(function () {
      wrapper.setState({ data: cells });
    });

    it("Should contain a Table component", function() {
      expect(wrapper.find(Table)).to.have.length(1);
    });

    it("Should have data prop", function() {
      var expected = [["Cell B3", "Cell C3"]];
      expect(wrapper.find(Table).props().data).to.deep.equal(expected);
    });

    it("Should have totalCols prop", function() {
      expect(wrapper.find(Table).props().totalCols).to.equal(2);
    });
  });

  describe("Don't Use First Row As Header", function() {
    beforeEach(function () {
      window.gadget.settings.additionalParams.spreadsheet.hasHeader = false;
      wrapper = mount(<Spreadsheet />);
      wrapper.setState({ data: cells });
    });

    afterEach(function() {
      window.gadget.settings.additionalParams.spreadsheet.hasHeader = true;
    });

    it("Should not contain a TableHeader component", function() {
      expect(wrapper.find(TableHeader)).to.have.length(0);
    });

    it("Should have data prop", function() {
      var expected = [["Cell B2", "Cell C2"], ["Cell B3", "Cell C3"]];
      expect(wrapper.find(Table).props().data).to.deep.equal(expected);
    });
  });

});