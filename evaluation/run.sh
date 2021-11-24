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
   echo
}

# Get the options
while getopts ":ho:i:w:c:t:e:d:" option; do
    case $option in
      h)  # display Help
        v=true;;
      o)  # output file
        o=$OPTARG;;
      i)  # iterations
        i=$OPTARG;;
      w)  # warm up iterations
        w=$OPTARG;;
      c)  # query calculator
        c=$OPTARG;;
      t)  # threshold
        t=$OPTARG;;
      e)  # early termination
        e=$OPTARG;;
      d)  # directory with queries
        d=$OPTARG;;
      \?) # Invalid option
        echo "Error: Invalid option."
        help
        exit;;
    esac
done

o=${o:-"results.csv"}  # output
i=${i:-1}              # iterations
w=${w:-1}              # warmups
c=${c:-true}           # use query calculator
t=${t:-10000}          # threshold
e=${e:-false}          # use early termination
# use query calculator
if [ -z "$d" ]; then
  echo "Error: No query directory has been defined."
  exit
fi

run(){
  o=$1 # output
  i=$2 # iterations
  w=$3 # warmups
  c=$4 # use query calculator
  t=$5 # threshold
  e=$6 # use early termination
  d=$7 # query directory
  
  echo "Start GraphQL server"
  cd ..
  node ./app.js \
    --useQueryCalculator=$c \
    --threshold=$t \
    --terminateEarly=$e &
  server=$!

  echo "Run tests"
  cd ./evaluation
  node benchmark.js \
    --useQueryCalculator=$c \
    --threshold=$t \
    --terminateEarly=$e \
    --outputFile=$o \
    --iterations=$i \
    --warmups=$w \
    --queryDir=$d
  kill $server
}

run $o $i $w $c $t $e $d
