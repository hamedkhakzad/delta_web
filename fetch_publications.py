import json
import os
import re
from scholarly import scholarly
import time


# Set a minimum publication year
MIN_YEAR = 2018

# Check if we already have recent data (less than 1 day old)
if os.path.exists('data/publications.json'):
    file_age = time.time() - os.path.getmtime('data/publications.json')
    if file_age < 86400:  # 24 hours in seconds
        print("Publications file is recent. Skipping fetch.")
        exit(0)

def parse_authors(author_str):
    """
    If the string contains commas, splits on them.
    Otherwise, uses a regex to capture names (at least 2 capitalized words).
    """
    if ',' in author_str:
        return [a.strip() for a in author_str.split(',')]
    else:
        return re.findall(r'\b[A-ZÀ-ÿ][a-zà-ÿ]+(?:\s+[A-ZÀ-ÿ][a-zà-ÿ]+){1,2}\b', author_str)

def process_authors(author_str):
    """
    Processes the author string:
      - Splits into a list using parse_authors.
      - Removes any occurrence of "and" (if present).
      - If there are 7 or fewer names, returns them all.
      - Otherwise, returns the first 5 names, an ellipsis ("..."),
        and the last 2 names.
      - Additionally, if neither "Khakzad" nor "Karami" appear in the selected names,
        the first found emphasized name is inserted.
    """
    authors = parse_authors(author_str)
    # Remove any stray "and" from individual names.
    authors = [a.replace(" and ", " ").strip() for a in authors]
    
    if len(authors) <= 7:
        return ", ".join(authors)
    else:
        first_part = authors[:5]
        last_part = authors[-2:]
        emphasized = [a for a in authors if 'Khakzad' in a or 'Karami' in a]
        if emphasized:
            # If none of the emphasized names appear in the chosen parts, insert one.
            if not any(name in first_part or name in last_part for name in emphasized):
                first_part.insert(1, emphasized[0])
                if len(first_part) > 5:
                    first_part = first_part[:5]
        final_list = first_part + ["..."] + last_part
        return ", ".join(final_list)

def fetch_author_publications(author_id):
    """
    Fetches all publications for a given Google Scholar author ID.
    Only returns publications that have a valid publication year, meet the MIN_YEAR criteria,
    and have a journal (or source) provided.
    Each publication dictionary includes:
      - title: Publication title.
      - authors: Processed author list.
      - year: Publication year.
      - journal: The publication’s journal/venue (or source if journal not available).
      - doi: HTML snippet with a FontAwesome icon linking to the DOI.
      - link: Publication URL.
      - tags: (empty list here; modify as needed)
    """
    print(f"Fetching publications for author: {author_id}")
    author = scholarly.search_author_id(author_id)
    time.sleep(3)  # 3-second delay
    author = scholarly.fill(author, sections=['publications'])
    
    publications = []
    for pub in author.get('publications', []):
        time.sleep(3)  # 3-second delay
        pub_filled = scholarly.fill(pub)
        bib = pub_filled.get('bib', {})
        
        title = bib.get('title', 'No title')
        authors_raw = bib.get('author', '')
        authors = process_authors(authors_raw) if authors_raw else ''
        
        # Try 'pub_year' first then 'year'
        year = bib.get('pub_year') or bib.get('year')
        if not year or not str(year).isdigit():
            print(f"Skipping '{title}' because the publication year is not available.")
            continue
        
        # Filter by MIN_YEAR
        if int(year) < MIN_YEAR:
            print(f"Skipping '{title}' because it is before {MIN_YEAR}.")
            continue
        
        doi_value = bib.get('doi', '')
        doi_html = (f'<a href="https://doi.org/{doi_value}" target="_blank">'
                    f'<i class="fas fa-external-link-alt"></i></a>') if doi_value else ''
        
        link = pub_filled.get('pub_url', '')
        # Get journal name: if not available, use the source.
        journal = bib.get('venue') or bib.get('journal') or bib.get('source') or ''
        if not journal:
            print(f"Skipping '{title}' because neither journal nor source is provided.")
            continue
        
        publications.append({
            "title": title,
            "authors": authors,
            "year": str(year),
            "journal": journal,
            "doi": doi_html,
            "link": link,
            "tags": []
        })
    return publications

def main():
    # List of Google Scholar author IDs.
    author_ids = [
        'GBxdoxAAAAAJ',  # Hamed Khakzad
        'j606i8oAAAAJ'   # Yasaman Karami
    ]
    
    all_publications = []
    for author_id in author_ids:
        try:
            pubs = fetch_author_publications(author_id)
            all_publications.extend(pubs)
        except Exception as e:
            print(f"Error fetching publications for author {author_id}: {e}")
    
    def sort_key(pub):
        try:
            return int(pub["year"])
        except Exception:
            return 0
    all_publications.sort(key=sort_key, reverse=True)
    
    data = {"publications": all_publications}
    os.makedirs('data', exist_ok=True)
    output_path = os.path.join('data', 'publications.json')
    print("Writing JSON data...")
    with open(output_path, 'w', encoding="utf-8") as f:
        json.dump(data, f, indent=2, ensure_ascii=False)
    print("File written successfully!")
    print(f"Publications JSON updated: {output_path}")

if __name__ == "__main__":
    main()
