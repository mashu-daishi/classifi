'use strict';

const main = require( process.cwd() + '/index.js' );

const csv = {
  'test':  'wpbc_real_test.csv',
  'train': 'wpbc_real_train.csv'
}

module.exports = {
  main, csv
};
