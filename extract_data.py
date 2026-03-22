import json
from collections import Counter
from pathlib import Path
import os
import matplotlib.pyplot as plt
import math 


FOLDER = Path("experiment_puzzles/angela")

def get_metrics(file_path):
    with open(os.path.join(FOLDER, file_path), "r", encoding="utf-8") as f:
        data = json.load(f)
    # Bin capacity
    bin_capacity = data["binXLen"] * data["binYLen"]

    # Object areas
    areas = [item["xLen"] * item["yLen"] for item in data["items"]]

    # n → number of objects
    n = len(areas)

    # S → total area
    S = sum(areas)

    # avg → mean size of objects
    avg = (S / n) 
    relative_avg = avg / bin_capacity

    # m → relative minimum size
    m = min(areas) / bin_capacity

    # r → relative range
    r = (max(areas) - min(areas)) / bin_capacity

    # θ → repetition frequency
    dims = [(item["xLen"], item["yLen"]) for item in data["items"]]
    counts = Counter(dims)

    # fraction of items that are repeated
    repeated_items = sum(c for c in counts.values() if c > 1)
    theta = repeated_items / n
    norm = math.sqrt(
        relative_avg**2 +
        m**2 +
        r**2 +
        theta**2
    )

    print("n:", n)
    print("avg:", avg)
    print("m:", m)
    print("r:", r)
    print("theta:", theta)
    print("norm:", norm)

    metrics = {
        "n": n, 
        "avg": avg,
        "realtive_avg": relative_avg,
        "m": m,
        "r": r,
        "theta": theta, 
        "norm": norm
        
    }
    return metrics

def plot_metrics(trials_metrics):
    n_values = [metrics["n"] for metrics in trials_metrics.values()]
    avg_values = [metrics["avg"] for metrics in trials_metrics.values()]
    m_values = [metrics["m"] for metrics in trials_metrics.values()]
    r_values = [metrics["r"] for metrics in trials_metrics.values()]
    theta_values = [metrics["theta"] for metrics in trials_metrics.values()]

    data = [n_values, avg_values, m_values, r_values, theta_values]

    plt.figure(figsize=(10,6))
    box = plt.boxplot(data, patch_artist=True)

    colors = ['blue','orange','green','red','purple']

    for patch, color in zip(box['boxes'], colors):
        patch.set_facecolor(color)

    plt.xticks([1,2,3,4,5], ["n","avg",  "relative_avg","m","r","theta"])
    plt.title("Distribution of Metrics Across Trials")
    plt.ylabel("Value")

    plt.show()

def plot_metrics_overlay(easy_metrics, medium_metrics, difficult_metrics):

    def extract(metric, data):
        return [v[metric] for v in data.values()]

    metrics = ["avg", "realtive_avg", "m", "r", "theta", "norm"]

    plt.figure(figsize=(12,8))

    for i, metric in enumerate(metrics):

        plt.subplot(3,3,i+1)

        plt.hist(extract(metric, easy_metrics),
                 bins=10, alpha=0.5, label="easy")

        plt.hist(extract(metric, medium_metrics),
                 bins=10, alpha=0.5, label="medium")

        plt.hist(extract(metric, difficult_metrics),
                 bins=10, alpha=0.5, label="difficult")

        plt.title(metric)
        plt.legend()

    plt.suptitle("Distribution of Metrics by Difficulty on Angela's Puzzles by Daidi", fontsize=10)

    plt.tight_layout(rect=[0, 0, 1, 0.95])

    plt.savefig("angelas_puzzles_metrics_by_daidi.png")
    plt.show()

trials_metrics = {}

for file in FOLDER.iterdir():
    if file.is_file():
        print(file.name)
        metrics = get_metrics(file.name)
        trials_metrics[file.stem] = metrics


easy_metrics = filtered_metrics = {
        k: v for k, v in trials_metrics.items()
        if "001" <= k <= "011"
    }

medium_metrics = filtered_metrics = {
        k: v for k, v in trials_metrics.items()
        if "012" <= k <= "017"
    }

difficult_metrics = filtered_metrics = {
        k: v for k, v in trials_metrics.items()
        if "018" <= k <= "022"
    }

# with open("metrics/angelas_trials_metrics.json", "w", encoding="utf-8") as f:    
#     json.dump(trials_metrics, f, indent=4)

# daidis_easy = ["trial 3", "trial 5", "trial 8", "trial 9", "trial 10", "trial 12", "trial 15", "trial 16", "trial 20"]
# daidis_medium = ["trial 2", "trial 6", "trial 11", "trial 14", "trial 17"]
# daidis_difficult = ["trial 1", "trial 4", "trial 7", "trial 13", "trial 18", "trial 19"]

daidis_angela_easy = ["trial 1", "trial 2", "trial 4", "trial 5", "trial 6", "trial 8", "trial 9", "trial 10", "trial 11", "trial 12", "trial 13", "trial 15", "trial 16", "trial 17", "trial 18", "trial 20"]
daidis_angela_medium = ["trial 3", "trial 7", "trial 19"]
daidis_angela_difficult = ["trial 14"]

# daidis_difficult = ["trial 1", "trial 4", "trial 7", "trial 13", "trial 18", "trial 19"]

angelas_daidi_easy = ["001", "003", "006", "008", "009", "010", "011", "012", "017", "022"]
angelas_daidi_medium = ["002", "005", "013", "015", "020"]
angelas_daidi_difficult = ["004", "007", "014", "016", "018", "019", "021"]

easy_metrics = filtered_metrics = {
        k: v for k, v in trials_metrics.items()
        if k in angelas_daidi_easy
    }

medium_metrics = filtered_metrics = {
        k: v for k, v in trials_metrics.items()
        if k in angelas_daidi_medium
    }

difficult_metrics = filtered_metrics = {
        k: v for k, v in trials_metrics.items()
        if k in angelas_daidi_difficult
    }

plot_metrics_overlay(easy_metrics, medium_metrics, difficult_metrics)
# plot_metrics(easy_metrics)
# plot_metrics(medium_metrics)
# plot_metrics(difficult_metrics)



