#/bin/bash

help() {
   # Display Help
   echo "Usage: ./run-benchmark.sh [h|o|i|w[c|t|e] -d <query dir>"
   echo
   echo "options:"
   echo "h     Print this help."
   echo "o     Output file.  (default: results.csv)"
   echo "i     Number of iterations.  (default: 3)"
   echo "w     Number of warm up iterations.  (default: 0)"
   echo "c     Use query calculator.  (default: true)"
   echo "t     Result size threshold.  (default: 10000)"
   echo "e     Early termination.  (default: false)"
   echo "d     Query directory (required)."
   echo "x     Database directory."
   echo
}

# Get the options
while getopts ":ho:i:w:c:t:e:d:x:" option; do
    case $option in
      h)  # display Help
        v=true;;
      o)  # output file
        o=$OPTARG;;
      i)  # iterations
        i=$OPTARG;;
      w)  # warm up iterations
        w=$OPTARG;;
      t)  # threshold
        t=$OPTARG;;
      e)  # early termination
        e=$OPTARG;;
      d)  # directory with queries
        d=$OPTARG;;
      x)  # database directory
        x=$OPTARG;;
      c)  # use query calculator
        c=$OPTARG;;
      \?) # Invalid option
        echo "Error: Invalid option."
        help
        exit;;
    esac
done

o=${o:-"results.csv"}  # output
i=${i:-1}              # iterations
w=${w:-1}              # warmups
t=${t:-10000}          # threshold
e=${e:-true}           # use early termination
c=${c:-true}           # use query calculator

if [ -z "$d" ]; then
  echo "Error: No query directory has been defined."
  exit
fi

run(){
  o=$1  # output
  i=$2  # iterations
  w=$3  # warmups
  t=$4  # threshold
  e=$5  # early termination
  d=$6  # query directory
  db=$7 # database path
  c=$8  # use calculator executor
  echo "Start GraphQL server"
  cd ..
  node --max-old-space-size=8192 ./app.js \
    --useQueryCalculator=$c \
    --threshold=$t \
    --terminateEarly=$e \
    --db $db &
  server=$!

  echo "Run tests"
  cd ./evaluation
  node benchmark.js \
    --outputFile=$o \
    --iterations=$i \
    --warmups=$w \
    --queryDir=$d \
    --useQueryCalculator=$c \
    --terminateEarly=$e \
    --threshold=$t
  kill $server
}

run $o $i $w $t $e $d $x $c
