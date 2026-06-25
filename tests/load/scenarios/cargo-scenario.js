import { check, group, sleep } from "k6";
import http from "k6/http";
import { Rate } from "k6/metrics";

const baseUrl = __ENV.API_URL || "http://localhost:4000";
const errorRate = new Rate("errors");

export const options = {
  stages: [
    { duration: "2m", target: 20 },
    { duration: "3m", target: 20 },
    { duration: "1m", target: 0 },
  ],
  thresholds: {
    errors: ["rate<0.03"],
    http_req_duration: ["p(95)<500"],
  },
};

export default function () {
  group("Cargo Search", () => {
    const res = http.get(`${baseUrl}/api/rpc/cargo.list`, {
      headers: { "Content-Type": "application/json" },
    });

    const success = check(res, {
      "status is 200": (r) => r.status === 200,
      "response has data": (r) => r.body && r.body.length > 0,
    });
    errorRate.add(!success);

    sleep(0.5);
  });

  group("Cargo Detail", () => {
    const res = http.get(`${baseUrl}/api/rpc/cargo.get`, {
      headers: { "Content-Type": "application/json" },
    });

    const success = check(res, {
      "status is 200": (r) => r.status === 200,
    });
    errorRate.add(!success);

    sleep(0.5);
  });
}
