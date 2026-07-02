import{j as r}from"./jsx-runtime-D_zvdyIk.js";import{B as c}from"./button-Dni6R342.js";import{C as a,a as s,b as o,c as i,d,e as j}from"./card-BWSEtcIE.js";import"./index-1evVQkiP.js";import"./utils-BLSKlp9E.js";import"./index-toT294on.js";import"./index-DURGLf5P.js";import"./_commonjsHelpers-CqkleIqs.js";const B={title:"Components/Card",component:a,parameters:{layout:"centered"},tags:["autodocs"]},e={render:()=>r.jsxs(a,{style:{width:350},children:[r.jsxs(s,{children:[r.jsx(o,{children:"Card Title"}),r.jsx(i,{children:"Card description goes here."})]}),r.jsx(d,{children:r.jsx("p",{style:{fontSize:"0.875rem",margin:0},children:"This is the card content area."})})]})},n={render:()=>r.jsxs(a,{style:{width:350},children:[r.jsxs(s,{children:[r.jsx(o,{children:"Confirm Action"}),r.jsx(i,{children:"Are you sure you want to proceed?"})]}),r.jsx(d,{children:r.jsx("p",{style:{fontSize:"0.875rem",margin:0},children:"This action cannot be undone."})}),r.jsxs(j,{children:[r.jsx(c,{variant:"outline",size:"sm",children:"Cancel"}),r.jsx(c,{variant:"destructive",size:"sm",children:"Confirm"})]})]})},t={parameters:{layout:"centered"},render:()=>r.jsxs(a,{style:{width:220},children:[r.jsxs(s,{children:[r.jsx(i,{children:"Total Revenue"}),r.jsx(o,{style:{fontSize:"1.75rem"},children:"$45,231"})]}),r.jsxs(d,{style:{paddingTop:0},children:[r.jsx("span",{style:{color:"var(--success)",fontSize:"0.875rem"},children:"+20.1%"}),r.jsx("span",{style:{color:"var(--muted-foreground)",fontSize:"0.875rem",marginLeft:"var(--space-1)"},children:"from last month"})]})]})};var l,m,C;e.parameters={...e.parameters,docs:{...(l=e.parameters)==null?void 0:l.docs,source:{originalSource:`{
  render: () => <Card style={{
    width: 350
  }}>\r
      <CardHeader>\r
        <CardTitle>Card Title</CardTitle>\r
        <CardDescription>Card description goes here.</CardDescription>\r
      </CardHeader>\r
      <CardContent>\r
        <p style={{
        fontSize: "0.875rem",
        margin: 0
      }}>This is the card content area.</p>\r
      </CardContent>\r
    </Card>
}`,...(C=(m=e.parameters)==null?void 0:m.docs)==null?void 0:C.source}}};var p,u,h;n.parameters={...n.parameters,docs:{...(p=n.parameters)==null?void 0:p.docs,source:{originalSource:`{
  render: () => <Card style={{
    width: 350
  }}>\r
      <CardHeader>\r
        <CardTitle>Confirm Action</CardTitle>\r
        <CardDescription>Are you sure you want to proceed?</CardDescription>\r
      </CardHeader>\r
      <CardContent>\r
        <p style={{
        fontSize: "0.875rem",
        margin: 0
      }}>This action cannot be undone.</p>\r
      </CardContent>\r
      <CardFooter>\r
        <Button variant="outline" size="sm">\r
          Cancel\r
        </Button>\r
        <Button variant="destructive" size="sm">\r
          Confirm\r
        </Button>\r
      </CardFooter>\r
    </Card>
}`,...(h=(u=n.parameters)==null?void 0:u.docs)==null?void 0:h.source}}};var f,x,y;t.parameters={...t.parameters,docs:{...(f=t.parameters)==null?void 0:f.docs,source:{originalSource:`{
  parameters: {
    layout: "centered"
  },
  render: () => <Card style={{
    width: 220
  }}>\r
      <CardHeader>\r
        <CardDescription>Total Revenue</CardDescription>\r
        <CardTitle style={{
        fontSize: "1.75rem"
      }}>$45,231</CardTitle>\r
      </CardHeader>\r
      <CardContent style={{
      paddingTop: 0
    }}>\r
        <span style={{
        color: "var(--success)",
        fontSize: "0.875rem"
      }}>+20.1%</span>\r
        <span style={{
        color: "var(--muted-foreground)",
        fontSize: "0.875rem",
        marginLeft: "var(--space-1)"
      }}>\r
          from last month\r
        </span>\r
      </CardContent>\r
    </Card>
}`,...(y=(x=t.parameters)==null?void 0:x.docs)==null?void 0:y.source}}};const F=["Default","WithFooter","MetricTile"];export{e as Default,t as MetricTile,n as WithFooter,F as __namedExportsOrder,B as default};
