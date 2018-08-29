const path = require('path');

module.exports = {
  devtool: 'source-map',
  entry: './main.js',
  output: {
    path: path.join(__dirname, '.'),
    filename: 'bundle.js',
    sourceMapFilename: 'bundle.js.map',
  }
};
