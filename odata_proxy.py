# odata_proxy.py
from flask import Flask, request, jsonify, Response
from flask_cors import CORS
import requests
import logging
from requests.adapters import HTTPAdapter
from urllib3.util.retry import Retry

app = Flask(__name__)
CORS(app, resources={r"/api/*": {"origins": "*"}})
logging.basicConfig(level=logging.INFO)

# Session with retry
SESSION = requests.Session()
SESSION.headers.update({
    "User-Agent": (
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
        "AppleWebKit/537.36 (KHTML, like Gecko) "
        "Chrome/123.0.0.0 Safari/537.36"
    ),
    "Accept": "application/json;odata=verbose",
    "Referer": "https://www.charities.govt.nz/",
})
SESSION.mount("https://", HTTPAdapter(max_retries=Retry(
    total=2, backoff_factor=0.2, status_forcelist=[429, 500, 502, 503, 504]
)))

@app.route("/api/GrpOrgLatestReturns", methods=["GET", "OPTIONS"])
def grp_org_latest_returns():
    """
    Proxy for the GrpOrgLatestReturns OData endpoint.
    """
    if request.method == "OPTIONS":
        return Response(status=204)

    cc = (request.args.get("cc") or "").upper().strip()
    if not (cc.startswith("CC") and cc[2:].isdigit()):
        return jsonify({"error": "Bad CC parameter"}), 400

    base_url = "https://www.odata.charities.govt.nz/GrpOrgLatestReturns"
    params = {
        "$filter": f"CharityRegistrationNumber eq '{cc}'",
        "$format": "json",
    }

    try:
        app.logger.info("Fetching GrpOrgLatestReturns for %s", cc)
        r = SESSION.get(base_url, params=params, timeout=15)
        app.logger.info("Upstream status: %s", r.status_code)
        r.raise_for_status()
        return Response(r.text, status=200, mimetype="application/json")
    except requests.Timeout:
        app.logger.exception("Upstream timeout")
        return jsonify({"error": "Upstream timeout"}), 504
    except requests.RequestException as e:
        status = getattr(e.response, "status_code", 502)
        text = getattr(e.response, "text", str(e))
        app.logger.exception("Upstream request failed: %s", text)
        return jsonify({"error": "Upstream failed", "detail": text}), status

@app.route("/api/Organisations", methods=["GET", "OPTIONS"])
def organisation():
    """
    Proxy for the Organisations OData endpoint.
    """
    if request.method == "OPTIONS":
        return Response(status=204)

    cc = (request.args.get("cc") or "").upper().strip()
    if not (cc.startswith("CC") and cc[2:].isdigit()):
        return jsonify({"error": "Bad CC parameter"}), 400

    base_url = "https://www.odata.charities.govt.nz/Organisations"
    params = {
        "$filter": f"CharityRegistrationNumber eq '{cc}'",
        "$format": "json",
    }

    try:
        app.logger.info("Fetching Organisation for %s", cc)
        r = SESSION.get(base_url, params=params, timeout=15)
        app.logger.info("Upstream status: %s", r.status_code)
        r.raise_for_status()
        return Response(r.text, status=200, mimetype="application/json")
    except requests.Timeout:
        app.logger.exception("Upstream timeout")
        return jsonify({"error": "Upstream timeout"}), 504
    except requests.RequestException as e:
        status = getattr(e.response, "status_code", 502)
        text = getattr(e.response, "text", str(e))
        app.logger.exception("Upstream request failed: %s", text)
        return jsonify({"error": "Upstream failed", "detail": text}), status

if __name__ == "__main__":
    app.run(port=5000)
