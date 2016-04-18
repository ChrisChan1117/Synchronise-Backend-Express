(function(b){var f=typeof self=="object"&&self.self==self&&self||typeof global=="object"&&global.global==global&&global;if(typeof define==="function"&&define.amd){define(["underscore","jquery","exports"],function(e,h,g){f.Backbone=b(f,g,e,h)})}else{if(typeof exports!=="undefined"){var a=require("underscore"),d;try{d=require("jquery")}catch(c){}b(f,exports,a,d)}else{f.Backbone=b(f,{},f._,f.jQuery||f.Zepto||f.ender||f.$)}}})(function(af,av,aq,ah){var ag=af.Backbone;var al=[].slice;av.VERSION="1.2.1";av.$=ah;av.noConflict=function(){af.Backbone=ag;return this};av.emulateHTTP=false;av.emulateJSON=false;var az=function(a,c,b){switch(a){case 1:return function(){return aq[c](this[b])};case 2:return function(d){return aq[c](this[b],d)};case 3:return function(d,e){return aq[c](this[b],d,e)};case 4:return function(d,e,f){return aq[c](this[b],d,e,f)};default:return function(){var d=al.call(arguments);d.unshift(this[b]);return aq[c].apply(aq,d)}}};var ak=function(a,c,b){aq.each(c,function(f,d){if(aq[d]){a.prototype[d]=az(f,d,b)}})};var ar=av.Events={};var ae=/\s+/;var an=function(c,g,f,d,i){var b=0,h;if(f&&typeof f==="object"){if(d!==void 0&&"context" in i&&i.context===void 0){i.context=d}for(h=aq.keys(f);b<h.length;b++){g=c(g,h[b],f[h[b]],i)}}else{if(f&&ae.test(f)){for(h=f.split(ae);b<h.length;b++){g=c(g,h[b],d,i)}}else{g=c(g,f,d,i)}}return g};ar.on=function(b,c,a){return ax(this,b,c,a)};var ax=function(b,f,a,d,c){b._events=an(au,b._events||{},f,a,{context:d,ctx:b,listening:c});if(c){var g=b._listeners||(b._listeners={});g[c.id]=c}return b};ar.listenTo=function(c,g,f){if(!c){return this}var d=c._listenId||(c._listenId=aq.uniqueId("l"));var i=this._listeningTo||(this._listeningTo={});var b=i[d];if(!b){var h=this._listenId||(this._listenId=aq.uniqueId("l"));b=i[d]={obj:c,objId:d,id:h,listeningTo:i,count:0}}ax(c,g,f,this,b);return this};var au=function(d,h,c,g){if(c){var f=d[h]||(d[h]=[]);var k=g.context,b=g.ctx,j=g.listening;if(j){j.count++}f.push({callback:c,context:k,ctx:k||b,listening:j})}return d};ar.off=function(b,c,a){if(!this._events){return this}this._events=an(aw,this._events,b,c,{context:a,listeners:this._listeners});return this};ar.stopListening=function(c,g,f){var d=this._listeningTo;if(!d){return this}var i=c?[c._listenId]:aq.keys(d);for(var b=0;b<i.length;b++){var h=d[i[b]];if(!h){break}h.obj.off(g,f,this)}if(aq.isEmpty(d)){this._listeningTo=void 0}return this};var aw=function(C,p,b,E){if(!C){return}var i=0,x;var g=E.context,k=E.listeners;if(!p&&!b&&!g){var A=aq.keys(k);for(;i<A.length;i++){x=k[A[i]];delete k[x.id];delete x.listeningTo[x.objId]}return}var j=p?[p]:aq.keys(C);for(;i<j.length;i++){p=j[i];var w=C[p];if(!w){break}var m=[];for(var q=0;q<w.length;q++){var y=w[q];if(b&&b!==y.callback&&b!==y.callback._callback||g&&g!==y.context){m.push(y)}else{x=y.listening;if(x&&--x.count===0){delete k[x.id];delete x.listeningTo[x.objId]}}}if(m.length){C[p]=m}else{delete C[p]}}if(aq.size(C)){return C}};ar.once=function(a,d,c){var b=an(ad,{},a,d,aq.bind(this.off,this));return this.on(b,void 0,c)};ar.listenToOnce=function(a,d,c){var b=an(ad,{},d,c,aq.bind(this.stopListening,this,a));return this.listenTo(a,b)};var ad=function(a,d,c,b){if(c){var f=a[d]=aq.once(function(){b(d,f);c.apply(this,arguments)});f._callback=c}return a};ar.trigger=function(b){if(!this._events){return this}var d=Math.max(0,arguments.length-1);var a=Array(d);for(var c=0;c<d;c++){a[c]=arguments[c+1]}an(at,this._events,b,void 0,a);return this};var at=function(b,f,a,d){if(b){var c=b[f];var g=b.all;if(c&&g){g=g.slice()}if(c){aj(c,d)}if(g){aj(g,[f].concat(d))}}return b};var aj=function(d,h){var c,g=-1,f=d.length,k=h[0],b=h[1],j=h[2];switch(h.length){case 0:while(++g<f){(c=d[g]).callback.call(c.ctx)}return;case 1:while(++g<f){(c=d[g]).callback.call(c.ctx,k)}return;case 2:while(++g<f){(c=d[g]).callback.call(c.ctx,k,b)}return;case 3:while(++g<f){(c=d[g]).callback.call(c.ctx,k,b,j)}return;default:while(++g<f){(c=d[g]).callback.apply(c.ctx,h)}return}};ar.bind=ar.on;ar.unbind=ar.off;aq.extend(av,ar);var am=av.Model=function(a,c){var b=a||{};c||(c={});this.cid=aq.uniqueId(this.cidPrefix);this.attributes={};if(c.collection){this.collection=c.collection}if(c.parse){b=this.parse(b,c)||{}}b=aq.defaults({},b,aq.result(this,"defaults"));this.set(b,c);this.changed={};this.initialize.apply(this,arguments)};aq.extend(am.prototype,ar,{changed:null,validationError:null,idAttribute:"id",cidPrefix:"c",initialize:function(){},toJSON:function(a){return aq.clone(this.attributes)},sync:function(){return av.sync.apply(this,arguments)},get:function(a){return this.attributes[a]},escape:function(a){return aq.escape(this.get(a))},has:function(a){return this.get(a)!=null},matches:function(a){return !!aq.iteratee(a,this)(this.attributes)},set:function(y,p,b){if(y==null){return this}var A;if(typeof y==="object"){A=y;b=p}else{(A={})[y]=p}b||(b={});if(!this._validate(A,b)){return false}var i=b.unset;var w=b.silent;var g=[];var k=this._changing;this._changing=true;if(!k){this._previousAttributes=aq.clone(this.attributes);this.changed={}}var x=this.attributes;var j=this.changed;var v=this._previousAttributes;if(this.idAttribute in A){this.id=A[this.idAttribute]}for(var m in A){p=A[m];if(!aq.isEqual(x[m],p)){g.push(m)}if(!aq.isEqual(v[m],p)){j[m]=p}else{delete j[m]}i?delete x[m]:x[m]=p}if(!w){if(g.length){this._pending=b}for(var q=0;q<g.length;q++){this.trigger("change:"+g[q],this,x[g[q]],b)}}if(k){return this}if(!w){while(this._pending){b=this._pending;this._pending=false;this.trigger("change",this,b)}}this._pending=false;this._changing=false;return this},unset:function(a,b){return this.set(a,void 0,aq.extend({},b,{unset:true}))},clear:function(a){var c={};for(var b in this.attributes){c[b]=void 0}return this.set(c,aq.extend({},a,{unset:true}))},hasChanged:function(a){if(a==null){return !aq.isEmpty(this.changed)}return aq.has(this.changed,a)},changedAttributes:function(a){if(!a){return this.hasChanged()?aq.clone(this.changed):false}var d=this._changing?this._previousAttributes:this.attributes;var c={};for(var b in a){var f=a[b];if(aq.isEqual(d[b],f)){continue}c[b]=f}return aq.size(c)?c:false},previous:function(a){if(a==null||!this._previousAttributes){return null}return this._previousAttributes[a]},previousAttributes:function(){return aq.clone(this._previousAttributes)},fetch:function(a){a=aq.extend({parse:true},a);var c=this;var b=a.success;a.success=function(d){var e=a.parse?c.parse(d,a):d;if(!c.set(e,a)){return false}if(b){b.call(a.context,c,d,a)}c.trigger("sync",c,d,a)};ai(this,a);return this.sync("read",this,a)},save:function(m,i,b){var p;if(m==null||typeof m==="object"){p=m;b=i}else{(p={})[m]=i}b=aq.extend({validate:true,parse:true},b);var d=b.wait;if(p&&!d){if(!this.set(p,b)){return false}}else{if(!this._validate(p,b)){return false}}var j=this;var c=b.success;var g=this.attributes;b.success=function(a){j.attributes=g;var h=b.parse?j.parse(a,b):a;if(d){h=aq.extend({},p,h)}if(h&&!j.set(h,b)){return false}if(c){c.call(b.context,j,a,b)}j.trigger("sync",j,a,b)};ai(this,b);if(p&&d){this.attributes=aq.extend({},g,p)}var k=this.isNew()?"create":b.patch?"patch":"update";if(k==="patch"&&!b.attrs){b.attrs=p}var f=this.sync(k,this,b);this.attributes=g;return f},destroy:function(c){c=c?aq.clone(c):{};var g=this;var f=c.success;var d=c.wait;var h=function(){g.stopListening();g.trigger("destroy",g,g.collection,c)};c.success=function(a){if(d){h()}if(f){f.call(c.context,g,a,c)}if(!g.isNew()){g.trigger("sync",g,a,c)}};var b=false;if(this.isNew()){aq.defer(c.success)}else{ai(this,c);b=this.sync("delete",this,c)}if(!d){h()}return b},url:function(){var a=aq.result(this,"urlRoot")||aq.result(this.collection,"url")||L();if(this.isNew()){return a}var b=this.get(this.idAttribute);return a.replace(/[^\/]$/,"$&/")+encodeURIComponent(b)},parse:function(a,b){return a},clone:function(){return new this.constructor(this.attributes)},isNew:function(){return !this.has(this.idAttribute)},isValid:function(a){return this._validate({},aq.defaults({validate:true},a))},_validate:function(a,c){if(!c.validate||!this.validate){return true}a=aq.extend({},this.attributes,a);var b=this.validationError=this.validate(a,c)||null;if(!b){return true}this.trigger("invalid",this,b,aq.extend(c,{validationError:b}));return false}});var aA={keys:1,values:1,pairs:1,invert:1,pick:0,omit:0,chain:1,isEmpty:1};ak(am,aA,"attributes");var aa=av.Collection=function(a,b){b||(b={});if(b.model){this.model=b.model}if(b.comparator!==void 0){this.comparator=b.comparator}this._reset();this.initialize.apply(this,arguments);if(a){this.reset(a,aq.extend({silent:true},b))}};var ay={add:true,remove:true,merge:true};var ab={add:true,remove:false};aq.extend(aa.prototype,ar,{model:am,initialize:function(){},toJSON:function(a){return this.map(function(b){return b.toJSON(a)})},sync:function(){return av.sync.apply(this,arguments)},add:function(a,b){return this.set(a,aq.extend({merge:false},b,ab))},remove:function(a,d){d=aq.extend({},d);var c=!aq.isArray(a);a=c?[a]:aq.clone(a);var b=this._removeModels(a,d);if(!d.silent&&b){this.trigger("update",this,d)}return c?b[0]:b},set:function(C,aB){aB=aq.defaults({},aB,ay);if(aB.parse&&!this._isModel(C)){C=this.parse(C,aB)}var I=!aq.isArray(C);C=I?C?[C]:[]:C.slice();var H,O,aE,N,S;var q=aB.at;if(q!=null){q=+q}if(q<0){q+=this.length+1}var R=this.comparator&&q==null&&aB.sort!==false;var aD=aq.isString(this.comparator)?this.comparator:null;var U=[],aC=[],k={};var T=aB.add,M=aB.merge,P=aB.remove;var aF=!R&&T&&P?[]:false;var b=false;for(var i=0;i<C.length;i++){aE=C[i];if(N=this.get(aE)){if(P){k[N.cid]=true}if(M&&aE!==N){aE=this._isModel(aE)?aE.attributes:aE;if(aB.parse){aE=N.parse(aE,aB)}N.set(aE,aB);if(R&&!S&&N.hasChanged(aD)){S=true}}C[i]=N}else{if(T){O=C[i]=this._prepareModel(aE,aB);if(!O){continue}U.push(O);this._addReference(O,aB)}}O=N||O;if(!O){continue}H=this.modelId(O.attributes);if(aF&&(O.isNew()||!k[H])){aF.push(O);b=b||!this.models[i]||O.cid!==this.models[i].cid}k[H]=true}if(P){for(var i=0;i<this.length;i++){if(!k[(O=this.models[i]).cid]){aC.push(O)}}if(aC.length){this._removeModels(aC,aB)}}if(U.length||b){if(R){S=true}this.length+=U.length;if(q!=null){for(var i=0;i<U.length;i++){this.models.splice(q+i,0,U[i])}}else{if(aF){this.models.length=0}var j=aF||U;for(var i=0;i<j.length;i++){this.models.push(j[i])}}}if(S){this.sort({silent:true})}if(!aB.silent){var A=q!=null?aq.clone(aB):aB;for(var i=0;i<U.length;i++){if(q!=null){A.index=q+i}(O=U[i]).trigger("add",O,this,A)}if(S||b){this.trigger("sort",this,aB)}if(U.length||aC.length){this.trigger("update",this,aB)}}return I?C[0]:C},reset:function(a,c){c=c?aq.clone(c):{};for(var b=0;b<this.models.length;b++){this._removeReference(this.models[b],c)}c.previousModels=this.models;this._reset();a=this.add(a,aq.extend({silent:true},c));if(!c.silent){this.trigger("reset",this,c)}return a},push:function(a,b){return this.add(a,aq.extend({at:this.length},b))},pop:function(a){var b=this.at(this.length-1);return this.remove(b,a)},unshift:function(a,b){return this.add(a,aq.extend({at:0},b))},shift:function(a){var b=this.at(0);return this.remove(b,a)},slice:function(){return al.apply(this.models,arguments)},get:function(a){if(a==null){return void 0}var b=this.modelId(this._isModel(a)?a.attributes:a);return this._byId[a]||this._byId[b]||this._byId[a.cid]},at:function(a){if(a<0){a+=this.length}return this.models[a]},where:function(a,c){var b=aq.matches(a);return this[c?"find":"filter"](function(d){return b(d.attributes)})},findWhere:function(a){return this.where(a,true)},sort:function(a){if(!this.comparator){throw new Error("Cannot sort a set without a comparator")}a||(a={});if(aq.isString(this.comparator)||this.comparator.length===1){this.models=this.sortBy(this.comparator,this)}else{this.models.sort(aq.bind(this.comparator,this))}if(!a.silent){this.trigger("sort",this,a)}return this},pluck:function(a){return aq.invoke(this.models,"get",a)},fetch:function(a){a=aq.extend({parse:true},a);var c=a.success;var b=this;a.success=function(d){var e=a.reset?"reset":"set";b[e](d,a);if(c){c.call(a.context,b,d,a)}b.trigger("sync",b,d,a)};ai(this,a);return this.sync("read",this,a)},create:function(a,d){d=d?aq.clone(d):{};var c=d.wait;a=this._prepareModel(a,d);if(!a){return false}if(!c){this.add(a,d)}var b=this;var f=d.success;d.success=function(h,j,g){if(c){b.add(h,g)}if(f){f.call(g.context,h,j,g)}};a.save(null,d);return a},parse:function(a,b){return a},clone:function(){return new this.constructor(this.models,{model:this.model,comparator:this.comparator})},modelId:function(a){return a[this.model.prototype.idAttribute||"id"]},_reset:function(){this.length=0;this.models=[];this._byId={}},_prepareModel:function(a,c){if(this._isModel(a)){if(!a.collection){a.collection=this}return a}c=c?aq.clone(c):{};c.collection=this;var b=new this.model(a,c);if(!b.validationError){return b}this.trigger("invalid",this,b.validationError,c);return false},_removeModels:function(b,f){var a=[];for(var d=0;d<b.length;d++){var c=this.get(b[d]);if(!c){continue}var g=this.indexOf(c);this.models.splice(g,1);this.length--;if(!f.silent){f.index=g;c.trigger("remove",c,this,f)}a.push(c);this._removeReference(c,f)}return a.length?a:false},_isModel:function(a){return a instanceof am},_addReference:function(b,c){this._byId[b.cid]=b;var a=this.modelId(b.attributes);if(a!=null){this._byId[a]=b}b.on("all",this._onModelEvent,this)},_removeReference:function(b,c){delete this._byId[b.cid];var a=this.modelId(b.attributes);if(a!=null){delete this._byId[a]}if(this===b.collection){delete b.collection}b.off("all",this._onModelEvent,this)},_onModelEvent:function(b,f,a,d){if((b==="add"||b==="remove")&&a!==this){return}if(b==="destroy"){this.remove(f,d)}if(b==="change"){var c=this.modelId(f.previousAttributes());var g=this.modelId(f.attributes);if(c!==g){if(c!=null){delete this._byId[c]}if(g!=null){this._byId[g]=f}}}this.trigger.apply(this,arguments)}});var ac={forEach:3,each:3,map:3,collect:3,reduce:4,foldl:4,inject:4,reduceRight:4,foldr:4,find:3,detect:3,filter:3,select:3,reject:3,every:3,all:3,some:3,any:3,include:2,contains:2,invoke:0,max:3,min:3,toArray:1,size:1,first:3,head:3,take:3,initial:3,rest:3,tail:3,drop:3,last:3,without:0,difference:0,indexOf:3,shuffle:1,lastIndexOf:3,isEmpty:1,chain:1,sample:3,partition:3};ak(aa,ac,"models");var W=["groupBy","countBy","sortBy","indexBy"];aq.each(W,function(a){if(!aq[a]){return}aa.prototype[a]=function(d,c){var b=aq.isFunction(d)?d:function(e){return e.get(d)};return aq[a](this.models,b,c)}});var ao=av.View=function(a){this.cid=aq.uniqueId("view");aq.extend(this,aq.pick(a,Q));this._ensureElement();this.initialize.apply(this,arguments)};var D=/^(\S+)\s*(.*)$/;var Q=["model","collection","el","id","attributes","className","tagName","events"];aq.extend(ao.prototype,ar,{tagName:"div",$:function(a){return this.$el.find(a)},initialize:function(){},render:function(){return this},remove:function(){this._removeElement();this.stopListening();return this},_removeElement:function(){this.$el.remove()},setElement:function(a){this.undelegateEvents();this._setElement(a);this.delegateEvents();return this},_setElement:function(a){this.$el=a instanceof av.$?a:av.$(a);this.el=this.$el[0]},delegateEvents:function(a){a||(a=aq.result(this,"events"));if(!a){return this}this.undelegateEvents();for(var d in a){var c=a[d];if(!aq.isFunction(c)){c=this[c]}if(!c){continue}var b=d.match(D);this.delegate(b[1],b[2],aq.bind(c,this))}return this},delegate:function(b,c,a){this.$el.on(b+".delegateEvents"+this.cid,c,a);return this},undelegateEvents:function(){if(this.$el){this.$el.off(".delegateEvents"+this.cid)}return this},undelegate:function(b,c,a){this.$el.off(b+".delegateEvents"+this.cid,c,a);return this},_createElement:function(a){return document.createElement(a)},_ensureElement:function(){if(!this.el){var a=aq.extend({},aq.result(this,"attributes"));if(this.id){a.id=aq.result(this,"id")}if(this.className){a["class"]=aq.result(this,"className")}this.setElement(this._createElement(aq.result(this,"tagName")));this._setAttributes(a)}else{this.setElement(aq.result(this,"el"))}},_setAttributes:function(a){this.$el.attr(a)}});av.sync=function(d,g,f){var j=B[d];aq.defaults(f||(f={}),{emulateHTTP:av.emulateHTTP,emulateJSON:av.emulateJSON});var b={type:j,dataType:"json"};if(!f.url){b.url=aq.result(g,"url")||L()}if(f.data==null&&g&&(d==="create"||d==="update"||d==="patch")){b.contentType="application/json";b.data=JSON.stringify(f.attrs||g.toJSON(f))}if(f.emulateJSON){b.contentType="application/x-www-form-urlencoded";b.data=b.data?{model:b.data}:{}}if(f.emulateHTTP&&(j==="PUT"||j==="DELETE"||j==="PATCH")){b.type="POST";if(f.emulateJSON){b.data._method=j}var i=f.beforeSend;f.beforeSend=function(a){a.setRequestHeader("X-HTTP-Method-Override",j);if(i){return i.apply(this,arguments)}}}if(b.type!=="GET"&&!f.emulateJSON){b.processData=false}var e=f.error;f.error=function(h,k,a){f.textStatus=k;f.errorThrown=a;if(e){e.call(f.context,h,k,a)}};var c=f.xhr=av.ajax(aq.extend(b,f));g.trigger("request",g,c,f);return c};var B={create:"POST",update:"PUT",patch:"PATCH","delete":"DELETE",read:"GET"};av.ajax=function(){return av.$.ajax.apply(av.$,arguments)};var G=av.Router=function(a){a||(a={});if(a.routes){this.routes=a.routes}this._bindRoutes();this.initialize.apply(this,arguments)};var V=/\((.*?)\)/g;var Z=/(\(\?)?:\w+/g;var Y=/\*\w+/g;var X=/[\-{}\[\]+?.,\\\^$|#\s]/g;aq.extend(G.prototype,ar,{initialize:function(){},route:function(a,c,b){if(!aq.isRegExp(a)){a=this._routeToRegExp(a)}if(aq.isFunction(c)){b=c;c=""}if(!b){b=this[c]}var d=this;av.history.route(a,function(f){var e=d._extractParameters(a,f);if(d.execute(b,e,c)!==false){d.trigger.apply(d,["route:"+c].concat(e));d.trigger("route",c,e);av.history.trigger("route",d,c,e)}});return this},execute:function(b,c,a){if(b){b.apply(this,c)}},navigate:function(b,a){av.history.navigate(b,a);return this},_bindRoutes:function(){if(!this.routes){return}this.routes=aq.result(this,"routes");var a,b=aq.keys(this.routes);while((a=b.pop())!=null){this.route(a,this.routes[a])}},_routeToRegExp:function(a){a=a.replace(X,"\\$&").replace(V,"(?:$1)?").replace(Z,function(b,c){return c?b:"([^/?]+)"}).replace(Y,"([^?]*?)");return new RegExp("^"+a+"(?:\\?([\\s\\S]*))?$")},_extractParameters:function(a,c){var b=a.exec(c).slice(1);return aq.map(b,function(d,f){if(f===b.length-1){return d||null}return d?decodeURIComponent(d):null})}});var K=av.History=function(){this.handlers=[];aq.bindAll(this,"checkUrl");if(typeof window!=="undefined"){this.location=window.location;this.history=window.history}};var F=/^[#\/]|\s+$/g;var ap=/^\/+|\/+$/g;var J=/#.*$/;K.started=false;aq.extend(K.prototype,ar,{interval:50,atRoot:function(){var a=this.location.pathname.replace(/[^\/]$/,"$&/");return a===this.root&&!this.getSearch()},matchRoot:function(){var a=this.decodeFragment(this.location.pathname);var b=a.slice(0,this.root.length-1)+"/";return b===this.root},decodeFragment:function(a){return decodeURI(a.replace(/%25/g,"%2525"))},getSearch:function(){var a=this.location.href.replace(/#.*/,"").match(/\?.+/);return a?a[0]:""},getHash:function(a){var b=(a||this).location.href.match(/#(.*)$/);return b?b[1]:""},getPath:function(){var a=this.decodeFragment(this.location.pathname+this.getSearch()).slice(this.root.length-1);return a.charAt(0)==="/"?a.slice(1):a},getFragment:function(a){if(a==null){if(this._usePushState||!this._wantsHashChange){a=this.getPath()}else{a=this.getHash()}}return a.replace(F,"")},start:function(a){if(K.started){throw new Error("Backbone.history has already been started")}K.started=true;this.options=aq.extend({root:"/"},this.options,a);this.root=this.options.root;this._wantsHashChange=this.options.hashChange!==false;this._hasHashChange="onhashchange" in window;this._useHashChange=this._wantsHashChange&&this._hasHashChange;this._wantsPushState=!!this.options.pushState;this._hasPushState=!!(this.history&&this.history.pushState);this._usePushState=this._wantsPushState&&this._hasPushState;this.fragment=this.getFragment();this.root=("/"+this.root+"/").replace(ap,"/");if(this._wantsHashChange&&this._wantsPushState){if(!this._hasPushState&&!this.atRoot()){var d=this.root.slice(0,-1)||"/";this.location.replace(d+"#"+this.getPath());return true}else{if(this._hasPushState&&this.atRoot()){this.navigate(this.getHash(),{replace:true})}}}if(!this._hasHashChange&&this._wantsHashChange&&!this._usePushState){this.iframe=document.createElement("iframe");this.iframe.src="javascript:0";this.iframe.style.display="none";this.iframe.tabIndex=-1;var c=document.body;var b=c.insertBefore(this.iframe,c.firstChild).contentWindow;b.document.open();b.document.close();b.location.hash="#"+this.fragment}var f=window.addEventListener||function(g,h){return attachEvent("on"+g,h)};if(this._usePushState){f("popstate",this.checkUrl,false)}else{if(this._useHashChange&&!this.iframe){f("hashchange",this.checkUrl,false)}else{if(this._wantsHashChange){this._checkUrlInterval=setInterval(this.checkUrl,this.interval)}}}if(!this.options.silent){return this.loadUrl()}},stop:function(){var a=window.removeEventListener||function(b,c){return detachEvent("on"+b,c)};if(this._usePushState){a("popstate",this.checkUrl,false)}else{if(this._useHashChange&&!this.iframe){a("hashchange",this.checkUrl,false)}}if(this.iframe){document.body.removeChild(this.iframe);this.iframe=null}if(this._checkUrlInterval){clearInterval(this._checkUrlInterval)}K.started=false},route:function(a,b){this.handlers.unshift({route:a,callback:b})},checkUrl:function(a){var b=this.getFragment();if(b===this.fragment&&this.iframe){b=this.getHash(this.iframe.contentWindow)}if(b===this.fragment){return false}if(this.iframe){this.navigate(b)}this.loadUrl()},loadUrl:function(a){if(!this.matchRoot()){return false}a=this.fragment=this.getFragment(a);return aq.any(this.handlers,function(b){if(b.route.test(a)){b.callback(a);return true}})},navigate:function(b,f){if(!K.started){return false}if(!f||f===true){f={trigger:!!f}}b=this.getFragment(b||"");var a=this.root;if(b===""||b.charAt(0)==="?"){a=a.slice(0,-1)||"/"}var d=a+b;b=this.decodeFragment(b.replace(J,""));if(this.fragment===b){return}this.fragment=b;if(this._usePushState){this.history[f.replace?"replaceState":"pushState"]({},document.title,d)}else{if(this._wantsHashChange){this._updateHash(this.location,b,f.replace);if(this.iframe&&b!==this.getHash(this.iframe.contentWindow)){var c=this.iframe.contentWindow;if(!f.replace){c.document.open();c.document.close()}this._updateHash(c.location,b,f.replace)}}else{return this.location.assign(d)}}if(f.trigger){return this.loadUrl(b)}},_updateHash:function(b,d,a){if(a){var c=b.href.replace(/(javascript:|#).*$/,"");b.replace(c+"#"+d)}else{b.hash="#"+d}}});av.history=new K;var z=function(a,d){var c=this;var b;if(a&&aq.has(a,"constructor")){b=a.constructor}else{b=function(){return c.apply(this,arguments)}}aq.extend(b,c,d);var f=function(){this.constructor=b};f.prototype=c.prototype;b.prototype=new f;if(a){aq.extend(b.prototype,a)}b.__super__=c.prototype;return b};am.extend=aa.extend=G.extend=ao.extend=K.extend=z;var L=function(){throw new Error('A "url" property or function must be specified')};var ai=function(b,c){var a=c.error;c.error=function(d){if(a){a.call(c.context,b,d,c)}b.trigger("error",b,d,c)}};return av});