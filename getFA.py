import requests
import json
import re

def clean_icon_name(name):
    # Remove 'fa' prefix and '.js' suffix
    name = name.replace('fa', '').replace('.js', '')
    # Convert to kebab case if it's not already
    return name if '-' in name else re.sub(r'(?<!^)(?=[A-Z])', '-', name).lower()

def get_free_icons():
    categories = {
        'solid': 'free-solid-svg-icons',
        'regular': 'free-regular-svg-icons',
        'brands': 'free-brands-svg-icons'
    }
    
    icons = {}
    
    for category, repo in categories.items():
        url = f'https://api.github.com/repos/FortAwesome/Font-Awesome/contents/js-packages/@fortawesome/{repo}'
        response = requests.get(url)
        data = response.json()
        
        # Filter and clean icon names
        icons[category] = [
            clean_icon_name(file['name'])
            for file in data
            if file['name'].endswith('.js') 
            and file['name'] != 'index.js'
            and not file['name'].replace('fa', '').replace('.js', '').isdigit()  # Filter out numeric names
        ]
        
        # Sort alphabetically
        icons[category].sort()
    
    return icons

if __name__ == '__main__':
    icons = get_free_icons()
    
    # Save as JSON with nice formatting
    with open('fa_free_icons.json', 'w', encoding='utf-8') as f:
        json.dump(icons, f, indent=2, ensure_ascii=False)
    
    # Print summary
    for category, icon_list in icons.items():
        print(f"{category}: {len(icon_list)} icons")
        # Print first few icons as examples
        print(f"Example icons: {', '.join(icon_list[:5])}\n")