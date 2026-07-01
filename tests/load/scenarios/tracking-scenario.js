import { check, group, sleep } from "k6";
import http from "k6/http";
import { Rate } from "k6/metrics";

const baseUrl = __ENV.API_URL || "http://localhost:4000";
const errorRate = new Rate("errors");

export const options = {
  stages: [
    { duration: "1m", target: 30 },
    { duration: "3m", target: 30 },
    { duration: "1m", target: 0 },
  ],
  thresholds: {
    errors: ["rate<0.03"],
    http_req_duration: ["p(95)<800"],
  },
};

export default function () {
  // Login step: obtain session cookie before making RPC calls
  const loginRes = http.post(
    `${baseUrl}/api/auth/sign-in/email`,
    {
      email: __ENV.TEST_USER_EMAIL || "test@example.com",
      password: __ENV.TEST_USER_PASSWORD || "TestPassword123!",
    },
    {
      headers: { "Content-Type": "application/json" },
    },
  );

  const loginSuccess = check(loginRes, {
    "login status is 200": (r) => r.status === 200,
    "has session cookie": (r) => r.cookies && Object.keys(r.cookies).length > 0,
  });

  if (!loginSuccess) {
    errorRate.add(1);
    return; // skip remaining groups if login failed
  }

  // Extract cookies from login response for subsequent requests
  const sessionCookies = loginRes.cookies;

  group("Tracking Overview", () => {
    const res = http.get(`${baseUrl}/api/rpc/tracking.overview`, {
      headers: {
        "Content-Type": "application/json",
      },
      cookies: sessionCookies,
    });

    const success = check(res, {
      "status is 200": (r) => r.status === 200,
    });
    errorRate.add(!success);

    sleep(1);
  });
}
