'use strict';

const fs   = require( 'fs' );
const lazy = require( 'lazy' );

const util = {
	normalize: function( data, nfeatures ) {
	  for( let i = 0; i < data.length; i++ ) {
	    let mean=0.0, stderr = 0.0;

	    for( let j = 0; j < nfeatures; j++) {
	      mean += data[ i ][ j ];
	    }

	    mean /= nfeatures;

	    for( let j = 0; j < nfeatures; j++ ) {
	      let a = data[ i ][ j ] - mean;
	      stderr += a * a;
	    }

	    stderr = Math.sqrt( stderr/nfeatures );

	    for( let j = 0; j < nfeatures; j++ ) {
	      data[ i ][ j ] -= mean;
	      data[ i ][ j ] /= stderr;
	    }
	  }
	},

	loadTextFile: function( fn, label, cb ) {
	  let data            = [];
	  let header          = true;
	  let targets         = [];
	  let label_col       = -1;
	  let l_features_id   = [];
	  let featuresType    = {};
	  let l_features_name = [];
	  let feature_name2id = [];
	  let s_targets       = {};
	  let l_targets       = [];
	  let nfeatures       = 0;
		let targetLabel     = 'label';

		if ( typeof label === 'function' ) {
			cb = label;
		} else {
			targetLabel = label;
		}

	  new lazy( fs.createReadStream( fn ) )
	  .on('end', function() {
	    for( let key in s_targets ) {
	      if ( s_targets.hasOwnProperty( key ) ) {
	        l_targets.push( key );
	      }
	    }

	    cb( {
				data:data,
				l_featuresIndex:l_features_id,
				nfeatures:nfeatures,
				targets:targets,
				l_targets:l_targets,
				ntargets:l_targets.length,
				featureNames:l_features_name,
				feature_name2id:feature_name2id,
				featuresType:featuresType
			} );
	  } )
	  .lines
	  .forEach( function( line ){
	    if( header ) {
	      header = false;

	      let aa = line.toString().split( ',' );

	      for( let i = 0; i < aa.length; i++) {
	        aa[ i ] = aa[ i ].trim();

	        if ( aa[ i ] === targetLabel ) {
						label_col = i;
					} else {
	          l_features_id.push( i );
	          l_features_name.push( aa[ i ] );
	          feature_name2id[ aa[ i ] ] = i;
	        }
	      }

	      if ( label_col === -1 ) {
	        console.log( 'ERROR. No label column found. Error: d2db6ad0-0323-4456-a886-3782f659d4d6' );
	        process.exit( 1 );
	      }

	      nfeatures = l_features_id.length;
	    } else {
	      let aa = line.toString().split( ',' );

	      if ( aa.length == ( nfeatures + 1 ) ) {
	        for( let i = 0; i < aa.length; i++ ) {
	          aa[ i ] = aa[ i ].trim();
	        }
	        if ( aa[ label_col ] === 'feature_type' ) {
	          for( let i = 0; i < nfeatures; i++ ) {
	            featuresType[ l_features_name[ i ] ] = aa[ l_features_id[ i ] ];//id points to index in input file
	          }
	        } else {
	          let dd = [];

	          for( let i = 0; i < nfeatures; i++ ) {
	            let a = aa[ l_features_id[ i ] ];
	            dd.push( a );
	          }

	          s_targets[ aa[ label_col ] ] = 1;
	          data.push( dd );
	          targets.push( aa[ label_col ] );
	        }
	      } else {
	        console.log( 'skip line:', line.toString() );
	      }
	    }
	  });
	},

	loadRealFile: function( fn, label, cb ) {
	  let data            = [];
	  let header          = true;
	  let targets         = [];
	  let label_col       = -1;
	  let l_features      = [];
	  let l_features_name = [];
	  let s_targets       = {};
	  let l_targets       = [];
	  let nfeatures       = 0;
		let targetLabel     = 'label';

		if ( typeof label === 'function' ) {
			cb = label;
		} else {
			targetLabel = label;
		}

	  new lazy( fs.createReadStream( fn ) )
	  .on( 'end', function() {
	    for( let key in s_targets ) {
	      if ( s_targets.hasOwnProperty( key ) ) {
	        l_targets.push( key );
	      }
	    }

	    let ntargets = l_targets.length;

	    cb( {
				data:data,
				l_featuresIndex:l_features,
				nfeatures:nfeatures,
				targets:targets,
				l_targets:l_targets,
				ntargets:ntargets,
				featureNames:l_features_name
			} );
	  } ).lines.forEach( function( line ) {
	    if ( header ) {
	      header = false;

	      let aa = line.toString().split( ',' );

	      for ( let i = 0; i < aa.length; i++ ) {
	        aa[ i ] = aa[ i ].trim();

	        if ( aa[ i ] === targetLabel ) {
						label_col = i;
					} else {
	          l_features.push( i );
	          l_features_name.push( aa[ i ] );
	        }
	      }

	      if( label_col === -1 ) {
	        console.log( 'ERROR. No label column found. Error: 3457b51d-8594-451c-b229-246b02b776c5' );
	        process.exit( 1 );
	      }

	      nfeatures = l_features.length;
	    } else {
	      let aa = line.toString().split( ',' );
	      let dd = [];

	      for( let i = 0; i < aa.length; i++ ) {
	        aa[ i ] = aa[ i ].trim();
	      }

	      if ( aa[ label_col ] === 'feature_type' ) {
					return true;
				}

	      for( let i = 0; i < nfeatures; i++ ) {
	        let a = parseFloat( aa[ l_features[ i ] ] );
	        dd.push( a||0 );
	      }

	      s_targets[ aa[ label_col ] ] = 1;
	      data.push( dd );
	      targets.push( aa[ label_col ] );
	    }
	  } );
	}
}

module.exports = util;
