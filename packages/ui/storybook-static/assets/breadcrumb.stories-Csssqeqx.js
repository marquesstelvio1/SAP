import{j as r}from"./jsx-runtime-D_zvdyIk.js";import{c as d}from"./utils-BLSKlp9E.js";import{c as P}from"./createLucideIcon-Dm95hVBN.js";import{S as C}from"./index-toT294on.js";import"./index-DURGLf5P.js";import"./_commonjsHelpers-CqkleIqs.js";/**
 * @license lucide-react v0.468.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const E=P("ChevronRight",[["path",{d:"m9 18 6-6-6-6",key:"mthhwq"}]]);/**
 * @license lucide-react v0.468.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const v=P("Ellipsis",[["circle",{cx:"12",cy:"12",r:"1",key:"41hilf"}],["circle",{cx:"19",cy:"12",r:"1",key:"1wjl8i"}],["circle",{cx:"5",cy:"12",r:"1",key:"1pcz8c"}]]);function m({...a}){return r.jsx("nav",{"data-slot":"breadcrumb","aria-label":"breadcrumb",...a})}function t({className:a,...n}){return r.jsx("ol",{"data-slot":"breadcrumb-list",className:d("flex flex-wrap items-center gap-1.5 break-words text-sm text-muted-foreground sm:gap-2.5",a),...n})}function e({className:a,...n}){return r.jsx("li",{"data-slot":"breadcrumb-item",className:d("inline-flex items-center gap-1.5",a),...n})}function c({className:a,asChild:n=!1,...N}){const z=n?C:"a";return r.jsx(z,{"data-slot":"breadcrumb-link",className:d("transition-colors hover:text-foreground",a),...N})}function o({className:a,...n}){return r.jsx("span",{"data-slot":"breadcrumb-page",role:"link","aria-disabled":"true","aria-current":"page",tabIndex:-1,className:d("font-normal text-foreground",a),...n})}function s({className:a,...n}){return r.jsx("li",{"data-slot":"breadcrumb-separator",role:"presentation","aria-hidden":"true",className:d("[&>svg]:size-3.5",a),...n,children:r.jsx(E,{})})}function _({className:a,...n}){return r.jsxs("span",{"data-slot":"breadcrumb-ellipsis",role:"presentation","aria-hidden":"true",className:d("flex size-9 items-center justify-center",a),...n,children:[r.jsx(v,{className:"size-4"}),r.jsx("span",{className:"sr-only",children:"More"})]})}m.__docgenInfo={description:"",methods:[],displayName:"Breadcrumb"};_.__docgenInfo={description:"",methods:[],displayName:"BreadcrumbEllipsis"};e.__docgenInfo={description:"",methods:[],displayName:"BreadcrumbItem"};c.__docgenInfo={description:"",methods:[],displayName:"BreadcrumbLink",props:{asChild:{required:!1,tsType:{name:"boolean"},description:"",defaultValue:{value:"false",computed:!1}}}};t.__docgenInfo={description:"",methods:[],displayName:"BreadcrumbList"};o.__docgenInfo={description:"",methods:[],displayName:"BreadcrumbPage"};s.__docgenInfo={description:"",methods:[],displayName:"BreadcrumbSeparator"};const q={title:"Components/Breadcrumb",component:m,parameters:{layout:"centered"},tags:["autodocs"]},i={render:()=>r.jsx(m,{children:r.jsxs(t,{children:[r.jsx(e,{children:r.jsx(c,{href:"/",children:"Home"})}),r.jsx(s,{}),r.jsx(e,{children:r.jsx(c,{href:"/products",children:"Products"})}),r.jsx(s,{}),r.jsx(e,{children:r.jsx(o,{children:"Details"})})]})})},u={render:()=>r.jsx(m,{children:r.jsxs(t,{children:[r.jsx(e,{children:r.jsx(c,{href:"/",children:"Home"})}),r.jsx(s,{}),r.jsx(e,{children:r.jsx(c,{href:"/organizations",children:"Organizations"})}),r.jsx(s,{}),r.jsx(e,{children:r.jsx(c,{href:"/organizations/acme",children:"Acme Corp"})}),r.jsx(s,{}),r.jsx(e,{children:r.jsx(c,{href:"/organizations/acme/warehouses",children:"Warehouses"})}),r.jsx(s,{}),r.jsx(e,{children:r.jsx(o,{children:"Warehouse #42"})})]})})},l={render:()=>r.jsx(m,{children:r.jsxs(t,{children:[r.jsx(e,{children:r.jsx(c,{href:"/",children:"Home"})}),r.jsx(s,{}),r.jsx(e,{children:r.jsx(_,{})}),r.jsx(s,{}),r.jsx(e,{children:r.jsx(c,{href:"/docs/components",children:"Components"})}),r.jsx(s,{}),r.jsx(e,{children:r.jsx(o,{children:"Breadcrumb"})})]})})},b={render:()=>r.jsx(m,{children:r.jsx(t,{children:r.jsx(e,{children:r.jsx(o,{children:"Dashboard"})})})})};var B,p,h;i.parameters={...i.parameters,docs:{...(B=i.parameters)==null?void 0:B.docs,source:{originalSource:`{
  render: () => <Breadcrumb>\r
      <BreadcrumbList>\r
        <BreadcrumbItem>\r
          <BreadcrumbLink href="/">Home</BreadcrumbLink>\r
        </BreadcrumbItem>\r
        <BreadcrumbSeparator />\r
        <BreadcrumbItem>\r
          <BreadcrumbLink href="/products">Products</BreadcrumbLink>\r
        </BreadcrumbItem>\r
        <BreadcrumbSeparator />\r
        <BreadcrumbItem>\r
          <BreadcrumbPage>Details</BreadcrumbPage>\r
        </BreadcrumbItem>\r
      </BreadcrumbList>\r
    </Breadcrumb>
}`,...(h=(p=i.parameters)==null?void 0:p.docs)==null?void 0:h.source}}};var x,j,f;u.parameters={...u.parameters,docs:{...(x=u.parameters)==null?void 0:x.docs,source:{originalSource:`{
  render: () => <Breadcrumb>\r
      <BreadcrumbList>\r
        <BreadcrumbItem>\r
          <BreadcrumbLink href="/">Home</BreadcrumbLink>\r
        </BreadcrumbItem>\r
        <BreadcrumbSeparator />\r
        <BreadcrumbItem>\r
          <BreadcrumbLink href="/organizations">Organizations</BreadcrumbLink>\r
        </BreadcrumbItem>\r
        <BreadcrumbSeparator />\r
        <BreadcrumbItem>\r
          <BreadcrumbLink href="/organizations/acme">Acme Corp</BreadcrumbLink>\r
        </BreadcrumbItem>\r
        <BreadcrumbSeparator />\r
        <BreadcrumbItem>\r
          <BreadcrumbLink href="/organizations/acme/warehouses">Warehouses</BreadcrumbLink>\r
        </BreadcrumbItem>\r
        <BreadcrumbSeparator />\r
        <BreadcrumbItem>\r
          <BreadcrumbPage>Warehouse #42</BreadcrumbPage>\r
        </BreadcrumbItem>\r
      </BreadcrumbList>\r
    </Breadcrumb>
}`,...(f=(j=u.parameters)==null?void 0:j.docs)==null?void 0:f.source}}};var g,I,L;l.parameters={...l.parameters,docs:{...(g=l.parameters)==null?void 0:g.docs,source:{originalSource:`{
  render: () => <Breadcrumb>\r
      <BreadcrumbList>\r
        <BreadcrumbItem>\r
          <BreadcrumbLink href="/">Home</BreadcrumbLink>\r
        </BreadcrumbItem>\r
        <BreadcrumbSeparator />\r
        <BreadcrumbItem>\r
          <BreadcrumbEllipsis />\r
        </BreadcrumbItem>\r
        <BreadcrumbSeparator />\r
        <BreadcrumbItem>\r
          <BreadcrumbLink href="/docs/components">Components</BreadcrumbLink>\r
        </BreadcrumbItem>\r
        <BreadcrumbSeparator />\r
        <BreadcrumbItem>\r
          <BreadcrumbPage>Breadcrumb</BreadcrumbPage>\r
        </BreadcrumbItem>\r
      </BreadcrumbList>\r
    </Breadcrumb>
}`,...(L=(I=l.parameters)==null?void 0:I.docs)==null?void 0:L.source}}};var k,S,y;b.parameters={...b.parameters,docs:{...(k=b.parameters)==null?void 0:k.docs,source:{originalSource:`{
  render: () => <Breadcrumb>\r
      <BreadcrumbList>\r
        <BreadcrumbItem>\r
          <BreadcrumbPage>Dashboard</BreadcrumbPage>\r
        </BreadcrumbItem>\r
      </BreadcrumbList>\r
    </Breadcrumb>
}`,...(y=(S=b.parameters)==null?void 0:S.docs)==null?void 0:y.source}}};const A=["Default","LongPath","WithEllipsis","SinglePage"];export{i as Default,u as LongPath,b as SinglePage,l as WithEllipsis,A as __namedExportsOrder,q as default};
