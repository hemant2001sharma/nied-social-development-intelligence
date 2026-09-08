import os, re, hashlib, requests
from bs4 import BeautifulSoup
from datetime import datetime, timezone

SUPABASE_URL = os.environ["SUPABASE_URL"].rstrip("/")
SUPABASE_SERVICE_ROLE_KEY = os.environ["SUPABASE_SERVICE_ROLE_KEY"]

HEADERS = {
    "User-Agent": "NIED-SDI-Collector/1.0 (+https://nied.example)"
}

SOURCES = [
    {
        "name": "NGOBox RFP / EOI",
        "url": "https://ngobox.org/full_rfp.php",
        "source_type": "RFP",
    },
    {
        "name": "SAMS-STC RFP / Tender",
        "url": "https://sams.co.in/rfp-tender",
        "source_type": "RFP",
    },
]

WATCH_TERMS = {
    "livelihoods": ["livelihood", "employment", "income generation"],
    "entrepreneurship": ["entrepreneur", "enterprise", "micro enterprise", "startup"],
    "csr": ["csr", "corporate social responsibility"],
    "rural development": ["rural development", "village", "rural"],
    "women": ["women", "female", "girls", "gender"],
    "skills": ["skill development", "skilling", "vocational", "training"],
    "climate": ["climate", "climate resilience", "renewable", "solar", "adaptation"],
    "water": ["wash", "water", "sanitation", "rainwater"],
    "health": ["health", "nutrition", "hospital"],
    "education": ["education", "school", "learning", "career guidance"],
}

def clean(text):
    return re.sub(r"\s+", " ", text or "").strip()

def fingerprint(title, organisation=""):
    raw = f"{clean(title).lower()}|{clean(organisation).lower()}"
    return hashlib.sha256(raw.encode("utf-8")).hexdigest()

def classify(title, description):
    text = f"{title} {description}".lower()
    if any(x in text for x in ["rfp", "eoi", "request for proposal", "tender", "consultancy", "expression of interest"]):
        return "OPPORTUNITY"
    if any(x in text for x in ["project", "programme", "initiative"]):
        return "PROJECT"
    if any(x in text for x in ["model", "innovation", "scalable"]):
        return "MODEL"
    if any(x in text for x in ["grant", "funding", "philanthropy"]):
        return "FUNDING"
    if any(x in text for x in ["policy", "guideline", "notification", "scheme"]):
        return "POLICY"
    if any(x in text for x in ["report", "assessment", "study"]):
        return "REPORT"
    return "NEWS"

def sectors(text):
    text = text.lower()
    return [name.title() for name, terms in WATCH_TERMS.items()
            if any(term in text for term in terms)]

def priority(item_type, sector_list, deadline=None):
    if item_type != "OPPORTUNITY":
        return "MEDIUM"
    if "Climate" in sector_list or "Livelihoods" in sector_list or "Entrepreneurship" in sector_list:
        return "HIGH"
    return "MEDIUM"

def extract_cards(html, base_url, source_name):
    soup = BeautifulSoup(html, "html.parser")
    cards = []
    # Generic fallback extraction. Source-specific selectors should be added as
    # the source registry is expanded and validated.
    for a in soup.find_all("a", href=True):
        title = clean(a.get_text(" ", strip=True))
        href = a["href"]
        if len(title) < 25:
            continue
        blob = clean(a.parent.get_text(" ", strip=True) if a.parent else title)
        lower = blob.lower()
        if not any(k in lower for k in ["rfp", "eoi", "tender", "consultancy", "proposal", "livelihood", "csr", "project"]):
            continue
        if href.startswith("/"):
            from urllib.parse import urljoin
            href = urljoin(base_url, href)
        if not href.startswith("http"):
            continue
        cards.append({
            "title": title[:500],
            "description": blob[:2000],
            "source_name": source_name,
            "source_url": href
        })
    # Deduplicate within a source
    out, seen = [], set()
    for c in cards:
        fp = fingerprint(c["title"])
        if fp not in seen:
            seen.add(fp); out.append(c)
    return out[:100]

def upsert_items(items):
    headers = {
        "apikey": SUPABASE_SERVICE_ROLE_KEY,
        "Authorization": f"Bearer {SUPABASE_SERVICE_ROLE_KEY}",
        "Content-Type": "application/json",
        "Prefer": "resolution=merge-duplicates,return=minimal",
    }
    endpoint = f"{SUPABASE_URL}/rest/v1/items"
    count = 0
    for x in items:
        item_type = classify(x["title"], x["description"])
        sec = sectors(f'{x["title"]} {x["description"]}')
        data = {
            "fingerprint": fingerprint(x["title"]),
            "item_type": item_type,
            "title": x["title"],
            "description": x["description"],
            "sector": sec,
            "geography": ["India"],
            "source_name": x["source_name"],
            "source_url": x["source_url"],
            "priority": priority(item_type, sec),
            "fetched_at": datetime.now(timezone.utc).isoformat(),
            "is_verified": False,
        }
        r = requests.post(endpoint, headers=headers, json=data, timeout=30)
        if r.status_code in (200, 201, 204):
            count += 1
        elif r.status_code == 409:
            continue
        else:
            print("Supabase error:", r.status_code, r.text[:500])
    return count

def main():
    all_items = []
    for src in SOURCES:
        try:
            r = requests.get(src["url"], headers=HEADERS, timeout=30)
            r.raise_for_status()
            found = extract_cards(r.text, src["url"], src["name"])
            print(src["name"], "found", len(found))
            all_items.extend(found)
        except Exception as e:
            print("Source failed:", src["name"], e)
    written = upsert_items(all_items)
    print("Items written/updated:", written)

if __name__ == "__main__":
    main()
