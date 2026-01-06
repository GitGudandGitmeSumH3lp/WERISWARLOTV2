import os

# The Project Blueprint
structure = {
    "docs": ["modules", "architecture"],
    "specs": [],
    "scripts": [],
    "public": ["assets/sprites", "assets/ui", "assets/audio", "data"],
    "src": {
        "app": [],
        "components": ["ui/debug", "world/core", "world/entities", "world/props"],
        "stores": [],
        "types": [],
        "lib": [],
        "data": ["registries"]
    }
}

files_to_create = {
    "docs/master-index.md": "# Master Interface Index\n\n## Core Systems\n",
    "src/lib/constants.ts": "// Global game constants\nexport const TILE_SIZE = 32;\nexport const SCALE_FACTOR = 4;",
    "src/types/index.ts": "// Export all types\n",
    "README.md": "# Project Noir\n\n## Setup\n1. `npm install`\n2. `npm run dev`"
}

def create_structure(base, struct):
    for name, content in struct.items():
        path = os.path.join(base, name)
        
        # If it's a list, these are subfolders
        if isinstance(content, list):
            os.makedirs(path, exist_ok=True)
            # Create subfolders
            for sub in content:
                os.makedirs(os.path.join(path, sub), exist_ok=True)
            # Add __init__.py for Python folders
            if base == "." and name == "scripts":
                with open(os.path.join(path, "__init__.py"), "w") as f:
                    pass

        # If it's a dict, recurse
        elif isinstance(content, dict):
            os.makedirs(path, exist_ok=True)
            create_structure(path, content)

def create_files():
    for filepath, content in files_to_create.items():
        # Ensure directory exists
        os.makedirs(os.path.dirname(filepath), exist_ok=True)
        # Write file if it doesn't exist
        if not os.path.exists(filepath):
            with open(filepath, "w") as f:
                f.write(content)
            print(f"Created: {filepath}")
        else:
            print(f"Skipped (Exists): {filepath}")

if __name__ == "__main__":
    print("Initializing Project Structure...")
    create_structure(".", structure)
    create_files()
    print("✅ Initialization Complete. Run 'npm install' next.")