'use strict';

const _ = require('lodash');

const DEBUG = process.env.MOCHA_DEBUG;

const c = {
  pass: '✓',
  fail: ')',
  pending: '-'
};

const colors = _.mapValues({
  pass: 90,
  fail: 31,
  'bright pass': 92,
  'bright fail': 91,
  'bright yellow': 93,
  pending: 36,
  suite: 0,
  'error title': 0,
  'error message': 31,
  'error stack': 90,
  checkmark: 32,
  fast: 90,
  medium: 33,
  slow: 31,
  green: 32,
  light: 90,
  'diff gutter': 90,
  'diff added': 32,
  'diff removed': 31,
  reset: 0
}, code => {
  return `\u001b[${code}m`;
});

const times = {
  fast: 40,
  slow: 80
};

const writer = process.stdout.write;

function write(msg) {
  writer.call(process.stdout, msg);
  return this;
}

function removeLog() {
  if (DEBUG) {
    return this;
  }
  process.stdout.write = _.noop;
  process.stderr.write = _.noop;
  return this;
}

function exposeLog() {
  process.stdout.write = writer;
  process.stderr.write = writer;
  return this;
}

let time;

function start() {
  time = Date.now();
  return this;
}

const skip = {
  __skip__: true
};

function outputResult(result) {
  let stats = {
    tests: 0,
    passes: 0,
    pending: 0,
    failures: 0,
    duration: 0
  };
  let errors = [];
  _.forEach(result, obj => {
    if (obj === skip) {
      return;
    }
    stats = _.mapValues(stats, (val, key) => {
      return val + obj.stats[key];
    });
    Array.prototype.push.apply(errors, obj.failures);
  });


  console.log(`\n`);
  let diff = Math.round((Date.now() - time) / 1000);
  console.log(`  ${colors.green}${stats.passes} passing ${colors.pass}(${diff}s)`);
  if (stats.pending) {
    console.log(`  ${colors.pending}${stats.pending} pending`);
  }
  if (stats.failures) {
    console.log(`  ${colors.fail}${stats.failures} failing${colors.reset}`);
  }

  _.forEach(errors, (obj, index) => {
    console.log(`\n`);
    console.log(`  ${++index}${c.fail} ${obj.fullTitle}\n`);
    let stack = obj.err.stack.split(/\n/);
    // TODO
    _.forEach(stack, msg => {
      console.log(`\t${colors.fail}${msg}${colors.reset}`);
    });
  });
  console.log();
  return this;
}

function output(log) {
  let errorCount = 0;
  _.forEach(log.tests, obj => {
    if (!_.isEmpty(obj.err)) {
      return failure(obj);
    }
    if (obj.duration === undefined) {
      return pending(obj);
    }
    pass(obj);
  });


  function pass(obj) {
    let str = '';
    let duration = obj.duration;
    let color = duration >= times.slow ? colors.slow : colors.fast;
    // TODO
    if (duration >= times.fast) {
      str = `${color}(${duration}ms)`;
    }
    console.log(`\t${colors.green}${c.pass} ${colors.pass}${obj.title} ${str}${colors.reset}`);
  }

  function pending(obj) {
    console.log(`\t${colors.pending}${c.pending} ${obj.title}${colors.reset}`);
  }

  function failure(obj) {
    console.log(`\t${colors.fail}${++errorCount}${c.fail} ${obj.title}${colors.reset}`);
  }
  return this;
}

exports.log = DEBUG ? console.log : _.noop;
exports.write = write;
exports.removeLog = removeLog;
exports.exposeLog = exposeLog;
exports.start = start;
exports.skip = skip;
exports.output = output;
exports.outputResult = outputResult;
