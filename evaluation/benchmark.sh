#/bin/bash

dirs=( \
    ./queries/acyclic/ \
    ./queries/cyclic/ \
    ./queries/varying/ \
    ./queries/blowup/ \
    ./queries/extreme-blowup/
)

for d in "${dirs[@]}"
do
    sh ./run.sh \
        -i 20 \
        -w 5 \
        -d $d \
        -c "false" \
        -o "results/results.csv" \
        -x "evaluation/database.db"
done

# high threshold
for d in "${dirs[@]}"
do
    for t in 999999999
    do
        sh ./run.sh \
            -i 20 \
            -w 5 \
            -d $d \
            -t $t \
            -e "false" \
            -o "results/results.csv" \
            -x "evaluation/database.db"
    done
done

# check all queries with low/hight threshold and early termination enabled/disabled
for d in "${dirs[@]}"
do
    for t in 10000 20000 30000 40000 50000 60000 70000 80000 90000 100000
    do
        for e in false true
        do
            sh ./run.sh \
                -i 20 \
                -w 5 \
                -d $d \
                -t $t \
                -e $e \
                -o "results/results.csv" \
                -x "evaluation/database.db"
        done
    done
done



