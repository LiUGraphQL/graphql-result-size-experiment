#/bin/bash

dirs=( \
    ./queries/acyclic/ \
    ./queries/cyclic/ \
    ./queries/varying/ \
    ./queries/blowup/ \
    ./queries/extreme-blowup/ 
)

# check all queries with low/hight threshold and early termination enabled/disabled
for d in "${dirs[@]}"
do
    for t in 10000 20000 30000 40000 50000 60000 70000 80000 90000 100000
    do
        for e in true false
        do
            sh ./run.sh \
                -i 10 \
                -w 3 \
                -d $d \
                -t $t \
                -e $e \
                -c true
        done
    done
done
