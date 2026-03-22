import random
import pandas as pd
import numpy as np


def generate_experiment():
    n_participants = 40
    n_stimuli = 20
    

    rows = []
    conditions = []

    for s in range(1, n_stimuli + 1):
        AB_array = ['A'] * 10 + ['B'] * 10
        CD_array = ['C'] * 10 + ['D'] * 10
        random.shuffle(AB_array)
        random.shuffle(CD_array)
        if s <= 10:
            array = AB_array + CD_array
        else:            
            array = CD_array + AB_array

        conditions.append(array)
    conditions = np.array(conditions).T
    print(conditions.shape)

    stimulis = []
    for p in range(1, n_participants + 1):
        stimuli_array = list(range(1, n_stimuli + 1))
        random.shuffle(stimuli_array)
        stimulis.append(stimuli_array)
        
    for p in range(n_participants):
        for s in range(n_stimuli):
            rows.append({
                "participant": p,
                "stimulus": stimulis[p][s],
                "condition": conditions[p][s],
            })
    df = pd.DataFrame(rows)
    df = reorder_participants(df)
    df["Trial"] = range(1, len(df) + 1)
    df.to_csv("experiment_trials.csv", index=False)

    print(df.head(40))

def reorder_participants(df, max_block=3):

    AB_first = list(range(0, 20))
    CD_first = list(range(20, 40))

    random.shuffle(AB_first)
    random.shuffle(CD_first)

    new_order = []
    current_group = random.choice(["AB", "CD"])

    while AB_first or CD_first:

        if current_group == "AB" and AB_first:
            k = random.randint(1, min(max_block, len(AB_first)))
            new_order.extend(AB_first[:k])
            AB_first = AB_first[k:]
            current_group = "CD"

        elif current_group == "CD" and CD_first:
            k = random.randint(1, min(max_block, len(CD_first)))
            new_order.extend(CD_first[:k])
            CD_first = CD_first[k:]
            current_group = "AB"

        else:
            new_order.extend(AB_first)
            new_order.extend(CD_first)
            break

    # THIS PART IS THE IMPORTANT CHANGE
    dfs = []
    for new_pid, old_pid in enumerate(new_order):
        tmp = df[df["participant"] == old_pid].copy()
        tmp["participant"] = new_pid +1
        dfs.append(tmp)

    df_new = pd.concat(dfs, ignore_index=True)

    return df_new
if __name__ == "__main__":
    # generate_experiment()
    df = pd.read_csv("experiment_trials.csv")
    df['Trial'] = df.groupby('participant').cumcount() + 1
    df.to_csv("experiment_trials.csv", index=False)