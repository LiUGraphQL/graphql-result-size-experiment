#/bin/bash

WARMUPS=3
RUNS=10

dirs=( \
    ./queries/varying/ \
    ./queries/blowup/ \
    ./queries/extreme-blowup/
    ./queries/acyclic/ \
    ./queries/cyclic/ \
)

# check all queries with low/hight threshold and early termination enabled/disabled
echo "Early Termination"
for d in "${dirs[@]}"
do
    for t in 100000
    do
        echo "Running with threshold: " $t
        for e in false
        do
            sh ./run.sh \
                -i $RUNS \
                -w $WARMUPS \
                -d $d \
                -t $t \
                -e $e \
                -o "results/results.csv" \
                -x "evaluation/database.db"
        done
    done
done

echo "Baseline: Standard Executor"
for d in "${dirs[@]}"
do
    sh ./run.sh \
        -i $RUNS \
        -w $WARMUPS \
        -d $d \
        -c "false" \
        -o "results/results.csv" \
        -x "evaluation/database.db"
done

echo "Calculate: High threshold"
# high threshold
for d in "${dirs[@]}"
do
    for t in 999999999
    do
        sh ./run.sh \
            -i $RUNS \
            -w $WARMUPS \
            -d $d \
            -t $t \
            -e "false" \
            -o "results/results.csv" \
            -x "evaluation/database.db"
    done
done
