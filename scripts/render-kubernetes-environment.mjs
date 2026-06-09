import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();
const environment = process.env.DEPLOY_ENVIRONMENT;

const environmentPlaceholders = {
  staging: {
    webHost: "staging.saptm.example.com",
    apiHost: "api.staging.saptm.example.com",
    webUrl: "https://staging.saptm.example.com",
    apiUrl: "https://api.staging.saptm.example.com",
  },
  production: {
    webHost: "app.saptm.example.com",
    apiHost: "api.saptm.example.com",
    webUrl: "https://app.saptm.example.com",
    apiUrl: "https://api.saptm.example.com",
  },
};

const placeholders = environmentPlaceholders[environment];

if (!placeholders) {
  console.error("DEPLOY_ENVIRONMENT must be staging or production.");
  process.exit(1);
}

const webUrl = readDeploymentUrl("SAPTM_WEB_URL");
const apiUrl = readDeploymentUrl("SAPTM_API_URL");

if (webUrl.hostname === apiUrl.hostname) {
  console.error("SAPTM_WEB_URL and SAPTM_API_URL must use different hosts.");
  process.exit(1);
}

const overlayDirectory = join(root, "deploy", "kubernetes", "overlays", environment);
replaceInFile(join(overlayDirectory, "ingress-patch.yaml"), [
  [placeholders.apiHost, apiUrl.hostname],
  [placeholders.webHost, webUrl.hostname],
]);
replaceInFile(join(overlayDirectory, "runtime-config-patch.yaml"), [
  [placeholders.apiUrl, stripTrailingSlash(apiUrl.toString())],
  [placeholders.webUrl, stripTrailingSlash(webUrl.toString())],
]);

console.log(
  `Rendered SAPTM ${environment} overlay for web=${webUrl.hostname} api=${apiUrl.hostname}.`,
);

function readDeploymentUrl(name) {
  const value = process.env[name];

  if (value === undefined || value.trim() === "") {
    console.error(`${name} is required for ${environment} deployments.`);
    process.exit(1);
  }

  let url;

  try {
    url = new URL(value);
  } catch {
    console.error(`${name} must be a valid absolute URL.`);
    process.exit(1);
  }

  const forbiddenHostFragments = ["example.com", "localhost", "127.0.0.1", "0.0.0.0"];

  if (url.protocol !== "https:") {
    console.error(`${name} must use https for ${environment} deployments.`);
    process.exit(1);
  }

  if (forbiddenHostFragments.some((fragment) => url.hostname.includes(fragment))) {
    console.error(`${name} must not use placeholder or local hostnames.`);
    process.exit(1);
  }

  if (url.pathname !== "/" || url.search !== "" || url.hash !== "") {
    console.error(`${name} must not include a path, query, or fragment.`);
    process.exit(1);
  }

  return url;
}

function replaceInFile(file, replacements) {
  let source = readFileSync(file, "utf8");

  for (const [placeholder, replacement] of replacements) {
    source = source.replaceAll(placeholder, replacement);
  }

  writeFileSync(file, source);
}

function stripTrailingSlash(value) {
  return value.endsWith("/") ? value.slice(0, -1) : value;
}
