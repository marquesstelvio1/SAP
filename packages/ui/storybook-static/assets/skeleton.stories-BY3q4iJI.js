import{j as e}from"./jsx-runtime-D_zvdyIk.js";import{c as h}from"./utils-BLSKlp9E.js";function s({className:r,...t}){return e.jsx("div",{"data-slot":"skeleton",className:h("animate-pulse rounded-md bg-muted",r),...t})}function I({className:r,...t}){return e.jsxs("div",{"data-slot":"skeleton-card",className:h("rounded-xl border p-6",r),...t,children:[e.jsx(s,{className:"mb-4 h-4 w-1/3"}),e.jsx(s,{className:"mb-2 h-[var(--density-operational-control-height)] w-1/2"}),e.jsx(s,{className:"h-3 w-1/4"})]})}function A({rows:r=5,columns:t=4,className:q}){return e.jsxs("div",{"data-slot":"skeleton-table",className:h("space-y-2",q),children:[e.jsx("div",{className:"flex gap-4 border-b pb-2",children:Array.from({length:t}).map((R,n)=>e.jsx(s,{className:"h-4 flex-1"},String(n)))}),Array.from({length:r}).map((R,n)=>e.jsx("div",{className:"flex gap-4 py-2",children:Array.from({length:t}).map((V,E)=>e.jsx(s,{className:"h-3 flex-1"},String(n*t+E)))},String(n)))]})}function M({className:r,...t}){return e.jsxs("div",{"data-slot":"skeleton-metric-tile",className:h("rounded-xl border p-4",r),...t,children:[e.jsx(s,{className:"mb-3 h-3 w-1/2"}),e.jsx(s,{className:"mb-2 h-[var(--density-operational-control-height)] w-2/3"}),e.jsx(s,{className:"h-3 w-1/3"})]})}s.__docgenInfo={description:"",methods:[],displayName:"Skeleton"};I.__docgenInfo={description:"",methods:[],displayName:"SkeletonCard"};M.__docgenInfo={description:"",methods:[],displayName:"SkeletonMetricTile"};A.__docgenInfo={description:"",methods:[],displayName:"SkeletonTable",props:{rows:{required:!1,tsType:{name:"number"},description:"",defaultValue:{value:"5",computed:!1}},columns:{required:!1,tsType:{name:"number"},description:"",defaultValue:{value:"4",computed:!1}},className:{required:!1,tsType:{name:"string"},description:""}}};const z={title:"Components/Skeleton",component:s,parameters:{layout:"centered"},tags:["autodocs"]},a={render:()=>e.jsxs("div",{style:{display:"flex",flexDirection:"column",gap:"var(--space-3)",width:300},children:[e.jsx(s,{style:{width:80,height:16}}),e.jsx(s,{style:{height:36}}),e.jsx(s,{style:{width:120,height:12}})]})},l={render:()=>e.jsxs("div",{style:{display:"flex",flexDirection:"column",gap:"var(--space-2)",width:300},children:[e.jsx(s,{style:{height:16,width:"100%"}}),e.jsx(s,{style:{height:16,width:"85%"}}),e.jsx(s,{style:{height:16,width:"70%"}})]})},i={render:()=>e.jsxs("div",{style:{display:"flex",alignItems:"center",gap:"var(--space-3)",width:300},children:[e.jsx(s,{style:{width:40,height:40,borderRadius:"9999px"}}),e.jsxs("div",{style:{display:"flex",flexDirection:"column",gap:"var(--space-2)",flex:1},children:[e.jsx(s,{style:{height:14,width:"60%"}}),e.jsx(s,{style:{height:12,width:"40%"}})]})]})},o={render:()=>e.jsx(I,{style:{width:300}})},d={render:()=>e.jsx(M,{style:{width:220}})},c={render:()=>e.jsx(A,{rows:4,columns:3,style:{width:500}})};var p,m,x;a.parameters={...a.parameters,docs:{...(p=a.parameters)==null?void 0:p.docs,source:{originalSource:`{
  render: () => <div style={{
    display: "flex",
    flexDirection: "column",
    gap: "var(--space-3)",
    width: 300
  }}>\r
      <Skeleton style={{
      width: 80,
      height: 16
    }} />\r
      <Skeleton style={{
      height: 36
    }} />\r
      <Skeleton style={{
      width: 120,
      height: 12
    }} />\r
    </div>
}`,...(x=(m=a.parameters)==null?void 0:m.docs)==null?void 0:x.source}}};var u,y,g;l.parameters={...l.parameters,docs:{...(u=l.parameters)==null?void 0:u.docs,source:{originalSource:`{
  render: () => <div style={{
    display: "flex",
    flexDirection: "column",
    gap: "var(--space-2)",
    width: 300
  }}>\r
      <Skeleton style={{
      height: 16,
      width: "100%"
    }} />\r
      <Skeleton style={{
      height: 16,
      width: "85%"
    }} />\r
      <Skeleton style={{
      height: 16,
      width: "70%"
    }} />\r
    </div>
}`,...(g=(y=l.parameters)==null?void 0:y.docs)==null?void 0:g.source}}};var f,w,j;i.parameters={...i.parameters,docs:{...(f=i.parameters)==null?void 0:f.docs,source:{originalSource:`{
  render: () => <div style={{
    display: "flex",
    alignItems: "center",
    gap: "var(--space-3)",
    width: 300
  }}>\r
      <Skeleton style={{
      width: 40,
      height: 40,
      borderRadius: "9999px"
    }} />\r
      <div style={{
      display: "flex",
      flexDirection: "column",
      gap: "var(--space-2)",
      flex: 1
    }}>\r
        <Skeleton style={{
        height: 14,
        width: "60%"
      }} />\r
        <Skeleton style={{
        height: 12,
        width: "40%"
      }} />\r
      </div>\r
    </div>
}`,...(j=(w=i.parameters)==null?void 0:w.docs)==null?void 0:j.source}}};var v,S,k;o.parameters={...o.parameters,docs:{...(v=o.parameters)==null?void 0:v.docs,source:{originalSource:`{
  render: () => <SkeletonCard style={{
    width: 300
  }} />
}`,...(k=(S=o.parameters)==null?void 0:S.docs)==null?void 0:k.source}}};var b,N,T;d.parameters={...d.parameters,docs:{...(b=d.parameters)==null?void 0:b.docs,source:{originalSource:`{
  render: () => <SkeletonMetricTile style={{
    width: 220
  }} />
}`,...(T=(N=d.parameters)==null?void 0:N.docs)==null?void 0:T.source}}};var _,D,C;c.parameters={...c.parameters,docs:{...(_=c.parameters)==null?void 0:_.docs,source:{originalSource:`{
  render: () => <SkeletonTable rows={4} columns={3} style={{
    width: 500
  }} />
}`,...(C=(D=c.parameters)==null?void 0:D.docs)==null?void 0:C.source}}};const B=["Default","Text","AvatarWithText","Card","MetricTile","Table"];export{i as AvatarWithText,o as Card,a as Default,d as MetricTile,c as Table,l as Text,B as __namedExportsOrder,z as default};
