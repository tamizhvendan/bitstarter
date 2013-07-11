#!/usr/bin/env node
/*
Automatically grade files for the presence of specified HTML tags/attributes.
Uses commander.js and cheerio. Teaches command line application development
and basic DOM parsing.

References:

 + cheerio
   - https://github.com/MatthewMueller/cheerio
   - http://encosia.com/cheerio-faster-windows-friendly-alternative-jsdom/
   - http://maxogden.com/scraping-with-node.html

 + commander.js
   - https://github.com/visionmedia/commander.js
   - http://tjholowaychuk.com/post/9103188408/commander-js-nodejs-command-line-interfaces-made-easy

 + JSON
   - http://en.wikipedia.org/wiki/JSON
   - https://developer.mozilla.org/en-US/docs/JSON
   - https://developer.mozilla.org/en-US/docs/JSON#JSON_in_Firefox_2
*/

var fs = require('fs');
var program = require('commander');
var cheerio = require('cheerio');
var HTMLFILE_DEFAULT = "index.html";
var CHECKSFILE_DEFAULT = "checks.json";

var assertFileExists = function(infile) {
    var instr = infile.toString();
    if(!fs.existsSync(instr)) {
        console.log("%s does not exist. Exiting.", instr);
        process.exit(1); // http://nodejs.org/api/process.html#process_process_exit_code
    }
    return instr;
};

var cheerioHtmlFile = function(htmlfile) {
    return cheerio.load(fs.readFileSync(htmlfile));
};

var cherrioHtmlUrl = function(url, callback){
  var restler = require('restler');
  restler.get(url).on('complete', function(result){
    var $ = cheerio.load(result);
    callback($);
  });
}

var loadChecks = function(checksfile) {
    return JSON.parse(fs.readFileSync(checksfile));
};

var checkHtmlFile = function($, checksfile) {    
    var checks = loadChecks(checksfile).sort();
    var out = {};
    for(var ii in checks) {
        var present = $(checks[ii]).length > 0;
        out[checks[ii]] = present;
    }
    return out;
};

var readAndCheckHtmlFile = function(htmlfile, checksfile) {
  var $ = cheerioHtmlFile(htmlfile),
      checkJson = checkHtmlFile($, checksfile);

  printJson(checkJson);
}

var downloadAndCheckHtmlFile = function(url, checksfile) {
  
  cherrioHtmlUrl(url, function($){
     var checkJson = checkHtmlFile($, checksfile);
     printJson(checkJson);
  });  
}

var clone = function(fn) {
    // Workaround for commander.js issue.
    // http://stackoverflow.com/a/6772648
    return fn.bind({});
};

var printJson = function(checkJson) {
  
  var outJson = JSON.stringify(checkJson, null, 4);
  
  console.log(outJson);
}

if(require.main == module) {
    program
        .option('-c, --checks <check_file>', 'Path to checks.json', clone(assertFileExists), CHECKSFILE_DEFAULT)
        .option('-f, --file <html_file>', 'Path to index.html', clone(assertFileExists), HTMLFILE_DEFAULT)
        .option('-u, --url <html_file url>', 'url to html file')
        .parse(process.argv);

    program.url ? downloadAndCheckHtmlFile(program.url, program.checks) : readAndCheckHtmlFile(program.file, program.checks);    
} else {
    exports.checkHtmlFile = checkHtmlFile;
}