import os
import re
import hashlib
from datetime import datetime, timezone
from urllib.parse import urljoin

import requests
from bs4 import BeautifulSoup


SUPABASE_URL = os.environ["SUPABASE_URL"].rstrip("/")
SUPABASE_SERVICE_ROLE_KEY = os.environ["SUPABASE_SERVICE_ROLE_KEY"]

HEADERS = {
    "User-Agent": "NIED-SDI-Collector/1.1"
}

NGOBOX_LISTING = "https://www.ngobox.org/rfp_eoi_listing.php"


WATCH_TERMS = {
    "Livelihoods": [
        "livelihood",
        "employment",
        "income generation"
    ],
    "Entrepreneurship": [
        "entrepreneur",
        "enterprise",
        "micro enterprise",
        "startup"
    ],
    "CSR": [
        "csr",
        "corporate social responsibility"
    ],
    "Rural Development": [
        "rural development",
        "village",
        "rural"
    ],
    "Women": [
        "women",
        "female",
        "girls",
        "gender"
    ],
    "Skills": [
        "skill development",
        "skilling",
        "vocational",
        "training"
    ],
    "Climate": [
        "climate",
        "climate resilience",
        "renewable",
        "solar",
        "adaptation"
    ],
    "Water": [
        "wash",
        "water",
        "sanitation",
        "rainwater"
    ],
    "Health": [
        "health",
        "nutrition",
        "hospital"
    ],
    "Education": [
        "education",
        "school",
        "learning",
        "career guidance"
    ],
    "Environment": [
        "environment",
        "biodiversity",
        "sustainability",
        "natural resource"
    ],
    "Research": [
        "research",
        "study",
        "assessment",
        "evaluation",
        "m&e",
        "impact assessment"
    ],
}


def clean(text):
    return re.sub(r"\s+", " ", text or "").strip()


def fingerprint(title, organisation=""):
    raw = f"{clean(title).lower()}|{clean(organisation).lower()}"
    return hashlib.sha256(
        raw.encode("utf-8")
    ).hexdigest()


def classify(title, description):
    text = f"{title} {description}".lower()

    if any(x in text for x in [
        "rfp",
        "eoi",
        "request for proposal",
        "tender",
        "consultancy",
        "expression of interest",
        "terms of reference",
        "tor"
    ]):
        return "OPPORTUNITY"

    if any(x in text for x in [
        "project",
        "programme",
        "initiative"
    ]):
        return "PROJECT"

    if any(x in text for x in [
        "model",
        "innovation",
        "scalable"
    ]):
        return "MODEL"

    if any(x in text for x in [
        "grant",
        "funding",
        "philanthropy"
    ]):
        return "FUNDING"

    if any(x in text for x in [
        "policy",
        "guideline",
        "notification",
        "scheme"
    ]):
        return "POLICY"

    if any(x in text for x in [
        "report",
        "assessment",
        "study"
    ]):
        return "REPORT"

    return "NEWS"


def sectors(text):
    t = text.lower()

    return [
        name
        for name, terms in WATCH_TERMS.items()
        if any(term in t for term in terms)
    ]


def extract_deadline(text):
    patterns = [
        r"Apply By:\s*(\d{1,2}\s+[A-Za-z]{3,9}\.?\s+2026)",
        r"Deadline:\s*(\d{1,2}\s+[A-Za-z]{3,9}\.?\s+2026)",
        r"Last Date[^:]*:\s*(\d{1,2}(?:st|nd|rd|th)?\s+[A-Za-z]{3,9}\.?\s+2026)",
        r"Submission Deadline[^:]*:\s*(\d{1,2}(?:st|nd|rd|th)?\s+[A-Za-z]{3,9}\.?\s+2026)",
    ]

    for pattern in patterns:
        match = re.search(
            pattern,
            text,
            flags=re.I
        )

        if not match:
            continue

        value = re.sub(
            r"(\d{1,2})(st|nd|rd|th)",
            r"\1",
            match.group(1)
        )

        value = value.replace(".", "")

        for fmt in ("%d %b %Y", "%d %B %Y"):
            try:
                return datetime.strptime(
                    value,
                    fmt
                ).date().isoformat()
            except ValueError:
                pass

    return None


def extract_organisation(text):
    match = re.search(
        r"Organization:\s*(.+?)(?:\s+Apply By:|\s+About the Organization|\s+About the|$)",
        text,
        flags=re.I
    )

    return clean(match.group(1)) if match else ""


def priority(item_type, sector_list, deadline):
    if item_type != "OPPORTUNITY":
        return "MEDIUM"

    strong = {
        "Livelihoods",
        "Entrepreneurship",
        "Skills",
        "Women",
        "Rural Development",
        "Climate",
        "Research"
    }

    if strong.intersection(sector_list):
        return "HIGH"

    if deadline:
        try:
            days = (
                datetime.fromisoformat(deadline).date()
                - datetime.now().date()
            ).days

            if days <= 3:
                return "URGENT"

        except ValueError:
            pass

    return "MEDIUM"


def fetch(url):
    response = requests.get(
        url,
        headers=HEADERS,
        timeout=40
    )

    response.raise_for_status()

    return response.text


def extract_listing_links(html):
    soup = BeautifulSoup(
        html,
        "html.parser"
    )

    found = []
    seen = set()

    for a in soup.find_all(
        "a",
        href=True
    ):
        href = urljoin(
            NGOBOX_LISTING,
            a["href"]
        )

        if "full_rfp_eoi_" not in href:
            continue

        title = clean(
            a.get_text(
                " ",
                strip=True
            )
        )

        if len(title) < 15:
            continue

        if href in seen:
            continue

        seen.add(href)

        found.append(
            (title, href)
        )

    return found[:60]


def parse_detail(url, fallback_title):
    html = fetch(url)

    soup = BeautifulSoup(
        html,
        "html.parser"
    )

    text = clean(
        soup.get_text(
            " ",
            strip=True
        )
    )

    h1 = soup.find("h1")

    title = (
        clean(h1.get_text(
            " ",
            strip=True
        ))
        if h1
        else fallback_title
    )

    organisation = extract_organisation(text)

    deadline = extract_deadline(text)

    description = text[:2500]

    return {
        "title": title[:500],
        "description": description,
        "organisation": organisation[:300],
        "deadline": deadline,
        "source_name": "NGOBox RFP / EOI",
        "source_url": url,
    }


def upsert(items):
    endpoint = f"{SUPABASE_URL}/rest/v1/items"

    headers = {
        "apikey": SUPABASE_SERVICE_ROLE_KEY,
        "Authorization": f"Bearer {SUPABASE_SERVICE_ROLE_KEY}",
        "Content-Type": "application/json",
        "Prefer": "resolution=merge-duplicates,return=minimal",
    }

    written = 0

    for item in items:

        combined = (
            f'{item["title"]} '
            f'{item["description"]}'
        )

        item_type = classify(
            item["title"],
            item["description"]
        )

        sec = sectors(combined)

        fp = fingerprint(
            item["title"],
            item["organisation"]
        )

        data = {
            "fingerprint": fp,
            "item_type": item_type,
            "title": item["title"],
            "description": item["description"],
            "organisation": item["organisation"],
            "sector": sec,
            "geography": ["India"],
            "opportunity_type": (
                item_type
                if item_type == "OPPORTUNITY"
                else None
            ),
            "deadline": item["deadline"],
            "source_name": item["source_name"],
            "source_url": item["source_url"],
            "priority": priority(
                item_type,
                sec,
                item["deadline"]
            ),
            "fetched_at": datetime.now(
                timezone.utc
            ).isoformat(),
            "is_verified": False,
        }

        response = requests.post(
            endpoint,
            headers=headers,
            json=data,
            timeout=30
        )

        if response.status_code in (
            200,
            201,
            204
        ):
            written += 1

        else:
            print(
                "Supabase write error:",
                response.status_code,
                response.text[:500]
            )

    return written


def main():

    print(
        "Fetching:",
        NGOBOX_LISTING
    )

    listing_html = fetch(
        NGOBOX_LISTING
    )

    links = extract_listing_links(
        listing_html
    )

    print(
        "Listing records found:",
        len(links)
    )

    items = []

    for fallback_title, url in links:

        try:

            item = parse_detail(
                url,
                fallback_title
            )

            items.append(item)

            print(
                "Parsed:",
                item["title"][:100]
            )

        except Exception as exc:

            print(
                "Detail failed:",
                url,
                exc
            )

    print(
        "Parsed detail records:",
        len(items)
    )

    written = upsert(items)

    print(
        "Supabase records written/updated:",
        written
    )


if __name__ == "__main__":
    main()
