import assert from "node:assert/strict";
import { test } from "node:test";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "../../../dist/components/pagination.js";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "../../../dist/components/table.js";

/* -------------------------------------------------------------------------- */
/* Table sub-components                                                       */
/* -------------------------------------------------------------------------- */

test("Table is a function and returns a React element wrapping a table", () => {
  assert.equal(typeof Table, "function");
  const element = Table({});
  assert.equal(element.$$typeof, Symbol.for("react.transitional.element"));
  // Table wraps in a div with data-slot "table-container"
  assert.equal(element.type, "div");
  assert.equal(element.props["data-slot"], "table-container");
  // inner table has data-slot "table"
  assert.equal(element.props.children.props["data-slot"], "table");
});

test("Table children table gets merged className", () => {
  const element = Table({ className: "custom-table" });
  assert.ok(element.props.children.props.className.includes("custom-table"));
  assert.ok(element.props.children.props.className.includes("w-full"));
});

test("TableHeader is a function and returns a React element", () => {
  assert.equal(typeof TableHeader, "function");
  const element = TableHeader({});
  assert.equal(element.props["data-slot"], "table-header");
});

test("TableHeader merges custom className", () => {
  const element = TableHeader({ className: "custom" });
  assert.ok(element.props.className.includes("custom"));
});

test("TableBody is a function and returns a React element", () => {
  assert.equal(typeof TableBody, "function");
  const element = TableBody({});
  assert.equal(element.props["data-slot"], "table-body");
});

test("TableBody merges custom className", () => {
  const element = TableBody({ className: "custom" });
  assert.ok(element.props.className.includes("custom"));
});

test("TableRow is a function and returns a React element", () => {
  assert.equal(typeof TableRow, "function");
  const element = TableRow({});
  assert.equal(element.props["data-slot"], "table-row");
  assert.ok(element.props.className.includes("border-b"));
});

test("TableRow merges custom className", () => {
  const element = TableRow({ className: "custom" });
  assert.ok(element.props.className.includes("custom"));
});

test("TableHead is a function and returns a React element", () => {
  assert.equal(typeof TableHead, "function");
  const element = TableHead({});
  assert.equal(element.type, "th");
  assert.equal(element.props["data-slot"], "table-head");
  assert.ok(element.props.className.includes("text-left"));
});

test("TableHead merges custom className", () => {
  const element = TableHead({ className: "custom" });
  assert.ok(element.props.className.includes("custom"));
});

test("TableCell is a function and returns a React element", () => {
  assert.equal(typeof TableCell, "function");
  const element = TableCell({});
  assert.equal(element.type, "td");
  assert.equal(element.props["data-slot"], "table-cell");
  assert.ok(element.props.className.includes("p-2"));
});

test("TableCell merges custom className", () => {
  const element = TableCell({ className: "custom" });
  assert.ok(element.props.className.includes("custom"));
});

test("TableFooter is a function and returns a React element", () => {
  assert.equal(typeof TableFooter, "function");
  const element = TableFooter({});
  assert.equal(element.type, "tfoot");
  assert.equal(element.props["data-slot"], "table-footer");
  assert.ok(element.props.className.includes("border-t"));
});

test("TableFooter merges custom className", () => {
  const element = TableFooter({ className: "custom" });
  assert.ok(element.props.className.includes("custom"));
});

test("TableCaption is a function and returns a React element", () => {
  assert.equal(typeof TableCaption, "function");
  const element = TableCaption({});
  assert.equal(element.type, "caption");
  assert.equal(element.props["data-slot"], "table-caption");
  assert.ok(element.props.className.includes("text-muted-foreground"));
});

test("TableCaption merges custom className", () => {
  const element = TableCaption({ className: "custom" });
  assert.ok(element.props.className.includes("custom"));
});

test("all Table sub-components are exported and are functions", () => {
  assert.equal(typeof Table, "function");
  assert.equal(typeof TableHeader, "function");
  assert.equal(typeof TableBody, "function");
  assert.equal(typeof TableFooter, "function");
  assert.equal(typeof TableRow, "function");
  assert.equal(typeof TableHead, "function");
  assert.equal(typeof TableCell, "function");
  assert.equal(typeof TableCaption, "function");
});

/* -------------------------------------------------------------------------- */
/* Pagination sub-components                                                   */
/* -------------------------------------------------------------------------- */

test("Pagination is a function and returns a React element", () => {
  assert.equal(typeof Pagination, "function");
  const element = Pagination({});
  assert.equal(element.$$typeof, Symbol.for("react.transitional.element"));
  assert.equal(element.type, "nav");
  assert.equal(element.props["data-slot"], "pagination");
  assert.equal(element.props["aria-label"], "pagination");
});

test("Pagination merges custom className", () => {
  const element = Pagination({ className: "custom" });
  assert.ok(element.props.className.includes("custom"));
});

test("PaginationContent is a function and returns a React element", () => {
  assert.equal(typeof PaginationContent, "function");
  const element = PaginationContent({});
  assert.equal(element.props["data-slot"], "pagination-content");
  assert.ok(element.props.className.includes("flex"));
});

test("PaginationItem is a function and returns a React element", () => {
  assert.equal(typeof PaginationItem, "function");
  const element = PaginationItem({});
  assert.equal(element.props["data-slot"], "pagination-item");
});

test("PaginationLink is a function and returns an anchor element", () => {
  assert.equal(typeof PaginationLink, "function");
  const element = PaginationLink({});
  assert.equal(element.type, "a");
  assert.equal(element.props["data-slot"], "pagination-link");
});

test("PaginationLink sets isActive aria-current", () => {
  const active = PaginationLink({ isActive: true });
  assert.equal(active.props["aria-current"], "page");

  const inactive = PaginationLink({ isActive: false });
  assert.equal(inactive.props["aria-current"], undefined);
});

test("PaginationLink uses outline variant when active", () => {
  const element = PaginationLink({ isActive: true });
  assert.ok(element.props.className.includes("border-input"));
});

test("PaginationLink uses ghost variant when not active", () => {
  const element = PaginationLink({});
  assert.ok(element.props.className.includes("hover:bg-accent"));
});

test("PaginationPrevious is a function and returns a React element", () => {
  assert.equal(typeof PaginationPrevious, "function");
  const element = PaginationPrevious({});
  assert.equal(element.props["data-slot"], "pagination-previous");
  assert.equal(element.props["aria-label"], "Go to previous page");
});

test("PaginationNext is a function and returns a React element", () => {
  assert.equal(typeof PaginationNext, "function");
  const element = PaginationNext({});
  assert.equal(element.props["data-slot"], "pagination-next");
  assert.equal(element.props["aria-label"], "Go to next page");
});

test("PaginationEllipsis is a function and returns a React element", () => {
  assert.equal(typeof PaginationEllipsis, "function");
  const element = PaginationEllipsis({});
  assert.equal(element.props["data-slot"], "pagination-ellipsis");
  assert.ok(element.props.className.includes("size-9"));
});

test("all Pagination sub-components are exported and are functions", () => {
  assert.equal(typeof Pagination, "function");
  assert.equal(typeof PaginationContent, "function");
  assert.equal(typeof PaginationItem, "function");
  assert.equal(typeof PaginationLink, "function");
  assert.equal(typeof PaginationPrevious, "function");
  assert.equal(typeof PaginationNext, "function");
  assert.equal(typeof PaginationEllipsis, "function");
});
