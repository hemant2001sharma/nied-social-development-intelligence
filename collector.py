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

HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
        "AppleWebKit/537.36 (KHTML, like Gecko) "
        "Chrome/120.0 Safari/537.36"
    )
}

TIMEOUT = 30


# ============================================================
# NIED STRATEGIC KEYWORDS
# ============================================================

SECTOR_RULES = {
    "Livelihoods": [
        "livelihood",
        "livelihoods",
        "income generation",
        "value chain",
        "value chains",
        "market linkage",
        "market linkages",
        "market access",
        "producer group",
        "producer groups",
        "enterprise development",
        "livelihood strengthening",
        "livelihood development",
    ],

    "Entrepreneurship": [
        "entrepreneurship",
        "entrepreneur",
        "entrepreneurs",
        "micro enterprise",
        "micro-enterprise",
        "micro enterprise development",
        "small enterprise",
        "business development",
        "enterprise development",
        "women entrepreneur",
        "women entrepreneurs",
        "micro entrepreneurship",
        "micro-entrepreneurship",
    ],

    "Women": [
        "women empowerment",
        "women's empowerment",
        "women entrepreneur",
        "women entrepreneurs",
        "women-led",
        "women led",
        "female entrepreneur",
        "gender",
        "gender equality",
        "women micro",
        "women-owned",
    ],

    "Rural Development": [
        "rural development",
        "rural communities",
        "rural livelihood",
        "rural livelihoods",
        "village development",
        "community development",
        "farmer",
        "farmers",
        "agriculture",
        "agricultural",
        "agrarian",
        "rural enterprise",
        "rural entrepreneurship",
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
        "capacity development",
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
        "climate-smart",
        "climate smart",
    ],

    "Renewable Energy": [
        "solar energy",
        "solar panel",
        "solar panels",
        "solar street light",
        "solar street lights",
        "renewable energy",
        "clean energy",
        "energy access",
        "solar power",
        "distributed renewable energy",
        "renewable-energy",
    ],

    "WASH": [
        "wash",
        "water sanitation",
        "water, sanitation",
        "water and sanitation",
        "sanitation",
        "hygiene",
        "drinking water",
        "water supply",
        "community water",
        "water security",
    ],

    "Health": [
        "healthcare",
        "public health",
        "maternal health",
        "child health",
        "frontline health worker",
        "frontline health workers",
        "health worker",
        "health workers",
        "nutrition",
        "health programme",
        "health program",
    ],

    "Education": [
        "education",
        "school education",
        "learning outcomes",
        "teacher training",
        "student learning",
        "literacy",
        "digital learning",
        "school development",
        "learning programme",
        "learning program",
    ],

    "Environment": [
        "environmental sustainability",
        "biodiversity",
        "conservation",
        "ecosystem",
        "waste management",
        "circular economy",
        "environment protection",
        "environmental",
    ],

    "Research": [
        "research study",
        "research",
        "assessment",
        "impact assessment",
        "evaluation",
        "baseline study",
        "endline study",
        "knowledge mapping",
        "learning study",
        "consultancy study",
        "programme learning",
        "program learning",
    ],

    "CSR": [
        "csr",
        "corporate social responsibility",
        "corporate philanthropy",
        "philanthropy",
        "foundation",
        "social investment",
    ],
}


# ============================================================
# STRATEGIC WEIGHTS
# ============================================================

STRATEGIC_WEIGHTS = {
    "Livelihoods": 20,
    "Entrepreneurship": 20,
    "Women": 15,
    "Rural Development": 15,
    "Skills": 10,
    "Climate": 15,
    "Research": 10,
    "CSR": 10,
    "WASH": 5,
    "Health": 5,
    "Education": 5,
    "Environment": 5,
    "Renewable Energy": 5,
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
    return re.sub(r"\s+", " ", text.lower()).strip()


def make_fingerprint(title, organisation=""):
    raw = (
        f"{title.lower().strip()}|"
        f"{organisation.lower().strip()}"
    )

    return hashlib.sha256(
        raw.encode("utf-8")
    ).hexdigest()


def get_soup(url):
    response = requests.get(
        url,
        headers=HEADERS,
        timeout=TIMEOUT,
    )

    response.raise_for_status()

    return BeautifulSoup(
        response.text,
        "html.parser",
    )


# ============================================================
# SECTOR CLASSIFICATION
# ============================================================

def classify_sectors(title, description):
    """
    Identify the most relevant sectors.

    The system scores meaningful keyword matches rather than
    tagging every generic word appearing on the webpage.
    """

    text = normalise(
        f"{title} {description}"
    )

    scores = {}

    for sector, keywords in SECTOR_RULES.items():

        score = 0

        for keyword in keywords:

            keyword = keyword.lower()

            if keyword in text:

                if len(keyword.split()) >= 2:
                    score += 3
                else:
                    score += 1

        if score > 0:
            scores[sector] = score

    ordered = sorted(
        scores.items(),
        key=lambda x: x[1],
        reverse=True,
    )

    selected = [
        sector
        for sector, score in ordered
        if score >= 2
    ]

    # Maximum four sectors.
    selected = selected[:4]

    return selected


# ============================================================
# OPPORTUNITY TYPE
# ============================================================

def classify_opportunity_type(title, description):

    text = normalise(
        f"{title} {description}"
    )

    if (
        "expression of interest" in text
        or re.search(r"\beoi\b", text)
    ):
        return "EOI"

    if (
        "request for proposal" in text
        or re.search(r"\brfp\b", text)
    ):
        return "RFP"

    if (
        "terms of reference" in text
        or re.search(r"\btor\b", text)
    ):
        return "Consultancy / ToR"

    if (
        "tender" in text
        or "e-tender" in text
    ):
        return "Tender"

    if "grant" in text:
        return "Grant"

    if "partnership" in text:
        return "Partnership"

    if "consultancy" in text:
        return "Consultancy"

    return "Opportunity"


# ============================================================
# OPPORTUNITY CHARACTER
# ============================================================

def classify_character(title, description):

    text = normalise(
        f"{title} {description}"
    )

    procurement_terms = [
        "procurement",
        "supply",
        "installation",
        "commissioning",
        "fabrication",
        "supplier",
        "vendor",
        "equipment",
        "materials",
        "construction",
        "delivery",
    ]

    implementation_terms = [
        "implementation partner",
        "implementing partner",
        "implementation partnership",
        "programme implementation",
        "program implementation",
        "project implementation",
        "community mobilisation",
        "community mobilization",
        "capacity building",
        "capacity-building",
        "livelihood strengthening",
        "enterprise development",
    ]

    research_terms = [
        "research",
        "assessment",
        "evaluation",
        "study",
        "knowledge mapping",
        "consultancy",
        "programme learning",
        "program learning",
    ]

    procurement_score = sum(
        1
        for term in procurement_terms
        if term in text
    )

    implementation_score = sum(
        1
        for term in implementation_terms
        if term in text
    )

    research_score = sum(
        1
        for term in research_terms
        if term in text
    )

    if (
        procurement_score >= 3
        and procurement_score > implementation_score
    ):
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
    "january": 1,
    "february": 2,
    "march": 3,
    "april": 4,
    "may": 5,
    "june": 6,
    "july": 7,
    "august": 8,
    "september": 9,
    "october": 10,
    "november": 11,
    "december": 12,
}


def parse_deadline(text):

    if not text:
        return None

    text = clean_text(text)

    patterns = [

        # 08/09/2026
        r"(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})",

        # 08 September 2026
        r"(\d{1,2})\s+([A-Za-z]+)\s+(\d{4})",

        # September 08, 2026
        r"([A-Za-z]+)\s+(\d{1,2}),?\s+(\d{4})",
    ]

    for pattern in patterns:

        match = re.search(
            pattern,
            text,
        )

        if not match:
            continue

        try:

            groups = match.groups()

            if pattern.startswith(
                r"(\d"
            ):

                day = int(groups[0])
                month = groups[1]
                year = int(groups[2])

                if month.isdigit():
                    month_num = int(month)
                else:
                    month_num = MONTHS.get(
                        month.lower()
                    )

            else:

                month_num = MONTHS.get(
                    groups[0].lower()
                )

                day = int(groups[1])
                year = int(groups[2])

            if not month_num:
                continue

            parsed = date(
                year,
                month_num,
                day,
            )

            return parsed.isoformat()

        except (
            ValueError,
            TypeError,
        ):
            continue

    return None


# ============================================================
# URGENCY SCORE
# ============================================================

def urgency_score(deadline):

    """
    Deadline urgency:

    <= 3 days     = 95
    4-7 days      = 85
    8-14 days     = 70
    15-30 days    = 55
    31-60 days    = 35
    >60 days      = 20
    Unknown       = 25
    """

    if not deadline:
        return 25

    try:

        deadline_date = datetime.strptime(
            deadline,
            "%Y-%m-%d",
        ).date()

        today = datetime.now(
            timezone.utc
        ).date()

        days = (
            deadline_date - today
        ).days

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

    score = 0

    # Sector-based strategic value.
    for sector in sectors:

        score += STRATEGIC_WEIGHTS.get(
            sector,
            0,
        )

    text = normalise(
        f"{title} {description}"
    )

    # Strong NIED strategic signals.
    if (
        "implementation partner"
        in text
    ):
        score += 10

    if (
        "implementing partner"
        in text
    ):
        score += 10

    if (
        "livelihood strengthening"
        in text
    ):
        score += 8

    if (
        "enterprise development"
        in text
    ):
        score += 8

    if (
        "women entrepreneur"
        in text
        or "women entrepreneurs"
        in text
    ):
        score += 7

    if (
        "micro entrepreneurship"
        in text
        or "micro-entrepreneurship"
        in text
    ):
        score += 7

    if (
        "community capacity"
        in text
        or "capacity building"
        in text
    ):
        score += 5

    if (
        "market access"
        in text
    ):
        score += 5

    if (
        "value chain"
        in text
    ):
        score += 5

    # Research and consultancy have value,
    # but direct programme opportunities remain stronger.
    if (
        character
        == "Research / Consultancy"
    ):
        score += 3

    # Procurement-heavy opportunities are
    # strategically weaker for NIED.
    if (
        character
        == "Procurement / Supply"
    ):
        score -= 20

    if opportunity_type == "Tender":
        score -= 5

    return max(
        0,
        min(100, score),
    )


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

    """
    Measures overall opportunity value.

    Strategic fit is the primary driver.
    Urgency contributes but does not overpower strategic fit.
    """

    score = (
        strategic * 0.60
        + urgency * 0.20
    )

    if (
        character
        == "Implementation / Partnership"
    ):
        score += 15

    elif (
        character
        == "Research / Consultancy"
    ):
        score += 8

    elif (
        character
        == "Procurement / Supply"
    ):
        score -= 20

    if opportunity_type in [
        "RFP",
        "EOI",
        "Partnership",
    ]:
        score += 5

    if opportunity_type == "Tender":
        score -= 5

    text = normalise(
        f"{title} {description}"
    )

    if "livelihood" in text:
        score += 5

    if "entrepreneur" in text:
        score += 5

    if "women" in text:
        score += 3

    if "rural" in text:
        score += 3

    return max(
        0,
        min(100, round(score)),
    )


# ============================================================
# RELEVANCE REASON
# ============================================================

def relevance_reason(
    sectors,
    character,
    strategic,
):

    if not sectors:

        return (
            "Limited direct alignment identified "
            "from available information."
        )

    primary = sectors[:3]

    sector_text = ", ".join(
        primary
    )

    if (
        character
        == "Implementation / Partnership"
    ):

        return (
            f"Strong potential alignment with "
            f"NIED work in {sector_text}, "
            f"particularly through implementation "
            f"or partnership engagement."
        )

    if (
        character
        == "Research / Consultancy"
    ):

        return (
            f"Relevant to NIED capabilities in "
            f"{sector_text}, with potential for "
            f"research, assessment, knowledge "
            f"or consultancy engagement."
        )

    if (
        character
        == "Procurement / Supply"
    ):

        return (
            f"Related to {sector_text}, but the "
            f"opportunity appears primarily procurement "
            f"or supply oriented, reducing direct "
            f"strategic relevance to NIED."
        )

    if strategic >= 70:

        return (
            f"Strong alignment with NIED priorities "
            f"across {sector_text}."
        )

    if strategic >= 45:

        return (
            f"Moderate alignment with NIED priorities "
            f"across {sector_text}."
        )

    return (
        f"Some relevance to NIED through "
        f"{sector_text}, but strategic fit "
        f"appears limited."
    )


# ============================================================
# CAPABILITY MATCH
# ============================================================

def capability_match(
    sectors,
    character,
    title,
    description,
):

    matches = []

    if any(
        sector in sectors
        for sector in [
            "Livelihoods",
            "Entrepreneurship",
            "Rural Development",
        ]
    ):

        matches.append(
            "Livelihood and enterprise development"
        )

    if "Women" in sectors:

        matches.append(
            "Women-focused development"
        )

    if "Skills" in sectors:

        matches.append(
            "Training and capacity building"
        )

    if "Climate" in sectors:

        matches.append(
            "Climate-resilient development"
        )

    if (
        "Research" in sectors
        or character
        == "Research / Consultancy"
    ):

        matches.append(
            "Research, assessment and knowledge work"
        )

    if "CSR" in sectors:

        matches.append(
            "CSR / corporate partnership engagement"
        )

    if "WASH" in sectors:

        matches.append(
            "WASH programme experience"
        )

    if "Health" in sectors:

        matches.append(
            "Health programme experience"
        )

    if "Education" in sectors:

        matches.append(
            "Education programme experience"
        )

    if "Renewable Energy" in sectors:

        matches.append(
            "Renewable-energy development context"
        )

    if not matches:

        return (
            "No strong capability match identified."
        )

    return "; ".join(
        matches[:4]
    )


# ============================================================
# CAPABILITY GAP
# ============================================================

def capability_gap(
    sectors,
    character,
    opportunity_type,
    title,
    description,
):

    text = normalise(
        f"{title} {description}"
    )

    gaps = []

    if (
        character
        == "Procurement / Supply"
    ):

        gaps.append(
            "Primarily procurement/supply oriented "
            "rather than a core programme-development "
            "opportunity"
        )

    if "construction" in text:

        gaps.append(
            "Construction/vendor capability may be required"
        )

    if (
        "solar" in text
        and "Renewable Energy" in sectors
    ):

        gaps.append(
            "Specialised technical renewable-energy capability"
        )

    if "hospital" in text:

        gaps.append(
            "Specialised infrastructure/health facility capability"
        )

    if "digital communication" in text:

        gaps.append(
            "Specialised communications/digital execution capability"
        )

    if "website development" in text:

        gaps.append(
            "Specialised web development capability"
        )

    if (
        "research" in text
        or "assessment" in text
    ):

        gaps.append(
            "Confirm availability of required "
            "research/technical specialists"
        )

    if not gaps:

        return (
            "No major capability gap identified "
            "from available information."
        )

    return "; ".join(
        gaps[:3]
    )


# ============================================================
# RECOMMENDED ACTION
# ============================================================

def recommended_action(
    priority,
    strategic,
    opportunity,
    character,
):

    if (
        character
        == "Procurement / Supply"
    ):

        if strategic >= 45:

            return (
                "Review only if NIED has a suitable "
                "technical/vendor partner."
            )

        return (
            "Monitor; low priority for direct NIED pursuit."
        )

    if priority == "URGENT":

        return (
            "Immediate eligibility review and "
            "decision on pursuit."
        )

    if priority == "HIGH":

        return (
            "Conduct detailed eligibility and "
            "capability review."
        )

    if priority == "MEDIUM":

        return (
            "Track opportunity and assess potential fit."
        )

    return (
        "Monitor for strategic relevance."
    )


# ============================================================
# PRIORITY
# ============================================================

def priority_level(
    strategic,
    opportunity,
    urgency,
):

    """
    Priority combines:

    1. Strategic fit
    2. Opportunity value
    3. Deadline urgency

    Strong + urgent opportunities become URGENT.
    """

    if (
        strategic >= 70
        and opportunity >= 70
        and urgency >= 85
    ):

        return "URGENT"

    if (
        opportunity >= 65
        or (
            strategic >= 70
            and urgency >= 70
        )
    ):

        return "HIGH"

    if (
        opportunity >= 45
        or strategic >= 45
    ):

        return "MEDIUM"

    return "LOW"


# ============================================================
# FULL INTELLIGENCE ANALYSIS
# ============================================================

def analyse_item(
    title,
    description,
    organisation,
    deadline,
):

    sectors = classify_sectors(
        title,
        description,
    )

    opportunity_type = (
        classify_opportunity_type(
            title,
            description,
        )
    )

    character = classify_character(
        title,
        description,
    )

    urgency = urgency_score(
        deadline
    )

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

    reason = relevance_reason(
        sectors,
        character,
        strategic,
    )

    match = capability_match(
        sectors,
        character,
        title,
        description,
    )

    gap = capability_gap(
        sectors,
        character,
        opportunity_type,
        title,
        description,
    )

    action = recommended_action(
        priority,
        strategic,
        opportunity,
        character,
    )

    return {
        "sector": sectors,
        "opportunity_type": opportunity_type,
        "strategic_score": strategic,
        "opportunity_score": opportunity,
        "urgency_score": urgency,
        "priority": priority,
        "relevance_reason": reason,
        "capability_match": match,
        "capability_gap": gap,
        "recommended_action": action,
    }


# ============================================================
# NGOBOX LISTING
# ============================================================

def get_ngobox_links():

    soup = get_soup(
        NGOBOX_LISTING
    )

    links = []

    for a in soup.find_all(
        "a",
        href=True,
    ):

        href = a["href"].strip()

        if "full_rfp_eoi_" not in href:
            continue

        if href.startswith("//"):

            href = (
                "https:" + href
            )

        elif href.startswith("/"):

            href = (
                "https://www.ngobox.org"
                + href
            )

        elif not href.startswith("http"):

            href = (
                "https://www.ngobox.org/"
                + href.lstrip("/")
            )

        if href not in links:

            links.append(href)

    return links


# ============================================================
# NGOBOX DETAIL PARSER
# ============================================================

def parse_ngobox_detail(url):

    soup = get_soup(
        url
    )

    page_text = clean_text(
        soup.get_text(
            " ",
            strip=True,
        )
    )

    # --------------------------------------------------------
    # TITLE
    # --------------------------------------------------------

    title = ""

    for tag in soup.find_all(
        ["h1", "h2", "h3"]
    ):

        text = clean_text(
            tag.get_text(
                " ",
                strip=True,
            )
        )

        if (
            text
            and len(text) > 10
            and "NGOBOX" not in text.upper()
        ):

            title = text
            break

    if (
        not title
        and soup.title
    ):

        title = clean_text(
            soup.title.get_text(
                " ",
                strip=True,
            )
        )

    # --------------------------------------------------------
    # ORGANISATION
    # --------------------------------------------------------

    organisation = ""

    organisation_patterns = [

        r"Organisation\s*[:\-]\s*"
        r"(.*?)(?=\s+(?:Deadline|Last Date|Closing Date)\b)",

        r"Organization\s*[:\-]\s*"
        r"(.*?)(?=\s+(?:Deadline|Last Date|Closing Date)\b)",

        r"Posted By\s*[:\-]\s*"
        r"(.*?)(?=\s+(?:Deadline|Last Date|Closing Date)\b)",
    ]

    for pattern in organisation_patterns:

        match = re.search(
            pattern,
            page_text,
            flags=re.I,
        )

        if match:

            organisation = clean_text(
                match.group(1)
            )

            break

    # --------------------------------------------------------
    # DEADLINE
    # --------------------------------------------------------

    deadline_text = ""

    deadline_patterns = [

        r"Deadline\s*[:\-]\s*"
        r"(.*?)(?=\s+(?:Description|About|Overview|Eligibility|Contact)\b)",

        r"Last Date\s*[:\-]\s*"
        r"(.*?)(?=\s+(?:Description|About|Overview|Eligibility|Contact)\b)",

        r"Closing Date\s*[:\-]\s*"
        r"(.*?)(?=\s+(?:Description|About|Overview|Eligibility|Contact)\b)",
    ]

    for pattern in deadline_patterns:

        match = re.search(
            pattern,
            page_text,
            flags=re.I,
        )

        if match:

            deadline_text = clean_text(
                match.group(1)
            )

            break

    deadline = parse_deadline(
        deadline_text
    )

    # --------------------------------------------------------
    # DESCRIPTION
    # --------------------------------------------------------

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

    description = clean_text(
        description
    )

    # Avoid enormous database records.
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
# SUPABASE HEADERS
# ============================================================

def supabase_headers():

    return {
        "apikey": SUPABASE_SERVICE_ROLE_KEY,

        "Authorization": (
            f"Bearer {SUPABASE_SERVICE_ROLE_KEY}"
        ),

        "Content-Type": "application/json",

        "Prefer": (
            "resolution=merge-duplicates"
        ),
    }


# ============================================================
# SUPABASE UPSERT
# ============================================================

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

        print(
            "Supabase error response:"
        )

        print(
            response.text
        )

    response.raise_for_status()


# ============================================================
# BUILD DATABASE RECORD
# ============================================================

def build_record(parsed):

    title = parsed["title"]

    organisation = (
        parsed["organisation"]
    )

    description = (
        parsed["description"]
    )

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

    # IMPORTANT:
    # Supabase items.sector is TEXT[]
    # Supabase items.geography is TEXT[]
    #
    # Therefore we send Python lists, not strings.

    record = {

        "fingerprint": fingerprint,

        "item_type": "OPPORTUNITY",

        "title": title,

        "description": description,

        "organisation": organisation,

        "sector": intelligence["sector"],

        "geography": ["India"],

        "opportunity_type": (
            intelligence["opportunity_type"]
        ),

        "deadline": deadline,

        "source_id": None,

        "source_name": "NGOBox",

        "source_url": (
            parsed["source_url"]
        ),

        "published_at": None,

        "fetched_at": now,

        "priority": (
            intelligence["priority"]
        ),

        "opportunity_score": (
            intelligence["opportunity_score"]
        ),

        "strategic_score": (
            intelligence["strategic_score"]
        ),

        "urgency_score": (
            intelligence["urgency_score"]
        ),

        "relevance_reason": (
            intelligence["relevance_reason"]
        ),

        "capability_match": (
            intelligence["capability_match"]
        ),

        "capability_gap": (
            intelligence["capability_gap"]
        ),

        "recommended_action": (
            intelligence["recommended_action"]
        ),

        "is_watchlisted": False,

        "is_verified": False,

        "updated_at": now,
    }

    return record


# ============================================================
# MAIN
# ============================================================

def main():

    print(
        "=============================================="
    )

    print(
        "NIED Social Development Intelligence Collector"
    )

    print(
        "Version 1.2"
    )

    print(
        "=============================================="
    )

    # --------------------------------------------------------
    # GET NGOBOX LISTING
    # --------------------------------------------------------

    try:

        links = get_ngobox_links()

        print(
            f"\nListing records found: {len(links)}"
        )

    except Exception as e:

        print(
            f"NGOBox listing failed: {e}"
        )

        return

    # --------------------------------------------------------
    # PROCESS RECORDS
    # --------------------------------------------------------

    written = 0

    for url in links:

        try:

            parsed = parse_ngobox_detail(
                url
            )

            if not parsed["title"]:

                print(
                    f"Skipped: no title found | {url}"
                )

                continue

            intelligence = analyse_item(
                parsed["title"],
                parsed["description"],
                parsed["organisation"],
                parsed["deadline"],
            )

            print(
                f"\nParsed: "
                f"{parsed['title'][:100]}"
            )

            print(
                "  Sector: "
                f"{', '.join(intelligence['sector'])}"
            )

            print(
                "  Strategic: "
                f"{intelligence['strategic_score']}"
            )

            print(
                "  Opportunity: "
                f"{intelligence['opportunity_score']}"
            )

            print(
                "  Urgency: "
                f"{intelligence['urgency_score']}"
            )

            print(
                "  Priority: "
                f"{intelligence['priority']}"
            )

            record = build_record(
                parsed
            )

            supabase_upsert(
                record
            )

            written += 1

        except Exception as e:

            print(
                f"\nDetail failed: {url}"
            )

            print(
                f"Reason: {e}"
            )

    # --------------------------------------------------------
    # COMPLETION
    # --------------------------------------------------------

    print(
        "\n=============================================="
    )

    print(
        f"Supabase records written/updated: {written}"
    )

    print(
        "Collector V1.2 completed."
    )


# ============================================================
# ENTRY POINT
# ============================================================

if __name__ == "__main__":
    main()
