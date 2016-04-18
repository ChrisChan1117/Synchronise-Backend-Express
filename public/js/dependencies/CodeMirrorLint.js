dependenciesLoader(["CodeMirror"],function(){!function(a){"object"==typeof exports&&"object"==typeof module?a(require("../../lib/codemirror")):"function"==typeof define&&define.amd?define(["../../lib/codemirror"],a):a(CodeMirror)}(function(q){function I(c,f){function d(g){return a.parentNode?(a.style.top=Math.max(0,g.clientY-a.offsetHeight-5)+"px",void (a.style.left=g.clientX+5+"px")):q.off(document,"mousemove",d)}var a=document.createElement("div");return a.className="CodeMirror-lint-tooltip",a.appendChild(f.cloneNode(!0)),document.body.appendChild(a),q.on(document,"mousemove",d),d(c),null!=a.style.opacity&&(a.style.opacity=1),a}function B(a){a.parentNode&&a.parentNode.removeChild(a)}function A(a){a.parentNode&&(null==a.style.opacity&&B(a),a.style.opacity=0,setTimeout(function(){B(a)},600))}function x(h,g,e){function d(){q.off(e,"mouseout",d),c&&(A(c),c=null)}var c=I(h,g),f=setInterval(function(){if(c){for(var a=e;;a=a.parentNode){if(a&&11==a.nodeType&&(a=a.host),a==document.body){return}if(!a){d();break}}}return c?void 0:clearInterval(f)},400);q.on(e,"mouseout",d)}function E(a,c,d){this.marked=[],this.options=c,this.timeout=null,this.hasGutter=d,this.onMouseOver=function(f){G(a,f)},this.waitingFor=0}function L(a,c){return c instanceof Function?{getAnnotations:c}:(c&&c!==!0||(c={}),c)}function D(a){var c=a.state.lint;c.hasGutter&&a.clearGutter(b);for(var d=0;d<c.marked.length;++d){c.marked[d].clear()}c.marked.length=0}function w(g,m,h,f){var d=document.createElement("div"),c=d;return d.className="CodeMirror-lint-marker-"+m,h&&(c=d.appendChild(document.createElement("div")),c.className="CodeMirror-lint-marker-multiple"),0!=f&&q.on(c,"mouseover",function(a){x(a,g,c)}),d}function k(a,c){return"error"==a?a:c}function K(a){for(var d=[],g=0;g<a.length;++g){var f=a[g],c=f.from.line;(d[c]||(d[c]=[])).push(f)}return d}function H(a){var c=a.severity;c||(c="error");var d=document.createElement("div");return d.className="CodeMirror-lint-message-"+c,d.appendChild(document.createTextNode(a.message)),d}function C(g,l,h){function f(){c=-1,g.off("change",f)}var d=g.state.lint,c=++d.waitingFor;g.on("change",f),l(g.getValue(),function(e,a){g.off("change",f),d.waitingFor==c&&(a&&e instanceof q&&(e=a),z(g,e))},h,g)}function J(d){var g=d.state.lint,f=g.options,c=f.options||f,a=f.getAnnotations||d.getHelper(q.Pos(0,0),"lint");a&&(f.async||a.async?C(d,a,c):z(d,a(d.getValue(),c,d)))}function z(Q,M){D(Q);for(var l=Q.state.lint,g=l.options,c=K(M),u=0;u<c.length;++u){var O=c[u];if(O){for(var s=null,N=l.hasGutter&&document.createDocumentFragment(),f=0;f<O.length;++f){var P=O[f],y=P.severity;y||(y="error"),s=k(s,y),g.formatAnnotation&&(P=g.formatAnnotation(P)),l.hasGutter&&N.appendChild(H(P)),P.to&&l.marked.push(Q.markText(P.from,P.to,{className:"CodeMirror-lint-mark-"+y,__annotation:P}))}l.hasGutter&&Q.setGutterMarker(u,b,w(N,s,O.length>1,l.options.tooltips))}}g.onUpdateLinting&&g.onUpdateLinting(M,c,Q)}function j(a){var c=a.state.lint;c&&(clearTimeout(c.timeout),c.timeout=setTimeout(function(){J(a)},c.options.delay||500))}function F(a,c){var d=c.target||c.srcElement;x(c,H(a),d)}function G(u,m){var f=m.target||m.srcElement;if(/\bCodeMirror-lint-mark-/.test(f.className)){for(var d=f.getBoundingClientRect(),c=(d.left+d.right)/2,h=(d.top+d.bottom)/2,p=u.findMarksAt(u.coordsChar({left:c,top:h},"client")),g=0;g<p.length;++g){var v=p[g].__annotation;if(v){return F(v,m)}}}}var b="CodeMirror-lint-markers";q.defineOption("lint",!1,function(g,l,h){if(h&&h!=q.Init&&(D(g),g.state.lint.options.lintOnChange!==!1&&g.off("change",j),q.off(g.getWrapperElement(),"mouseover",g.state.lint.onMouseOver),clearTimeout(g.state.lint.timeout),delete g.state.lint),l){for(var f=g.getOption("gutters"),d=!1,a=0;a<f.length;++a){f[a]==b&&(d=!0)}var i=g.state.lint=new E(g,L(g,l),d);i.options.lintOnChange!==!1&&g.on("change",j),0!=i.options.tooltips&&q.on(g.getWrapperElement(),"mouseover",i.onMouseOver),J(g)}}),q.defineExtension("performLint",function(){this.state.lint&&J(this)})})});