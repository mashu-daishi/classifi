LearningJS: A Javascript Implementation of Logistic Regression and C4.5 Decision Tree Algorithms
==========
Original Author: Yandong Liu. Email: yandongl @ cs.cmu.edu

Revised Author: Matthew Young. Email: mashu.daishi @ gmail.com

# Introduction
Javascript implementation of several machine learning algorithms including Decision Tree and Logistic Regression this far.

# Data format
Input files need to be in CSV-format with 1st line being feature names. E.g.  
<pre>
outlook, temp, humidity, wind, label
text, real, text, text, feature_type
'Sunny',80,'High', 'Weak', 'No'
'Sunny',82,'High', 'Strong', 'No'
'Overcast',73,'High', 'Weak', 'Yes'
</pre>

# Installing
```
npm install classifi
```

# Usage
Data loading: learningjs.data_util provides two methods:

 * `loadTextFile`: the csv-format file will be loaded from disk and columns are parsed as strings unless 2nd line specifies feature types.
 * `loadRealFile`: the csv-format file will be loaded from disk and columns are parsed as real numbers.

In the loading callback function you will obtain a data object D on which you can apply the learning methods. Note that only Decision Tree supports both real and categorical features. Logistic Regression works on real features only.  

```javascript
let learningjs = require( 'learningjs' );
let data_util  = learning.dataUtil;
let tree       = new learningjs.tree();

data_util.loadRealFile( '${ path-to-csv }', function( D ) {
  //normalize data
  data_util.normalize( D.data, D.nfeatures );

  //logistic regression. following params are optional
  D.optimizer     = 'sgd'; //default choice. other choice is 'gd'
  D.learning_rate = 0.005;
  D.l2_weight     = 0.0;
  D.iterations    = 1000; //increase number of iterations for better performance

  new learningjs.logistic().train( D )
    .then( model => {
			let trainAccuracy = model.calcAccuracy( D.data, D.targets );

			console.log( 'training: got ' + trainAccuracy.n_correct + ' correct out of ' + trainAccuracy.n_samples+ ' examples. accuracy:' + ( trainAccuracy.accuracy * 100.0 ).toFixed( 2 ) + '%' );

			data_util.loadRealFile( fn_test, function( T ) {
				let testAccuracy = model.calcAccuracy( T.data, T.targets );

				console.log('    test: got ' + testAccuracy.n_correct + ' correct out of ' + testAccuracy.n_samples + ' examples. accuracy:' + ( trainAccuracy.accuracy * 100.0 ).toFixed( 2 ) + '%' );
			} );			
		} )
  } );
} );
```

# License
MIT
