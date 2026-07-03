import{j as e}from"./jsx-runtime-D_zvdyIk.js";import{c as z}from"./index-1evVQkiP.js";import{c as M}from"./utils-BLSKlp9E.js";import{S as R}from"./index-toT294on.js";import"./index-DURGLf5P.js";import"./_commonjsHelpers-CqkleIqs.js";const F={comfortable:"h-[var(--density-comfortable-control-height)] px-3 py-1",compact:"h-[var(--density-compact-control-height)] px-2 py-0.5",operational:"h-[var(--density-operational-control-height)] px-1.5 py-0.5"},G=z("inline-flex w-fit shrink-0 items-center justify-center gap-1 overflow-hidden rounded-md border text-xs font-medium whitespace-nowrap transition-[color,background-color,border-color,text-decoration-color,fill,stroke] duration-[var(--motion-duration-fast)] [&_[data-icon]]:pointer-events-none [&_[data-icon]]:size-3 [&_[data-icon]]:shrink-0",{variants:{variant:{default:"border-transparent bg-primary text-primary-foreground",destructive:"border-transparent bg-destructive text-destructive-foreground",info:"border-transparent bg-info text-info-foreground",outline:"text-foreground",secondary:"border-transparent bg-secondary text-secondary-foreground",success:"border-transparent bg-success text-success-foreground",warning:"border-transparent bg-warning text-warning-foreground"}},defaultVariants:{variant:"default"}});function r({className:P,variant:T,asChild:q=!1,density:E="compact",...N}){const U=q?R:"span";return e.jsx(U,{"data-slot":"badge",className:M(G({variant:T}),F[E],P),...N})}r.__docgenInfo={description:"",methods:[],displayName:"Badge",props:{asChild:{required:!1,tsType:{name:"boolean"},description:"",defaultValue:{value:"false",computed:!1}},density:{required:!1,tsType:{name:"union",raw:'"comfortable" | "compact" | "operational"',elements:[{name:"literal",value:'"comfortable"'},{name:"literal",value:'"compact"'},{name:"literal",value:'"operational"'}]},description:"",defaultValue:{value:'"compact"',computed:!1}}}};const Y={title:"Components/Badge",component:r,parameters:{layout:"centered"},tags:["autodocs"],argTypes:{variant:{control:"select",options:["default","secondary","destructive","outline","success","warning","info"]},density:{control:"select",options:["comfortable","compact","operational"]}}},a={args:{children:"Badge",variant:"default"}},n={args:{children:"Secondary",variant:"secondary"}},t={args:{children:"Deleted",variant:"destructive"}},s={args:{children:"Draft",variant:"outline"}},o={args:{children:"Active",variant:"success"}},c={args:{children:"Pending",variant:"warning"}},i={args:{children:"Updated",variant:"info"}},d={render:()=>e.jsxs("div",{style:{display:"flex",gap:"var(--space-2)",flexWrap:"wrap"},children:[e.jsx(r,{variant:"default",children:"Default"}),e.jsx(r,{variant:"secondary",children:"Secondary"}),e.jsx(r,{variant:"destructive",children:"Destructive"}),e.jsx(r,{variant:"outline",children:"Outline"}),e.jsx(r,{variant:"success",children:"Success"}),e.jsx(r,{variant:"warning",children:"Warning"}),e.jsx(r,{variant:"info",children:"Info"})]})};var l,u,p;a.parameters={...a.parameters,docs:{...(l=a.parameters)==null?void 0:l.docs,source:{originalSource:`{
  args: {
    children: "Badge",
    variant: "default"
  }
}`,...(p=(u=a.parameters)==null?void 0:u.docs)==null?void 0:p.source}}};var g,m,f;n.parameters={...n.parameters,docs:{...(g=n.parameters)==null?void 0:g.docs,source:{originalSource:`{
  args: {
    children: "Secondary",
    variant: "secondary"
  }
}`,...(f=(m=n.parameters)==null?void 0:m.docs)==null?void 0:f.source}}};var v,h,y;t.parameters={...t.parameters,docs:{...(v=t.parameters)==null?void 0:v.docs,source:{originalSource:`{
  args: {
    children: "Deleted",
    variant: "destructive"
  }
}`,...(y=(h=t.parameters)==null?void 0:h.docs)==null?void 0:y.source}}};var x,b,S;s.parameters={...s.parameters,docs:{...(x=s.parameters)==null?void 0:x.docs,source:{originalSource:`{
  args: {
    children: "Draft",
    variant: "outline"
  }
}`,...(S=(b=s.parameters)==null?void 0:b.docs)==null?void 0:S.source}}};var B,w,j;o.parameters={...o.parameters,docs:{...(B=o.parameters)==null?void 0:B.docs,source:{originalSource:`{
  args: {
    children: "Active",
    variant: "success"
  }
}`,...(j=(w=o.parameters)==null?void 0:w.docs)==null?void 0:j.source}}};var D,_,V;c.parameters={...c.parameters,docs:{...(D=c.parameters)==null?void 0:D.docs,source:{originalSource:`{
  args: {
    children: "Pending",
    variant: "warning"
  }
}`,...(V=(_=c.parameters)==null?void 0:_.docs)==null?void 0:V.source}}};var W,I,O;i.parameters={...i.parameters,docs:{...(W=i.parameters)==null?void 0:W.docs,source:{originalSource:`{
  args: {
    children: "Updated",
    variant: "info"
  }
}`,...(O=(I=i.parameters)==null?void 0:I.docs)==null?void 0:O.source}}};var k,A,C;d.parameters={...d.parameters,docs:{...(k=d.parameters)==null?void 0:k.docs,source:{originalSource:`{
  render: () => <div style={{
    display: "flex",
    gap: "var(--space-2)",
    flexWrap: "wrap"
  }}>\r
      <Badge variant="default">Default</Badge>\r
      <Badge variant="secondary">Secondary</Badge>\r
      <Badge variant="destructive">Destructive</Badge>\r
      <Badge variant="outline">Outline</Badge>\r
      <Badge variant="success">Success</Badge>\r
      <Badge variant="warning">Warning</Badge>\r
      <Badge variant="info">Info</Badge>\r
    </div>
}`,...(C=(A=d.parameters)==null?void 0:A.docs)==null?void 0:C.source}}};const Z=["Default","Secondary","Destructive","Outline","Success","Warning","Info","AllVariants"];export{d as AllVariants,a as Default,t as Destructive,i as Info,s as Outline,n as Secondary,o as Success,c as Warning,Z as __namedExportsOrder,Y as default};
