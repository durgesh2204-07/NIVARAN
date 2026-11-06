import urllib.request
import urllib.error
import json

def test_rate_limiting():
    url = "http://127.0.0.1:8000/api/auth/login"
    payload = json.dumps({"email": "test@nivaran.gov.in", "password": "wrong"}).encode("utf-8")
    fake_client_ip = "198.51.100.99"

    codes = []
    retry_headers = []

    for i in range(25):
        req = urllib.request.Request(
            url,
            data=payload,
            headers={
                "Content-Type": "application/json",
                "X-Forwarded-For": fake_client_ip,
                "Origin": "http://frontend-origin.test"
            }
        )
        try:
            resp = urllib.request.urlopen(req)
            codes.append(resp.getcode())
        except urllib.error.HTTPError as e:
            codes.append(e.code)
            if e.code == 429:
                retry_headers.append(e.headers.get("Retry-After"))

    print(f"Total calls: {len(codes)}")
    count_401 = codes.count(401)
    count_429 = codes.count(429)
    print(f"HTTP 401 count (allowed through rate limiter): {count_401}")
    print(f"HTTP 429 count (rate-limit blocked): {count_429}")
    assert count_401 == 20, f"Expected exactly 20 allowed requests, got {count_401}"
    assert count_429 == 5, f"Expected 5 rate-limited requests, got {count_429}"
    assert len(retry_headers) > 0, "Expected Retry-After header on 429 response"
    print(f"Sample Retry-After value: {retry_headers[0]} seconds")
    print("ALL RATE LIMITER TESTS PASSED SUCCESSFULLY!")

if __name__ == "__main__":
    test_rate_limiting()

