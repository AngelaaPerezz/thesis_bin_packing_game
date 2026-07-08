import json
from pathlib import Path
from collections import Counter

PATH_DIRECTORY = "experiment_puzzles/final_selection"

def count_item_frequencies(directory):
    frequencies = Counter()

    for json_file in Path(directory).rglob("*.json"):
        try:
            with open(json_file, "r", encoding="utf-8") as f:
                data = json.load(f)

            if "items" in data and isinstance(data["items"], list):
                frequencies[len(data["items"])] += 1

        except Exception as e:
            print(f"Error reading {json_file}: {e}")

    return frequencies

if __name__ == "__main__":
    directory = PATH_DIRECTORY
    frequencies = count_item_frequencies(directory)

    print("Item count distribution:")
    for item_count in sorted(frequencies):
        print(f"{item_count} items: {frequencies[item_count]} puzzles")