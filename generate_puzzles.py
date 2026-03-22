import matplotlib.pyplot as plt
import random

def partition_square_unique(x, y, width, height, used_sizes, min_size=2):
    """
    Partition a rectangle into unique-sized smaller rectangles.
    Avoid 1x1 rectangles and duplicates.
    """
    # If rectangle is too small to split
    if width <= min_size and height <= min_size:
        size = (width, height)
        if size not in used_sizes and size[::-1] not in used_sizes:
            used_sizes.add(size)
            return [(x, y, width, height)]
        else:
            return []

    rectangles = []

    can_split_vert = width > min_size * 2
    can_split_horiz = height > min_size * 2

    # If we can't split at all, return as is (unique check)
    if not can_split_vert and not can_split_horiz:
        size = (width, height)
        if size not in used_sizes and size[::-1] not in used_sizes:
            used_sizes.add(size)
            return [(x, y, width, height)]
        else:
            return []

    # Decide split direction
    if can_split_vert and (not can_split_horiz or random.choice([True, False])):
        split = random.randint(min_size, width - min_size)
        rectangles += partition_square_unique(x, y, split, height, used_sizes, min_size)
        rectangles += partition_square_unique(x + split, y, width - split, height, used_sizes, min_size)
    else:
        split = random.randint(min_size, height - min_size)
        rectangles += partition_square_unique(x, y, width, split, used_sizes, min_size)
        rectangles += partition_square_unique(x, y + split, width, height - split, used_sizes, min_size)

    return rectangles

def generate_puzzle(square_size=20, min_rect_size=2):
    used_sizes = set()
    rects = partition_square_unique(0, 0, square_size, square_size, used_sizes, min_rect_size)
    # Retry if too few rectangles were generated
    if len(rects) < 2:
        return generate_puzzle(square_size, min_rect_size)
    return rects

def plot_puzzle(rects, square_size=20):
    fig, ax = plt.subplots()
    for (x, y, w, h) in rects:
        rect = plt.Rectangle((x, y), w, h, fill=None, edgecolor="black")
        ax.add_patch(rect)
    ax.set_xlim(0, square_size)
    ax.set_ylim(0, square_size)
    ax.set_aspect('equal')
    plt.show()

# Generate 20 puzzles
puzzles = []
for i in range(20):
    puzzle = generate_puzzle()
    puzzles.append(puzzle)
    print(f"Puzzle {i+1}: {len(puzzle)} rectangles")
plot_puzzle(puzzle)