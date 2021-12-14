#/bin/bash

dirs=( \
    ./queries/acyclic/ \
    ./queries/cyclic/ \
    ./queries/varying/ \
    ./queries/blowup/ \
    ./queries/extreme-blowup/
    #./queries/mix/
)

# check all queries with low/hight threshold and early termination enabled/disabled
for d in "${dirs[@]}"
do
    for t in 10000
    do
        for e in false true
        do
            sh ./run.sh \
                -i 10 \
                -w 2 \
                -d $d \
                -t $t \
                -e $e \
                -o "results/results.csv" \
                -x 'evaluation/database.db'
        done
    done
done
