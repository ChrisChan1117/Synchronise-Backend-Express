(function(a){if(typeof define==="function"&&define.amd){define(["jquery","moment"],a)}else{if(typeof exports==="object"){a(require("jquery"),require("moment"))}else{if(!jQuery){throw"bootstrap-datetimepicker requires jQuery to be loaded first"}if(!moment){throw"bootstrap-datetimepicker requires Moment.js to be loaded first"}a(jQuery,moment)}}}(function(b,c){if(!c){throw new Error("bootstrap-datetimepicker requires Moment.js to be loaded first")}var a=function(u,A){var o={},ac=c(),Y=ac.clone(),O=true,j,ad=false,J=false,h,Q=0,w,ag,r,X=[{clsName:"days",navFnc:"M",navStep:1},{clsName:"months",navFnc:"y",navStep:1},{clsName:"years",navFnc:"y",navStep:10}],ae=["days","months","years"],s=["top","bottom","auto"],i=["left","right","auto"],af=["default","top","bottom"],Z=function(ai){if(typeof ai!=="string"||ai.length>1){throw new TypeError("isEnabled expects a single character string parameter")}switch(ai){case"y":return w.indexOf("Y")!==-1;case"M":return w.indexOf("M")!==-1;case"d":return w.toLowerCase().indexOf("d")!==-1;case"h":case"H":return w.toLowerCase().indexOf("h")!==-1;case"m":return w.indexOf("m")!==-1;case"s":return w.indexOf("s")!==-1;default:return false}},D=function(){return(Z("h")||Z("m")||Z("s"))},I=function(){return(Z("y")||Z("M")||Z("d"))},k=function(){var aj=b("<thead>").append(b("<tr>").append(b("<th>").addClass("prev").attr("data-action","previous").append(b("<span>").addClass(A.icons.previous))).append(b("<th>").addClass("picker-switch").attr("data-action","pickerSwitch").attr("colspan",(A.calendarWeeks?"6":"5"))).append(b("<th>").addClass("next").attr("data-action","next").append(b("<span>").addClass(A.icons.next)))),ai=b("<tbody>").append(b("<tr>").append(b("<td>").attr("colspan",(A.calendarWeeks?"8":"7"))));return[b("<div>").addClass("datepicker-days").append(b("<table>").addClass("table-condensed").append(aj).append(b("<tbody>"))),b("<div>").addClass("datepicker-months").append(b("<table>").addClass("table-condensed").append(aj.clone()).append(ai.clone())),b("<div>").addClass("datepicker-years").append(b("<table>").addClass("table-condensed").append(aj.clone()).append(ai.clone()))]},M=function(){var ai=b("<tr>"),aj=b("<tr>"),ak=b("<tr>");if(Z("h")){ai.append(b("<td>").append(b("<a>").attr("href","#").addClass("btn").attr("data-action","incrementHours").append(b("<span>").addClass(A.icons.up))));aj.append(b("<td>").append(b("<span>").addClass("timepicker-hour").attr("data-time-component","hours").attr("data-action","showHours")));ak.append(b("<td>").append(b("<a>").attr("href","#").addClass("btn").attr("data-action","decrementHours").append(b("<span>").addClass(A.icons.down))))}if(Z("m")){if(Z("h")){ai.append(b("<td>").addClass("separator"));aj.append(b("<td>").addClass("separator").html(":"));ak.append(b("<td>").addClass("separator"))}ai.append(b("<td>").append(b("<a>").attr("href","#").addClass("btn").attr("data-action","incrementMinutes").append(b("<span>").addClass(A.icons.up))));aj.append(b("<td>").append(b("<span>").addClass("timepicker-minute").attr("data-time-component","minutes").attr("data-action","showMinutes")));ak.append(b("<td>").append(b("<a>").attr("href","#").addClass("btn").attr("data-action","decrementMinutes").append(b("<span>").addClass(A.icons.down))))}if(Z("s")){if(Z("m")){ai.append(b("<td>").addClass("separator"));aj.append(b("<td>").addClass("separator").html(":"));ak.append(b("<td>").addClass("separator"))}ai.append(b("<td>").append(b("<a>").attr("href","#").addClass("btn").attr("data-action","incrementSeconds").append(b("<span>").addClass(A.icons.up))));aj.append(b("<td>").append(b("<span>").addClass("timepicker-second").attr("data-time-component","seconds").attr("data-action","showSeconds")));ak.append(b("<td>").append(b("<a>").attr("href","#").addClass("btn").attr("data-action","decrementSeconds").append(b("<span>").addClass(A.icons.down))))}if(!h){ai.append(b("<td>").addClass("separator"));aj.append(b("<td>").append(b("<button>").addClass("btn btn-primary").attr("data-action","togglePeriod")));ak.append(b("<td>").addClass("separator"))}return b("<div>").addClass("timepicker-picker").append(b("<table>").addClass("table-condensed").append([ai,aj,ak]))},N=function(){var aj=b("<div>").addClass("timepicker-hours").append(b("<table>").addClass("table-condensed")),ai=b("<div>").addClass("timepicker-minutes").append(b("<table>").addClass("table-condensed")),al=b("<div>").addClass("timepicker-seconds").append(b("<table>").addClass("table-condensed")),ak=[M()];if(Z("h")){ak.push(aj)}if(Z("m")){ak.push(ai)}if(Z("s")){ak.push(al)}return ak},W=function(){var ai=[];if(A.showTodayButton){ai.push(b("<td>").append(b("<a>").attr("data-action","today").append(b("<span>").addClass(A.icons.today))))}if(!A.sideBySide&&I()&&D()){ai.push(b("<td>").append(b("<a>").attr("data-action","togglePicker").append(b("<span>").addClass(A.icons.time))))}if(A.showClear){ai.push(b("<td>").append(b("<a>").attr("data-action","clear").append(b("<span>").addClass(A.icons.clear))))}return b("<table>").addClass("table-condensed").append(b("<tbody>").append(b("<tr>").append(ai)))},ah=function(){var ak=b("<div>").addClass("bootstrap-datetimepicker-widget dropdown-menu"),ai=b("<div>").addClass("datepicker").append(k()),aj=b("<div>").addClass("timepicker").append(N()),am=b("<ul>").addClass("list-unstyled"),al=b("<li>").addClass("picker-switch"+(A.collapse?" accordion-toggle":"")).append(W());if(h){ak.addClass("usetwentyfour")}if(A.sideBySide&&I()&&D()){ak.addClass("timepicker-sbs");ak.append(b("<div>").addClass("row").append(ai.addClass("col-sm-6")).append(aj.addClass("col-sm-6")));ak.append(al);return ak}if(A.toolbarPlacement==="top"){am.append(al)}if(I()){am.append(b("<li>").addClass((A.collapse&&D()?"collapse in":"")).append(ai))}if(A.toolbarPlacement==="default"){am.append(al)}if(D()){am.append(b("<li>").addClass((A.collapse&&I()?"collapse":"")).append(aj))}if(A.toolbarPlacement==="bottom"){am.append(al)}return ak.append(am)},d=function(){var ai=u.data(),aj={};if(ai.dateOptions&&ai.dateOptions instanceof Object){aj=b.extend(true,aj,ai.dateOptions)}b.each(A,function(al){var ak="date"+al.charAt(0).toUpperCase()+al.slice(1);if(ai[ak]!==undefined){aj[al]=ai[ak]}});return aj},m=function(){var al=(ad||u).position(),aj=A.widgetPositioning.vertical,ai=A.widgetPositioning.horizontal,ak;if(A.widgetParent){ak=A.widgetParent.append(J)}else{if(u.is("input")){ak=u.parent().append(J)}else{ak=u;u.children().first().after(J)}}if(aj==="auto"){if((ad||u).offset().top+J.height()>b(window).height()+b(window).scrollTop()&&J.height()+u.outerHeight()<(ad||u).offset().top){aj="top"}else{aj="bottom"}}if(ai==="auto"){if(ak.width()<al.left+J.outerWidth()){ai="right"}else{ai="left"}}if(aj==="top"){J.addClass("top").removeClass("bottom")}else{J.addClass("bottom").removeClass("top")}if(ai==="right"){J.addClass("pull-right")}else{J.removeClass("pull-right")}if(ak.css("position")!=="relative"){ak=ak.parents().filter(function(){return b(this).css("position")==="relative"}).first()}if(ak.length===0){throw new Error("datetimepicker component should be placed within a relative positioned container")}J.css({top:aj==="top"?"auto":al.top+u.outerHeight(),bottom:aj==="top"?al.top+u.outerHeight():"auto",left:ai==="left"?ak.css("padding-left"):"auto",right:ai==="left"?"auto":ak.css("padding-right")})},q=function(ai){if(ai.type==="dp.change"&&((ai.date&&ai.date.isSame(ai.oldDate))||(!ai.date&&!ai.oldDate))){return}u.trigger(ai)},e=function(ai){if(!J){return}if(ai){r=Math.max(Q,Math.min(2,r+ai))}J.find(".datepicker > div").hide().filter(".datepicker-"+X[r].clsName).show()},ab=function(){var aj=b("<tr>"),ai=Y.clone().startOf("w");if(A.calendarWeeks===true){aj.append(b("<th>").addClass("cw").text("#"))}while(ai.isBefore(Y.clone().endOf("w"))){aj.append(b("<th>").addClass("dow").text(ai.format("dd")));ai.add(1,"d")}J.find(".datepicker-days thead").append(aj)},y=function(ai){if(!A.disabledDates){return false}return A.disabledDates[ai.format("YYYY-MM-DD")]===true},L=function(ai){if(!A.enabledDates){return false}return A.enabledDates[ai.format("YYYY-MM-DD")]===true},l=function(ai,aj){if(!ai.isValid()){return false}if(A.disabledDates&&y(ai)){return false}if(A.enabledDates&&L(ai)){return true}if(A.minDate&&ai.isBefore(A.minDate,aj)){return false}if(A.maxDate&&ai.isAfter(A.maxDate,aj)){return false}if(aj==="d"&&A.daysOfWeekDisabled.indexOf(ai.day())!==-1){return false}return true},E=function(){var ai=[],aj=Y.clone().startOf("y").hour(12);while(aj.isSame(Y,"y")){ai.push(b("<span>").attr("data-action","selectMonth").addClass("month").text(aj.format("MMM")));aj.add(1,"M")}J.find(".datepicker-months td").empty().append(ai)},v=function(){var aj=J.find(".datepicker-months"),ak=aj.find("th"),ai=aj.find("tbody").find("span");aj.find(".disabled").removeClass("disabled");if(!l(Y.clone().subtract(1,"y"),"y")){ak.eq(0).addClass("disabled")}ak.eq(1).text(Y.year());if(!l(Y.clone().add(1,"y"),"y")){ak.eq(2).addClass("disabled")}ai.removeClass("active");if(ac.isSame(Y,"y")){ai.eq(ac.month()).addClass("active")}ai.each(function(al){if(!l(Y.clone().month(al),"M")){b(this).addClass("disabled")}})},x=function(){var aj=J.find(".datepicker-years"),al=aj.find("th"),ai=Y.clone().subtract(5,"y"),am=Y.clone().add(6,"y"),ak="";aj.find(".disabled").removeClass("disabled");if(A.minDate&&A.minDate.isAfter(ai,"y")){al.eq(0).addClass("disabled")}al.eq(1).text(ai.year()+"-"+am.year());if(A.maxDate&&A.maxDate.isBefore(am,"y")){al.eq(2).addClass("disabled")}while(!ai.isAfter(am,"y")){ak+='<span data-action="selectYear" class="year'+(ai.isSame(ac,"y")?" active":"")+(!l(ai,"y")?" disabled":"")+'">'+ai.year()+"</span>";ai.add(1,"y")}aj.find("td").html(ak)},p=function(){var aj=J.find(".datepicker-days"),an=aj.find("th"),ai,ak=[],am,al;if(!I()){return}aj.find(".disabled").removeClass("disabled");an.eq(1).text(Y.format(A.dayViewHeaderFormat));if(!l(Y.clone().subtract(1,"M"),"M")){an.eq(0).addClass("disabled")}if(!l(Y.clone().add(1,"M"),"M")){an.eq(2).addClass("disabled")}ai=Y.clone().startOf("M").startOf("week");while(!Y.clone().endOf("M").endOf("w").isBefore(ai,"d")){if(ai.weekday()===0){am=b("<tr>");if(A.calendarWeeks){am.append('<td class="cw">'+ai.week()+"</td>")}ak.push(am)}al="";if(ai.isBefore(Y,"M")){al+=" old"}if(ai.isAfter(Y,"M")){al+=" new"}if(ai.isSame(ac,"d")&&!O){al+=" active"}if(!l(ai,"d")){al+=" disabled"}if(ai.isSame(c(),"d")){al+=" today"}if(ai.day()===0||ai.day()===6){al+=" weekend"}am.append('<td data-action="selectDay" class="day'+al+'">'+ai.date()+"</td>");ai.add(1,"d")}aj.find("tbody").empty().append(ak);v();x()},G=function(){var aj=J.find(".timepicker-hours table"),al=Y.clone().startOf("d"),ai=[],ak=b("<tr>");if(Y.hour()>11&&!h){al.hour(12)}while(al.isSame(Y,"d")&&(h||(Y.hour()<12&&al.hour()<12)||Y.hour()>11)){if(al.hour()%4===0){ak=b("<tr>");ai.push(ak)}ak.append('<td data-action="selectHour" class="hour'+(!l(al,"h")?" disabled":"")+'">'+al.format(h?"HH":"hh")+"</td>");al.add(1,"h")}aj.empty().append(ai)},C=function(){var ak=J.find(".timepicker-minutes table"),al=Y.clone().startOf("h"),ai=[],am=b("<tr>"),aj=A.stepping===1?5:A.stepping;while(Y.isSame(al,"h")){if(al.minute()%(aj*4)===0){am=b("<tr>");ai.push(am)}am.append('<td data-action="selectMinute" class="minute'+(!l(al,"m")?" disabled":"")+'">'+al.format("mm")+"</td>");al.add(aj,"m")}ak.empty().append(ai)},g=function(){var ak=J.find(".timepicker-seconds table"),ai=Y.clone().startOf("m"),aj=[],al=b("<tr>");while(Y.isSame(ai,"m")){if(ai.second()%20===0){al=b("<tr>");aj.push(al)}al.append('<td data-action="selectSecond" class="second'+(!l(ai,"s")?" disabled":"")+'">'+ai.format("ss")+"</td>");ai.add(5,"s")}ak.empty().append(aj)},n=function(){var ai=J.find(".timepicker span[data-time-component]");if(!h){J.find(".timepicker [data-action=togglePeriod]").text(ac.format("A"))}ai.filter("[data-time-component=hours]").text(ac.format(h?"HH":"hh"));ai.filter("[data-time-component=minutes]").text(ac.format("mm"));ai.filter("[data-time-component=seconds]").text(ac.format("ss"));G();C();g()},K=function(){if(!J){return}p();n()},P=function(aj){var ai=O?null:ac;if(!aj){O=true;j.val("");u.data("date","");q({type:"dp.change",date:null,oldDate:ai});K();return}aj=aj.clone().locale(A.locale);if(A.stepping!==1){aj.minutes((Math.round(aj.minutes()/A.stepping)*A.stepping)%60).seconds(0)}if(l(aj)){ac=aj;Y=ac.clone();j.val(ac.format(w));u.data("date",ac.format(w));K();O=false;q({type:"dp.change",date:ac.clone(),oldDate:ai})}else{j.val(O?"":ac.format(w));q({type:"dp.error",date:aj})}},aa=function(){var ai=false;if(!J){return o}J.find(".collapse").each(function(){var aj=b(this).data("collapse");if(aj&&aj.transitioning){ai=true;return false}});if(ai){return o}if(ad&&ad.hasClass("btn")){ad.toggleClass("active")}J.hide();b(window).off("resize",m);J.off("click","[data-action]");J.off("mousedown",false);J.remove();J=false;q({type:"dp.hide",date:ac.clone()});return o},V={next:function(){Y.add(X[r].navStep,X[r].navFnc);p()},previous:function(){Y.subtract(X[r].navStep,X[r].navFnc);p()},pickerSwitch:function(){e(1)},selectMonth:function(aj){var ai=b(aj.target).closest("tbody").find("span").index(b(aj.target));Y.month(ai);if(r===Q){P(ac.clone().year(Y.year()).month(Y.month()));aa()}e(-1);p()},selectYear:function(aj){var ai=parseInt(b(aj.target).text(),10)||0;Y.year(ai);if(r===Q){P(ac.clone().year(Y.year()));aa()}e(-1);p()},selectDay:function(aj){var ai=Y.clone();if(b(aj.target).is(".old")){ai.subtract(1,"M")}if(b(aj.target).is(".new")){ai.add(1,"M")}P(ai.date(parseInt(b(aj.target).text(),10)));if(!D()&&!A.keepOpen){aa()}},incrementHours:function(){P(ac.clone().add(1,"h"))},incrementMinutes:function(){P(ac.clone().add(A.stepping,"m"))},incrementSeconds:function(){P(ac.clone().add(1,"s"))},decrementHours:function(){P(ac.clone().subtract(1,"h"))},decrementMinutes:function(){P(ac.clone().subtract(A.stepping,"m"))},decrementSeconds:function(){P(ac.clone().subtract(1,"s"))},togglePeriod:function(){P(ac.clone().add((ac.hours()>=12)?-12:12,"h"))},togglePicker:function(an){var am=b(an.target),al=am.closest("ul"),aj=al.find(".in"),ai=al.find(".collapse:not(.in)"),ak;if(aj&&aj.length){ak=aj.data("collapse");if(ak&&ak.transitioning){return}aj.collapse("hide");ai.collapse("show");if(am.is("span")){am.toggleClass(A.icons.time+" "+A.icons.date)}else{am.find("span").toggleClass(A.icons.time+" "+A.icons.date)}}},showPicker:function(){J.find(".timepicker > div:not(.timepicker-picker)").hide();J.find(".timepicker .timepicker-picker").show()},showHours:function(){J.find(".timepicker .timepicker-picker").hide();J.find(".timepicker .timepicker-hours").show()},showMinutes:function(){J.find(".timepicker .timepicker-picker").hide();J.find(".timepicker .timepicker-minutes").show()},showSeconds:function(){J.find(".timepicker .timepicker-picker").hide();J.find(".timepicker .timepicker-seconds").show()},selectHour:function(aj){var ai=parseInt(b(aj.target).text(),10);if(!h){if(ac.hours()>=12){if(ai!==12){ai+=12}}else{if(ai===12){ai=0}}}P(ac.clone().hours(ai));V.showPicker.call(o)},selectMinute:function(ai){P(ac.clone().minutes(parseInt(b(ai.target).text(),10)));V.showPicker.call(o)},selectSecond:function(ai){P(ac.clone().seconds(parseInt(b(ai.target).text(),10)));V.showPicker.call(o)},clear:function(){P(null)},today:function(){P(c())}},H=function(ai){if(b(ai.currentTarget).is(".disabled")){return false}V[b(ai.currentTarget).data("action")].apply(o,arguments);return false},S=function(){var ai,aj={year:function(ak){return ak.month(0).date(1).hours(0).seconds(0).minutes(0)},month:function(ak){return ak.date(1).hours(0).seconds(0).minutes(0)},day:function(ak){return ak.hours(0).seconds(0).minutes(0)},hour:function(ak){return ak.seconds(0).minutes(0)},minute:function(ak){return ak.seconds(0)}};if(j.prop("disabled")||j.prop("readonly")||J){return o}if(A.useCurrent&&O){ai=c();if(typeof A.useCurrent==="string"){ai=aj[A.useCurrent](ai)}P(ai)}J=ah();ab();E();J.find(".timepicker-hours").hide();J.find(".timepicker-minutes").hide();J.find(".timepicker-seconds").hide();K();e();b(window).on("resize",m);J.on("click","[data-action]",H);J.on("mousedown",false);if(ad&&ad.hasClass("btn")){ad.toggleClass("active")}J.show();m();if(!j.is(":focus")){j.focus()}q({type:"dp.show"});return o},B=function(){return(J?aa():S())},R=function(ai){if(c.isMoment(ai)||ai instanceof Date){ai=c(ai)}else{ai=c(ai,ag,A.useStrict)}ai.locale(A.locale);return ai},z=function(ai){if(ai.keyCode===27){aa()}},f=function(aj){var ak=b(aj.target).val().trim(),ai=ak?R(ak):null;P(ai);aj.stopImmediatePropagation();return false},t=function(){j.on({change:f,blur:aa,keydown:z});if(u.is("input")){j.on({focus:S})}else{if(ad){ad.on("click",B);ad.on("mousedown",false)}}},F=function(){j.off({change:f,blur:aa,keydown:z});if(u.is("input")){j.off({focus:S})}else{if(ad){ad.off("click",B);ad.off("mousedown",false)}}},T=function(ai){var aj={};b.each(ai,function(){var ak=R(this);if(ak.isValid()){aj[ak.format("YYYY-MM-DD")]=true}});return(Object.keys(aj).length)?aj:false},U=function(){var ai=A.format||"L LT";w=ai.replace(/(\[[^\[]*\])|(\\)?(LTS|LT|LL?L?L?|l{1,4})/g,function(aj){return ac.localeData().longDateFormat(aj)||aj});ag=A.extraFormats?A.extraFormats.slice():[];if(ag.indexOf(ai)<0&&ag.indexOf(w)<0){ag.push(w)}h=(w.toLowerCase().indexOf("a")<1&&w.indexOf("h")<1);if(Z("y")){Q=2}if(Z("M")){Q=1}if(Z("d")){Q=0}r=Math.max(Q,r);if(!O){P(ac)}};o.destroy=function(){aa();F();u.removeData("DateTimePicker");u.removeData("date")};o.toggle=B;o.show=S;o.hide=aa;o.disable=function(){aa();if(ad&&ad.hasClass("btn")){ad.addClass("disabled")}j.prop("disabled",true);return o};o.enable=function(){if(ad&&ad.hasClass("btn")){ad.removeClass("disabled")}j.prop("disabled",false);return o};o.options=function(ai){if(arguments.length===0){return b.extend(true,{},A)}if(!(ai instanceof Object)){throw new TypeError("options() options parameter should be an object")}b.extend(true,A,ai);b.each(A,function(aj,ak){if(o[aj]!==undefined){o[aj](ak)}else{throw new TypeError("option "+aj+" is not recognized!")}});return o};o.date=function(ai){if(arguments.length===0){if(O){return null}return ac.clone()}if(ai!==null&&typeof ai!=="string"&&!c.isMoment(ai)&&!(ai instanceof Date)){throw new TypeError("date() parameter must be one of [null, string, moment or Date]")}P(ai===null?null:R(ai));return o};o.format=function(ai){if(arguments.length===0){return A.format}if((typeof ai!=="string")&&((typeof ai!=="boolean")||(ai!==false))){throw new TypeError("format() expects a sting or boolean:false parameter "+ai)}A.format=ai;if(w){U()}return o};o.dayViewHeaderFormat=function(ai){if(arguments.length===0){return A.dayViewHeaderFormat}if(typeof ai!=="string"){throw new TypeError("dayViewHeaderFormat() expects a string parameter")}A.dayViewHeaderFormat=ai;return o};o.extraFormats=function(ai){if(arguments.length===0){return A.extraFormats}if(ai!==false&&!(ai instanceof Array)){throw new TypeError("extraFormats() expects an array or false parameter")}A.extraFormats=ai;if(ag){U()}return o};o.disabledDates=function(ai){if(arguments.length===0){return(A.disabledDates?b.extend({},A.disabledDates):A.disabledDates)}if(!ai){A.disabledDates=false;K();return o}if(!(ai instanceof Array)){throw new TypeError("disabledDates() expects an array parameter")}A.disabledDates=T(ai);A.enabledDates=false;K();return o};o.enabledDates=function(ai){if(arguments.length===0){return(A.enabledDates?b.extend({},A.enabledDates):A.enabledDates)}if(!ai){A.enabledDates=false;K();return o}if(!(ai instanceof Array)){throw new TypeError("enabledDates() expects an array parameter")}A.enabledDates=T(ai);A.disabledDates=false;K();return o};o.daysOfWeekDisabled=function(ai){if(arguments.length===0){return A.daysOfWeekDisabled.splice(0)}if(!(ai instanceof Array)){throw new TypeError("daysOfWeekDisabled() expects an array parameter")}A.daysOfWeekDisabled=ai.reduce(function(aj,ak){ak=parseInt(ak,10);if(ak>6||ak<0||isNaN(ak)){return aj}if(aj.indexOf(ak)===-1){aj.push(ak)}return aj},[]).sort();K();return o};o.maxDate=function(ai){if(arguments.length===0){return A.maxDate?A.maxDate.clone():A.maxDate}if((typeof ai==="boolean")&&ai===false){A.maxDate=false;K();return o}var aj=R(ai);if(!aj.isValid()){throw new TypeError("maxDate() Could not parse date parameter: "+ai)}if(A.minDate&&aj.isBefore(A.minDate)){throw new TypeError("maxDate() date parameter is before options.minDate: "+aj.format(w))}A.maxDate=aj;if(A.maxDate.isBefore(ai)){P(A.maxDate)}K();return o};o.minDate=function(ai){if(arguments.length===0){return A.minDate?A.minDate.clone():A.minDate}if((typeof ai==="boolean")&&ai===false){A.minDate=false;K();return o}var aj=R(ai);if(!aj.isValid()){throw new TypeError("minDate() Could not parse date parameter: "+ai)}if(A.maxDate&&aj.isAfter(A.maxDate)){throw new TypeError("minDate() date parameter is after options.maxDate: "+aj.format(w))}A.minDate=aj;if(A.minDate.isAfter(ai)){P(A.minDate)}K();return o};o.defaultDate=function(aj){if(arguments.length===0){return A.defaultDate?A.defaultDate.clone():A.defaultDate}if(!aj){A.defaultDate=false;return o}var ai=R(aj);if(!ai.isValid()){throw new TypeError("defaultDate() Could not parse date parameter: "+aj)}if(!l(ai)){throw new TypeError("defaultDate() date passed is invalid according to component setup validations")}A.defaultDate=ai;if(A.defaultDate&&j.val().trim()===""){P(A.defaultDate)}return o};o.locale=function(ai){if(arguments.length===0){return A.locale}if(!c.localeData(ai)){throw new TypeError("locale() locale "+ai+" is not loaded from moment locales!")}A.locale=ai;ac.locale(A.locale);Y.locale(A.locale);if(w){U()}if(J){aa();S()}return o};o.stepping=function(ai){if(arguments.length===0){return A.stepping}ai=parseInt(ai,10);if(isNaN(ai)||ai<1){ai=1}A.stepping=ai;return o};o.useCurrent=function(ai){var aj=["year","month","day","hour","minute"];if(arguments.length===0){return A.useCurrent}if((typeof ai!=="boolean")&&(typeof ai!=="string")){throw new TypeError("useCurrent() expects a boolean or string parameter")}if(typeof ai==="string"&&aj.indexOf(ai.toLowerCase())===-1){throw new TypeError("useCurrent() expects a string parameter of "+aj.join(", "))}A.useCurrent=ai;return o};o.collapse=function(ai){if(arguments.length===0){return A.collapse}if(typeof ai!=="boolean"){throw new TypeError("collapse() expects a boolean parameter")}if(A.collapse===ai){return o}A.collapse=ai;if(J){aa();S()}return o};o.icons=function(ai){if(arguments.length===0){return b.extend({},A.icons)}if(!(ai instanceof Object)){throw new TypeError("icons() expects parameter to be an Object")}b.extend(A.icons,ai);if(J){aa();S()}return o};o.useStrict=function(ai){if(arguments.length===0){return A.useStrict}if(typeof ai!=="boolean"){throw new TypeError("useStrict() expects a boolean parameter")}A.useStrict=ai;return o};o.sideBySide=function(ai){if(arguments.length===0){return A.sideBySide}if(typeof ai!=="boolean"){throw new TypeError("sideBySide() expects a boolean parameter")}A.sideBySide=ai;if(J){aa();S()}return o};o.viewMode=function(ai){if(arguments.length===0){return A.viewMode}if(typeof ai!=="string"){throw new TypeError("viewMode() expects a string parameter")}if(ae.indexOf(ai)===-1){throw new TypeError("viewMode() parameter must be one of ("+ae.join(", ")+") value")}A.viewMode=ai;r=Math.max(ae.indexOf(ai),Q);e();return o};o.toolbarPlacement=function(ai){if(arguments.length===0){return A.toolbarPlacement}if(typeof ai!=="string"){throw new TypeError("toolbarPlacement() expects a string parameter")}if(af.indexOf(ai)===-1){throw new TypeError("toolbarPlacement() parameter must be one of ("+af.join(", ")+") value")}A.toolbarPlacement=ai;if(J){aa();S()}return o};o.widgetPositioning=function(ai){if(arguments.length===0){return b.extend({},A.widgetPositioning)}if(({}).toString.call(ai)!=="[object Object]"){throw new TypeError("widgetPositioning() expects an object variable")}if(ai.horizontal){if(typeof ai.horizontal!=="string"){throw new TypeError("widgetPositioning() horizontal variable must be a string")}ai.horizontal=ai.horizontal.toLowerCase();if(i.indexOf(ai.horizontal)===-1){throw new TypeError("widgetPositioning() expects horizontal parameter to be one of ("+i.join(", ")+")")}A.widgetPositioning.horizontal=ai.horizontal}if(ai.vertical){if(typeof ai.vertical!=="string"){throw new TypeError("widgetPositioning() vertical variable must be a string")}ai.vertical=ai.vertical.toLowerCase();if(s.indexOf(ai.vertical)===-1){throw new TypeError("widgetPositioning() expects vertical parameter to be one of ("+s.join(", ")+")")}A.widgetPositioning.vertical=ai.vertical}K();return o};o.calendarWeeks=function(ai){if(arguments.length===0){return A.calendarWeeks}if(typeof ai!=="boolean"){throw new TypeError("calendarWeeks() expects parameter to be a boolean value")}A.calendarWeeks=ai;K();return o};o.showTodayButton=function(ai){if(arguments.length===0){return A.showTodayButton}if(typeof ai!=="boolean"){throw new TypeError("showTodayButton() expects a boolean parameter")}A.showTodayButton=ai;if(J){aa();S()}return o};o.showClear=function(ai){if(arguments.length===0){return A.showClear}if(typeof ai!=="boolean"){throw new TypeError("showClear() expects a boolean parameter")}A.showClear=ai;if(J){aa();S()}return o};o.widgetParent=function(ai){if(arguments.length===0){return A.widgetParent}if(typeof ai==="string"){ai=b(ai)}if(ai!==null&&(typeof ai!=="string"&&!(ai instanceof jQuery))){throw new TypeError("widgetParent() expects a string or a jQuery object parameter")}A.widgetParent=ai;if(J){aa();S()}return o};o.keepOpen=function(ai){if(arguments.length===0){return A.format}if(typeof ai!=="boolean"){throw new TypeError("keepOpen() expects a boolean parameter")}A.keepOpen=ai;return o};if(u.is("input")){j=u}else{j=u.find(".datepickerinput");if(j.size()===0){j=u.find("input")}else{if(!j.is("input")){throw new Error('CSS class "datepickerinput" cannot be applied to non input element')}}}if(u.hasClass("input-group")){if(u.find(".datepickerbutton").size()===0){ad=u.find('[class^="input-group-"]')}else{ad=u.find(".datepickerbutton")}}if(!j.is("input")){throw new Error("Could not initialize DateTimePicker without an input element")}b.extend(true,A,d());o.options(A);U();t();if(j.prop("disabled")){o.disable()}if(j.val().trim().length!==0){P(R(j.val().trim()))}else{if(A.defaultDate){P(A.defaultDate)}}return o};b.fn.datetimepicker=function(d){return this.each(function(){var e=b(this);if(!e.data("DateTimePicker")){d=b.extend(true,{},b.fn.datetimepicker.defaults,d);e.data("DateTimePicker",a(e,d))}})};b.fn.datetimepicker.defaults={format:false,dayViewHeaderFormat:"MMMM YYYY",extraFormats:false,stepping:1,minDate:false,maxDate:false,useCurrent:true,collapse:true,locale:c.locale(),defaultDate:false,disabledDates:false,enabledDates:false,icons:{time:"glyphicon glyphicon-time",date:"glyphicon glyphicon-calendar",up:"glyphicon glyphicon-chevron-up",down:"glyphicon glyphicon-chevron-down",previous:"glyphicon glyphicon-chevron-left",next:"glyphicon glyphicon-chevron-right",today:"glyphicon glyphicon-screenshot",clear:"glyphicon glyphicon-trash"},useStrict:false,sideBySide:false,daysOfWeekDisabled:[],calendarWeeks:false,viewMode:"days",toolbarPlacement:"default",showTodayButton:false,showClear:false,widgetPositioning:{horizontal:"auto",vertical:"auto"},widgetParent:null,keepOpen:false}}));