!function n(c,f,g){function b(h,j){if(!f[h]){if(!c[h]){var k="function"==typeof require&&require;if(!j&&k){return k(h,!0)}if(d){return d(h,!0)}var i=new Error("Cannot find module '"+h+"'");throw i.code="MODULE_NOT_FOUND",i}var e=f[h]={exports:{}};c[h][0].call(e.exports,function(m){var l=c[h][1][m];return b(l?l:m)},e,e.exports,n,c,f,g)}return f[h].exports}for(var d="function"==typeof require&&require,a=0;a<g.length;a++){b(g[a])}return b}({1:[function(d,a){function b(){}var c=a.exports={};c.nextTick=function(){var h="undefined"!=typeof window&&window.setImmediate,f="undefined"!=typeof window&&window.postMessage&&window.addEventListener;if(h){return function(e){return window.setImmediate(e)}}if(f){var g=[];return window.addEventListener("message",function(j){var e=j.source;if((e===window||null===e)&&"process-tick"===j.data&&(j.stopPropagation(),g.length>0)){var i=g.shift();i()}},!0),function(e){g.push(e),window.postMessage("process-tick","*")}}return function(e){setTimeout(e,0)}}(),c.title="browser",c.browser=!0,c.env={},c.argv=[],c.on=b,c.addListener=b,c.once=b,c.off=b,c.removeListener=b,c.removeAllListeners=b,c.emit=b,c.binding=function(){throw new Error("process.binding is not supported")},c.cwd=function(){return"/"},c.chdir=function(){throw new Error("process.chdir is not supported")}},{}],2:[function(g,b){function d(h){function q(e){return null===m?void o.push(e):void c(function(){var l=m?e.onFulfilled:e.onRejected;if(null===l){return void (m?e.resolve:e.reject)(r)}var s;try{s=l(r)}catch(u){return void e.reject(u)}e.resolve(s)})}function k(s){try{if(s===i){throw new TypeError("A promise cannot be resolved with itself.")}if(s&&("object"==typeof s||"function"==typeof s)){var e=s.then;if("function"==typeof e){return void a(e.bind(s),k,p)}}m=!0,r=s,j()}catch(l){p(l)}}function p(e){m=!1,r=e,j()}function j(){for(var s=0,l=o.length;l>s;s++){q(o[s])}o=null}if("object"!=typeof this){throw new TypeError("Promises must be constructed via new")}if("function"!=typeof h){throw new TypeError("not a function")}var m=null,r=null,o=[],i=this;this.then=function(s,l){return new i.constructor(function(e,t){q(new f(s,l,e,t))})},a(h,k,p)}function f(k,h,i,j){this.onFulfilled="function"==typeof k?k:null,this.onRejected="function"==typeof h?h:null,this.resolve=i,this.reject=j}function a(m,j,k){var l=!1;try{m(function(e){l||(l=!0,j(e))},function(e){l||(l=!0,k(e))})}catch(h){if(l){return}l=!0,k(h)}}var c=g("asap");b.exports=d},{asap:4}],3:[function(g,q){function k(a){this.then=function(c){return"function"!=typeof c?this:new d(function(f,i){h(function(){try{f(c(a))}catch(e){i(e)}})})}}var d=g("./core.js"),h=g("asap");q.exports=d,k.prototype=d.prototype;var b=new k(!0),p=new k(!1),j=new k(null),l=new k(void 0),v=new k(0),m=new k("");d.resolve=function(e){if(e instanceof d){return e}if(null===e){return j}if(void 0===e){return l}if(e===!0){return b}if(e===!1){return p}if(0===e){return v}if(""===e){return m}if("object"==typeof e||"function"==typeof e){try{var c=e.then;if("function"==typeof c){return new d(c.bind(e))}}catch(a){return new d(function(i,f){f(a)})}}return new k(e)},d.all=function(c){var a=Array.prototype.slice.call(c);return new d(function(w,t){function u(i,e){try{if(e&&("object"==typeof e||"function"==typeof e)){var o=e.then;if("function"==typeof o){return void o.call(e,function(r){u(i,r)},t)}}a[i]=e,0===--f&&w(a)}catch(x){t(x)}}if(0===a.length){return w([])}for(var f=a.length,s=0;s<a.length;s++){u(s,a[s])}})},d.reject=function(a){return new d(function(c,f){f(a)})},d.race=function(a){return new d(function(c,f){a.forEach(function(e){d.resolve(e).then(c,f)})})},d.prototype["catch"]=function(a){return this.then(null,a)}},{"./core.js":2,asap:4}],4:[function(b,a){(function(h){function l(){for(;j.next;){j=j.next;var f=j.task;j.task=void 0;var c=j.domain;c&&(j.domain=void 0,c.enter());try{f()}catch(e){if(m){throw c&&c.exit(),setTimeout(l,0),c&&c.enter(),e}setTimeout(function(){throw e},0)}c&&c.exit()}p=!1}function g(c){d=d.next={task:c,domain:m&&h.domain,next:null},p||(p=!0,k())}var j={task:void 0,next:null},d=j,p=!1,k=void 0,m=!1;if("undefined"!=typeof h&&h.nextTick){m=!0,k=function(){h.nextTick(l)}}else{if("function"==typeof setImmediate){k="undefined"!=typeof window?setImmediate.bind(window,l):function(){setImmediate(l)}}else{if("undefined"!=typeof MessageChannel){var q=new MessageChannel;q.port1.onmessage=l,k=function(){q.port2.postMessage(0)}}else{k=function(){setTimeout(l,0)}}}}a.exports=g}).call(this,b("_process"))},{_process:1}],5:[function(){"function"!=typeof Promise.prototype.done&&(Promise.prototype.done=function(){var a=arguments.length?this.then.apply(this,arguments):this;a.then(null,function(b){setTimeout(function(){throw b},0)})})},{}],6:[function(a){a("asap");"undefined"==typeof Promise&&(Promise=a("./lib/core.js"),a("./lib/es6-extensions.js")),a("./polyfill-done.js")},{"./lib/core.js":2,"./lib/es6-extensions.js":3,"./polyfill-done.js":5,asap:4}]},{},[6]);