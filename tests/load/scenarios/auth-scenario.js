import { check, group, sleep } from "k6";
import http from "k6/http";
import { Rate, Trend } from "k6/metrics";

const baseUrl = __ENV.API_URL || "http://localhost:4000";
const errorRate = new Rate("errors");
const loginDuration = new Trend("login_duration");

export const options = {
  stages: [
    { duration: "1m", target: 10 }, // Ramp up to 10 users
    { duration: "2m", target: 10 }, // Stay at 10 users
    { duration: "1m", target: 50 }, // Ramp up to 50
    { duration: "2m", target: 50 }, // Stay at 50
    { duration: "1m", target: 0 }, // Ramp down
  ],
  thresholds: {
    errors: ["rate<0.05"], // Error rate < 5%
    http_req_duration: ["p(95)<1000"], // 95% of requests < 1s
    login_duration: ["p(95)<2000"], // Login specific < 2s
  },
};

export default function () {
  group("Auth Flow", () => {
    const payload = JSON.stringify({
      email: `test-${__VU}@example.com`,
      password: "TestPassword123!",
    });

    const start = Date.now();
    const res = http.post(`${baseUrl}/api/auth/sign-in`, payload, {
      headers: { "Content-Type": "application/json" },
    });
    loginDuration.add(Date.now() - start);

    const success = check(res, {
      "status is 200": (r) => r.status === 200,
      "has session cookie": (r) => r.cookies && Object.keys(r.cookies).length > 0,
    });
    errorRate.add(!success);

    sleep(1);
  });
}
