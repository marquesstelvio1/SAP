import{j as e}from"./jsx-runtime-D_zvdyIk.js";import{B as r}from"./button-Dni6R342.js";import{I as f}from"./input-DUD-rXCE.js";import{L as x}from"./label-DBh-5I1j.js";import{c as L}from"./index-1evVQkiP.js";import{c as a}from"./utils-BLSKlp9E.js";import{X as V}from"./x-CG7-CoKU.js";import{R,T as A,C as E,a as k,b as q,D as J,P as M,O as Q}from"./index-CD-5ijnQ.js";import"./index-toT294on.js";import"./index-DURGLf5P.js";import"./_commonjsHelpers-CqkleIqs.js";import"./index-CXgFpmaa.js";import"./index-VYnphsZV.js";import"./index-CSQiPKB2.js";import"./createLucideIcon-Dm95hVBN.js";import"./index-7nrtBLB1.js";import"./index-DlxmE3PM.js";import"./index-CJvlpILa.js";import"./index-4H7aFNXa.js";import"./index-D6W88KNp.js";import"./index-CVUsnoK_.js";function i({...t}){return e.jsx(R,{"data-slot":"sheet",...t})}function s({...t}){return e.jsx(A,{"data-slot":"sheet-trigger",...t})}function O({...t}){return e.jsx(k,{"data-slot":"sheet-close",...t})}function w({...t}){return e.jsx(M,{"data-slot":"sheet-portal",...t})}function I({className:t,...n}){return e.jsx(Q,{"data-slot":"sheet-overlay",className:a("fixed inset-0 z-overlay bg-background/80 backdrop-blur-sm transition-opacity duration-[var(--motion-duration-normal)] data-[state=closed]:opacity-0 data-[state=open]:opacity-100",t),...n})}const W=L("fixed gap-4 bg-background p-6 shadow-overlay outline-none transition-transform duration-[var(--motion-duration-normal)]",{variants:{side:{bottom:"inset-x-0 bottom-0 border-t data-[state=closed]:translate-y-full data-[state=open]:translate-y-0",left:"inset-y-0 left-0 h-full w-3/4 border-r data-[state=closed]:-translate-x-full data-[state=open]:translate-x-0 sm:max-w-sm",right:"inset-y-0 right-0 h-full w-3/4 border-l data-[state=closed]:translate-x-full data-[state=open]:translate-x-0 sm:max-w-sm",top:"inset-x-0 top-0 border-b data-[state=closed]:-translate-y-full data-[state=open]:translate-y-0"}},defaultVariants:{side:"right"}});function o({side:t="right",className:n,children:P,showCloseButton:F=!0,...z}){return e.jsxs(w,{children:[e.jsx(I,{}),e.jsxs(E,{"data-slot":"sheet-content",className:a(W({side:t,className:n})),...z,children:[P,F?e.jsxs(k,{"data-slot":"sheet-close",className:"absolute top-4 right-4 rounded-xs opacity-70 outline-none transition-opacity duration-[var(--motion-duration-fast)] hover:opacity-100 focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:pointer-events-none [&_svg]:pointer-events-none [&_svg]:size-4",children:[e.jsx(V,{"aria-hidden":"true"}),e.jsx("span",{className:"sr-only",children:"Fechar"})]}):null]})]})}function l({className:t,...n}){return e.jsx("div",{"data-slot":"sheet-header",className:a("flex flex-col gap-2 text-left",t),...n})}function H({className:t,...n}){return e.jsx("div",{"data-slot":"sheet-footer",className:a("flex flex-col gap-2",t),...n})}function d({className:t,...n}){return e.jsx(q,{"data-slot":"sheet-title",className:a("font-semibold text-lg tracking-tight",t),...n})}function c({className:t,...n}){return e.jsx(J,{"data-slot":"sheet-description",className:a("text-muted-foreground text-sm",t),...n})}i.__docgenInfo={description:"",methods:[],displayName:"Sheet"};O.__docgenInfo={description:"",methods:[],displayName:"SheetClose"};o.__docgenInfo={description:"",methods:[],displayName:"SheetContent",props:{showCloseButton:{required:!1,tsType:{name:"boolean"},description:"",defaultValue:{value:"true",computed:!1}},side:{defaultValue:{value:'"right"',computed:!1},required:!1}}};c.__docgenInfo={description:"",methods:[],displayName:"SheetDescription"};H.__docgenInfo={description:"",methods:[],displayName:"SheetFooter"};l.__docgenInfo={description:"",methods:[],displayName:"SheetHeader"};I.__docgenInfo={description:"",methods:[],displayName:"SheetOverlay"};w.__docgenInfo={description:"",methods:[],displayName:"SheetPortal"};d.__docgenInfo={description:"",methods:[],displayName:"SheetTitle"};s.__docgenInfo={description:"",methods:[],displayName:"SheetTrigger"};const me={title:"Components/Sheet",component:i,parameters:{layout:"centered"},tags:["autodocs"]},h={render:()=>e.jsxs(i,{defaultOpen:!0,children:[e.jsx(s,{asChild:!0,children:e.jsx(r,{variant:"outline",children:"Open Sheet"})}),e.jsxs(o,{side:"right",children:[e.jsxs(l,{children:[e.jsx(d,{children:"Edit Profile"}),e.jsx(c,{children:"Make changes to your profile here. Click save when you are done."})]}),e.jsxs("div",{style:{display:"flex",flexDirection:"column",gap:"var(--space-4)",padding:"var(--space-4) 0"},children:[e.jsxs("div",{children:[e.jsx(x,{htmlFor:"name",children:"Name"}),e.jsx(f,{id:"name",defaultValue:"John Doe"})]}),e.jsxs("div",{children:[e.jsx(x,{htmlFor:"email",children:"Email"}),e.jsx(f,{id:"email",defaultValue:"john@example.com"})]})]}),e.jsxs(H,{children:[e.jsx(O,{asChild:!0,children:e.jsx(r,{variant:"outline",size:"sm",children:"Cancel"})}),e.jsx(r,{size:"sm",children:"Save Changes"})]})]})]})},p={render:()=>e.jsxs(i,{defaultOpen:!0,children:[e.jsx(s,{asChild:!0,children:e.jsx(r,{variant:"outline",children:"Open Navigation"})}),e.jsxs(o,{side:"left",children:[e.jsxs(l,{children:[e.jsx(d,{children:"Navigation"}),e.jsx(c,{children:"Browse through the available sections."})]}),e.jsx("nav",{style:{display:"flex",flexDirection:"column",gap:"var(--space-2)",padding:"var(--space-4) 0"},children:["Dashboard","Analytics","Settings","Help"].map(t=>e.jsx(r,{variant:"ghost",style:{justifyContent:"flex-start"},children:t},t))})]})]})},u={render:()=>e.jsxs(i,{defaultOpen:!0,children:[e.jsx(s,{asChild:!0,children:e.jsx(r,{variant:"outline",children:"Open Notification"})}),e.jsxs(o,{side:"top",children:[e.jsxs(l,{children:[e.jsx(d,{children:"Notifications"}),e.jsx(c,{children:"You have 3 unread notifications."})]}),e.jsx("div",{style:{display:"flex",flexDirection:"column",gap:"var(--space-3)",padding:"var(--space-4) 0"},children:["New login detected","Payment received","Weekly report ready"].map(t=>e.jsx("div",{style:{padding:"var(--space-3)",borderRadius:"var(--radius-md)",background:"var(--muted)",fontSize:"0.875rem"},children:t},t))})]})]})},m={render:()=>e.jsxs(i,{defaultOpen:!0,children:[e.jsx(s,{asChild:!0,children:e.jsx(r,{variant:"outline",children:"Open Actions"})}),e.jsxs(o,{side:"bottom",children:[e.jsxs(l,{children:[e.jsx(d,{children:"Quick Actions"}),e.jsx(c,{children:"Select an action to perform."})]}),e.jsx("div",{style:{display:"flex",flexDirection:"column",gap:"var(--space-2)",padding:"var(--space-4) 0"},children:["Share","Download","Print","Bookmark"].map(t=>e.jsx(r,{variant:"outline",style:{justifyContent:"flex-start"},children:t},t))})]})]})};var g,v,S;h.parameters={...h.parameters,docs:{...(g=h.parameters)==null?void 0:g.docs,source:{originalSource:`{
  render: () => <Sheet defaultOpen>\r
      <SheetTrigger asChild>\r
        <Button variant="outline">Open Sheet</Button>\r
      </SheetTrigger>\r
      <SheetContent side="right">\r
        <SheetHeader>\r
          <SheetTitle>Edit Profile</SheetTitle>\r
          <SheetDescription>\r
            Make changes to your profile here. Click save when you are done.\r
          </SheetDescription>\r
        </SheetHeader>\r
        <div style={{
        display: "flex",
        flexDirection: "column",
        gap: "var(--space-4)",
        padding: "var(--space-4) 0"
      }}>\r
          <div>\r
            <Label htmlFor="name">Name</Label>\r
            <Input id="name" defaultValue="John Doe" />\r
          </div>\r
          <div>\r
            <Label htmlFor="email">Email</Label>\r
            <Input id="email" defaultValue="john@example.com" />\r
          </div>\r
        </div>\r
        <SheetFooter>\r
          <SheetClose asChild>\r
            <Button variant="outline" size="sm">\r
              Cancel\r
            </Button>\r
          </SheetClose>\r
          <Button size="sm">Save Changes</Button>\r
        </SheetFooter>\r
      </SheetContent>\r
    </Sheet>
}`,...(S=(v=h.parameters)==null?void 0:v.docs)==null?void 0:S.source}}};var y,j,C;p.parameters={...p.parameters,docs:{...(y=p.parameters)==null?void 0:y.docs,source:{originalSource:`{
  render: () => <Sheet defaultOpen>\r
      <SheetTrigger asChild>\r
        <Button variant="outline">Open Navigation</Button>\r
      </SheetTrigger>\r
      <SheetContent side="left">\r
        <SheetHeader>\r
          <SheetTitle>Navigation</SheetTitle>\r
          <SheetDescription>Browse through the available sections.</SheetDescription>\r
        </SheetHeader>\r
        <nav style={{
        display: "flex",
        flexDirection: "column",
        gap: "var(--space-2)",
        padding: "var(--space-4) 0"
      }}>\r
          {["Dashboard", "Analytics", "Settings", "Help"].map(item => <Button key={item} variant="ghost" style={{
          justifyContent: "flex-start"
        }}>\r
              {item}\r
            </Button>)}\r
        </nav>\r
      </SheetContent>\r
    </Sheet>
}`,...(C=(j=p.parameters)==null?void 0:j.docs)==null?void 0:C.source}}};var b,N,D;u.parameters={...u.parameters,docs:{...(b=u.parameters)==null?void 0:b.docs,source:{originalSource:`{
  render: () => <Sheet defaultOpen>\r
      <SheetTrigger asChild>\r
        <Button variant="outline">Open Notification</Button>\r
      </SheetTrigger>\r
      <SheetContent side="top">\r
        <SheetHeader>\r
          <SheetTitle>Notifications</SheetTitle>\r
          <SheetDescription>You have 3 unread notifications.</SheetDescription>\r
        </SheetHeader>\r
        <div style={{
        display: "flex",
        flexDirection: "column",
        gap: "var(--space-3)",
        padding: "var(--space-4) 0"
      }}>\r
          {["New login detected", "Payment received", "Weekly report ready"].map(item => <div key={item} style={{
          padding: "var(--space-3)",
          borderRadius: "var(--radius-md)",
          background: "var(--muted)",
          fontSize: "0.875rem"
        }}>\r
              {item}\r
            </div>)}\r
        </div>\r
      </SheetContent>\r
    </Sheet>
}`,...(D=(N=u.parameters)==null?void 0:N.docs)==null?void 0:D.source}}};var T,B,_;m.parameters={...m.parameters,docs:{...(T=m.parameters)==null?void 0:T.docs,source:{originalSource:`{
  render: () => <Sheet defaultOpen>\r
      <SheetTrigger asChild>\r
        <Button variant="outline">Open Actions</Button>\r
      </SheetTrigger>\r
      <SheetContent side="bottom">\r
        <SheetHeader>\r
          <SheetTitle>Quick Actions</SheetTitle>\r
          <SheetDescription>Select an action to perform.</SheetDescription>\r
        </SheetHeader>\r
        <div style={{
        display: "flex",
        flexDirection: "column",
        gap: "var(--space-2)",
        padding: "var(--space-4) 0"
      }}>\r
          {["Share", "Download", "Print", "Bookmark"].map(item => <Button key={item} variant="outline" style={{
          justifyContent: "flex-start"
        }}>\r
              {item}\r
            </Button>)}\r
        </div>\r
      </SheetContent>\r
    </Sheet>
}`,...(_=(B=m.parameters)==null?void 0:B.docs)==null?void 0:_.source}}};const fe=["Right","Left","Top","Bottom"];export{m as Bottom,p as Left,h as Right,u as Top,fe as __namedExportsOrder,me as default};
