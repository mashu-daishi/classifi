'use strict';

const helper     = require( './helper.js' );
const learningjs = helper.main.learning;
const data_util  = helper.main.dataUtil;

require( 'should' );

describe( 'logistic.js', () => {
  describe( 'refactor test', () => {
    let results = {
      'error':   null,
      'success': {},

      'time': {
        'start': process.hrtime(),
        'end':   null
      }
    };

    before( done => {
      data_util.loadRealFile( helper.csv.train, D => {
        data_util.normalize( D.data, D.nfeatures );

        D.optimizer     = 'sgd';
        D.learning_rate = 0.005;
        D.l2_weight     = 0.0;
        D.iterations    = 1000;

        new learningjs.logistic().train( D )
				.then( model => {
					results.time.end = process.hrtime( results.time.start )[ 1 ] / 1000000;

					let accuracyObj = model.calcAccuracy( D.data, D.targets );

					results.success[ 'training' ] = {
						'correct': accuracyObj.n_correct,
						'total':   accuracyObj.n_samples,
						'acc':     accuracyObj.accuracy
					};

					data_util.loadRealFile( helper.csv.test, T => {
						let testAccuracy = model.calcAccuracy( T.data, T.targets )

						results.success[ 'testing' ] = {
							'correct': testAccuracy.n_correct,
							'total':   testAccuracy.n_samples,
							'acc':     testAccuracy.accuracy
						};
					});

					done();
				} );
      } );
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

      accuracy.training.should.equal( '79.73' );
      accuracy.testing.should.equal( '80.00' );
    } );
  } );
} );
