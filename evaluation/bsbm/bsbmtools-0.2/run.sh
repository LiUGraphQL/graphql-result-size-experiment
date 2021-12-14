./generate -pc 10000 -s sql
cd ./dataset
./preparefiles.sh
mv database.db ../../../.