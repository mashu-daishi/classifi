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

    let correct = 0;

    if ( totalSamples === 0 ) {
      return calcCallback( 0.0 );
    }

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

lr.prototype.optimize = function( D ) {
  let thetas = {};

  D.optimizer     = D.optimizer || 'sgd';
  D.learning_rate = D.learning_rate || 0.005;
  D.l2_weight     = D.l2_weight || 0.000001;
  D.iterations    = D.iterations || 50;

  for( let i = 0; i < D.ntargets; i++ ) {
    let theta = [];

    for( let j = 0; j < D.nfeatures; j++ ) {
      theta.push( 0.0 );
    }

    thetas[ D.l_targets[ i ] ] = theta;
  }

  for( let i = 0; i < D.iterations; i++ ) {
    let targetOptimizer;

    if ( D.optimizer === 'sgd' ) {
      targetOptimizer = 'sgd_once';
    } else if ( D.optimizer === 'gd' ) {
      targetOptimizer = 'gd_batch';
    } else {
      throw new Error( 'unrecognized optimizer:', D.optimizer );
    }

    this[ targetOptimizer ]( thetas, D.data, D.nfeatures, D.targets, D.l_targets, D.ntargets, D.learning_rate, D.l2_weight );
  }

  return thetas;
};

lr.prototype.gd_batch = function( thetas, training, nfeatures,targets,l_targets, ntargets, learning_rate, l2_weight ){
  for( let t = 0; t < ntargets; t++ ) {
    let gradient = [];
    let target   = l_targets[ t ];
    let theta    = thetas[ target ];

    for( let k = 0; k < nfeatures; k++ ) {
      gradient.push( 0.0 );
    }

    for( let i = 0; i < training.length; i++ ) {
      let max_prdt, p, prdt, this_prdt, z;

      prdt     = [];
      max_prdt = prdt[ 0 ];
      z        = 0.0

      prdt.push( this.compThetaXProduct( thetas[ l_targets[ 0 ] ], training[ i ], nfeatures ) );

      if( t === 0 ) {
        this_prdt = prdt[ 0 ];
      }

      for( let j = 1; j < ntargets; j++ ) {
        let prdt1 = this.compThetaXProduct( thetas[ l_targets[ j ] ], training[ i ], nfeatures );

        prdt[ j ] = prdt1;

        if( t === j ) {
          this_prdt = prdt1;
        }

        if( max_prdt < prdt1 ) {
          max_prdt = prdt1;
        }
      }

      for( let j = 0; j < ntargets; j++ ) {
        z += Math.exp( prdt[ j ] - max_prdt );
      }

      p = Math.exp( this_prdt - max_prdt ) / z;

      for( let k = 0; k < nfeatures; k++ ) {
        let targetWeight = 0.0;

        if( target === targets[ i ] ) {
          targetWeight = 1.0;
        }

        gradient[ k ] += ( ( targetWeight - p ) * training[ i ][ k ] );
      }
    }

    for( let k = 0; k < nfeatures; k++ ) {
      theta[ k ] += ( learning_rate * gradient[ k ] - 2 * training.length * l2_weight * theta[ k ] );
    }
  }
};

lr.prototype.sgd_once = function( thetas, training, nfeatures,targets,l_targets, ntargets, learning_rate, l2_weight ) {
  for( let i = 0; i < training.length; i++ ) {
    let prdt, max_prdt, z;

    prdt = [];
    z    = 0.0;

    prdt.push( this.compThetaXProduct( thetas[ l_targets[ 0 ] ], training[ i ], nfeatures ) );

    max_prdt = prdt[ 0 ];

    for( let j = 1; j < ntargets; j++ ) {
      let prdt1 = this.compThetaXProduct( thetas[ l_targets[ j ] ], training[ i ], nfeatures );

      prdt[ j ] = prdt1;

      if( max_prdt < prdt1 ) {
        max_prdt = prdt1;
      }
    }

    for( let j = 0; j < ntargets; j++ ) {
      z += Math.exp( prdt[ j ] - max_prdt );
    }

    for( let j = 0; j < ntargets; j++ ) {
      let p, target, theta;

      p      = Math.exp( prdt[ j ] - max_prdt ) / z;
      target = l_targets[ j ];
      theta  = thetas[ target ];

      for( let k = 0; k < nfeatures; k++ ) {
        let targetWeight = 0.0;

        if( target === targets[ i ] ) {
          targetWeight = 1.0;
        }

        theta[ k ] += ( learning_rate * ( targetWeight - p ) * training[ i ][ k ] - 2 * l2_weight * theta[ k ] );
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
