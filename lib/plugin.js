"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;
var _helperPluginUtils = require("@babel/helper-plugin-utils");
var _default = exports["default"] = (0, _helperPluginUtils.declare)(function (api) {
  api.assertVersion(7);
  console.log(api.parse);
  return {
    visitor: {
      FunctionExpression: function FunctionExpression(path) {
        var _path$node$id;
        console.log((_path$node$id = path.node.id) === null || _path$node$id === void 0 ? void 0 : _path$node$id.name);
      }
    }
  };
});