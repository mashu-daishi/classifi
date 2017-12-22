'use strict';

//logistic regression
const lr = function () {};

lr.prototype.train = function( D, callback ) {
  function classify ( sample ) {
    let max_p = this.that.compThetaXProduct( this.thetas[ D.l_targets[ 0 ] ], sample, D.nfeatures );
    let max_t = D.l_targets[ 0 ];

    for( let i = 1; i < D.ntargets; i++ ) {
      const tempTarget = D.l_targets[ i ];
      const p          = this.that.compThetaXProduct( this.thetas[ tempTarget ], sample, D.nfeatures );

      if ( max_p < p ) {
        max_p = p;
        max_t = tempTarget;
      }
    }

    return max_t;
  };

  function calcAccuracy ( samples, targets, calcCallback ) {
    const totalSamples = samples.length;

    if ( totalSamples === 0 ) {
      return calcCallback( 0.0 );
    }

    let correct = 0;

    samples.forEach( ( sample, index ) => {
      let tempPred   = this.classify( sample );
      let tempActual = targets[ index ];

      if ( tempPred === tempActual ) {
        correct++;
      }
    } );

    calcCallback( correct/totalSamples, correct, totalSamples );
  };

  const trainCallback = {
    'that':   this,
    'thetas': this.optimize( D ),

    classify, calcAccuracy
  };

  callback( trainCallback, undefined );
};

lr.prototype.printThetas = function( thetas, ntargets, l_targets, nfeatures ) {
  for( let i = 0; i < ntargets; i++ ) {
    console.log( l_targets[ i ] );

    for( let j = 0; j < nfeatures; j++ ) {
      process.stdout.write( thetas[ l_targets[ i ] ][ j ] + ' ');
    }

    console.log(' ');
  }
};

lr.prototype.optimize = function( D ) {
  D.optimizer     = D.optimizer || 'sgd';
  D.learning_rate = D.learning_rate || 0.005;
  D.l2_weight     = D.l2_weight || 0.000001;
  D.iterations    = D.iterations || 50;

  let thetas = {};

  for( let i = 0; i < D.ntargets; i++ ) {
    let theta = [];

    for( let j = 0; j < D.nfeatures; j++ ) {
      theta.push( 0.0 );
    }

    thetas[ D.l_targets[ i ] ] = theta;
  }

  for( let i = 0; i < D.iterations; i++ ) {
    if ( D.optimizer === 'sgd' ) {
      this.sgd_once( thetas, D.data, D.nfeatures, D.targets, D.l_targets, D.ntargets, D.learning_rate, D.l2_weight );
    } else if ( D.optimizer === 'gd' ) {
      this.gd_batch( thetas, D.data, D.nfeatures, D.targets, D.l_targets, D.ntargets, D.learning_rate, D.l2_weight );
    } else {
      console.log('unrecognized optimizer:'+D.optimizer);

      break;
    }
  }

  return thetas;
};

lr.prototype.gd_batch = function( thetas, training, nfeatures,targets,l_targets, ntargets, learning_rate, l2_weight ){
  for( let t = 0; t < ntargets; t++ ) {
    let gradient = [];

    for( let k = 0; k < nfeatures; k++ ) {
      gradient.push( 0.0 );
    }

    let target = l_targets[ t ];

    for( let i = 0; i < training.length; i++ ) {
      let prdt=[], this_prdt;

      prdt.push( this.compThetaXProduct( thetas[ l_targets[ 0 ] ], training[ i ], nfeatures ) );

      if( t === 0 ) {
        this_prdt = prdt[ 0 ];
      }

      let max_prdt = prdt[ 0 ];

      for( let j = 1; j < ntargets; j++ ) {
        let prdt1 = this.compThetaXProduct( thetas[ l_targets[ j ] ], training[ i ], nfeatures );

        prdt[ j ] = prdt1;

        if( t === j ) {
          this_prdt = prdt1;
        }

        if( max_prdt < prdt1 ) {
          max_prdt= prdt1;
        }
      }

      let z = 0.0;

      for( let j = 0; j < ntargets; j++ ) {
        z += Math.exp( prdt[ j ] - max_prdt );
      }

      let p = Math.exp( this_prdt - max_prdt ) / z;

      for( let k = 0; k < nfeatures; k++ ) {
        if( target === targets[ i ] ) {
          gradient[ k ] += ( ( 1.0 - p ) * training[ i ][ k ] );
        } else {
          gradient[ k ] += ( ( 0.0 - p ) * training[ i ][ k ] );
        }
      }
    }

    let theta = thetas[ target ];

    for( let k = 0; k < nfeatures; k++ ) {
      theta[ k ] += ( learning_rate * gradient[ k ] - 2 * training.length * l2_weight * theta[ k ] );
    }
  }
};

lr.prototype.sgd_once = function( thetas, training, nfeatures,targets,l_targets, ntargets, learning_rate, l2_weight ) {
  for( let i = 0; i < training.length; i++ ) {
    let prdt = [];

    prdt.push( this.compThetaXProduct( thetas[ l_targets[ 0 ] ], training[ i ], nfeatures ) );

    let max_prdt = prdt[ 0 ];

    for( let j = 1; j < ntargets; j++ ) {
      let prdt1 = this.compThetaXProduct( thetas[ l_targets[ j ] ], training[ i ], nfeatures );

      prdt[ j ] = prdt1;

      if( max_prdt < prdt1 ) {
        max_prdt = prdt1;
      }
    }

    let z=0.0;

    for( let j = 0; j < ntargets; j++ ) {
      z += Math.exp( prdt[ j ] - max_prdt );
    }

    for( let j = 0; j < ntargets; j++ ) {
      let p      = Math.exp( prdt[ j ] - max_prdt ) / z;
      let target = l_targets[ j ];
      let theta  = thetas[ target ];

      for( let k = 0; k < nfeatures; k++ ) {
        if( target === targets[ i ] ) {
          theta[ k ] += ( learning_rate * ( 1.0 - p ) * training[ i ][ k ] - 2 * l2_weight * theta[ k ] );
        } else {
          theta[ k ] += ( learning_rate * ( 0.0 - p ) * training[ i ][ k ] - 2 * l2_weight * theta[ k ] );
        }
      }
    }
  }
};

lr.prototype.compThetaXProduct = function( theta, sample, nfeatures ) {
  let a = 0;

  for( let i = 0; i < nfeatures; i++ ) {
    a += theta[ i ] * sample[ i ];
  }

  return a;
};

module.exports = lr;
