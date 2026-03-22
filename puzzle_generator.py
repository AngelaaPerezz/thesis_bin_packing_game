import json
import random

class PuzzleGenerator:
    def __init__(self, Bx=12, By=12):
        self.Bx = Bx
        self.By = By    
        
    def generate_difficult_puzzle(self, trial):
        Bx = self.Bx
        By  = self.By
        remaining_area = Bx * By
        rects = []
        
        # Dividir el bin en filas aleatorias
        remaining_height = By
        while remaining_height > 0:
            h = random.randint(1, remaining_height)
            remaining_height -= h
            
            # Para cada fila, dividir en columnas aleatorias
            remaining_width = Bx
            while remaining_width > 0:
                w = random.randint(1, remaining_width)
                remaining_width -= w
                rects.append((w,h))
        
        # Dividir el bin en filas aleatorias
        remaining_width = Bx
        while remaining_width > 0:
            w = random.randint(1, remaining_width)
            remaining_width -= w
            
            # Para cada fila, dividir en columnas aleatorias
            remaining_width = Bx
            while remaining_width > 0:
                w = random.randint(1, remaining_width)
                remaining_width -= w
                rects.append((w,h))
        
        # Agrupar iguales y asignar colores
        item_dict = {}
        colors = ["red","blue","green","orange","purple","yellow","cyan"]
        i = 0
        items = []
        for w,h in rects:
            item_dict[(w,h)] = item_dict.get((w,h), 0) + 1
        for (w,h), count in item_dict.items():
            items.append({
                "xLen": w,
                "yLen": h,
                "color": colors[i % len(colors)],
                "n": count
            })
            i += 1

        # Solución perfecta: llenamos la matriz
        solution = [[1]*Bx for _ in range(By)]
        
        puzzle = {
            "trialNumber": trial,
            "binXLen": Bx,
            "binYLen": By,
            "gameType": "bp",
            "rotation": False,
            "items": items,
            "solution": solution
        }
        return puzzle

    def generate_difficult_puzzle2(self, trial):
        Bx, By = self.Bx, self.By
        colors = ["red","blue","green","orange","purple","yellow","cyan"]

        # Recursive subdivision to guarantee a perfect tiling
        def subdivide(x_len, y_len, min_size=1):
            if x_len <= min_size and y_len <= min_size:
                return [(x_len, y_len)]
            
            rects = []
            if random.random() < 0.5 and x_len > 1:  # vertical split
                split = random.randint(1, x_len-1)
                rects += subdivide(split, y_len, min_size)
                rects += subdivide(x_len - split, y_len, min_size)
            elif y_len > 1:  # horizontal split
                split = random.randint(1, y_len-1)
                rects += subdivide(x_len, split, min_size)
                rects += subdivide(x_len, y_len - split, min_size)
            else:
                rects.append((x_len, y_len))
            return rects

        # Generate the rectangles
        rects = subdivide(Bx, By, min_size=1)

        # Optional: shuffle and increase variability by randomly adjusting splits
        random.shuffle(rects)

        # Assign colors and make every piece unique
        items = []
        for i, (w, h) in enumerate(rects):
            # Optionally swap w and h to simulate rotation variability
            if random.random() < 0.5:
                w, h = h, w
            items.append({
                "xLen": w,
                "yLen": h,
                "color": colors[i % len(colors)],
                "n": 1
            })
        random.shuffle(items)

        # Perfect solution: the full bin
        solution = [[1]*Bx for _ in range(By)]

        puzzle = {
            "trialNumber": trial,
            "binXLen": Bx,
            "binYLen": By,
            "gameType": "bp",
            "rotation": False,
            "items": items,
            "solution": solution
        }
        return puzzle

    import random

    def generate_difficult_puzzle3(self, trial):
        Bx = self.Bx
        By = self.By

        # -------------------------------------------------
        # Partition A (horizontal first)
        # -------------------------------------------------
        rectsA = []

        y = 0
        remaining_height = By
        while remaining_height > 0:
            h = random.randint(1, remaining_height)
            remaining_height -= h

            x = 0
            remaining_width = Bx
            while remaining_width > 0:
                w = random.randint(1, remaining_width)
                remaining_width -= w

                rectsA.append((x, y, w, h))
                x += w

            y += h

        # -------------------------------------------------
        # Partition B (vertical first)
        # -------------------------------------------------
        rectsB = []

        x = 0
        remaining_width = Bx
        while remaining_width > 0:
            w = random.randint(1, remaining_width)
            remaining_width -= w

            y = 0
            remaining_height = By
            while remaining_height > 0:
                h = random.randint(1, remaining_height)
                remaining_height -= h

                rectsB.append((x, y, w, h))
                y += h

            x += w

        # -------------------------------------------------
        # Intersection (refinement of A and B)
        # -------------------------------------------------
        final_rects = []

        for (x1, y1, w1, h1) in rectsA:
            for (x2, y2, w2, h2) in rectsB:

                x_left   = max(x1, x2)
                y_top    = max(y1, y2)
                x_right  = min(x1 + w1, x2 + w2)
                y_bottom = min(y1 + h1, y2 + h2)

                if x_left < x_right and y_top < y_bottom:
                    new_w = x_right - x_left
                    new_h = y_bottom - y_top
                    final_rects.append((new_w, new_h))

        # -------------------------------------------------
        # Group identical sizes
        # -------------------------------------------------
        item_dict = {}
        for (w, h) in final_rects:
            item_dict[(w, h)] = item_dict.get((w, h), 0) + 1

        colors = ["red","blue","green","orange","purple","yellow","cyan"]
        items = []

        for i, ((w, h), count) in enumerate(item_dict.items()):
            items.append({
                "xLen": w,
                "yLen": h,
                "color": colors[i % len(colors)],
                "n": count
            })

        # Perfect fill (since construction covers entire bin)
        solution = [[1] * Bx for _ in range(By)]

        puzzle = {
            "trialNumber": trial,
            "binXLen": Bx,
            "binYLen": By,
            "gameType": "bp",
            "rotation": False,
            "items": items,
            "solution": solution
        }

        return puzzle
    

    
    print("20 puzzles difíciles generados.")

if __name__ == "__main__":
    generator = PuzzleGenerator(6,6)
    # Generar 20 puzzles difíciles
    for i in range(1,21):
        p = generator.generate_difficult_puzzle3(i)
        with open(f"difficult_{i}.json","w") as f:
            json.dump(p, f, indent=4)
