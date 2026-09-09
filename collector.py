import os
import re
import hashlib
from datetime import datetime, timezone, date

import requests
from bs4 import BeautifulSoup


# ============================================================
# CONFIG
# ============================================================

SUPABASE_URL = os.environ["SUPABASE_URL"].rstrip("/")
SUPABASE_SERVICE_ROLE_KEY = os.environ["SUPABASE_SERVICE_ROLE_KEY"]

NGOBOX_LISTING = "https://www.ngobox.org/rfp_eoi_listing.php"

ONE_PURPOS_RFP_API = "https://onepurpos.in/api/user/get-all-rfps-grants"

HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
        "AppleWebKit/537.36 (KHTML, like Gecko) "
        "Chrome/120.0 Safari/537.36"
    )
}

TIMEOUT = 30


# ============================================================
# NIED SECTOR RULES
# ============================================================

SECTOR_RULES = {
    "Livelihoods": [
        "livelihood",
        "livelihoods",
        "income generation",
        "value chain",
        "value chains",
        "market linkage",
        "market access",
        "producer group",
        "producer groups",
        "enterprise development",
        "livelihood strengthening",
        "livelihood development",
        "trade and livelihood",
        "trade & livelihood",
    ],
    "Entrepreneurship": [
        "entrepreneurship",
        "entrepreneur",
        "micro enterprise",
        "micro-enterprise",
        "microenterprise",
        "small enterprise",
        "business development",
        "enterprise development",
        "women entrepreneur",
        "women entrepreneurs",
        "enterprise incubation",
        "enterprise support",
    ],
    "Women": [
        "women empowerment",
        "women's empowerment",
        "women entrepreneur",
        "women entrepreneurs",
        "women-led",
        "women led",
        "female entrepreneur",
        "gender equality",
        "women micro-entrepreneurship",
        "women micro entrepreneurship",
    ],
    "Rural Development": [
        "rural development",
        "rural communities",
        "rural livelihood",
        "rural livelihoods",
        "village development",
        "community development",
        "tribal communities",
        "tribal development",
        "farmer",
        "farmers",
        "agriculture",
        "agricultural",
        "agrarian",
    ],
    "Skills": [
        "skill development",
        "skills development",
        "vocational training",
        "vocational education",
        "capacity building",
        "capacity-building",
        "training programme",
        "training program",
        "workforce development",
        "employability",
        "employment generation",
        "facilitator training",
        "training modules",
    ],
    "Climate": [
        "climate resilience",
        "climate-resilient",
        "climate resilient",
        "climate adaptation",
        "climate change",
        "resilient livelihood",
        "resilient livelihoods",
        "natural resource management",
        "disaster resilience",
    ],
    "Renewable Energy": [
        "decentralized renewable energy",
        "decentralised renewable energy",
        "renewable energy",
        "solar energy",
        "solar panel",
        "solar panels",
        "solar street light",
        "solar street lights",
        "solar pv",
        "solar power",
        "clean energy",
        "energy access",
        "inverter",
        "battery system",
    ],
    "WASH": [
        "wash",
        "water, sanitation",
        "water and sanitation",
        "water sanitation",
        "sanitation",
        "hygiene",
        "drinking water",
        "water supply",
        "community water",
        "hygiene framework",
        "hygiene booklet",
    ],
    "Health": [
        "healthcare",
        "public health",
        "maternal health",
        "child health",
        "frontline health worker",
        "health worker",
        "health workers",
        "nutrition",
        "hospital",
        "hospitals",
        "non-communicable diseases",
        "ncd",
    ],
    "Education": [
        "education",
        "school education",
        "learning outcomes",
        "teacher training",
        "student learning",
        "literacy",
        "foundational literacy",
        "digital learning",
    ],
    "Environment": [
        "environmental sustainability",
        "biodiversity",
        "conservation",
        "ecosystem",
        "waste management",
        "circular economy",
        "sustainable farming",
        "natural dyes",
        "natural dye",
    ],
    "Research": [
        "research study",
        "research collaboration",
        "research",
        "assessment",
        "impact assessment",
        "evaluation",
        "baseline study",
        "endline study",
        "knowledge mapping",
        "learning study",
        "ecosystem study",
        "consultancy study",
    ],
    "CSR": [
        "corporate social responsibility",
        "csr programme",
        "csr program",
        "csr initiative",
        "csr-funded",
        "corporate philanthropy",
        "social investment",
        "philanthropic funding",
    ],
}


STRATEGIC_WEIGHTS = {
    "Livelihoods": 22,
    "Entrepreneurship": 20,
    "Women": 15,
    "Rural Development": 15,
    "Skills": 10,
    "Climate": 15,
    "Research": 8,
    "CSR": 8,
    "WASH": 7,
    "Health": 5,
    "Education": 5,
    "Environment": 5,
    "Renewable Energy": 7,
}


# ============================================================
# HELPERS
# ============================================================

def clean_text(value):
    if not value:
        return ""
    value = re.sub(r"\s+", " ", value)
    return value.strip()


def normalise(text):
    text = clean_text(text).lower()
    text = text.replace("–", "-").replace("—", "-")
    return text


def make_fingerprint(title, organisation=""):
    """
    Stable fingerprint based on normalized title + clean organisation.
    """
    title = normalise(title)
    organisation = normalise(organisation)

    raw = f"{title}|{organisation}"
    return hashlib.sha256(raw.encode("utf-8")).hexdigest()


def get_soup(url):
    response = requests.get(
        url,
        headers=HEADERS,
        timeout=TIMEOUT,
    )
    response.raise_for_status()
    return BeautifulSoup(response.text, "html.parser")


# ============================================================
# SECTOR CLASSIFICATION
# ============================================================

def keyword_hits(text, keywords):
    hits = 0
    matched = []

    for keyword in keywords:
        keyword_n = normalise(keyword)

        if keyword_n in text:
            hits += 1
            matched.append(keyword)

    return hits, matched


def classify_sectors(title, description):
    """
    Title receives stronger weight than generic page text.
    Generic 'foundation'/'CSR' references do not create CSR.
    """

    title_n = normalise(title)
    desc_n = normalise(description)

    scores = {}

    for sector, keywords in SECTOR_RULES.items():
        title_hits, title_matches = keyword_hits(title_n, keywords)
        desc_hits, desc_matches = keyword_hits(desc_n, keywords)

        score = title_hits * 4 + desc_hits

        if score > 0:
            scores[sector] = score

    # Explicit high-confidence rules
    if (
        "wash" in title_n
        or "hygiene" in title_n
        or "wateraid" in title_n
        or "water and sanitation" in title_n
    ):
        scores["WASH"] = scores.get("WASH", 0) + 8

    if "livelihood" in title_n:
        scores["Livelihoods"] = scores.get("Livelihoods", 0) + 8

    if "entrepreneur" in title_n or "enterprise" in title_n:
        scores["Entrepreneurship"] = scores.get("Entrepreneurship", 0) + 6

    if "trade & livelihood" in title_n or "trade and livelihood" in title_n:
        scores["Livelihoods"] = scores.get("Livelihoods", 0) + 8

    if "women" in title_n:
        scores["Women"] = scores.get("Women", 0) + 5

    if "climate-resilient" in title_n or "climate resilient" in title_n:
        scores["Climate"] = scores.get("Climate", 0) + 8

    if "solar" in title_n or "renewable energy" in title_n or "dre" in title_n:
        scores["Renewable Energy"] = scores.get("Renewable Energy", 0) + 7

    if "pmfme" in title_n or "enterprise" in title_n:
        scores["Entrepreneurship"] = scores.get("Entrepreneurship", 0) + 3

    if "hospital" in title_n or "health worker" in title_n:
        scores["Health"] = scores.get("Health", 0) + 6

    if "research" in title_n or "study" in title_n or "assessment" in title_n:
        scores["Research"] = scores.get("Research", 0) + 5

    # CSR only when CSR is explicit, never because 'foundation' appears.
    explicit_csr = any(
        phrase in title_n or phrase in desc_n
        for phrase in [
            "corporate social responsibility",
            "csr programme",
            "csr program",
            "csr initiative",
            "csr-funded",
            "corporate philanthropy",
            "social investment",
        ]
    )

    if explicit_csr:
        scores["CSR"] = scores.get("CSR", 0) + 4

    ordered = sorted(
        scores.items(),
        key=lambda x: x[1],
        reverse=True,
    )

    # Keep strong sectors only, maximum four.
    selected = [sector for sector, score in ordered if score >= 2][:4]

    return selected


# ============================================================
# OPPORTUNITY TYPE
# ============================================================

def classify_opportunity_type(title, description):
    title_n = normalise(title)
    text = normalise(f"{title} {description}")

    # Title is authoritative when available.
    if "tender" in title_n or "e-tender" in title_n:
        return "Tender"

    if "request for proposal" in title_n or re.search(r"\brfp\b", title_n):
        return "RFP"

    if "expression of interest" in title_n or re.search(r"\beoi\b", title_n):
        return "EOI"

    if "terms of reference" in title_n or re.search(r"\btor\b", title_n):
        return "Consultancy / ToR"

    if "grant" in title_n:
        return "Grant"

    if "partnership" in title_n:
        return "Partnership"

    if "consultancy" in title_n:
        return "Consultancy"

    # Fallback to page content.
    if "tender" in text:
        return "Tender"

    if "request for proposal" in text or re.search(r"\brfp\b", text):
        return "RFP"

    if "expression of interest" in text or re.search(r"\beoi\b", text):
        return "EOI"

    if "terms of reference" in text or re.search(r"\btor\b", text):
        return "Consultancy / ToR"

    return "Opportunity"


# ============================================================
# OPPORTUNITY CHARACTER
# ============================================================

def classify_character(title, description):
    title_n = normalise(title)
    text = normalise(f"{title} {description}")

    procurement_terms = [
        "procurement",
        "supply",
        "installation",
        "commissioning",
        "fabrication",
        "supplier",
        "suppliers",
        "vendor",
        "equipment",
        "materials",
        "construction",
        "oem",
    ]

    implementation_terms = [
        "implementation partner",
        "implementing partner",
        "implementing partner ngos",
        "empanelment of implementing partner",
        "programme implementation",
        "project implementation",
        "community mobilisation",
        "capacity building",
        "livelihood strengthening",
        "enterprise development",
        "enterprise incubation",
        "business mentoring",
    ]

    research_terms = [
        "research",
        "assessment",
        "evaluation",
        "study",
        "knowledge mapping",
        "consultancy",
    ]

    procurement_score = sum(
        1 for term in procurement_terms if term in title_n
    )

    implementation_score = sum(
        1 for term in implementation_terms if term in title_n
    )

    research_score = sum(
        1 for term in research_terms if term in title_n
    )

    # Title-first classification prevents generic page text
    # from turning implementation work into procurement.
    if implementation_score >= 1:
        return "Implementation / Partnership"

    if "partnership" in title_n or "trade & livelihood partners" in title_n:
        return "Implementation / Partnership"

    if procurement_score >= 1:
        return "Procurement / Supply"

    if research_score >= 1:
        return "Research / Consultancy"

    # Fallback to full text.
    procurement_score = sum(
        1 for term in procurement_terms if term in text
    )

    implementation_score = sum(
        1 for term in implementation_terms if term in text
    )

    research_score = sum(
        1 for term in research_terms if term in text
    )

    if procurement_score >= 3 and procurement_score > implementation_score:
        return "Procurement / Supply"

    if implementation_score >= 1:
        return "Implementation / Partnership"

    if research_score >= 1:
        return "Research / Consultancy"

    return "General Opportunity"


# ============================================================
# DEADLINE PARSING
# ============================================================

MONTHS = {
    "january": 1, "jan": 1,
    "february": 2, "feb": 2,
    "march": 3, "mar": 3,
    "april": 4, "apr": 4,
    "may": 5,
    "june": 6, "jun": 6,
    "july": 7, "jul": 7,
    "august": 8, "aug": 8,
    "september": 9, "sep": 9, "sept": 9,
    "october": 10, "oct": 10,
    "november": 11, "nov": 11,
    "december": 12, "dec": 12,
}


def parse_date_match(match):
    groups = match.groups()

    try:
        if groups[0].isdigit() and groups[1].isdigit():
            day = int(groups[0])
            month = int(groups[1])
            year = int(groups[2])
        elif groups[0].isdigit():
            day = int(groups[0])
            month = MONTHS.get(groups[1].lower())
            year = int(groups[2])
        else:
            month = MONTHS.get(groups[0].lower())
            day = int(groups[1])
            year = int(groups[2])

        if not month:
            return None

        return date(year, month, day).isoformat()

    except (ValueError, TypeError):
        return None


def parse_deadline(text):
    if not text:
        return None

    text = clean_text(text)

    patterns = [
        # 16/09/2026, 16-09-2026
        r"\b(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})\b",

        # 16 September 2026, 16th September 2026
        r"\b(\d{1,2})(?:st|nd|rd|th)?\s+([A-Za-z]+)\s+(\d{4})\b",

        # September 16 2026, September 16th, 2026
        r"\b([A-Za-z]+)\s+(\d{1,2})(?:st|nd|rd|th)?,?\s+(\d{4})\b",

        # 16 Sep 2026
        r"\b(\d{1,2})(?:st|nd|rd|th)?\s+([A-Za-z]{3})\.?\s+(\d{4})\b",

        # Sep 16, 2026
        r"\b([A-Za-z]{3})\.?\s+(\d{1,2})(?:st|nd|rd|th)?,?\s+(\d{4})\b",
    ]

    for pattern in patterns:
        match = re.search(pattern, text, flags=re.I)

        if match:
            parsed = parse_date_match(match)

            if parsed:
                return parsed

    return None


def extract_deadline(page_text):
    """
    Extract the application/submission deadline from NGOBox pages.

    Priority:
    1. Explicit application/submission labels
    2. Common closing/deadline labels
    3. Avoid unrelated dates such as posting dates
    """

    text = clean_text(page_text)

    label_patterns = [
        r"(?:last date for submission|last date for apply|last date to apply|"
        r"last date of submission|last date of application|"
        r"submission deadline|application deadline|proposal deadline|"
        r"bid submission closing date|bid submission deadline|"
        r"proposal submission deadline|closing date|apply by|"
        r"applications close|submission last date|"
        r"deadline for submission|deadline for application)"
        r"\s*[:\-]?\s*(.{0,220})"
    ]

    candidates = []

    for pattern in label_patterns:
        for match in re.finditer(pattern, text, flags=re.I):
            candidate = clean_text(match.group(1))

            # Stop at obvious next-field labels.
            candidate = re.split(
                r"\s+(?:Description|About|Overview|Eligibility|Contact|"
                r"Organisation|Organization|Posted By|How to Apply)\b",
                candidate,
                flags=re.I,
            )[0]

            parsed = parse_deadline(candidate)

            if parsed:
                candidates.append(parsed)

    if candidates:
        return candidates[0]

    # Fallback: inspect short windows around generic "deadline".
    for match in re.finditer(
        r"\bdeadline\b\s*[:\-]?\s*(.{0,180})",
        text,
        flags=re.I,
    ):
        candidate = clean_text(match.group(1))
        parsed = parse_deadline(candidate)

        if parsed:
            return parsed

    return None


# ============================================================
# URGENCY
# ============================================================

def urgency_score(deadline):
    if not deadline:
        return 25

    try:
        deadline_date = datetime.strptime(
            deadline,
            "%Y-%m-%d",
        ).date()

        today = datetime.now(timezone.utc).date()
        days = (deadline_date - today).days

        if days < 0:
            return 0

        if days <= 3:
            return 95

        if days <= 7:
            return 85

        if days <= 14:
            return 70

        if days <= 30:
            return 55

        if days <= 60:
            return 35

        return 20

    except Exception:
        return 25


# ============================================================
# STRATEGIC SCORE
# ============================================================

def strategic_score(
    sectors,
    character,
    opportunity_type,
    title,
    description,
):
    score = sum(
        STRATEGIC_WEIGHTS.get(sector, 0)
        for sector in sectors
    )

    text = normalise(f"{title} {description}")
    title_n = normalise(title)

    if "implementation partner" in text or "implementing partner" in text:
        score += 12

    if "livelihood strengthening" in text:
        score += 8

    if "enterprise incubation" in text or "enterprise development" in text:
        score += 7

    if "women-led" in text or "women led" in text:
        score += 7

    if "women micro-entrepreneurship" in text or "women micro entrepreneurship" in text:
        score += 8

    if "trade & livelihood" in text or "trade and livelihood" in text:
        score += 6

    if "community capacity" in text or "capacity building" in text:
        score += 5

    if "partnership" in title_n:
        score += 6

    if character == "Research / Consultancy":
        score += 3

    if character == "Procurement / Supply":
        score -= 25

    if opportunity_type == "Tender":
        score -= 5

    return max(0, min(100, score))


# ============================================================
# OPPORTUNITY SCORE
# ============================================================

def opportunity_score(
    strategic,
    urgency,
    character,
    opportunity_type,
    title,
    description,
):
    score = strategic * 0.60 + urgency * 0.20

    if character == "Implementation / Partnership":
        score += 15

    elif character == "Research / Consultancy":
        score += 8

    elif character == "Procurement / Supply":
        score -= 20

    if opportunity_type in ["RFP", "EOI", "Partnership"]:
        score += 5

    if opportunity_type == "Tender":
        score -= 5

    title_n = normalise(title)
    text = normalise(f"{title} {description}")

    if "livelihood" in title_n:
        score += 7

    if "entrepreneur" in title_n:
        score += 6

    if "women" in title_n:
        score += 4

    if "rural" in text or "tribal" in text:
        score += 3

    return max(0, min(100, round(score)))


# ============================================================
# RELEVANCE / CAPABILITY
# ============================================================

def relevance_reason(sectors, character, strategic):
    if not sectors:
        return "Limited direct alignment identified from available information."

    sector_text = ", ".join(sectors[:3])

    if character == "Implementation / Partnership":
        return (
            f"Strong potential alignment with NIED work in {sector_text}, "
            f"particularly through implementation or partnership engagement."
        )

    if character == "Research / Consultancy":
        return (
            f"Relevant to NIED capabilities in {sector_text}, with potential "
            f"for research, assessment, knowledge or consultancy engagement."
        )

    if character == "Procurement / Supply":
        return (
            f"Related to {sector_text}, but primarily procurement/supply "
            f"oriented, reducing direct strategic relevance to NIED."
        )

    if strategic >= 70:
        return f"Strong alignment with NIED priorities across {sector_text}."

    if strategic >= 45:
        return f"Moderate alignment with NIED priorities across {sector_text}."

    return f"Some relevance to NIED through {sector_text}, but strategic fit appears limited."


def capability_match(sectors, character, title, description):
    matches = []

    if any(
        sector in sectors
        for sector in ["Livelihoods", "Entrepreneurship", "Rural Development"]
    ):
        matches.append("Livelihood and enterprise development")

    if "Women" in sectors:
        matches.append("Women-focused development")

    if "Skills" in sectors:
        matches.append("Training and capacity building")

    if "Climate" in sectors:
        matches.append("Climate-resilient development")

    if "Research" in sectors or character == "Research / Consultancy":
        matches.append("Research, assessment and knowledge work")

    if "WASH" in sectors:
        matches.append("WASH programme experience")

    if "Health" in sectors:
        matches.append("Health programme experience")

    if "Education" in sectors:
        matches.append("Education programme experience")

    if "Renewable Energy" in sectors:
        matches.append("Renewable-energy development context")

    if not matches:
        return "No strong capability match identified."

    return "; ".join(matches[:4])


def capability_gap(
    sectors,
    character,
    opportunity_type,
    title,
    description,
):
    text = normalise(f"{title} {description}")
    gaps = []

    if character == "Procurement / Supply":
        gaps.append(
            "Primarily procurement/supply oriented rather than a core programme-development opportunity"
        )

    if "construction" in text:
        gaps.append("Construction/vendor capability may be required")

    if "solar" in text and "Renewable Energy" in sectors:
        gaps.append("Specialised technical renewable-energy capability")

    if "hospital" in text:
        gaps.append("Specialised infrastructure/health facility capability")

    if "digital communication" in text:
        gaps.append("Specialised communications/digital execution capability")

    if "website development" in text:
        gaps.append("Specialised web development capability")

    if "research" in text or "assessment" in text:
        gaps.append("Confirm availability of required research/technical specialists")

    if not gaps:
        return "No major capability gap identified from available information."

    return "; ".join(gaps[:3])


def priority_level(strategic, opportunity, urgency):
    if (
        strategic >= 70
        and opportunity >= 70
        and urgency >= 85
    ):
        return "URGENT"

    if (
        opportunity >= 65
        or (
            strategic >= 65
            and urgency >= 70
        )
    ):
        return "HIGH"

    if opportunity >= 45 or strategic >= 45:
        return "MEDIUM"

    return "LOW"


def recommended_action(priority, strategic, opportunity, character):
    if character == "Procurement / Supply":
        if strategic >= 45:
            return "Review only if NIED has a suitable technical/vendor partner."
        return "Monitor; low priority for direct NIED pursuit."

    if priority == "URGENT":
        return "Immediate eligibility review and decision on pursuit."

    if priority == "HIGH":
        return "Conduct detailed eligibility and capability review."

    if priority == "MEDIUM":
        return "Track opportunity and assess potential fit."

    return "Monitor for strategic relevance."


# ============================================================
# FULL INTELLIGENCE ANALYSIS
# ============================================================

def analyse_item(title, description, organisation, deadline):
    sectors = classify_sectors(title, description)

    opportunity_type = classify_opportunity_type(
        title,
        description,
    )

    character = classify_character(
        title,
        description,
    )

    urgency = urgency_score(deadline)

    strategic = strategic_score(
        sectors,
        character,
        opportunity_type,
        title,
        description,
    )

    opportunity = opportunity_score(
        strategic,
        urgency,
        character,
        opportunity_type,
        title,
        description,
    )

    priority = priority_level(
        strategic,
        opportunity,
        urgency,
    )

    return {
        "sectors": sectors,
        "sector": ", ".join(sectors) if sectors else "Other",
        "opportunity_type": opportunity_type,
        "character": character,
        "strategic_score": strategic,
        "opportunity_score": opportunity,
        "urgency_score": urgency,
        "priority": priority,
        "relevance_reason": relevance_reason(
            sectors,
            character,
            strategic,
        ),
        "capability_match": capability_match(
            sectors,
            character,
            title,
            description,
        ),
        "capability_gap": capability_gap(
            sectors,
            character,
            opportunity_type,
            title,
            description,
        ),
        "recommended_action": recommended_action(
            priority,
            strategic,
            opportunity,
            character,
        ),
    }


# ============================================================
# NGOBOX LISTING
# ============================================================

def get_ngobox_links():
    soup = get_soup(NGOBOX_LISTING)

    links = []

    for a in soup.find_all("a", href=True):
        href = a["href"].strip()

        if "full_rfp_eoi_" not in href:
            continue

        if href.startswith("//"):
            href = "https:" + href
        elif href.startswith("/"):
            href = "https://www.ngobox.org" + href
        elif not href.startswith("http"):
            href = "https://www.ngobox.org/" + href.lstrip("/")

        if href not in links:
            links.append(href)

    return links


# ============================================================
# ONE PURPOS RFP API
# ============================================================

def get_one_purpos_rfps():
    response = requests.get(
        ONE_PURPOS_RFP_API,
        params={
            "page": 1,
            "limit": 50,
        },
        headers=HEADERS,
        timeout=TIMEOUT,
    )

    response.raise_for_status()

    data = response.json()
    records = data.get("data", [])

    if not isinstance(records, list):
        raise ValueError("Unexpected One Purpos API response format.")

    return records


def parse_one_purpos_rfp(record):
    title = clean_text(record.get("rfpTitle", ""))
    organisation = clean_text(record.get("organization", ""))
    description = clean_text(record.get("description", ""))
    slug = clean_text(record.get("slug", ""))

    application_deadline = clean_text(
        str(record.get("applicationDeadline", "") or "")
    )

    deadline = None

    if application_deadline:
        deadline = parse_deadline(application_deadline)

        # Handle ISO timestamps such as 2026-09-18T18:30:00.000Z.
        if not deadline:
            iso_match = re.search(
                r"(20\\d{2})-(\\d{1,2})-(\\d{1,2})",
                application_deadline,
            )
            if iso_match:
                try:
                    deadline = date(
                        int(iso_match.group(1)),
                        int(iso_match.group(2)),
                        int(iso_match.group(3)),
                    ).isoformat()
                except ValueError:
                    deadline = None

    if slug:
        source_url = f"https://onepurpos.in/openings/rfps/{slug}"
    else:
        source_url = ONE_PURPOS_RFP_API

    geography = record.get("locations") or ["India"]

    if isinstance(geography, str):
        geography = [clean_text(geography)] if clean_text(geography) else ["India"]
    elif not isinstance(geography, list):
        geography = ["India"]

    geography = [
        clean_text(str(location))
        for location in geography
        if clean_text(str(location))
    ]

    if not geography:
        geography = ["India"]

    return {
        "title": title[:500],
        "organisation": organisation[:300],
        "deadline": deadline,
        "description": description[:6000],
        "source_url": source_url,
        "source_name": "One Purpos",
        "source_id": None,
        "geography": geography[:20],
        "published_at": None,
    }


# ============================================================
# NGOBOX DETAIL PARSER
# ============================================================

def extract_organisation(page_text):
    patterns = [
        r"Organisation\s*[:\-]\s*(.*?)(?=\s+(?:Apply By|Deadline|Last Date|Closing Date)\b)",
        r"Organization\s*[:\-]\s*(.*?)(?=\s+(?:Apply By|Deadline|Last Date|Closing Date)\b)",
        r"Posted By\s*[:\-]\s*(.*?)(?=\s+(?:Apply By|Deadline|Last Date|Closing Date)\b)",
    ]

    for pattern in patterns:
        match = re.search(pattern, page_text, flags=re.I)

        if match:
            org = clean_text(match.group(1))

            # Remove common trailing source noise.
            org = re.split(
                r"\s+(?:Apply By|Deadline|Last Date|Closing Date)\b",
                org,
                flags=re.I,
            )[0]

            return org[:300]

    return ""


def parse_ngobox_detail(url):
    soup = get_soup(url)

    page_text = clean_text(
        soup.get_text(" ", strip=True)
    )

    title = ""

    for tag in soup.find_all(["h1", "h2", "h3"]):
        text = clean_text(tag.get_text(" ", strip=True))

        if (
            text
            and len(text) > 10
            and "NGOBOX" not in text.upper()
        ):
            title = text
            break

    if not title and soup.title:
        title = clean_text(
            soup.title.get_text(" ", strip=True)
        )

    organisation = extract_organisation(page_text)

    # First try explicit deadline/application language.
    deadline = extract_deadline(page_text)

    # Description is the source page text, trimmed.
    description = page_text

    noise_patterns = [
        r"Home\s+RFP\s*/\s*EOI.*?(?=RFP|EOI|ToR|Tender)",
        r"Share this opportunity.*",
        r"Login.*",
        r"Register.*",
    ]

    for pattern in noise_patterns:
        description = re.sub(
            pattern,
            " ",
            description,
            flags=re.I,
        )

    description = clean_text(description)

    if len(description) > 6000:
        description = description[:6000]

    return {
        "title": title[:500],
        "organisation": organisation[:300],
        "deadline": deadline,
        "description": description,
        "source_url": url,
    }


# ============================================================
# SUPABASE
# ============================================================

def supabase_headers():
    return {
        "apikey": SUPABASE_SERVICE_ROLE_KEY,
        "Authorization": f"Bearer {SUPABASE_SERVICE_ROLE_KEY}",
        "Content-Type": "application/json",
        "Prefer": "resolution=merge-duplicates",
    }


def supabase_upsert(item):
    url = (
        f"{SUPABASE_URL}/rest/v1/items"
        "?on_conflict=fingerprint"
    )

    response = requests.post(
        url,
        headers=supabase_headers(),
        json=item,
        timeout=TIMEOUT,
    )

    if not response.ok:
        print("Supabase response:", response.text[:1000])

    response.raise_for_status()


# ============================================================
# BUILD DATABASE RECORD
# ============================================================

def build_record(parsed):
    title = parsed["title"]
    organisation = parsed["organisation"]
    description = parsed["description"]
    deadline = parsed["deadline"]

    intelligence = analyse_item(
        title=title,
        description=description,
        organisation=organisation,
        deadline=deadline,
    )

    fingerprint = make_fingerprint(
        title,
        organisation,
    )

    now = datetime.now(
        timezone.utc
    ).isoformat()

    record = {
        "fingerprint": fingerprint,
        "item_type": "OPPORTUNITY",
        "title": title,
        "description": description,
        "organisation": organisation,
        "sector": intelligence["sectors"],
        "geography": parsed.get("geography", ["India"]),
        "opportunity_type": intelligence["opportunity_type"],
        "deadline": deadline,
        "source_id": parsed.get("source_id"),
        "source_name": parsed.get("source_name", "NGOBox"),
        "source_url": parsed["source_url"],
        "published_at": parsed.get("published_at"),
        "fetched_at": now,
        "priority": intelligence["priority"],
        "opportunity_score": intelligence["opportunity_score"],
        "strategic_score": intelligence["strategic_score"],
        "urgency_score": intelligence["urgency_score"],
        "relevance_reason": intelligence["relevance_reason"],
        "capability_match": intelligence["capability_match"],
        "capability_gap": intelligence["capability_gap"],
        "recommended_action": intelligence["recommended_action"],
        "is_watchlisted": False,
        "is_verified": False,
        "updated_at": now,
    }

    return record


# ============================================================
# MAIN
# ============================================================

def main():
    print("==============================================")
    print("NIED Social Development Intelligence Collector")
    print("Version 1.5")
    print("Sources: NGOBox + One Purpos")
    print("==============================================")

    written = 0
    deadlines_found = 0
    source_counts = {"NGOBox": 0, "One Purpos": 0}

    # ========================================================
    # SOURCE 1: NGOBOX
    # ========================================================

    try:
        ngobox_links = get_ngobox_links()
        print(f"\nNGOBox listing records found: {len(ngobox_links)}")
    except Exception as e:
        print(f"NGOBox listing failed: {e}")
        ngobox_links = []

    for url in ngobox_links:
        try:
            parsed = parse_ngobox_detail(url)
            if not parsed["title"]:
                print(f"Skipped: no title found | {url}")
                continue

            parsed["source_name"] = "NGOBox"
            parsed["source_id"] = None
            parsed["geography"] = ["India"]
            parsed["published_at"] = None

            intelligence = analyse_item(
                parsed["title"], parsed["description"],
                parsed["organisation"], parsed["deadline"]
            )

            print(f"\n[NGOBox] Parsed: {parsed['title'][:100]}")
            print(f"  Organisation: {parsed['organisation'][:80]}")
            print(f"  Type: {intelligence['opportunity_type']}")
            print(f"  Character: {intelligence['character']}")
            print(f"  Sector: {intelligence['sector']}")
            print(f"  Deadline: {parsed['deadline'] or 'NOT FOUND'}")
            print(f"  Strategic: {intelligence['strategic_score']}")
            print(f"  Opportunity: {intelligence['opportunity_score']}")
            print(f"  Urgency: {intelligence['urgency_score']}")
            print(f"  Priority: {intelligence['priority']}")

            if parsed["deadline"]:
                deadlines_found += 1

            supabase_upsert(build_record(parsed))
            written += 1
            source_counts["NGOBox"] += 1

        except Exception as e:
            print(f"NGOBox detail failed: {url}")
            print(f"Reason: {e}")

    # ========================================================
    # SOURCE 2: ONE PURPOS
    # ========================================================

    try:
        one_purpos_records = get_one_purpos_rfps()
        print(f"\nOne Purpos RFP records found: {len(one_purpos_records)}")
    except Exception as e:
        print(f"One Purpos API failed: {e}")
        one_purpos_records = []

    one_purpos_deadlines = 0

    for raw_record in one_purpos_records:
        try:
            parsed = parse_one_purpos_rfp(raw_record)
            if not parsed["title"]:
                print("Skipped One Purpos record: no title found")
                continue

            intelligence = analyse_item(
                parsed["title"], parsed["description"],
                parsed["organisation"], parsed["deadline"]
            )

            print(f"\n[One Purpos] Parsed: {parsed['title'][:100]}")
            print(f"  Organisation: {parsed['organisation'][:80]}")
            print(f"  Type: {intelligence['opportunity_type']}")
            print(f"  Character: {intelligence['character']}")
            print(f"  Sector: {intelligence['sector']}")
            print(f"  Deadline: {parsed['deadline'] or 'NOT FOUND'}")
            print(f"  Strategic: {intelligence['strategic_score']}")
            print(f"  Opportunity: {intelligence['opportunity_score']}")
            print(f"  Urgency: {intelligence['urgency_score']}")
            print(f"  Priority: {intelligence['priority']}")

            if parsed["deadline"]:
                deadlines_found += 1
                one_purpos_deadlines += 1

            supabase_upsert(build_record(parsed))
            written += 1
            source_counts["One Purpos"] += 1

        except Exception as e:
            print(f"One Purpos record failed: {raw_record.get('rfpTitle', 'UNKNOWN')}")
            print(f"Reason: {e}")

    # ========================================================
    # SUMMARY
    # ========================================================

    print("\n==============================================")
    print(f"NGOBox processed: {source_counts['NGOBox']}")
    print(f"One Purpos processed: {source_counts['One Purpos']}")
    print(f"Supabase records written/updated: {written}")
    print(f"Deadlines found: {deadlines_found}")
    print(f"One Purpos deadlines found: {one_purpos_deadlines}/{len(one_purpos_records)}")
    print("Collector V1.5 completed.")
    print("==============================================")


if __name__ == "__main__":
    main()
