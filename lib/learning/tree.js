const tree = function () {};

tree.prototype = {
  _c45: function(data, targets, l_features_id, l_features_name, featuresType, major_label) {
    let node;
    if (targets.length == 0) {
      return {type:"result", val: major_label, name: major_label,alias:major_label+this.randomTag() };
    }
    if (targets.length == 1) {
      return {type:"result", val: targets[0], name: targets[0],alias:targets[0]+this.randomTag() };
    }
    if(l_features_name.length == 0) {
      let topTarget = this.mostCommon(targets);
      return {type:"result", val: topTarget, name: topTarget, alias: topTarget+this.randomTag()};
    }
    let bestFeatureData = this.maxGain(data,targets,l_features_id, l_features_name, featuresType);
    let best_id = bestFeatureData.feature_id;//feature_id is index in data file
    let best_name = bestFeatureData.feature_name;
    //console.log('bestFeatureData:',bestFeatureData);
    //console.log(featuresType[bestFeatureData.feature_name]);
    let remainingFeaturesId = _und.without(l_features_id, best_id);
    let remainingFeaturesName = _und.without(l_features_name, best_name);
    if(featuresType[best_name]==='real') {
      node = {name: best_name, id:best_id,alias: best_name+this.randomTag()};
      node.type = "feature_real";
      node.cut = bestFeatureData.cut;
      node.vals=[];

      let _newS_r = this.filterByCutGreater(data, targets, bestFeatureData.cut, best_id);
      //printDataset(_newS_r,bestFeature, 'label','>'+bestFeatureData.cut);
      let child_node_r = {name:bestFeatureData.cut.toString(),alias:'>'+bestFeatureData.cut.toString()+this.randomTag(),type: "feature_value"};
      child_node_r.child = this._c45(_newS_r[0], _newS_r[1], remainingFeaturesId, remainingFeaturesName, featuresType, major_label);
      node.vals.push(child_node_r);

      let _newS_l = this.filterByCutLessEqual(data, targets, bestFeatureData.cut, best_id);
      //printDataset(_newS_l,bestFeature, 'label','<='+bestFeatureData.cut);
      let child_node_l= {name:bestFeatureData.cut.toString(),alias:'<='+bestFeatureData.cut.toString()+this.randomTag(),type: "feature_value"};
      child_node_l.child = this._c45(_newS_l[0],_newS_l[1], remainingFeaturesId, remainingFeaturesName, featuresType, major_label);
      node.vals.push(child_node_l);

    } else{ //default is text
      let possibleValues = _und.unique(this.getCol(data, best_id));
      node = {name: best_name, alias: best_name+this.randomTag()};
      node.type = "feature_category";
      node.vals=[];

      for(let i=0;i<possibleValues.length;i++) {
        let _newS = this.filterByValue(data,targets,best_id, possibleValues[i]);
        let child_node = {name:possibleValues[i], alias:possibleValues[i]+this.randomTag(),type: "feature_value"};
        child_node.child = this._c45(_newS[0],_newS[1],remainingFeaturesId,remainingFeaturesName, featuresType, major_label);
        node.vals.push(child_node);
      }
    }
    return node;
  },

  //node(alias, vals(node))
  addEdges:function(node, colors, h_color, g){
    let that = this;
    if(node.type == 'feature_real'||node.type=='feature_category'){
      _und.each(node.vals,function(m){
        g.push(['val:'+m.alias+'</span>',node.alias+'','node']);
        g = that.addEdges(m, colors, h_color, g);
      });
      return g;
    } else if(node.type == 'feature_value'){
      if(node.child.type != 'result'){
        g.push([node.child.alias+'','val:'+node.alias+'</span>','value']);
        g = this.addEdges(node.child, colors, h_color, g);
      } else {
        let color='black';
        if(node.child.name in h_color) {
          color = h_color[node.child.name];
        } else {
          let _sz = Object.keys(h_color).length;
          if (_sz >=colors.length) color='black';
          else color = colors[_sz];
          h_color[node.child.name]=color;
        }
        g.push(['<span style="color:'+color+';font-weight:bold;">'+node.child.alias+'</span>','val:'+node.alias+'</span>','value']);
      }
      return g;
    }
    return g;
  } ,

  drawGraph: function(model,divId, cb){
    if(typeof google==='undefined') {
      cb('google visualization APIs are not defined');
      return;
    }
    let g = new Array();
    let colors=['red','blue','green','yellow','black','fuchsia','gold','indigo','lime','mintcream','navy','olive','salmon','skyblue'];
    let h_color={};
    g = this.addEdges(model.model, colors,h_color,g).reverse();
    window.g = g;
    let data = google.visualization.arrayToDataTable(g.concat(g));
    let chart = new google.visualization.OrgChart(document.getElementById(divId));
    google.visualization.events.addListener(chart, 'ready',function(){
       _und.each($('.google-visualization-orgchart-node'),function(x){
          let oldVal = $(x).html();
          if(oldVal){
              let cleanVal = oldVal.replace(/_r[0-9]+/,'');
              cleanVal = cleanVal.replace(/val:/,'<span style="color:olivedrab;">');
              $(x).html(cleanVal);
          }
        });
    });
    chart.draw(data, {allowHtml: true});
    cb();
  },

  getCol:function(d, colIdx) {
    let col = [];
    for(let i=0;i<d.length;i++) col.push(d[i][colIdx]);
    return col;
  },

  filterByCutLessEqual:function(d, targets, cut, col) {
    let nd = [];
    let nt = [];
    if(d.length != targets.length) {
      console.log('ERRROR: difft dimensions');
    }
    for(let i=0;i<d.length;i++)
      if(parseFloat(d[i][col])<=cut) {
        nd.push(d[i]);
        nt.push(targets[i]);
      }
    return [nd, nt];
  },

  filterByCutGreater:function(d, targets, cut, col) {
    let nd = [];
    let nt = [];
    if(d.length != targets.length) {
      console.log('ERRROR: difft dimensions');
    }
    for(let i=0;i<d.length;i++)
      if(parseFloat(d[i][col])>cut) {
        nd.push(d[i]);
        nt.push(targets[i]);
      }
    return [nd, nt];
  },

  //filter data, target at the same time
  filterByValue:function(d,t, featureIdx, val) {
    let nd = [];
    let nt = [];
    for(let i=0;i<d.length;i++)
      if(d[i][featureIdx]===val) {
        nd.push(d[i]);
        nt.push(t[i]);
      }
    return [nd,nt];
  },

  //compute info gain for this feature. feature can be category or real type
  gain: function(data,targets, feature_id, featureName, featuresType) {
    if(data.length != targets.length) {
      console.log('ERRROR: difft dimensions');
    }
    let setEntropy = this.entropy(targets);
    //console.log('setEntropy:',setEntropy);
    let vals = _und.unique(this.getCol(data,feature_id));
    if(featuresType[featureName] === 'real') {
      let gainVals = [];
      for(let i=0;i<vals.length;i++) {
        let cutf=parseFloat(vals[i]);
        let _gain = setEntropy-this.conditionalEntropy(data, targets, feature_id, cutf);
        gainVals.push({feature_id:feature_id, feature_name:featureName, gain:_gain, cut:cutf});
      }
      let _maxgain= _und.max(gainVals, function(e){return e.gain});
      return _maxgain;
    } else{//default is text
      let setSize = data.length;
      let entropies = [];
      for(let i=0;i<vals.length;i++) {
        let subset = this.filterByValue(data, targets, feature_id, vals[i]);
        entropies.push((subset[0].length/setSize)*this.entropy(subset[1]));
      }
      //console.log(featureName,' entropies:',entropies);
      let sumOfEntropies =  _und(entropies).reduce(function(a,b){return a+b},0);
      //console.log(featureName,' sumOfEntropies:',sumOfEntropies);
      return {feature_id:feature_id, feature_name:featureName, gain:setEntropy - sumOfEntropies, cut:0};
    }
  },

  entropy: function (vals){
    let that = this;
    let uniqueVals = _und.unique(vals);
    let probs = uniqueVals.map(function(x){return that.prob(x,vals)});
    let logVals = probs.map(function(p){return -p*that.log2(p) });
    return logVals.reduce(function(a,b){return a+b},0);
  },

  //conditional entropy if data is split to two
  conditionalEntropy: function(_s, targets, feature_id, cut) {
    let subset1 = this.filterByCutLessEqual(_s, targets, cut, feature_id);
    let subset2 = this.filterByCutGreater(_s, targets, cut, feature_id);
    let setSize = _s.length;
    return subset1[0].length/setSize*this.entropy(subset1[1]) + subset2[0].length/setSize*this.entropy(subset1[1]);
  },

  maxGain: function (data, targets, l_features_id, l_features_name, featuresType){
    let g45 = [];
    for(let i=0;i<l_features_id.length;i++) {
      //console.log('maxgain feature:'+l_features_id[i]+' '+l_features_name[i]);
      g45.push(this.gain(data,targets,l_features_id[i], l_features_name[i], featuresType));
    }
    return _und.max(g45,function(e){
      return e.gain;
    });
  },

  prob: function(val,vals){
   let instances = _und.filter(vals,function(x) {return x === val}).length;
   let total = vals.length;
   return instances/total;
  },

  log2: function (n){
   return Math.log(n)/Math.log(2);
  },

  mostCommon: function(l){
    let that=this;
    return  _und.sortBy(l,function(a){
      return that.count(a,l);
    }).reverse()[1];
  },

  count: function (a,l){
    return _und.filter(l,function(b) { return b === a}).length
  },

  randomTag: function (){
    return "_r"+Math.round(Math.random()*1000000).toString();
  }

}

tree.prototype.train = function(D, cb) {
 let major_label = this.mostCommon(D.targets);
 cb({
   model:this._c45(D.data, D.targets, D.l_featuresIndex, D.featureNames, D.featuresType, major_label),
   classify: function(sample) {
     let root = this.model;
     if(typeof root === 'undefined') {
       return 'null';
     }
     while(root.type != "result") {
       let childNode;
       if(root.type === 'feature_real') {
         let feature_name = root.name;
         let sampleVal = parseFloat(sample[D.feature_name2id[feature_name]]);
         if(sampleVal<=root.cut)
           childNode=root.vals[1];
         else
           childNode=root.vals[0];
       } else {
         let attr = root.name;
         let sampleVal = sample[D.feature_name2id[attr]];
         childNode = _und.detect(root.vals,function(x){return x.name == sampleVal});
       }
       //unseen feature value (didn't appear in training data)
       if(typeof childNode === 'undefined') {
         //console.log('unseen feature value:',root.name,'sample:',sample);
         return major_label;
       }
       root = childNode.child;
     }
     return root.val;
   },
   calcAccuracy: function(samples, targets, cb) {
     let total = samples.length;
     let correct = 0;
     for(let i=0;i<samples.length;i++) {
       let pred = this.classify(samples[i]);
       let actual = targets[i];
       //console.log('predict:'+pred,' actual:'+actual);
       if(pred === actual){
         correct++;
       }
     }
     if(total>0)
       cb(correct/total, correct, total);
     else
       cb(0.0);
   },
 }, undefined);
}

module.exports = tree;
