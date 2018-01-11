'use strict';

const main = require( process.cwd() + '/index.js' );

const csv = {
  'test':  'test/data/wpbc_real_test.csv',
  'train': 'test/data/wpbc_real_train.csv'
}

module.exports = {
  main, csv
};
