#/bin/bash

WARMUPS=1
RUNS=5

dirs=( \
    ./queries/blowup/ \
    ./queries/extreme-blowup/ \
    ./queries/varying/ \
    ./queries/acyclic/ \
    ./queries/cyclic/ \
)

earlyTermination(){
    # check all queries with low/hight threshold and early termination enabled/disabled
    echo ">>> Early Termination <<<"
    for d in "${dirs[@]}"
    do
        for e in true false
        do
            for t in 100000 90000 80000 70000 60000 50000 40000 30000 20000 100000
            do
                echo "Run with threshold:" $t "terminateEarly is" $e     
                sh ./run.sh \
                    -i $RUNS \
                    -w $WARMUPS \
                    -d $d \
                    -t $t \
                    -e $e \
                    -o "results/results.csv" \
                    -x "evaluation/database.db" \
                    -b 180000
            done
        done
    done
}

noThreshold(){
    echo ">>> Calculate: No threshold <<<"
    for d in "${dirs[@]}"
    do
        sh ./run.sh \
            -i $RUNS \
            -w $WARMUPS \
            -d $d \
            -t 0 \
            -e "false" \
            -o "results/results.csv" \
            -x "evaluation/database.db" \
            -b 600000
    done
}

standardExecutor(){
    echo ">>> Standard Executor <<<"
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
}

earlyTermination
noThreshold
standardExecutor