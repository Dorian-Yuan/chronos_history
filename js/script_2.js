(function(){
  var base='/api/apps/chronos/file';
  var re=/^(?:\.\/|\/)((?:[\w.-]+\/)*[\w][\w.-]*\.(?:png|jpg|jpeg|gif|svg|ico|webp|avif|mp3|wav|ogg|mp4|webm|woff2?|ttf|eot|otf|pdf|glb|gltf))$/i;
  function rw(v){
    if(typeof v!=='string')return v;
    if(v.startsWith('http')||v.startsWith('//')||v.startsWith('data:')||v.startsWith('blob:')||v.startsWith('/api/')||v.startsWith('/_next/'))return v;
    var m=v.match(re);
    return m?base+'/'+m[1]:v;
  }
  // url() 改写：把 CSS 值字符串里的 url(...) 路径过一遍 rw()
  function rwCss(v){
    if(typeof v!=='string'||v.indexOf('url(')<0)return v;
    return v.replace(/url\(\s*(['"]?)([^'")]+?)\1\s*\)/gi,function(_,q,p){return 'url('+q+rw(p)+q+')'});
  }
  // HTMLAudioElement / HTMLVideoElement 的 'src' 属性是在 HTMLMediaElement.prototype 上定义的，
  // 不在 Audio/Video 自己的 prototype 上。所以 getOwnPropertyDescriptor 在这里会返回 undefined，
  // 导致音频 / 视频从未被劫持（之前静默失败）。沿原型链查找一次 descriptor 再装到直接 prototype 上，
  // Image/Source 不受影响（它们第一轮就能找到自身 descriptor）。
  ['Image','Audio','Video','Source'].forEach(function(t){
    var p=window['HTML'+t+'Element']&&window['HTML'+t+'Element'].prototype;
    if(!p)return;
    try{
      var d,proto=p;
      while(proto&&!d){
        d=Object.getOwnPropertyDescriptor(proto,'src');
        proto=Object.getPrototypeOf(proto);
      }
      if(!d||!d.set)return;
      Object.defineProperty(p,'src',{set:function(v){d.set.call(this,rw(v))},get:d.get,configurable:true});
    }catch(_){/* 未知 exotic element，保留原生行为 */}
  });
  // new Audio('/x.mp3') / new Image() 的构造器在 C++ 层用内部 "set an attribute value"
  // 直接写属性，不会经过 JS 层的 Element.prototype.setAttribute，也不会触发我们改写过的
  // HTMLMediaElement.prototype.src setter。所以必须把构造器本身包一层，把传入的 src 先 rw()。
  ['Audio','Image'].forEach(function(t){
    var O=window[t];if(!O||typeof Reflect==='undefined')return;
    function W(s){
      var nt=new.target||W;
      return arguments.length===0?Reflect.construct(O,[],nt):Reflect.construct(O,[rw(s)],nt);
    }
    W.prototype=O.prototype;
    try{Object.setPrototypeOf(W,O);window[t]=W;}catch(_){/* 不可写就放弃，保留原生 */}
  });
  // React 的 style={{ backgroundImage: 'url(/x.png)' }} 最终调用 el.style.backgroundImage = …
  // 这条路径既不走 setAttribute 也不走任何 src setter。
  // 关键事实（用 Playwright 在线上确认过）：Chrome/Blink 的 backgroundImage 等 camelCase
  // CSS 属性 setter 不在 CSSStyleDeclaration.prototype（也不在它的任何祖先）上 —— 用
  // Object.getOwnPropertyDescriptor 看到的是 undefined。它们由 V8 的 named property handler
  // 在 C++ 层动态处理，对 JS 反射不可见。所以没法用"找 setter 然后 defineProperty 包一层"
  // 的常规手法。
  // 解决方法：劫持 HTMLElement.prototype 上的 'style' getter，让它返回一个 Proxy。
  // Proxy 的 set trap 同步地把值过 rwCss 再 forward 给原生 declaration —— 在浏览器解析
  // CSS 触发资源 fetch 之前就完成改写。get trap 把方法绑回原生 target，确保 setProperty /
  // removeProperty / item 等内置方法在 internal slot access 时不会因为 receiver 是 Proxy
  // 而炸掉。每个原生 declaration 缓存一个 Proxy（WeakMap），所以 el.style === el.style 仍然成立。
  var styleDesc=Object.getOwnPropertyDescriptor(window.HTMLElement&&HTMLElement.prototype,'style')
              ||Object.getOwnPropertyDescriptor(window.Element&&Element.prototype,'style');
  if(styleDesc&&styleDesc.get&&typeof Proxy!=='undefined'){
    var origStyleGet=styleDesc.get;
    var styleProxyCache=new WeakMap();
    var handler={
      set:function(t,p,v){return Reflect.set(t,p,rwCss(v))},
      get:function(t,p){var v=Reflect.get(t,p);return typeof v==='function'?v.bind(t):v}
    };
    try{
      Object.defineProperty(HTMLElement.prototype,'style',{
        get:function(){
          var native=origStyleGet.call(this);
          var px=styleProxyCache.get(native);
          if(!px){px=new Proxy(native,handler);styleProxyCache.set(native,px);}
          return px;
        },
        configurable:true
      });
    }catch(_){/* 不可写就放弃 */}
  }
  // setProperty 调用的是 CSSStyleDeclaration.prototype 上的方法，Proxy get trap
  // 把它绑回 native target 后直接执行 —— 不走 set trap。需要单独 hook 这个方法。
  // cssText 同理（不过它是 accessor，prototype 上有真正的 setter，可以直接覆盖）。
  var SP=window.CSSStyleDeclaration&&CSSStyleDeclaration.prototype;
  if(SP){
    var oSP=SP.setProperty;
    if(oSP){
      SP.setProperty=function(n,v,p){
        if(typeof n==='string'&&/^(?:-webkit-|-moz-)?(?:background|background-image|list-style-image|border-image(?:-source)?|content|cursor|mask|mask-image)$/i.test(n))v=rwCss(v);
        return oSP.call(this,n,v,p);
      };
    }
    var dCT=Object.getOwnPropertyDescriptor(SP,'cssText');
    if(dCT&&dCT.set){
      try{Object.defineProperty(SP,'cssText',{set:function(v){dCT.set.call(this,rwCss(v))},get:dCT.get,configurable:true,enumerable:!!dCT.enumerable});}catch(_){}
    }
  }
  var origSet=Element.prototype.setAttribute;
  Element.prototype.setAttribute=function(n,v){
    if(n==='src'||n==='href')v=rw(v);
    else if(n==='style')v=rwCss(v);
    return origSet.call(this,n,v);
  };
})();
