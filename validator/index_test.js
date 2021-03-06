#!/usr/bin/env node
/**
 * @license
 * Copyright 2016 The AMP HTML Authors. All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS-IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the license.
 */

'use strict';

global.assert = require('assert');
var fs = require('fs');
global.path = require('path');

var JasmineRunner = require('jasmine');
var jasmine = new JasmineRunner();

var ampValidator = require('./index.js');

it('deployed validator rejects the empty file', function(done) {
  // Note: This will fetch and use the validator from
  // 'https://cdn.ampproject.org/v0/validator.js', since only one argument
  // is supplied to validateString.
  ampValidator.getInstance()
      .then(function(instance) {
        var validationResult = instance.validateString('');
        expect(validationResult.status).toBe('FAIL');
        done();
      })
      .catch(function(error) {
        fail(error);
        done();
      });
});

it('validator_minified.js was built (run build.py if this fails)', function() {
  expect(fs.statSync('dist/validator_minified.js').isFile()).toBe(true);
});

it('built validator rejects the empty file', function(done) {
  // Note: This will use the validator that was built with build.py.
  ampValidator.getInstance(/*validatorJs*/ 'dist/validator_minified.js')
      .then(function(instance) {
        var validationResult = instance.validateString('');
        expect(validationResult.status).toBe('FAIL');
        done();
      })
      .catch(function(error) {
        fail(error);
        done();
      });
});

it('accepts the minimum valid AMP file', function(done) {
  // Note: This will use the validator that was built with build.py.
  var mini =
      fs.readFileSync('testdata/feature_tests/minimum_valid_amp.html', 'utf-8');
  ampValidator.getInstance(/*validatorJs*/ 'dist/validator_minified.js')
      .then(function(instance) {
        var validationResult = instance.validateString('');
        expect(validationResult.status).toBe('FAIL');
        done();
      })
      .catch(function(error) {
        fail(error);
        done();
      });
});

it('rejects a specific file that is known to have errors', function(done) {
  // Note: This will use the validator that was built with build.py.
  var severalErrorsHtml =
      fs.readFileSync('testdata/feature_tests/several_errors.html', 'utf-8');
  var severalErrorsOut =
      fs.readFileSync('testdata/feature_tests/several_errors.out', 'utf-8');
  ampValidator.getInstance(/*validatorJs*/ 'dist/validator_minified.js')
      .then(function(instance) {
        var validationResult = instance.validateString(severalErrorsHtml);
        expect(validationResult.status).toBe('FAIL');
        // Here, we assemble the output from the validationResult that was
        // computed by the validator and compare it with the golden file.
        var out = 'FAIL\n';
        for (var ii = 0; ii < validationResult.errors.length; ii++) {
          var error = validationResult.errors[ii];
          out += 'feature_tests/several_errors.html';
          out += ':' + error.line + ':' + error.col + ' ' + error.message;
          if (error.specUrl) {
            out += ' (see ' + error.specUrl + ')';
          }
          out += ' [' + error.category + ']\n';
        }
        expect(out).toBe(severalErrorsOut);
        done();
      })
      .catch(function(error) {
        fail(error);
        done();
      });
});

it('handles syntax errors in validator file', function(done) {
  // Note: This points the library at a file that's not even Javascript.
  ampValidator.getInstance(/*validatorJs*/ 'dist/validator.protoascii')
      .then(function(instance) {
        fail('We should not get here since this is not a good validator.');
        done();
      })
      .catch(function(error) {
        expect(error.message)
            .toBe(
                'Could not instantiate validator.js - Unexpected token ILLEGAL');
        done();
      });
});

jasmine.onComplete(function(passed) { process.exit(passed ? 0 : 1); });
jasmine.execute();
