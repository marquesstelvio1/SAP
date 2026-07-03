import{j as e}from"./jsx-runtime-D_zvdyIk.js";import{B as r}from"./button-Dni6R342.js";import{D as t,a,b as s,c as l,d,e as c,f as u}from"./dialog-D5Bm5w_X.js";import"./index-1evVQkiP.js";import"./utils-BLSKlp9E.js";import"./index-toT294on.js";import"./index-DURGLf5P.js";import"./_commonjsHelpers-CqkleIqs.js";import"./x-CG7-CoKU.js";import"./createLucideIcon-Dm95hVBN.js";import"./index-CD-5ijnQ.js";import"./index-7nrtBLB1.js";import"./index-CXgFpmaa.js";import"./index-VYnphsZV.js";import"./index-CSQiPKB2.js";import"./index-DlxmE3PM.js";import"./index-CJvlpILa.js";import"./index-4H7aFNXa.js";import"./index-D6W88KNp.js";import"./index-CVUsnoK_.js";const W={title:"Components/Dialog",component:t,parameters:{layout:"centered"},tags:["autodocs"]},n={render:()=>e.jsxs(t,{defaultOpen:!0,children:[e.jsx(a,{asChild:!0,children:e.jsx(r,{variant:"outline",children:"Open Dialog"})}),e.jsxs(s,{children:[e.jsxs(l,{children:[e.jsx(d,{children:"Edit Profile"}),e.jsx(c,{children:"Make changes to your profile here. Click save when you are done."})]}),e.jsx("div",{style:{fontSize:"0.875rem",padding:"var(--space-2) 0"},children:e.jsx("p",{style:{margin:0,color:"var(--muted-foreground)"},children:"Dialog content goes here."})}),e.jsxs(u,{children:[e.jsx(r,{variant:"outline",size:"sm",children:"Cancel"}),e.jsx(r,{size:"sm",children:"Save Changes"})]})]})]})},o={render:()=>e.jsxs(t,{defaultOpen:!0,children:[e.jsx(a,{asChild:!0,children:e.jsx(r,{variant:"destructive",children:"Delete Account"})}),e.jsxs(s,{children:[e.jsxs(l,{children:[e.jsx(d,{children:"Are you absolutely sure?"}),e.jsx(c,{children:"This action cannot be undone. This will permanently delete your account and remove your data from our servers."})]}),e.jsxs(u,{children:[e.jsx(r,{variant:"outline",size:"sm",children:"Cancel"}),e.jsx(r,{variant:"destructive",size:"sm",children:"Delete Account"})]})]})]})},i={render:()=>e.jsxs(t,{defaultOpen:!0,children:[e.jsx(a,{asChild:!0,children:e.jsx(r,{variant:"outline",children:"Open"})}),e.jsxs(s,{showCloseButton:!1,children:[e.jsxs(l,{children:[e.jsx(d,{children:"Important Notice"}),e.jsx(c,{children:"Please read before continuing."})]}),e.jsx("div",{style:{fontSize:"0.875rem",padding:"var(--space-2) 0"},children:e.jsx("p",{style:{margin:0,color:"var(--muted-foreground)"},children:"This dialog requires explicit action — no close button is available."})}),e.jsx(u,{children:e.jsx(r,{size:"sm",children:"I Understand"})})]})]})};var g,p,m;n.parameters={...n.parameters,docs:{...(g=n.parameters)==null?void 0:g.docs,source:{originalSource:`{
  render: () => <Dialog defaultOpen>\r
      <DialogTrigger asChild>\r
        <Button variant="outline">Open Dialog</Button>\r
      </DialogTrigger>\r
      <DialogContent>\r
        <DialogHeader>\r
          <DialogTitle>Edit Profile</DialogTitle>\r
          <DialogDescription>\r
            Make changes to your profile here. Click save when you are done.\r
          </DialogDescription>\r
        </DialogHeader>\r
        <div style={{
        fontSize: "0.875rem",
        padding: "var(--space-2) 0"
      }}>\r
          <p style={{
          margin: 0,
          color: "var(--muted-foreground)"
        }}>Dialog content goes here.</p>\r
        </div>\r
        <DialogFooter>\r
          <Button variant="outline" size="sm">\r
            Cancel\r
          </Button>\r
          <Button size="sm">Save Changes</Button>\r
        </DialogFooter>\r
      </DialogContent>\r
    </Dialog>
}`,...(m=(p=n.parameters)==null?void 0:p.docs)==null?void 0:m.source}}};var D,h,v;o.parameters={...o.parameters,docs:{...(D=o.parameters)==null?void 0:D.docs,source:{originalSource:`{
  render: () => <Dialog defaultOpen>\r
      <DialogTrigger asChild>\r
        <Button variant="destructive">Delete Account</Button>\r
      </DialogTrigger>\r
      <DialogContent>\r
        <DialogHeader>\r
          <DialogTitle>Are you absolutely sure?</DialogTitle>\r
          <DialogDescription>\r
            This action cannot be undone. This will permanently delete your account and remove your\r
            data from our servers.\r
          </DialogDescription>\r
        </DialogHeader>\r
        <DialogFooter>\r
          <Button variant="outline" size="sm">\r
            Cancel\r
          </Button>\r
          <Button variant="destructive" size="sm">\r
            Delete Account\r
          </Button>\r
        </DialogFooter>\r
      </DialogContent>\r
    </Dialog>
}`,...(v=(h=o.parameters)==null?void 0:h.docs)==null?void 0:v.source}}};var x,j,f;i.parameters={...i.parameters,docs:{...(x=i.parameters)==null?void 0:x.docs,source:{originalSource:`{
  render: () => <Dialog defaultOpen>\r
      <DialogTrigger asChild>\r
        <Button variant="outline">Open</Button>\r
      </DialogTrigger>\r
      <DialogContent showCloseButton={false}>\r
        <DialogHeader>\r
          <DialogTitle>Important Notice</DialogTitle>\r
          <DialogDescription>Please read before continuing.</DialogDescription>\r
        </DialogHeader>\r
        <div style={{
        fontSize: "0.875rem",
        padding: "var(--space-2) 0"
      }}>\r
          <p style={{
          margin: 0,
          color: "var(--muted-foreground)"
        }}>\r
            This dialog requires explicit action — no close button is available.\r
          </p>\r
        </div>\r
        <DialogFooter>\r
          <Button size="sm">I Understand</Button>\r
        </DialogFooter>\r
      </DialogContent>\r
    </Dialog>
}`,...(f=(j=i.parameters)==null?void 0:j.docs)==null?void 0:f.source}}};const _=["Default","ConfirmDelete","WithoutCloseButton"];export{o as ConfirmDelete,n as Default,i as WithoutCloseButton,_ as __namedExportsOrder,W as default};
