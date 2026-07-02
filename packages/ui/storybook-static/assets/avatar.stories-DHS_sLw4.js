import{j as r}from"./jsx-runtime-D_zvdyIk.js";import{c as _}from"./utils-BLSKlp9E.js";import{a as ca,r as v}from"./index-DURGLf5P.js";import{P as R,u as w,c as ia}from"./index-CXgFpmaa.js";import{u as ua}from"./index-4H7aFNXa.js";import"./_commonjsHelpers-CqkleIqs.js";import"./index-VYnphsZV.js";import"./index-CSQiPKB2.js";import"./index-toT294on.js";var I={exports:{}},F={};/**
 * @license React
 * use-sync-external-store-shim.production.js
 *
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */var z;function la(){if(z)return F;z=1;var a=ca();function e(n,o){return n===o&&(n!==0||1/n===1/o)||n!==n&&o!==o}var c=typeof Object.is=="function"?Object.is:e,s=a.useState,i=a.useEffect,t=a.useLayoutEffect,p=a.useDebugValue;function u(n,o){var S=o(),k=s({inst:{value:S,getSnapshot:o}}),d=k[0].inst,L=k[1];return t(function(){d.value=S,d.getSnapshot=o,l(d)&&L({inst:d})},[n,S,o]),i(function(){return l(d)&&L({inst:d}),n(function(){l(d)&&L({inst:d})})},[n]),p(S),S}function l(n){var o=n.getSnapshot;n=n.value;try{var S=o();return!c(n,S)}catch{return!0}}function f(n,o){return o()}var A=typeof window>"u"||typeof window.document>"u"||typeof window.document.createElement>"u"?f:u;return F.useSyncExternalStore=a.useSyncExternalStore!==void 0?a.useSyncExternalStore:A,F}var M;function da(){return M||(M=1,I.exports=la()),I.exports}var va=da();function ma(){return va.useSyncExternalStore(pa,()=>!0,()=>!1)}function pa(){return()=>{}}var N="Avatar",[fa]=ia(N),[Sa,ea]=fa(N),ra=v.forwardRef((a,e)=>{const{__scopeAvatar:c,...s}=a,[i,t]=v.useState("idle");return r.jsx(Sa,{scope:c,imageLoadingStatus:i,onImageLoadingStatusChange:t,children:r.jsx(R.span,{...s,ref:e})})});ra.displayName=N;var ta="AvatarImage",na=v.forwardRef((a,e)=>{const{__scopeAvatar:c,src:s,onLoadingStatusChange:i=()=>{},...t}=a,p=ea(ta,c),u=ha(s,t),l=ua(f=>{i(f),p.onImageLoadingStatusChange(f)});return w(()=>{u!=="idle"&&l(u)},[u,l]),u==="loaded"?r.jsx(R.img,{...t,ref:e,src:s}):null});na.displayName=ta;var sa="AvatarFallback",oa=v.forwardRef((a,e)=>{const{__scopeAvatar:c,delayMs:s,...i}=a,t=ea(sa,c),[p,u]=v.useState(s===void 0);return v.useEffect(()=>{if(s!==void 0){const l=window.setTimeout(()=>u(!0),s);return()=>window.clearTimeout(l)}},[s]),p&&t.imageLoadingStatus!=="loaded"?r.jsx(R.span,{...i,ref:e}):null});oa.displayName=sa;function q(a,e){return a?e?(a.src!==e&&(a.src=e),a.complete&&a.naturalWidth>0?"loaded":"loading"):"error":"idle"}function ha(a,{referrerPolicy:e,crossOrigin:c}){const s=ma(),i=v.useRef(null),t=s?(i.current||(i.current=new window.Image),i.current):null,[p,u]=v.useState(()=>q(t,a));return w(()=>{u(q(t,a))},[t,a]),w(()=>{const l=n=>()=>{u(n)};if(!t)return;const f=l("loaded"),A=l("error");return t.addEventListener("load",f),t.addEventListener("error",A),e&&(t.referrerPolicy=e),typeof c=="string"&&(t.crossOrigin=c),()=>{t.removeEventListener("load",f),t.removeEventListener("error",A)}},[t,c,e]),p}var Aa=ra,ga=na,xa=oa;function m({className:a,...e}){return r.jsx(Aa,{"data-slot":"avatar",className:_("relative flex size-10 shrink-0 overflow-hidden rounded-full",a),...e})}function C({className:a,...e}){return r.jsx(ga,{"data-slot":"avatar-image",className:_("aspect-square size-full",a),...e})}function h({className:a,...e}){return r.jsx(xa,{"data-slot":"avatar-fallback",className:_("flex size-full items-center justify-center rounded-full bg-muted",a),...e})}m.__docgenInfo={description:"",methods:[],displayName:"Avatar"};h.__docgenInfo={description:"",methods:[],displayName:"AvatarFallback"};C.__docgenInfo={description:"",methods:[],displayName:"AvatarImage"};const _a={title:"Components/Avatar",component:m,parameters:{layout:"centered"},tags:["autodocs"]},g={render:()=>r.jsxs(m,{children:[r.jsx(C,{src:"https://i.pravatar.cc/150?u=default",alt:"@user"}),r.jsx(h,{children:"US"})]})},x={render:()=>r.jsxs(m,{children:[r.jsx(C,{src:"https://i.pravatar.cc/150?u=avatar",alt:"@avatar"}),r.jsx(h,{children:"AV"})]})},y={render:()=>r.jsx(m,{children:r.jsx(h,{children:"JD"})})},b={render:()=>r.jsx(m,{children:r.jsx(h,{children:"AN"})})},E={render:()=>r.jsx(m,{style:{width:"var(--space-8)",height:"var(--space-8)"},children:r.jsx(h,{style:{fontSize:"0.75rem"},children:"SM"})})},j={render:()=>r.jsx(m,{style:{width:"var(--space-14)",height:"var(--space-14)"},children:r.jsx(h,{style:{fontSize:"1.25rem"},children:"LG"})})};var D,$,P;g.parameters={...g.parameters,docs:{...(D=g.parameters)==null?void 0:D.docs,source:{originalSource:`{
  render: () => <Avatar>\r
      <AvatarImage src="https://i.pravatar.cc/150?u=default" alt="@user" />\r
      <AvatarFallback>US</AvatarFallback>\r
    </Avatar>
}`,...(P=($=g.parameters)==null?void 0:$.docs)==null?void 0:P.source}}};var U,V,G;x.parameters={...x.parameters,docs:{...(U=x.parameters)==null?void 0:U.docs,source:{originalSource:`{
  render: () => <Avatar>\r
      <AvatarImage src="https://i.pravatar.cc/150?u=avatar" alt="@avatar" />\r
      <AvatarFallback>AV</AvatarFallback>\r
    </Avatar>
}`,...(G=(V=x.parameters)==null?void 0:V.docs)==null?void 0:G.source}}};var T,W,H;y.parameters={...y.parameters,docs:{...(T=y.parameters)==null?void 0:T.docs,source:{originalSource:`{
  render: () => <Avatar>\r
      <AvatarFallback>JD</AvatarFallback>\r
    </Avatar>
}`,...(H=(W=y.parameters)==null?void 0:W.docs)==null?void 0:H.source}}};var J,O,B;b.parameters={...b.parameters,docs:{...(J=b.parameters)==null?void 0:J.docs,source:{originalSource:`{
  render: () => <Avatar>\r
      <AvatarFallback>AN</AvatarFallback>\r
    </Avatar>
}`,...(B=(O=b.parameters)==null?void 0:O.docs)==null?void 0:B.source}}};var K,Q,X;E.parameters={...E.parameters,docs:{...(K=E.parameters)==null?void 0:K.docs,source:{originalSource:`{
  render: () => <Avatar style={{
    width: "var(--space-8)",
    height: "var(--space-8)"
  }}>\r
      <AvatarFallback style={{
      fontSize: "0.75rem"
    }}>SM</AvatarFallback>\r
    </Avatar>
}`,...(X=(Q=E.parameters)==null?void 0:Q.docs)==null?void 0:X.source}}};var Y,Z,aa;j.parameters={...j.parameters,docs:{...(Y=j.parameters)==null?void 0:Y.docs,source:{originalSource:`{
  render: () => <Avatar style={{
    width: "var(--space-14)",
    height: "var(--space-14)"
  }}>\r
      <AvatarFallback style={{
      fontSize: "1.25rem"
    }}>LG</AvatarFallback>\r
    </Avatar>
}`,...(aa=(Z=j.parameters)==null?void 0:Z.docs)==null?void 0:aa.source}}};const Ra=["Default","WithImage","Fallback","FallbackIcon","Small","Large"];export{g as Default,y as Fallback,b as FallbackIcon,j as Large,E as Small,x as WithImage,Ra as __namedExportsOrder,_a as default};
