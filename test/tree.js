'use strict';

const helper     = require( './helper.js' );
const learningjs = helper.main.learning;
const data_util  = helper.main.dataUtil;

require( 'should' );

describe( 'tree.js -- This one can take a bit', () => {
  describe( 'refactor test', () => {

    let results = {
      'error':   null,
      'success': {},

      'time': {
        'start': process.hrtime(),
        'end':   null
      }
    };

    before( function( done ) {
      this.timeout( 5000 );

      function trainTree ( D ) {
        return new Promise( ( resolve, reject ) => {
            new learningjs.tree().train( D, ( model, err ) => {
              results.time.end = process.hrtime( results.time.start )[ 1 ] / 1000000;

              if ( err ) {
                return reject( err );
              }

              resolve( model );
            } );
        } );
      };

      function calcAccuracy( model, data, targets, type ) {
        return new Promise( resolve => {
          model.calcAccuracy(data, targets, function(acc, correct, total){
            results.success[ type ] = {
              correct, total, acc
            };

            resolve( model );
          } );
        } );
      };

      data_util.loadTextFile( helper.csv.train, D => {
        trainTree( D )
        .then( model => {
          return calcAccuracy( model, D.data, D.targets, 'training' );
        } )
        .then( model => {
          data_util.loadTextFile(helper.csv.test, function(T) {
            return calcAccuracy( model, T.data, T.targets, 'testing' );
          } );
        } )
        .then( done )
        .catch( e => {
          results.error = e;
          done();
        } );
      });
    } );

    it( 'should run without error', () => {
      should.not.exist( results.error );
    } );

    it( 'should create correct keys', () => {
      should.exist( results.success.training );
      should.exist( results.success.testing );
    } );

    it( 'should have correct keys within successes', () => {
      results.success.training.should.have.property( 'correct' );
      results.success.training.should.have.property( 'total' );
      results.success.training.should.have.property( 'acc' );


      results.success.testing.should.have.property( 'correct' );
      results.success.testing.should.have.property( 'total' );
      results.success.testing.should.have.property( 'acc' );
    } );

    it( 'should have correct accuracy', () => {
      let accuracy = {
        'training' : ( results.success.training.acc * 100 ).toFixed( 2 ),
        'testing' : ( results.success.testing.acc * 100 ).toFixed( 2 )
      };

      accuracy.training.should.equal( '83.78' );
      accuracy.testing.should.equal( '74.00' );
    } );
  } );
} );
