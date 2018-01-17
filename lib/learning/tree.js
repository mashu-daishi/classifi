const tree = function () {};
const _    = require( 'underscore' );

tree.prototype = {
  _c45: function( data, targets, l_features_id, l_features_name, featuresType, major_label ) {
    let node;

    if ( targets.length === 0 ) {
      return {
				type:  'result',
				val:   major_label,
				name:  major_label,
				alias: major_label + this.randomTag()
			};
    }

    if ( targets.length === 1 ) {
      return {
				type:  'result',
				val:   targets[0],
				name:  targets[0],
				alias: targets[0] + this.randomTag()
			};
    }

    if( l_features_name.length === 0 ) {
      let topTarget = this.mostCommon( targets );

      return {
				type:  'result',
				val:   topTarget,
				name:  topTarget,
				alias: topTarget + this.randomTag()
			};
    }

    let bestFeatureData       = this.maxGain( data,targets,l_features_id, l_features_name, featuresType );
    let best_id               = bestFeatureData.feature_id;
    let best_name             = bestFeatureData.feature_name;
    let remainingFeaturesId   = _.without( l_features_id, best_id );
    let remainingFeaturesName = _.without( l_features_name, best_name );

    if( featuresType[ best_name ] === 'real' ) {
      node = {
				name: best_name,
				id:best_id,
				alias: best_name + this.randomTag()
			};

      node.type = 'feature_real';
      node.cut  = bestFeatureData.cut;
      node.vals = [];

      let _newS_r = this.filterByCutGreater( data, targets, bestFeatureData.cut, best_id );

			let child_node_r = {
				name:  bestFeatureData.cut.toString(),
				alias: '>' + bestFeatureData.cut.toString() + this.randomTag(),
				type:  'feature_value'
			};

      child_node_r.child = this._c45( _newS_r[ 0 ], _newS_r[ 1 ], remainingFeaturesId, remainingFeaturesName, featuresType, major_label );

      node.vals.push( child_node_r );

      let _newS_l = this.filterByCutLessEqual( data, targets, bestFeatureData.cut, best_id );

      let child_node_l = {
				name:  bestFeatureData.cut.toString(),
				alias: '<=' + bestFeatureData.cut.toString() + this.randomTag(),
				type:  'feature_value'
			};

      child_node_l.child = this._c45( _newS_l[ 0 ], _newS_l[ 1 ], remainingFeaturesId, remainingFeaturesName, featuresType, major_label );

      node.vals.push( child_node_l );

    } else {
      let possibleValues = _.unique( this.getCol( data, best_id ) );

      node = {
				name:  best_name,
				alias: best_name + this.randomTag()
			};

      node.type = "feature_category";
      node.vals = [];

      for( let i = 0; i < possibleValues.length; i++ ) {
        let _newS = this.filterByValue( data, targets, best_id, possibleValues[ i ] );

        let child_node = {
					name:  possibleValues[ i ],
					alias: possibleValues[ i ] + this.randomTag(),
					type:  'feature_value'
				};

        child_node.child = this._c45( _newS[ 0 ], _newS[ 1 ], remainingFeaturesId, remainingFeaturesName, featuresType, major_label );

        node.vals.push( child_node );
      }
    }

    return node;
  },

  getCol: function( d, colIdx ) {
    let col = [];

    for ( let i = 0; i < d.length; i++ ) {
			col.push( d[ i ][ colIdx ] );
		}

    return col;
  },

  filterByCutLessEqual: function( d, targets, cut, col ) {
    let nd = [];
    let nt = [];

    if ( d.length !== targets.length ) {
      console.log( 'ERROR: difft dimensions, c48c82cb-4b16-42ad-95e1-1f752104c687' );
    }

    for ( let i = 0; i < d.length; i++ )
      if( parseFloat( d[ i ][ col ] ) <= cut ) {
        nd.push( d[ i ] );
        nt.push( targets[ i ] );
      }

    return [ nd, nt ];
  },

  filterByCutGreater: function( d, targets, cut, col ) {
    let nd = [];
    let nt = [];

    if( d.length !== targets.length ) {
      console.log( 'ERROR: difft dimensions, 8a8f9118-eed8-4ae1-9f16-e7181c5e2381' );
    }

    for ( let i = 0; i < d.length; i++ )
      if( parseFloat( d[ i ][ col ] ) > cut ) {
        nd.push( d[ i ] );
        nt.push( targets[ i ] );
      }

    return [ nd, nt ];
  },

  filterByValue: function( d, t, featureIdx, val ) {
    let nd = [];
    let nt = [];

    for ( let i = 0; i < d.length; i++ )
      if( d[ i ][ featureIdx ] === val ) {
        nd.push( d[ i ] );
        nt.push( t[ i ] );
      }

    return [ nd, nt ];
  },

  gain: function( data,targets, feature_id, featureName, featuresType ) {
    if ( data.length !== targets.length ) {
      console.log( 'ERROR: difft dimensions, 66a871a8-3461-49d5-a13d-6fa473cf8aa0' );
    }

    let setEntropy = this.entropy( targets );
    let vals       = _.unique( this.getCol( data, feature_id ) );

    if( featuresType[ featureName ] === 'real' ) {
      let gainVals = [];

      for( let i = 0; i < vals.length; i++ ) {
        let cutf  = parseFloat( vals[ i ] );
        let _gain = setEntropy - this.conditionalEntropy( data, targets, feature_id, cutf );

        gainVals.push( {
					feature_id:feature_id,
					feature_name:featureName,
					gain:_gain,
					cut:cutf
				} );
      }

      let _maxgain = _.max( gainVals, e => e.gain );

      return _maxgain;
    } else {
      let setSize   = data.length;
      let entropies = [];

      for( let i = 0; i < vals.length; i++ ) {
        let subset = this.filterByValue( data, targets, feature_id, vals[ i ] );

        entropies.push( ( subset[ 0 ].length / setSize ) * this.entropy( subset[ 1 ] ) );
      }
      let sumOfEntropies = _( entropies ).reduce( ( a, b ) => a+b, 0 );

      return {
				feature_id:   feature_id,
				feature_name: featureName,
				gain:         setEntropy - sumOfEntropies,
				cut:          0
			};
    }
  },

  entropy: function ( vals ){
    let that       = this;
    let uniqueVals = _.unique( vals );
    let probs      = uniqueVals.map( x => that.prob( x, vals ) );
    let logVals    = probs.map( p => -p * that.log2( p ) );

    return logVals.reduce( ( a, b ) => a + b, 0);
  },

//
  conditionalEntropy: function( _s, targets, feature_id, cut ) {
    let subset1 = this.filterByCutLessEqual( _s, targets, cut, feature_id );
    let subset2 = this.filterByCutGreater( _s, targets, cut, feature_id );
    let setSize = _s.length;

    return subset1[ 0 ].length / setSize * this.entropy( subset1[ 1 ] ) + subset2[ 0 ].length / setSize * this.entropy( subset1[ 1 ] );
  },

  maxGain: function ( data, targets, l_features_id, l_features_name, featuresType ) {
    let g45 = [];

    for ( let i = 0; i < l_features_id.length; i++ ) {
      g45.push( this.gain( data, targets, l_features_id[ i ], l_features_name[ i ], featuresType ) );
    }

    return _.max( g45, e => e.gain );
  },

  prob: function( val, vals ){
   let instances = _.filter( vals, x => x === val ).length;
   let total     = vals.length;

   return instances / total;
  },

  log2: function ( n ) {
   return Math.log( n ) / Math.log( 2 );
  },

  mostCommon: function( l ) {
    let that = this;

    return  _.sortBy( l, a => that.count( a, l ) ).reverse()[ 1 ];
  },

  count: function ( a, l ){
    return _.filter( l, b => b === a ).length;
  },

  randomTag: function () {
    return '_r' + Math.round( Math.random() * 1000000 ).toString();
  }

}

tree.prototype.train = function( D, cb ) {
 let major_label = this.mostCommon( D.targets );

 cb( {
   model: this._c45( D.data, D.targets, D.l_featuresIndex, D.featureNames, D.featuresType, major_label ),

   classify: function( sample ) {
     let root = this.model;

     if( typeof root === 'undefined' ) {
       return 'null';
     }

     while( root.type !== 'result' ) {
       let childNode;

       if( root.type === 'feature_real' ) {
         let feature_name = root.name;
         let sampleVal    = parseFloat( sample[ D.feature_name2id[ feature_name ] ] );

         if( sampleVal <= root.cut ) {
					 childNode = root.vals[ 1 ];
				 } else {
					 childNode = root.vals[ 0 ];
				 }
       } else {
         let attr      = root.name;
         let sampleVal = sample[ D.feature_name2id[ attr ] ];

         childNode = _.detect( root.vals, x => x.name === sampleVal );
       }

       if ( typeof childNode === 'undefined' ) {
         return major_label;
       }

       root = childNode.child;
     }

     return root.val;
   },

   calcAccuracy: function( samples, targets, cb ) {
     let total   = samples.length;
     let correct = 0;

     for ( let i = 0; i < samples.length; i++ ) {
       let pred   = this.classify( samples[ i ] );
       let actual = targets[ i ];

       if( pred === actual ){
         correct++;
       }
     }

     if( total > 0 ) {
			 return cb( correct / total, correct, total );
		 }

		 cb( 0.0 );
   },
 }, undefined );
}

module.exports = tree;
