const PORT = 4000;

// Make a request with an auth cookie
async function test() {
  // First get a session by calling the health endpoint (no auth needed)
  const healthRes = await fetch(`http://localhost:${PORT}/rpc/system/health`);
  const healthBody = await healthRes.json();
  console.log("Health:", healthRes.status, JSON.stringify(healthBody));

  // Now try the overview endpoint without auth
  const overviewRes = await fetch(`http://localhost:${PORT}/rpc/capacity/overview`);
  const overviewBody = await overviewRes.text();
  console.log("Overview:", overviewRes.status, overviewBody.slice(0, 500));
}

test().catch(console.error);
