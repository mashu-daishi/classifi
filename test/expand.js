'use strict';

const helper     = require( './helper' );
const learningjs = helper.main.learning;
const data_util  = helper.main.dataUtil;
const training   = 'test/data/iris_train.csv';
const testing    = 'test/data/iris_test.csv';

require( 'should' );

describe( 'logistic', () => {
  let results = {
    'error':   null,
    'success': {},

    'time': {
      'start': process.hrtime(),
      'end':   null
    }
  };

  before( done => {
    data_util.loadRealFile( training, 'species', D => {
      data_util.normalize( D.data, D.nfeatures );

      D.optimizer     = 'sgd';
      D.learning_rate = 0.005;
      D.l2_weight     = 0.0;
      D.iterations    = 1000;

      new learningjs.logistic().train( D, ( model, err ) => {
        results.time.end = process.hrtime( results.time.start )[ 1 ] / 1000000;

        if ( err ) {
          results.error = err;

          return done();
        }

        model.calcAccuracy( D.data, D.targets, ( acc, correct, total ) => {
          results.success[ 'training' ] = {
            correct, total, acc
          };
        });

        data_util.loadRealFile( testing, 'species', T => {
          model.calcAccuracy( T.data, T.targets, ( acc, correct, total ) => {
            results.success[ 'testing' ] = {
              correct, total, acc
            };
          });
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
} );

describe( 'tree', () => {
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

		data_util.loadTextFile( training, 'species', D => {
			trainTree( D )
			.then( model => {
				return calcAccuracy( model, D.data, D.targets, 'training' );
			} )
			.then( model => {
				data_util.loadTextFile( testing, 'species', T => {
					// Attempting to visualize the tree here.
// console.log('model.model:', model.model);
// 					model.model.vals.forEach( item => {
// 						if ( item.name === '5.4' ) {
// 							console.log('item.child:', item.child);
// 						}
// 					} );

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
} );
