import requests
import json
import re


def clean_icon_name(name):
    # Remove special characters and convert to lowercase
    name = re.sub(r"[^\w\s-]", "", name).lower()
    return name


def is_valid_icon(name):
    # Filter out purely numeric icons and non-standard names
    if re.match(
        r"^[\d]+[a-zA-Z]*$", name
    ):  # Matches numbers followed by optional letters
        return False
    if len(name) < 2:  # Too short names
        return False
    if not re.match(r"^[a-z][a-z0-9_-]*$", name):  # Must start with letter
        return False
    return True


def get_material_icons():
    url = "https://fonts.google.com/metadata/icons"

    try:
        response = requests.get(url)
        clean_json = response.text.replace(")]}'", "")
        data = json.loads(clean_json)

        # Extract and clean icon names
        icons = []
        for icon in data["icons"]:
            name = clean_icon_name(icon["name"])
            if is_valid_icon(name):
                icons.append(name)

        # Sort alphabetically
        icons.sort()

        return icons

    except Exception as e:
        print(f"Error fetching Material icons: {e}")
        return []


if __name__ == "__main__":
    icons = get_material_icons()

    # Save to JSON file
    with open("icons/material_icons.json", "w", encoding="utf-8") as f:
        json.dump({"material": icons}, f, indent=2, ensure_ascii=False)

    # Print summary and some examples
    print(f"Total Material icons: {len(icons)}")
    print(f"Example icons: {', '.join(icons[:10])}\n")
