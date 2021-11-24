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
    for t in 999999999 10000 1000
    do
        for e in true false
        do
            sh ./run.sh \
                -i 10 \
                -w 5 \
                -d $d \
                -t $t \
                -e $e \
                -c true
        done
    done
done
