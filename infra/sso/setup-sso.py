import requests, json, sys

AK_URL = "http://localhost:9090"
AK_TOKEN = "lcZsFVC00sPuIPAbjUtj5oYpDIrfAfeCifKXkM2jSuQENOdAtKjrIeB3OVSZ"
HEADERS = {"Authorization": f"Bearer {AK_TOKEN}", "Content-Type": "application/json"}

AUTH_FLOW = "44633cd0-b3cb-47d0-856c-b11d92001682"
INVALIDATION_FLOW = "5dc03c5d-93dd-481f-94ce-dfc5ad6a8edc"
SIGNING_KEY = "e6f8a550-914c-400e-a567-3ff2d3d1c53b"

APPS = [
    {
        "name": "SparkyFitness",
        "slug": "sparkyfitness",
        "redirect_uris": "https://health.yaya.sh/api/auth/callback/oidc\nhttp://localhost:3004/api/auth/callback/oidc",
        "launch_url": "https://health.yaya.sh",
    },
    {
        "name": "Yaya Health",
        "slug": "yaya-health",
        "redirect_uris": "https://health.yaya.sh/api/auth/callback\nhttp://localhost:3100/api/auth/callback",
        "launch_url": "https://health.yaya.sh",
    },
    {
        "name": "Yaya Business",
        "slug": "yaya-business",
        "redirect_uris": "https://biz.yaya.sh/api/auth/callback\nhttp://localhost:3000/api/auth/callback",
        "launch_url": "https://biz.yaya.sh",
    },
    {
        "name": "Cal.com",
        "slug": "calcom",
        "redirect_uris": "https://cal.yaya.sh/api/auth/callback/oidc\nhttp://localhost:3002/api/auth/callback/oidc",
        "launch_url": "https://cal.yaya.sh",
    },
    {
        "name": "Metabase",
        "slug": "metabase",
        "redirect_uris": "https://analytics.yaya.sh/auth/oidc/callback\nhttp://localhost:3003/auth/oidc/callback",
        "launch_url": "https://analytics.yaya.sh",
    },
    {
        "name": "Lago Billing",
        "slug": "lago",
        "redirect_uris": "https://billing.yaya.sh/auth/callback\nhttp://localhost:8080/auth/callback",
        "launch_url": "https://billing.yaya.sh",
    },
    {
        "name": "MinIO Storage",
        "slug": "minio",
        "redirect_uris": "https://storage.yaya.sh/oauth_callback\nhttp://localhost:9001/oauth_callback",
        "launch_url": "https://storage.yaya.sh",
    },
]

results = {}
for app in APPS:
    redirect_list = [{"matching_mode": "strict", "url": u.strip()} for u in app["redirect_uris"].split("\n") if u.strip()]
    provider_data = {
        "name": app["name"] + " Provider",
        "authorization_flow": AUTH_FLOW,
        "invalidation_flow": INVALIDATION_FLOW,
        "client_type": "confidential",
        "redirect_uris": redirect_list,
        "signing_key": SIGNING_KEY,
        "sub_mode": "hashed_user_id",
        "include_claims_in_id_token": True,
        "issuer_mode": "per_provider",
        "access_code_validity": "minutes=1",
        "access_token_validity": "hours=1",
        "refresh_token_validity": "days=30",
    }

    resp = requests.post(AK_URL + "/api/v3/providers/oauth2/", headers=HEADERS, json=provider_data)
    if resp.status_code == 201:
        provider = resp.json()
        provider_pk = provider["pk"]
        client_id = provider["client_id"]
        client_secret = provider["client_secret"]
        print("OK Provider: " + app["name"] + " (id=" + client_id + ")")
    elif resp.status_code == 400 and "already exists" in resp.text:
        print("SKIP Provider " + app["name"] + " already exists")
        continue
    else:
        print("FAIL Provider " + app["name"] + ": " + str(resp.status_code) + " " + resp.text)
        continue

    app_data = {
        "name": app["name"],
        "slug": app["slug"],
        "provider": provider_pk,
        "meta_launch_url": app["launch_url"],
        "policy_engine_mode": "any",
    }

    resp2 = requests.post(AK_URL + "/api/v3/core/applications/", headers=HEADERS, json=app_data)
    if resp2.status_code == 201:
        print("OK App: " + app["name"] + " -> " + app["slug"])
    else:
        print("FAIL App " + app["name"] + ": " + str(resp2.status_code) + " " + resp2.text)

    results[app["slug"]] = {
        "client_id": client_id,
        "client_secret": client_secret,
        "provider_pk": provider_pk,
    }

with open("/tmp/sso-credentials.json", "w") as f:
    json.dump(results, f, indent=2)

print("\n=== Credentials ===")
for slug, creds in results.items():
    print("")
    print("[" + slug + "]")
    print("  CLIENT_ID=" + creds["client_id"])
    print("  CLIENT_SECRET=" + creds["client_secret"])
    print("  ISSUER=https://auth.yaya.sh/application/o/" + slug + "/")
