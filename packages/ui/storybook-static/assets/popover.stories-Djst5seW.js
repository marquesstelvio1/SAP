import{j as e}from"./jsx-runtime-D_zvdyIk.js";import{B as T}from"./button-Dni6R342.js";import"./card-BWSEtcIE.js";import{I as w}from"./input-DUD-rXCE.js";import{L as S}from"./label-DBh-5I1j.js";import{c as Q}from"./utils-BLSKlp9E.js";import{r as l}from"./index-DURGLf5P.js";import{u as X,c as m}from"./index-7nrtBLB1.js";import{u as M,c as Y}from"./index-toT294on.js";import{P as k,c as ee}from"./index-CXgFpmaa.js";import{P as oe,D as re}from"./index-CJvlpILa.js";import{h as te,R as ne,u as ae,F as se}from"./index-D6W88KNp.js";import{u as ie}from"./index-DlxmE3PM.js";import{R as ce,A as B,c as L,C as le,a as de}from"./index-BfQ2cPna.js";import{P as z}from"./index-CVUsnoK_.js";import"./index-1evVQkiP.js";import"./_commonjsHelpers-CqkleIqs.js";import"./index-VYnphsZV.js";import"./index-CSQiPKB2.js";import"./index-4H7aFNXa.js";import"./index-CW1u6dt9.js";var y="Popover",[V]=ee(y,[L]),h=L(),[pe,u]=V(y),W=o=>{const{__scopePopover:a,children:r,open:s,defaultOpen:t,onOpenChange:n,modal:i=!1}=o,c=h(a),d=l.useRef(null),[p,g]=l.useState(!1),[P,f]=X({prop:s,defaultProp:t??!1,onChange:n,caller:y});return e.jsx(ce,{...c,children:e.jsx(pe,{scope:a,contentId:ie(),triggerRef:d,open:P,onOpenChange:f,onOpenToggle:l.useCallback(()=>f(R=>!R),[f]),hasCustomAnchor:p,onCustomAnchorAdd:l.useCallback(()=>g(!0),[]),onCustomAnchorRemove:l.useCallback(()=>g(!1),[]),modal:i,children:r})})};W.displayName=y;var H="PopoverAnchor",ue=l.forwardRef((o,a)=>{const{__scopePopover:r,...s}=o,t=u(H,r),n=h(r),{onCustomAnchorAdd:i,onCustomAnchorRemove:c}=t;return l.useEffect(()=>(i(),()=>c()),[i,c]),e.jsx(B,{...n,...s,ref:a})});ue.displayName=H;var $="PopoverTrigger",G=l.forwardRef((o,a)=>{const{__scopePopover:r,...s}=o,t=u($,r),n=h(r),i=M(a,t.triggerRef),c=e.jsx(k.button,{type:"button","aria-haspopup":"dialog","aria-expanded":t.open,"aria-controls":t.contentId,"data-state":J(t.open),...s,ref:i,onClick:m(o.onClick,t.onOpenToggle)});return t.hasCustomAnchor?c:e.jsx(B,{asChild:!0,...n,children:c})});G.displayName=$;var O="PopoverPortal",[fe,ve]=V(O,{forceMount:void 0}),q=o=>{const{__scopePopover:a,forceMount:r,children:s,container:t}=o,n=u(O,a);return e.jsx(fe,{scope:a,forceMount:r,children:e.jsx(z,{present:r||n.open,children:e.jsx(oe,{asChild:!0,container:t,children:s})})})};q.displayName=O;var v="PopoverContent",K=l.forwardRef((o,a)=>{const r=ve(v,o.__scopePopover),{forceMount:s=r.forceMount,...t}=o,n=u(v,o.__scopePopover);return e.jsx(z,{present:s||n.open,children:n.modal?e.jsx(he,{...t,ref:a}):e.jsx(ge,{...t,ref:a})})});K.displayName=v;var me=Y("PopoverContent.RemoveScroll"),he=l.forwardRef((o,a)=>{const r=u(v,o.__scopePopover),s=l.useRef(null),t=M(a,s),n=l.useRef(!1);return l.useEffect(()=>{const i=s.current;if(i)return te(i)},[]),e.jsx(ne,{as:me,allowPinchZoom:!0,children:e.jsx(U,{...o,ref:t,trapFocus:r.open,disableOutsidePointerEvents:!0,onCloseAutoFocus:m(o.onCloseAutoFocus,i=>{var c;i.preventDefault(),n.current||(c=r.triggerRef.current)==null||c.focus()}),onPointerDownOutside:m(o.onPointerDownOutside,i=>{const c=i.detail.originalEvent,d=c.button===0&&c.ctrlKey===!0,p=c.button===2||d;n.current=p},{checkForDefaultPrevented:!1}),onFocusOutside:m(o.onFocusOutside,i=>i.preventDefault(),{checkForDefaultPrevented:!1})})})}),ge=l.forwardRef((o,a)=>{const r=u(v,o.__scopePopover),s=l.useRef(!1),t=l.useRef(!1);return e.jsx(U,{...o,ref:a,trapFocus:!1,disableOutsidePointerEvents:!1,onCloseAutoFocus:n=>{var i,c;(i=o.onCloseAutoFocus)==null||i.call(o,n),n.defaultPrevented||(s.current||(c=r.triggerRef.current)==null||c.focus(),n.preventDefault()),s.current=!1,t.current=!1},onInteractOutside:n=>{var d,p;(d=o.onInteractOutside)==null||d.call(o,n),n.defaultPrevented||(s.current=!0,n.detail.originalEvent.type==="pointerdown"&&(t.current=!0));const i=n.target;((p=r.triggerRef.current)==null?void 0:p.contains(i))&&n.preventDefault(),n.detail.originalEvent.type==="focusin"&&t.current&&n.preventDefault()}})}),U=l.forwardRef((o,a)=>{const{__scopePopover:r,trapFocus:s,onOpenAutoFocus:t,onCloseAutoFocus:n,disableOutsidePointerEvents:i,onEscapeKeyDown:c,onPointerDownOutside:d,onFocusOutside:p,onInteractOutside:g,...P}=o,f=u(v,r),R=h(r);return ae(),e.jsx(se,{asChild:!0,loop:!0,trapped:s,onMountAutoFocus:t,onUnmountAutoFocus:n,children:e.jsx(re,{asChild:!0,disableOutsidePointerEvents:i,onInteractOutside:g,onEscapeKeyDown:c,onPointerDownOutside:d,onFocusOutside:p,onDismiss:()=>f.onOpenChange(!1),children:e.jsx(le,{"data-state":J(f.open),role:"dialog",id:f.contentId,...R,...P,ref:a,style:{...P.style,"--radix-popover-content-transform-origin":"var(--radix-popper-transform-origin)","--radix-popover-content-available-width":"var(--radix-popper-available-width)","--radix-popover-content-available-height":"var(--radix-popper-available-height)","--radix-popover-trigger-width":"var(--radix-popper-anchor-width)","--radix-popover-trigger-height":"var(--radix-popper-anchor-height)"}})})})}),Z="PopoverClose",Pe=l.forwardRef((o,a)=>{const{__scopePopover:r,...s}=o,t=u(Z,r);return e.jsx(k.button,{type:"button",...s,ref:a,onClick:m(o.onClick,()=>t.onOpenChange(!1))})});Pe.displayName=Z;var xe="PopoverArrow",Ce=l.forwardRef((o,a)=>{const{__scopePopover:r,...s}=o,t=h(r);return e.jsx(de,{...t,...s,ref:a})});Ce.displayName=xe;function J(o){return o?"open":"closed"}var ye=W,je=G,Re=q,Oe=K;function j({...o}){return e.jsx(ye,{"data-slot":"popover",...o})}function _({...o}){return e.jsx(je,{"data-slot":"popover-trigger",...o})}function A({className:o,align:a="center",sideOffset:r=4,...s}){return e.jsx(Re,{children:e.jsx(Oe,{"data-slot":"popover-content",align:a,sideOffset:r,className:Q("z-popover w-72 rounded-md border bg-popover p-4 text-popover-foreground shadow-overlay outline-none data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2",o),...s})})}j.__docgenInfo={description:"",methods:[],displayName:"Popover"};A.__docgenInfo={description:"",methods:[],displayName:"PopoverContent",props:{align:{defaultValue:{value:'"center"',computed:!1},required:!1},sideOffset:{defaultValue:{value:"4",computed:!1},required:!1}}};_.__docgenInfo={description:"",methods:[],displayName:"PopoverTrigger"};const qe={title:"Components/Popover",component:j,parameters:{layout:"centered"},tags:["autodocs"]},x={render:()=>e.jsxs(j,{defaultOpen:!0,children:[e.jsx(_,{asChild:!0,children:e.jsx(T,{variant:"outline",children:"Open Popover"})}),e.jsx(A,{children:e.jsxs("div",{style:{fontSize:"0.875rem"},children:[e.jsx("p",{style:{margin:0,fontWeight:600,marginBottom:"var(--space-1)"},children:"Dimensions"}),e.jsx("p",{style:{margin:0,color:"var(--muted-foreground)"},children:"Set the dimensions for the layer."})]})})]})},C={render:()=>e.jsxs(j,{defaultOpen:!0,children:[e.jsx(_,{asChild:!0,children:e.jsx(T,{variant:"outline",children:"Edit Dimensions"})}),e.jsx(A,{style:{width:280},children:e.jsxs("div",{style:{display:"flex",flexDirection:"column",gap:"var(--space-4)"},children:[e.jsxs("div",{children:[e.jsx("p",{style:{margin:0,fontWeight:600,fontSize:"0.875rem",marginBottom:"var(--space-1)"},children:"Dimensions"}),e.jsx("p",{style:{margin:0,color:"var(--muted-foreground)",fontSize:"0.75rem"},children:"Set the width and height of the layer."})]}),e.jsxs("div",{style:{display:"flex",gap:"var(--space-2)"},children:[e.jsxs("div",{style:{flex:1},children:[e.jsx(S,{htmlFor:"width",children:"Width"}),e.jsx(w,{id:"width",defaultValue:"100%"})]}),e.jsxs("div",{style:{flex:1},children:[e.jsx(S,{htmlFor:"height",children:"Height"}),e.jsx(w,{id:"height",defaultValue:"auto"})]})]})]})})]})};var b,E,D;x.parameters={...x.parameters,docs:{...(b=x.parameters)==null?void 0:b.docs,source:{originalSource:`{
  render: () => <Popover defaultOpen>\r
      <PopoverTrigger asChild>\r
        <Button variant="outline">Open Popover</Button>\r
      </PopoverTrigger>\r
      <PopoverContent>\r
        <div style={{
        fontSize: "0.875rem"
      }}>\r
          <p style={{
          margin: 0,
          fontWeight: 600,
          marginBottom: "var(--space-1)"
        }}>\r
            Dimensions\r
          </p>\r
          <p style={{
          margin: 0,
          color: "var(--muted-foreground)"
        }}>\r
            Set the dimensions for the layer.\r
          </p>\r
        </div>\r
      </PopoverContent>\r
    </Popover>
}`,...(D=(E=x.parameters)==null?void 0:E.docs)==null?void 0:D.source}}};var F,N,I;C.parameters={...C.parameters,docs:{...(F=C.parameters)==null?void 0:F.docs,source:{originalSource:`{
  render: () => <Popover defaultOpen>\r
      <PopoverTrigger asChild>\r
        <Button variant="outline">Edit Dimensions</Button>\r
      </PopoverTrigger>\r
      <PopoverContent style={{
      width: 280
    }}>\r
        <div style={{
        display: "flex",
        flexDirection: "column",
        gap: "var(--space-4)"
      }}>\r
          <div>\r
            <p style={{
            margin: 0,
            fontWeight: 600,
            fontSize: "0.875rem",
            marginBottom: "var(--space-1)"
          }}>\r
              Dimensions\r
            </p>\r
            <p style={{
            margin: 0,
            color: "var(--muted-foreground)",
            fontSize: "0.75rem"
          }}>\r
              Set the width and height of the layer.\r
            </p>\r
          </div>\r
          <div style={{
          display: "flex",
          gap: "var(--space-2)"
        }}>\r
            <div style={{
            flex: 1
          }}>\r
              <Label htmlFor="width">Width</Label>\r
              <Input id="width" defaultValue="100%" />\r
            </div>\r
            <div style={{
            flex: 1
          }}>\r
              <Label htmlFor="height">Height</Label>\r
              <Input id="height" defaultValue="auto" />\r
            </div>\r
          </div>\r
        </div>\r
      </PopoverContent>\r
    </Popover>
}`,...(I=(N=C.parameters)==null?void 0:N.docs)==null?void 0:I.source}}};const Ke=["Default","Form"];export{x as Default,C as Form,Ke as __namedExportsOrder,qe as default};
