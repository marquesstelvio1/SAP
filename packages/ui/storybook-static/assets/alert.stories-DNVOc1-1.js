import{j as e}from"./jsx-runtime-D_zvdyIk.js";import{c as p}from"./utils-BLSKlp9E.js";import{c as u}from"./createLucideIcon-Dm95hVBN.js";import"./index-DURGLf5P.js";import"./_commonjsHelpers-CqkleIqs.js";/**
 * @license lucide-react v0.468.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const _=u("CircleCheckBig",[["path",{d:"M21.801 10A10 10 0 1 1 17 3.335",key:"yps3ct"}],["path",{d:"m9 11 3 3L22 4",key:"1pflzl"}]]);/**
 * @license lucide-react v0.468.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const C=u("Info",[["circle",{cx:"12",cy:"12",r:"10",key:"1mglay"}],["path",{d:"M12 16v-4",key:"1dtifu"}],["path",{d:"M12 8h.01",key:"e9boi3"}]]);/**
 * @license lucide-react v0.468.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const b=u("TriangleAlert",[["path",{d:"m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3",key:"wmoenq"}],["path",{d:"M12 9v4",key:"juzpu7"}],["path",{d:"M12 17h.01",key:"p32p05"}]]);function r({className:n,...a}){return e.jsx("div",{"data-slot":"alert",className:p("relative w-full rounded-lg border px-4 py-3 text-sm grid gap-1 [&>svg+div]:translate-y-[-3px] [&>svg]:absolute [&>svg]:left-4 [&>svg]:top-4 [&>svg]:text-foreground [&>svg~*]:pl-7",n),...a})}function t({className:n,...a}){return e.jsx("h5",{"data-slot":"alert-title",className:p("mb-1 font-medium leading-none tracking-tight",n),...a})}function s({className:n,...a}){return e.jsx("div",{"data-slot":"alert-description",className:p("text-sm [&_p]:leading-relaxed",n),...a})}r.__docgenInfo={description:"",methods:[],displayName:"Alert"};s.__docgenInfo={description:"",methods:[],displayName:"AlertDescription"};t.__docgenInfo={description:"",methods:[],displayName:"AlertTitle"};const W={title:"Components/Alert",component:r,parameters:{layout:"centered"},tags:["autodocs"],argTypes:{className:{control:"text"}}},o={render:()=>e.jsxs(r,{children:[e.jsx(t,{children:"Heads up!"}),e.jsx(s,{children:"This is a default alert with some information."})]})},i={render:()=>e.jsxs(r,{children:[e.jsx(b,{}),e.jsx(t,{children:"Error"}),e.jsx(s,{children:"Something went wrong. Please try again later."})]})},c={render:()=>e.jsxs(r,{children:[e.jsx(C,{}),e.jsx(t,{children:"Information"}),e.jsx(s,{children:"A new update is available. Restart to apply changes."})]})},l={render:()=>e.jsxs(r,{children:[e.jsx(_,{}),e.jsx(t,{children:"Success"}),e.jsx(s,{children:"Your changes have been saved successfully."})]})},d={render:()=>e.jsxs(r,{children:[e.jsx(C,{}),e.jsx(t,{children:"Terms of Service Update"}),e.jsx(s,{children:"We have updated our terms of service effective March 15, 2026. The key changes include updated data processing descriptions, clarified content ownership terms, and new dispute resolution procedures. Please review the full document for details."})]})};var m,h,f;o.parameters={...o.parameters,docs:{...(m=o.parameters)==null?void 0:m.docs,source:{originalSource:`{
  render: () => <Alert>\r
      <AlertTitle>Heads up!</AlertTitle>\r
      <AlertDescription>This is a default alert with some information.</AlertDescription>\r
    </Alert>
}`,...(f=(h=o.parameters)==null?void 0:h.docs)==null?void 0:f.source}}};var g,A,x;i.parameters={...i.parameters,docs:{...(g=i.parameters)==null?void 0:g.docs,source:{originalSource:`{
  render: () => <Alert>\r
      <AlertTriangleIcon />\r
      <AlertTitle>Error</AlertTitle>\r
      <AlertDescription>Something went wrong. Please try again later.</AlertDescription>\r
    </Alert>
}`,...(x=(A=i.parameters)==null?void 0:A.docs)==null?void 0:x.source}}};var v,y,j;c.parameters={...c.parameters,docs:{...(v=c.parameters)==null?void 0:v.docs,source:{originalSource:`{
  render: () => <Alert>\r
      <InfoIcon />\r
      <AlertTitle>Information</AlertTitle>\r
      <AlertDescription>A new update is available. Restart to apply changes.</AlertDescription>\r
    </Alert>
}`,...(j=(y=c.parameters)==null?void 0:y.docs)==null?void 0:j.source}}};var T,w,D;l.parameters={...l.parameters,docs:{...(T=l.parameters)==null?void 0:T.docs,source:{originalSource:`{
  render: () => <Alert>\r
      <CheckCircleIcon />\r
      <AlertTitle>Success</AlertTitle>\r
      <AlertDescription>Your changes have been saved successfully.</AlertDescription>\r
    </Alert>
}`,...(D=(w=l.parameters)==null?void 0:w.docs)==null?void 0:D.source}}};var I,k,S;d.parameters={...d.parameters,docs:{...(I=d.parameters)==null?void 0:I.docs,source:{originalSource:`{
  render: () => <Alert>\r
      <InfoIcon />\r
      <AlertTitle>Terms of Service Update</AlertTitle>\r
      <AlertDescription>\r
        We have updated our terms of service effective March 15, 2026. The key changes include\r
        updated data processing descriptions, clarified content ownership terms, and new dispute\r
        resolution procedures. Please review the full document for details.\r
      </AlertDescription>\r
    </Alert>
}`,...(S=(k=d.parameters)==null?void 0:k.docs)==null?void 0:S.source}}};const R=["Default","Destructive","Info","Success","WithLongContent"];export{o as Default,i as Destructive,c as Info,l as Success,d as WithLongContent,R as __namedExportsOrder,W as default};
