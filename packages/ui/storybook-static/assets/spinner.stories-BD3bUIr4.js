import{j as e}from"./jsx-runtime-D_zvdyIk.js";import{c as b}from"./utils-BLSKlp9E.js";function r({className:x,...h}){return e.jsxs("div",{"data-slot":"spinner",className:b("flex items-center justify-center",x),role:"status","aria-label":"A carregar",children:[e.jsxs("svg",{className:"size-5 animate-spin",xmlns:"http://www.w3.org/2000/svg",fill:"none",viewBox:"0 0 24 24",...h,children:[e.jsx("title",{children:"A carregar"}),e.jsx("circle",{className:"opacity-25",cx:"12",cy:"12",r:"10",stroke:"currentColor",strokeWidth:"4"}),e.jsx("path",{className:"opacity-75",fill:"currentColor",d:"M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"})]}),e.jsx("span",{className:"sr-only",children:"A carregar"})]})}r.__docgenInfo={description:"",methods:[],displayName:"Spinner"};const w={title:"Components/Spinner",component:r,parameters:{layout:"centered"},tags:["autodocs"]},n={},a={render:()=>e.jsxs("div",{style:{display:"flex",alignItems:"center",gap:"var(--space-2)"},children:[e.jsx(r,{}),e.jsx("span",{style:{color:"var(--muted-foreground)",fontSize:"0.875rem"},children:"Loading…"})]})},s={parameters:{layout:"fullscreen"},render:()=>e.jsxs("div",{style:{display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",height:"100vh",gap:"var(--space-4)"},children:[e.jsx(r,{}),e.jsx("span",{style:{color:"var(--muted-foreground)",fontSize:"0.875rem"},children:"Loading dashboard data…"})]})},t={render:()=>e.jsxs("button",{type:"button",disabled:!0,style:{display:"inline-flex",alignItems:"center",gap:"var(--space-2)",padding:"var(--space-2) var(--space-4)",borderRadius:"var(--radius-md)",border:"1px solid var(--border)",background:"var(--primary)",color:"var(--primary-foreground)",cursor:"not-allowed",opacity:.5},children:[e.jsx("span",{style:{width:16,height:16,display:"flex"},children:e.jsx(r,{})}),"Saving…"]})};var o,i,l;n.parameters={...n.parameters,docs:{...(o=n.parameters)==null?void 0:o.docs,source:{originalSource:"{}",...(l=(i=n.parameters)==null?void 0:i.docs)==null?void 0:l.source}}};var c,d,p;a.parameters={...a.parameters,docs:{...(c=a.parameters)==null?void 0:c.docs,source:{originalSource:`{
  render: () => <div style={{
    display: "flex",
    alignItems: "center",
    gap: "var(--space-2)"
  }}>\r
      <Spinner />\r
      <span style={{
      color: "var(--muted-foreground)",
      fontSize: "0.875rem"
    }}>Loading…</span>\r
    </div>
}`,...(p=(d=a.parameters)==null?void 0:d.docs)==null?void 0:p.source}}};var m,u,g;s.parameters={...s.parameters,docs:{...(m=s.parameters)==null?void 0:m.docs,source:{originalSource:`{
  parameters: {
    layout: "fullscreen"
  },
  render: () => <div style={{
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    height: "100vh",
    gap: "var(--space-4)"
  }}>\r
      <Spinner />\r
      <span style={{
      color: "var(--muted-foreground)",
      fontSize: "0.875rem"
    }}>\r
        Loading dashboard data…\r
      </span>\r
    </div>
}`,...(g=(u=s.parameters)==null?void 0:u.docs)==null?void 0:g.source}}};var y,v,f;t.parameters={...t.parameters,docs:{...(y=t.parameters)==null?void 0:y.docs,source:{originalSource:`{
  render: () => <button type="button" disabled style={{
    display: "inline-flex",
    alignItems: "center",
    gap: "var(--space-2)",
    padding: "var(--space-2) var(--space-4)",
    borderRadius: "var(--radius-md)",
    border: "1px solid var(--border)",
    background: "var(--primary)",
    color: "var(--primary-foreground)",
    cursor: "not-allowed",
    opacity: 0.5
  }}>\r
      <span style={{
      width: 16,
      height: 16,
      display: "flex"
    }}>\r
        <Spinner />\r
      </span>\r
      Saving…\r
    </button>
}`,...(f=(v=t.parameters)==null?void 0:v.docs)==null?void 0:f.source}}};const I=["Default","WithLabel","FullPage","InButton"];export{n as Default,s as FullPage,t as InButton,a as WithLabel,I as __namedExportsOrder,w as default};
