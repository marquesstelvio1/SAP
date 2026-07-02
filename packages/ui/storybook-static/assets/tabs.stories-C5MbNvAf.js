import{j as t}from"./jsx-runtime-D_zvdyIk.js";import{c as V}from"./utils-BLSKlp9E.js";import{r as i}from"./index-DURGLf5P.js";import{c as y,u as Z}from"./index-7nrtBLB1.js";import{P as I,c as ee}from"./index-CXgFpmaa.js";import{c as Ie,u as te}from"./index-2D0BnMxZ.js";import{u as Se}from"./index-toT294on.js";import{u as re}from"./index-DlxmE3PM.js";import{u as je}from"./index-4H7aFNXa.js";import{P as Fe}from"./index-CVUsnoK_.js";import"./_commonjsHelpers-CqkleIqs.js";import"./index-VYnphsZV.js";import"./index-CSQiPKB2.js";var z="rovingFocusGroup.onEntryFocus",Re={bubbles:!1,cancelable:!0},S="RovingFocusGroup",[O,ne,_e]=Ie(S),[Ee,oe]=ee(S,[_e]),[Ae,Ne]=Ee(S),ae=i.forwardRef((e,r)=>t.jsx(O.Provider,{scope:e.__scopeRovingFocusGroup,children:t.jsx(O.Slot,{scope:e.__scopeRovingFocusGroup,children:t.jsx(De,{...e,ref:r})})}));ae.displayName=S;var De=i.forwardRef((e,r)=>{const{__scopeRovingFocusGroup:o,orientation:n,loop:u=!1,dir:d,currentTabStopId:s,defaultCurrentTabStopId:m,onCurrentTabStopIdChange:b,onEntryFocus:p,preventScrollOnEntryFocus:a=!1,...c}=e,g=i.useRef(null),F=Se(r,g),R=te(d),[_,l]=Z({prop:s,defaultProp:m??null,onChange:b,caller:S}),[x,M]=i.useState(!1),v=je(p),w=ne(o),G=i.useRef(!1),[he,K]=i.useState(0);return i.useEffect(()=>{const f=g.current;if(f)return f.addEventListener(z,v),()=>f.removeEventListener(z,v)},[v]),t.jsx(Ae,{scope:o,orientation:n,dir:R,loop:u,currentTabStopId:_,onItemFocus:i.useCallback(f=>l(f),[l]),onItemShiftTab:i.useCallback(()=>M(!0),[]),onFocusableItemAdd:i.useCallback(()=>K(f=>f+1),[]),onFocusableItemRemove:i.useCallback(()=>K(f=>f-1),[]),children:t.jsx(I.div,{tabIndex:x||he===0?-1:0,"data-orientation":n,...c,ref:F,style:{outline:"none",...e.style},onMouseDown:y(e.onMouseDown,()=>{G.current=!0}),onFocus:y(e.onFocus,f=>{const ye=!G.current;if(f.target===f.currentTarget&&ye&&!x){const U=new CustomEvent(z,Re);if(f.currentTarget.dispatchEvent(U),!U.defaultPrevented){const L=w().filter(C=>C.focusable),xe=L.find(C=>C.active),we=L.find(C=>C.id===_),Ce=[xe,we,...L].filter(Boolean).map(C=>C.ref.current);ce(Ce,a)}}G.current=!1}),onBlur:y(e.onBlur,()=>M(!1))})})}),se="RovingFocusGroupItem",ie=i.forwardRef((e,r)=>{const{__scopeRovingFocusGroup:o,focusable:n=!0,active:u=!1,tabStopId:d,children:s,...m}=e,b=re(),p=d||b,a=Ne(se,o),c=a.currentTabStopId===p,g=ne(o),{onFocusableItemAdd:F,onFocusableItemRemove:R,currentTabStopId:_}=a;return i.useEffect(()=>{if(n)return F(),()=>R()},[n,F,R]),t.jsx(O.ItemSlot,{scope:o,id:p,focusable:n,active:u,children:t.jsx(I.span,{tabIndex:c?0:-1,"data-orientation":a.orientation,...m,ref:r,onMouseDown:y(e.onMouseDown,l=>{n?a.onItemFocus(p):l.preventDefault()}),onFocus:y(e.onFocus,()=>a.onItemFocus(p)),onKeyDown:y(e.onKeyDown,l=>{if(l.key==="Tab"&&l.shiftKey){a.onItemShiftTab();return}if(l.target!==l.currentTarget)return;const x=Ge(l,a.orientation,a.dir);if(x!==void 0){if(l.metaKey||l.ctrlKey||l.altKey||l.shiftKey)return;l.preventDefault();let v=g().filter(w=>w.focusable).map(w=>w.ref.current);if(x==="last")v.reverse();else if(x==="prev"||x==="next"){x==="prev"&&v.reverse();const w=v.indexOf(l.currentTarget);v=a.loop?Le(v,w+1):v.slice(w+1)}setTimeout(()=>ce(v))}}),children:typeof s=="function"?s({isCurrentTabStop:c,hasTabStop:_!=null}):s})})});ie.displayName=se;var Pe={ArrowLeft:"prev",ArrowUp:"prev",ArrowRight:"next",ArrowDown:"next",PageUp:"first",Home:"first",PageDown:"last",End:"last"};function Me(e,r){return r!=="rtl"?e:e==="ArrowLeft"?"ArrowRight":e==="ArrowRight"?"ArrowLeft":e}function Ge(e,r,o){const n=Me(e.key,o);if(!(r==="vertical"&&["ArrowLeft","ArrowRight"].includes(n))&&!(r==="horizontal"&&["ArrowUp","ArrowDown"].includes(n)))return Pe[n]}function ce(e,r=!1){const o=document.activeElement;for(const n of e)if(n===o||(n.focus({preventScroll:r}),document.activeElement!==o))return}function Le(e,r){return e.map((o,n)=>e[(r+n)%e.length])}var ze=ae,Oe=ie,D="Tabs",[Ve]=ee(D,[oe]),le=oe(),[ke,k]=Ve(D),ue=i.forwardRef((e,r)=>{const{__scopeTabs:o,value:n,onValueChange:u,defaultValue:d,orientation:s="horizontal",dir:m,activationMode:b="automatic",...p}=e,a=te(m),[c,g]=Z({prop:n,onChange:u,defaultProp:d??"",caller:D});return t.jsx(ke,{scope:o,baseId:re(),value:c,onValueChange:g,orientation:s,dir:a,activationMode:b,children:t.jsx(I.div,{dir:a,"data-orientation":s,...p,ref:r})})});ue.displayName=D;var de="TabsList",fe=i.forwardRef((e,r)=>{const{__scopeTabs:o,loop:n=!0,...u}=e,d=k(de,o),s=le(o);return t.jsx(ze,{asChild:!0,...s,orientation:d.orientation,dir:d.dir,loop:n,children:t.jsx(I.div,{role:"tablist","aria-orientation":d.orientation,...u,ref:r})})});fe.displayName=de;var me="TabsTrigger",pe=i.forwardRef((e,r)=>{const{__scopeTabs:o,value:n,disabled:u=!1,...d}=e,s=k(me,o),m=le(o),b=be(s.baseId,n),p=Te(s.baseId,n),a=n===s.value;return t.jsx(Oe,{asChild:!0,...m,focusable:!u,active:a,children:t.jsx(I.button,{type:"button",role:"tab","aria-selected":a,"aria-controls":p,"data-state":a?"active":"inactive","data-disabled":u?"":void 0,disabled:u,id:b,...d,ref:r,onMouseDown:y(e.onMouseDown,c=>{!u&&c.button===0&&c.ctrlKey===!1?s.onValueChange(n):c.preventDefault()}),onKeyDown:y(e.onKeyDown,c=>{[" ","Enter"].includes(c.key)&&s.onValueChange(n)}),onFocus:y(e.onFocus,()=>{const c=s.activationMode!=="manual";!a&&!u&&c&&s.onValueChange(n)})})})});pe.displayName=me;var ge="TabsContent",ve=i.forwardRef((e,r)=>{const{__scopeTabs:o,value:n,forceMount:u,children:d,...s}=e,m=k(ge,o),b=be(m.baseId,n),p=Te(m.baseId,n),a=n===m.value,c=i.useRef(a);return i.useEffect(()=>{const g=requestAnimationFrame(()=>c.current=!1);return()=>cancelAnimationFrame(g)},[]),t.jsx(Fe,{present:u||a,children:({present:g})=>t.jsx(I.div,{"data-state":a?"active":"inactive","data-orientation":m.orientation,role:"tabpanel","aria-labelledby":b,hidden:!g,id:p,tabIndex:0,...s,ref:r,style:{...e.style,animationDuration:c.current?"0s":void 0},children:g&&d})})});ve.displayName=ge;function be(e,r){return`${e}-trigger-${r}`}function Te(e,r){return`${e}-content-${r}`}var Ke=ue,Ue=fe,$e=pe,Be=ve;const He={comfortable:"h-[var(--density-comfortable-control-height)]",compact:"h-[var(--density-compact-control-height)]",operational:"h-[var(--density-operational-control-height)]"};function j({...e}){return t.jsx(Ke,{"data-slot":"tabs",...e})}function P({className:e,density:r="comfortable",...o}){return t.jsx(Ue,{"data-slot":"tabs-list",className:V("inline-flex items-center justify-center rounded-md bg-muted p-1 text-muted-foreground",He[r],e),...o})}function T({className:e,...r}){return t.jsx($e,{"data-slot":"tabs-trigger",className:V("inline-flex items-center justify-center gap-2 rounded-sm px-3 py-1 text-sm font-medium whitespace-nowrap outline-none transition-all duration-[var(--motion-duration-fast)] disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-panel",e),...r})}function h({className:e,...r}){return t.jsx(Be,{"data-slot":"tabs-content",className:V("mt-2 outline-none ring-offset-background focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:ring-offset-2",e),...r})}j.__docgenInfo={description:"",methods:[],displayName:"Tabs"};h.__docgenInfo={description:"",methods:[],displayName:"TabsContent"};P.__docgenInfo={description:"",methods:[],displayName:"TabsList",props:{density:{required:!1,tsType:{name:"union",raw:'"comfortable" | "compact" | "operational"',elements:[{name:"literal",value:'"comfortable"'},{name:"literal",value:'"compact"'},{name:"literal",value:'"operational"'}]},description:"",defaultValue:{value:'"comfortable"',computed:!1}}}};T.__docgenInfo={description:"",methods:[],displayName:"TabsTrigger"};const it={title:"Components/Tabs",component:j,parameters:{layout:"centered"},tags:["autodocs"]},E={render:()=>t.jsxs(j,{defaultValue:"account",style:{width:400},children:[t.jsxs(P,{children:[t.jsx(T,{value:"account",children:"Account"}),t.jsx(T,{value:"password",children:"Password"}),t.jsx(T,{value:"settings",children:"Settings"})]}),t.jsx(h,{value:"account",children:t.jsx("p",{style:{fontSize:"0.875rem",margin:0,color:"var(--muted-foreground)"},children:"Manage your account details and preferences."})}),t.jsx(h,{value:"password",children:t.jsx("p",{style:{fontSize:"0.875rem",margin:0,color:"var(--muted-foreground)"},children:"Update your password and security settings."})}),t.jsx(h,{value:"settings",children:t.jsx("p",{style:{fontSize:"0.875rem",margin:0,color:"var(--muted-foreground)"},children:"Configure application preferences."})})]})},A={render:()=>t.jsxs(j,{defaultValue:"overview",style:{width:450},children:[t.jsxs(P,{children:[t.jsx(T,{value:"overview",children:"Overview"}),t.jsx(T,{value:"analytics",children:"Analytics"}),t.jsx(T,{value:"reports",children:"Reports"}),t.jsx(T,{value:"notifications",children:"Notifications"})]}),t.jsx(h,{value:"overview",children:t.jsx("p",{style:{fontSize:"0.875rem",margin:0,color:"var(--muted-foreground)"},children:"Dashboard overview with key metrics."})}),t.jsx(h,{value:"analytics",children:t.jsx("p",{style:{fontSize:"0.875rem",margin:0,color:"var(--muted-foreground)"},children:"Detailed analytics and charts."})}),t.jsx(h,{value:"reports",children:t.jsx("p",{style:{fontSize:"0.875rem",margin:0,color:"var(--muted-foreground)"},children:"Generate and view reports."})}),t.jsx(h,{value:"notifications",children:t.jsx("p",{style:{fontSize:"0.875rem",margin:0,color:"var(--muted-foreground)"},children:"Manage your notification preferences."})})]})},N={render:()=>t.jsxs(j,{defaultValue:"details",style:{width:300},children:[t.jsx(P,{children:t.jsx(T,{value:"details",children:"Details"})}),t.jsx(h,{value:"details",children:t.jsx("p",{style:{fontSize:"0.875rem",margin:0,color:"var(--muted-foreground)"},children:"Single tab content."})})]})};var $,B,H;E.parameters={...E.parameters,docs:{...($=E.parameters)==null?void 0:$.docs,source:{originalSource:`{
  render: () => <Tabs defaultValue="account" style={{
    width: 400
  }}>\r
      <TabsList>\r
        <TabsTrigger value="account">Account</TabsTrigger>\r
        <TabsTrigger value="password">Password</TabsTrigger>\r
        <TabsTrigger value="settings">Settings</TabsTrigger>\r
      </TabsList>\r
      <TabsContent value="account">\r
        <p style={{
        fontSize: "0.875rem",
        margin: 0,
        color: "var(--muted-foreground)"
      }}>\r
          Manage your account details and preferences.\r
        </p>\r
      </TabsContent>\r
      <TabsContent value="password">\r
        <p style={{
        fontSize: "0.875rem",
        margin: 0,
        color: "var(--muted-foreground)"
      }}>\r
          Update your password and security settings.\r
        </p>\r
      </TabsContent>\r
      <TabsContent value="settings">\r
        <p style={{
        fontSize: "0.875rem",
        margin: 0,
        color: "var(--muted-foreground)"
      }}>\r
          Configure application preferences.\r
        </p>\r
      </TabsContent>\r
    </Tabs>
}`,...(H=(B=E.parameters)==null?void 0:B.docs)==null?void 0:H.source}}};var Y,q,W;A.parameters={...A.parameters,docs:{...(Y=A.parameters)==null?void 0:Y.docs,source:{originalSource:`{
  render: () => <Tabs defaultValue="overview" style={{
    width: 450
  }}>\r
      <TabsList>\r
        <TabsTrigger value="overview">Overview</TabsTrigger>\r
        <TabsTrigger value="analytics">Analytics</TabsTrigger>\r
        <TabsTrigger value="reports">Reports</TabsTrigger>\r
        <TabsTrigger value="notifications">Notifications</TabsTrigger>\r
      </TabsList>\r
      <TabsContent value="overview">\r
        <p style={{
        fontSize: "0.875rem",
        margin: 0,
        color: "var(--muted-foreground)"
      }}>\r
          Dashboard overview with key metrics.\r
        </p>\r
      </TabsContent>\r
      <TabsContent value="analytics">\r
        <p style={{
        fontSize: "0.875rem",
        margin: 0,
        color: "var(--muted-foreground)"
      }}>\r
          Detailed analytics and charts.\r
        </p>\r
      </TabsContent>\r
      <TabsContent value="reports">\r
        <p style={{
        fontSize: "0.875rem",
        margin: 0,
        color: "var(--muted-foreground)"
      }}>\r
          Generate and view reports.\r
        </p>\r
      </TabsContent>\r
      <TabsContent value="notifications">\r
        <p style={{
        fontSize: "0.875rem",
        margin: 0,
        color: "var(--muted-foreground)"
      }}>\r
          Manage your notification preferences.\r
        </p>\r
      </TabsContent>\r
    </Tabs>
}`,...(W=(q=A.parameters)==null?void 0:q.docs)==null?void 0:W.source}}};var J,Q,X;N.parameters={...N.parameters,docs:{...(J=N.parameters)==null?void 0:J.docs,source:{originalSource:`{
  render: () => <Tabs defaultValue="details" style={{
    width: 300
  }}>\r
      <TabsList>\r
        <TabsTrigger value="details">Details</TabsTrigger>\r
      </TabsList>\r
      <TabsContent value="details">\r
        <p style={{
        fontSize: "0.875rem",
        margin: 0,
        color: "var(--muted-foreground)"
      }}>\r
          Single tab content.\r
        </p>\r
      </TabsContent>\r
    </Tabs>
}`,...(X=(Q=N.parameters)==null?void 0:Q.docs)==null?void 0:X.source}}};const ct=["Default","WithIcons","SingleTab"];export{E as Default,N as SingleTab,A as WithIcons,ct as __namedExportsOrder,it as default};
