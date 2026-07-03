import{I as R}from"./input-DUD-rXCE.js";import"./jsx-runtime-D_zvdyIk.js";import"./utils-BLSKlp9E.js";const C={title:"Components/Input",component:R,parameters:{layout:"centered"},tags:["autodocs"],argTypes:{type:{control:"select",options:["text","email","password","number","tel","url","search"]},placeholder:{control:"text"},disabled:{control:"boolean"},required:{control:"boolean"}}},e={args:{placeholder:"Enter value…",type:"text"}},r={args:{defaultValue:"Some value",type:"text"}},a={args:{type:"email",placeholder:"email@example.com"}},s={args:{type:"password",placeholder:"Enter password",defaultValue:"supersecret"}},o={args:{placeholder:"Disabled input",disabled:!0}},t={args:{placeholder:"Required field",required:!0}},l={args:{placeholder:"Invalid input","aria-invalid":!0}};var n,c,p;e.parameters={...e.parameters,docs:{...(n=e.parameters)==null?void 0:n.docs,source:{originalSource:`{
  args: {
    placeholder: "Enter value…",
    type: "text"
  }
}`,...(p=(c=e.parameters)==null?void 0:c.docs)==null?void 0:p.source}}};var d,u,i;r.parameters={...r.parameters,docs:{...(d=r.parameters)==null?void 0:d.docs,source:{originalSource:`{
  args: {
    defaultValue: "Some value",
    type: "text"
  }
}`,...(i=(u=r.parameters)==null?void 0:u.docs)==null?void 0:i.source}}};var m,g,h;a.parameters={...a.parameters,docs:{...(m=a.parameters)==null?void 0:m.docs,source:{originalSource:`{
  args: {
    type: "email",
    placeholder: "email@example.com"
  }
}`,...(h=(g=a.parameters)==null?void 0:g.docs)==null?void 0:h.source}}};var y,b,f;s.parameters={...s.parameters,docs:{...(y=s.parameters)==null?void 0:y.docs,source:{originalSource:`{
  args: {
    type: "password",
    placeholder: "Enter password",
    defaultValue: "supersecret"
  }
}`,...(f=(b=s.parameters)==null?void 0:b.docs)==null?void 0:f.source}}};var x,E,S;o.parameters={...o.parameters,docs:{...(x=o.parameters)==null?void 0:x.docs,source:{originalSource:`{
  args: {
    placeholder: "Disabled input",
    disabled: true
  }
}`,...(S=(E=o.parameters)==null?void 0:E.docs)==null?void 0:S.source}}};var v,q,w;t.parameters={...t.parameters,docs:{...(v=t.parameters)==null?void 0:v.docs,source:{originalSource:`{
  args: {
    placeholder: "Required field",
    required: true
  }
}`,...(w=(q=t.parameters)==null?void 0:q.docs)==null?void 0:w.source}}};var D,V,I;l.parameters={...l.parameters,docs:{...(D=l.parameters)==null?void 0:D.docs,source:{originalSource:`{
  args: {
    placeholder: "Invalid input",
    "aria-invalid": true
  }
}`,...(I=(V=l.parameters)==null?void 0:V.docs)==null?void 0:I.source}}};const O=["Default","WithValue","Email","Password","Disabled","Required","WithError"];export{e as Default,o as Disabled,a as Email,s as Password,t as Required,l as WithError,r as WithValue,O as __namedExportsOrder,C as default};
