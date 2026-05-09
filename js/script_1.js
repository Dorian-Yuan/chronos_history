(function(){
var S="chronos",Q=[],T=null,N=0,M=50,D={},P="",RE="/api/apps/"+S+"/error-report";
function h(c){return c?String(c).slice(0,200):""}
function k(m,s){var key=h(m)+"|"+h(s);if(D[key])return true;D[key]=1;setTimeout(function(){delete D[key]},5000);return false}
function send(){if(!Q.length)return;var b=Q.splice(0,10);try{var x=new XMLHttpRequest();x.open("POST",RE);x.setRequestHeader("Content-Type","application/json");x.send(JSON.stringify({errors:b}))}catch(e){}}
function q(e){if(N>=M)return;if(k(e.message,e.source))return;N++;if(P)e.aiProvider=P;Q.push(e);clearTimeout(T);T=setTimeout(send,2000)}
window.onerror=function(msg,src,line,col,err){
if(!msg)return;
if(typeof msg==="string"&&(msg==="Script error."||msg==="Script error"))return;
if(typeof msg==="string"&&msg.indexOf("ResizeObserver")!==-1)return;
q({message:h(msg),source:h(src),line:line||0,col:col||0,stack:err?h(err.stack):""});
};
window.addEventListener("unhandledrejection",function(ev){
var r=ev.reason;if(!r)return;
var m=typeof r==="string"?r:(r.message||"Unhandled rejection");
if(m.indexOf("ResizeObserver")!==-1)return;
q({message:h(m),source:"unhandledrejection",line:0,col:0,stack:r&&r.stack?h(r.stack):""});
});
window.addEventListener("error",function(ev){
if(!ev.target||!ev.target.tagName)return;
var t=ev.target.tagName;
if(t!=="SCRIPT"&&t!=="LINK"&&t!=="IMG"&&t!=="VIDEO"&&t!=="AUDIO"&&t!=="SOURCE")return;
var src=ev.target.src||ev.target.href||"";
if(!src)return;
q({message:"Resource load failed: "+h(src),source:"resource",line:0,col:0,stack:""});
},true);
var _fetch=window.fetch;if(_fetch){
window.fetch=function(){var a=arguments;
return _fetch.apply(this,a).then(function(r){
var ru=typeof a[0]==="string"?a[0]:(a[0]&&a[0].url?a[0].url:"");if(ru.indexOf("/api/ai/")!==-1){var p=r.headers.get("X-AI-Provider");if(p)P=p;}
if(!r.ok&&r.status>=400){q({message:"Fetch "+r.status+": "+h(r.url),source:"fetch",line:0,col:0,stack:""})}
return r;
},function(e){
var url="";try{url=typeof a[0]==="string"?a[0]:(a[0]&&a[0].url?a[0].url:"")}catch(x){}
q({message:"Fetch failed: "+h(e&&e.message||e)+(url?" "+h(url):""),source:"fetch",line:0,col:0,stack:e&&e.stack?h(e.stack):""});
throw e;
});
};}
var _xo=XMLHttpRequest.prototype.open,_xs=XMLHttpRequest.prototype.send;
XMLHttpRequest.prototype.open=function(m,u){this._gappMethod=m;this._gappUrl=u;return _xo.apply(this,arguments)};
XMLHttpRequest.prototype.send=function(){var self=this;
self.addEventListener("loadend",function(){
if(self.status>=400){q({message:"XHR "+self.status+": "+h(self._gappUrl),source:"xhr",line:0,col:0,stack:""})}
});
self.addEventListener("error",function(){
q({message:"XHR failed: "+h(self._gappUrl),source:"xhr",line:0,col:0,stack:""});
});
return _xs.apply(this,arguments);
};
if(window.PerformanceObserver){try{
var po=new PerformanceObserver(function(list){list.getEntries().forEach(function(e){
if(!e.responseStatus||e.responseStatus<400)return;
q({message:"Resource "+e.responseStatus+": "+h(e.name),source:"perf",line:0,col:0,stack:""});
})});
po.observe({type:"resource",buffered:true});
}catch(e){}}
var _ce=console.error;
console.error=function(){
var args=[].slice.call(arguments);
var m=args.map(function(a){return typeof a==="string"?a:(a&&a.message?a.message:String(a))}).join(" ");
if(m.indexOf("ResizeObserver")===-1&&m.indexOf("gapp-error-report")===-1){
q({message:h(m),source:"console.error",line:0,col:0,stack:""});
}
return _ce.apply(this,arguments);
};
})();
