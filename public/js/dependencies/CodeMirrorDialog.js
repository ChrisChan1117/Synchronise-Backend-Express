dependenciesLoader(["CodeMirror"],function(){!function(a){"object"==typeof exports&&"object"==typeof module?a(require("../../lib/codemirror")):"function"==typeof define&&define.amd?define(["../../lib/codemirror"],a):a(CodeMirror)}(function(a){function b(g,h,j){var f,d=g.getWrapperElement();return f=d.appendChild(document.createElement("div")),j?f.className="CodeMirror-dialog CodeMirror-dialog-bottom":f.className="CodeMirror-dialog CodeMirror-dialog-top","string"==typeof h?f.innerHTML=h:f.appendChild(h),f}function c(d,f){d.state.currentNotificationClose&&d.state.currentNotificationClose(),d.state.currentNotificationClose=f}a.defineExtension("openDialog",function(n,g,d){function m(f){if("string"==typeof f){o.value=f}else{if(h){return}h=!0,j.parentNode.removeChild(j),k.focus(),d.onClose&&d.onClose(j)}}d||(d={}),c(this,null);var e,j=b(this,n,d.bottom),h=!1,k=this,o=j.getElementsByTagName("input")[0];return o?(d.value&&(o.value=d.value,d.selectValueOnOpen!==!1&&o.select()),d.onInput&&a.on(o,"input",function(f){d.onInput(f,o.value,m)}),d.onKeyUp&&a.on(o,"keyup",function(f){d.onKeyUp(f,o.value,m)}),a.on(o,"keydown",function(f){d&&d.onKeyDown&&d.onKeyDown(f,o.value,m)||((27==f.keyCode||d.closeOnEnter!==!1&&13==f.keyCode)&&(o.blur(),a.e_stop(f),m()),13==f.keyCode&&g(o.value,f))}),d.closeOnBlur!==!1&&a.on(o,"blur",m),o.focus()):(e=j.getElementsByTagName("button")[0])&&(a.on(e,"click",function(){m(),k.focus()}),d.closeOnBlur!==!1&&a.on(e,"blur",m),e.focus()),m}),a.defineExtension("openConfirm",function(v,j,e){function q(){k||(k=!0,h.parentNode.removeChild(h),o.focus())}c(this,null);var h=b(this,v,e&&e.bottom),n=h.getElementsByTagName("button"),k=!1,o=this,w=1;n[0].focus();for(var m=0;m<n.length;++m){var g=n[m];!function(d){a.on(g,"click",function(f){a.e_preventDefault(f),q(),d&&d(o)})}(j[m]),a.on(g,"blur",function(){--w,setTimeout(function(){0>=w&&q()},200)}),a.on(g,"focus",function(){++w})}}),a.defineExtension("openNotification",function(h,g){function j(){m||(m=!0,clearTimeout(e),d.parentNode.removeChild(d))}c(this,j);var e,d=b(this,h,g&&g.bottom),m=!1,k=g&&"undefined"!=typeof g.duration?g.duration:5000;return a.on(d,"click",function(f){a.e_preventDefault(f),j()}),k&&(e=setTimeout(j,k)),j})})});